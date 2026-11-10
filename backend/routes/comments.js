import { Router } from 'express';
import mongoose from 'mongoose';
import Card from '../models/Card.js';
import Comment from '../models/Comment.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const MAX = 500;
const text = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const EMPTY = 'Комментарий не может быть пустым';
const TOO_LONG = `Максимум ${MAX} символов`;
const FORBIDDEN = 'Недостаточно прав';

export const canEdit = (comment, user) => comment && !comment.hidden && (user.role === 'ADMIN' || comment.authorId === user.id);

// Temporarily banned users (bannedUntil in the future) may not write; the message reaches REST and socket clients
export function assertCanComment(user) {
  if (user.bannedUntil && user.bannedUntil > new Date())
    throw Object.assign(new Error(`Вы не можете комментировать до ${user.bannedUntil.toLocaleDateString('ru-RU')}`), { status: 403 });
}

// Trims and validates; returns the clean text or throws a 400 with a Russian message
export function cleanText(raw) {
  const t = text(raw, MAX + 1);
  if (!t) throw Object.assign(new Error(EMPTY), { status: 400 });
  if (t.length > MAX) throw Object.assign(new Error(TOO_LONG), { status: 400 });
  return t;
}

export async function addComment({ cardId, text: raw, parentId }, user) {
  assertCanComment(user);
  const t = cleanText(raw);
  if (!mongoose.isValidObjectId(cardId) || !(await Card.exists({ _id: cardId }))) return null;
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
  // Errors carrying a status (validation, ban) go to the client as-is; everything else hits the central handler
  const fail = (res, e, next) => (e.status ? res.status(e.status).json({ error: e.message }) : next(e));

  r.get('/comments', authenticate, async (req, res, next) => {
    try {
      if (!mongoose.isValidObjectId(req.query.cardId)) return res.status(400).json({ error: 'Некорректная карточка' });
      res.json(await Comment.find({ cardId: req.query.cardId, hidden: false }).sort('timestamp'));
    } catch (e) { next(e); }
  });

  r.post('/comments', authenticate, requireRole('VERIFIED'), async (req, res, next) => {
    try {
      const { cardId, text, parentId } = req.body ?? {};
      const comment = await addComment({ cardId, text, parentId }, req.user);
      if (!comment) return res.status(400).json({ error: 'Некорректный комментарий' });
      io.emit('commentAdded', comment);
      res.status(201).json(comment);
    } catch (e) { fail(res, e, next); }
  });

  r.put('/comments/:id', authenticate, requireRole('VERIFIED'), async (req, res, next) => {
    try {
      assertCanComment(req.user);
      const t = cleanText(req.body?.text);
      const comment = mongoose.isValidObjectId(req.params.id) && (await Comment.findById(req.params.id));
      if (!comment || comment.hidden) return res.sendStatus(404);
      if (!canEdit(comment, req.user)) return res.status(403).json({ error: FORBIDDEN });
      const updatedAt = Date.now();
      await Comment.updateOne({ _id: comment.id }, { text: t, updatedAt });
      const payload = { commentId: comment.id, text: t, updatedAt };
      io.emit('commentUpdated', payload);
      res.json(payload);
    } catch (e) { fail(res, e, next); }
  });

  r.delete('/comments/:id', authenticate, requireRole('VERIFIED'), async (req, res, next) => {
    try {
      const comment = mongoose.isValidObjectId(req.params.id) && (await Comment.findById(req.params.id));
      if (!comment) return res.sendStatus(404);
      if (!canEdit(comment, req.user)) return res.status(403).json({ error: FORBIDDEN });
      (await removeComment(req.params.id, req.user)).forEach((id) => io.emit('commentDeleted', id));
      res.sendStatus(204);
    } catch (e) { next(e); }
  });

  return r;
}
