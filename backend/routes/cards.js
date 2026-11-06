import { Router } from 'express';
import mongoose from 'mongoose';
import Card from '../models/Card.js';
import Column from '../models/Column.js';
import Comment from '../models/Comment.js';
import { authenticate, requireRole } from '../middleware/auth.js';

export default function cardsRouter(io) {
  const r = Router();

  r.get('/boards', authenticate, async (_req, res, next) => {
    try {
      const [columns, cards, comments] = await Promise.all([Column.find().sort('_id'), Card.find(), Comment.find({ hidden: { $ne: true } })]);
      res.json({ columns, cards, comments });
    } catch (e) { next(e); }
  });

  r.post('/cards', authenticate, requireRole('VERIFIED'), async (req, res, next) => {
    try {
      const { title, description, columnId } = req.body ?? {};
      if (!mongoose.isValidObjectId(columnId) || !(await Column.exists({ _id: columnId })))
        return res.status(400).json({ error: 'Invalid columnId' });
      const card = await Card.create({ title, description, columnId }); // schema validation -> ValidationError
      await Column.updateOne({ _id: columnId }, { $push: { cardIds: card.id } });
      io.emit('cardCreated', card);
      res.status(201).json(card);
    } catch (e) { next(e); }
  });

  r.delete('/cards/:id', authenticate, requireRole('VERIFIED'), async (req, res, next) => {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
      const card = await Card.findByIdAndDelete(req.params.id);
      if (!card) return res.sendStatus(404);
      await Promise.all([
        Comment.deleteMany({ cardId: card.id }),
        Column.updateMany({}, { $pull: { cardIds: card.id } }),
      ]);
      io.emit('cardDeleted', card.id);
      res.sendStatus(204);
    } catch (e) { next(e); }
  });

  return r;
}
