import { Router } from 'express';
import mongoose from 'mongoose';
import Comment from '../models/Comment.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { str } from '../auth/validate.js';

export default function moderationRouter(io) {
  const r = Router();
  r.use('/moderation', authenticate, requireRole('ADMIN'));

  r.get('/moderation/comments', async (_req, res, next) => {
    try { res.json(await Comment.find({ hidden: true }).sort('-timestamp').limit(200)); } catch (e) { next(e); }
  });

  const setHidden = (hidden) => async (req, res, next) => {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
      const comment = await Comment.findByIdAndUpdate(
        req.params.id,
        { hidden, hiddenReason: hidden ? str(req.body?.reason, 200) : undefined },
        { new: true }
      );
      if (!comment) return res.sendStatus(404);
      if (hidden) io.emit('commentDeleted', comment.id);
      else io.emit('commentAdded', comment);
      res.json(comment);
    } catch (e) { next(e); }
  };
  r.post('/moderation/comments/:id/hide', setHidden(true));
  r.post('/moderation/comments/:id/restore', setHidden(false));

  return r;
}
