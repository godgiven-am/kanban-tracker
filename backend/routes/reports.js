import { Router } from 'express';
import mongoose from 'mongoose';
import Comment from '../models/Comment.js';
import Report, { REASONS, STATUSES } from '../models/Report.js';
import User from '../models/User.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { removeComment } from './comments.js';

const MAX_DETAILS = 300;
const MAX_BAN_DAYS = 3650;
const ACTIONS = ['dismiss', 'deleteComment', 'banAuthor'];

// Account state shown to moderators: BANNED (permanent), MUTED (temporary comment ban) or the role
const accountStatus = (u) => (u.banned ? 'BANNED' : u.bannedUntil > new Date() ? 'MUTED' : u.role);

// Adds the author's live profile (the snapshot only keeps id and name) to each report
async function withAuthors(reports) {
  const ids = [...new Set(reports.map((r) => r.commentSnapshot.authorId).filter(mongoose.isValidObjectId))];
  const users = new Map((await User.find({ _id: { $in: ids } })).map((u) => [u.id, u]));
  return reports.map((r) => {
    const u = users.get(r.commentSnapshot.authorId);
    return { ...r.toJSON(), author: u && { id: u.id, name: u.name, email: u.email, status: accountStatus(u), bannedUntil: u.bannedUntil } };
  });
}

export default function reportsRouter(io) {
  const r = Router();
  r.use('/reports', authenticate);

  r.post('/reports', async (req, res, next) => {
    try {
      const { commentId, reason } = req.body ?? {};
      const details = typeof req.body?.details === 'string' ? req.body.details.trim() : '';
      if (!mongoose.isValidObjectId(commentId) || !REASONS.includes(reason)) return res.status(400).json({ error: 'Некорректная жалоба' });
      if (details.length > MAX_DETAILS) return res.status(400).json({ error: `Максимум ${MAX_DETAILS} символов` });
      const comment = await Comment.findById(commentId);
      if (!comment || comment.hidden) return res.status(404).json({ error: 'Комментарий не найден' });
      let report;
      try {
        report = await Report.create({
          commentId,
          commentSnapshot: { text: comment.text, authorId: comment.authorId, authorName: comment.authorName },
          reportedBy: { userId: req.user.id, userName: req.user.name },
          reason,
          details: details || undefined,
        });
      } catch (e) {
        if (e.code === 11000) return res.status(409).json({ error: 'Вы уже жаловались на этот комментарий' });
        throw e;
      }
      const [full] = await withAuthors([report]);
      io.to('admins').emit('reportCreated', full);
      res.status(201).json({ id: report.id });
    } catch (e) { next(e); }
  });

  r.get('/reports', requireRole('ADMIN'), async (req, res, next) => {
    try {
      const { status } = req.query;
      if (status !== undefined && !STATUSES.includes(status)) return res.status(400).json({ error: 'Некорректный статус' });
      res.json(await withAuthors(await Report.find(status ? { status } : {}).sort('-createdAt').limit(200)));
    } catch (e) { next(e); }
  });

  r.patch('/reports/:id/resolve', requireRole('ADMIN'), async (req, res, next) => {
    try {
      const { action, banDurationDays } = req.body ?? {};
      if (!mongoose.isValidObjectId(req.params.id) || !ACTIONS.includes(action)) return res.status(400).json({ error: 'Некорректное действие' });
      const days = banDurationDays == null ? null : Number(banDurationDays);
      if (days !== null && !(Number.isInteger(days) && days >= 1 && days <= MAX_BAN_DAYS)) return res.status(400).json({ error: 'Некорректный срок бана' });
      const report = await Report.findById(req.params.id);
      if (!report) return res.sendStatus(404);
      if (report.status !== 'pending') return res.status(409).json({ error: 'Жалоба уже обработана' });

      if (action === 'deleteComment') {
        (await removeComment(report.commentId, req.user)).forEach((id) => io.emit('commentDeleted', id));
      } else if (action === 'banAuthor') {
        const author = mongoose.isValidObjectId(report.commentSnapshot.authorId) && (await User.findById(report.commentSnapshot.authorId));
        if (!author) return res.status(404).json({ error: 'Автор не найден' });
        if (author.role === 'ADMIN') return res.status(403).json({ error: 'Администратора нельзя забанить' });
        if (days) author.bannedUntil = new Date(Date.now() + days * 86_400_000);
        else { author.banned = true; author.banReason = 'Бан по жалобе'; }
        await author.save();
        if (author.banned) io.in(`user:${author.id}`).disconnectSockets(true);
      }

      // Deleting the comment settles every pending report about it; other actions settle just this one
      const filter = action === 'deleteComment' ? { commentId: report.commentId, status: 'pending' } : { _id: report._id };
      const patch = { status: action === 'dismiss' ? 'dismissed' : 'resolved', resolvedAt: new Date(), resolvedBy: req.user.id };
      const ids = action === 'deleteComment' ? await Report.find(filter).distinct('_id') : [report._id];
      await Report.updateMany(filter, patch);
      const updated = await withAuthors(await Report.find({ _id: { $in: ids } }));
      updated.forEach((u) => io.to('admins').emit('reportResolved', u));
      res.json(updated.find((u) => u.id === report.id));
    } catch (e) { next(e); }
  });

  return r;
}
