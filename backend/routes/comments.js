import { Router } from 'express';
import mongoose from 'mongoose';
import Card from '../models/Card.js';
import Comment from '../models/Comment.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const text = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

export const canEdit = (comment, user) => comment && !comment.hidden && (user.role === 'ADMIN' || comment.authorId === user.id);

export async function addComment({ cardId, text: raw, parentId }, user) {
  const t = text(raw, 1000);
  if (!t || !mongoose.isValidObjectId(cardId) || !(await Card.exists({ _id: cardId }))) return null;
  if (parentId) {
    if (!mongoose.isValidObjectId(parentId) || !(await Comment.exists({ _id: parentId, cardId }))) return null;
  }
  return Comment.create({ cardId, text: t, parentId: parentId || undefined, authorId: user.id, authorName: user.name });
}

// Deletes the comment and its replies; returns every removed id
export async function removeComment(commentId, user) {
  if (!mongoose.isValidObjectId(commentId) || !canEdit(await Comment.findById(commentId), user)) return [];
  const ids = [commentId];
  for (let i = 0; i < ids.length; i++) ids.push(...(await Comment.find({ parentId: ids[i] }).distinct('_id')).map(String));
  await Comment.deleteMany({ _id: { $in: ids } });
  return ids;
}

export default function commentsRouter(io) {
  const r = Router();

  r.post('/comments', authenticate, requireRole('VERIFIED'), async (req, res, next) => {
    try {
      const { cardId, text, parentId } = req.body ?? {};
      const comment = await addComment({ cardId, text, parentId }, req.user);
      if (!comment) return res.status(400).json({ error: 'Invalid comment' });
      io.emit('commentAdded', comment);
      res.status(201).json(comment);
    } catch (e) { next(e); }
  });

  r.delete('/comments/:id', authenticate, requireRole('VERIFIED'), async (req, res, next) => {
    try {
      const ids = await removeComment(req.params.id, req.user);
      if (!ids.length) return res.sendStatus(404);
      ids.forEach((id) => io.emit('commentDeleted', id));
      res.sendStatus(204);
    } catch (e) { next(e); }
  });

  return r;
}
