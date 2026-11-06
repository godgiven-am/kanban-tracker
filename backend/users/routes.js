import { Router } from 'express';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Comment from '../models/Comment.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { str, validName, validPassword } from '../auth/validate.js';

export default function usersRouter(io) {
  const r = Router();
  r.use('/users', authenticate);

  r.patch('/users/me', async (req, res, next) => {
    try {
      const { name, currentPassword, newPassword } = req.body ?? {};
      const user = await User.findById(req.user.id).select('+passwordHash');
      if (name !== undefined) {
        if (!validName(name)) return res.status(400).json({ error: 'Name must be 2-50 characters' });
        user.name = name;
      }
      if (newPassword !== undefined) {
        if (!validPassword(newPassword)) return res.status(400).json({ error: 'Password must be 8-72 characters' });
        if (typeof currentPassword !== 'string' || !(await bcrypt.compare(currentPassword, user.passwordHash)))
          return res.status(403).json({ error: 'Current password is incorrect' });
        user.passwordHash = await bcrypt.hash(newPassword, 12);
      }
      await user.save();
      if (name !== undefined) await Comment.updateMany({ authorId: user.id }, { authorName: user.name });
      res.json({ user });
    } catch (e) { next(e); }
  });

  r.use('/users', requireRole('ADMIN'));

  r.get('/users', async (_req, res, next) => {
    try { res.json(await User.find().sort('-createdAt').limit(200)); } catch (e) { next(e); }
  });

  const setBan = (banned) => async (req, res, next) => {
    try {
      const { id } = req.params;
      if (!mongoose.isValidObjectId(id) || id === req.user.id) return res.status(400).json({ error: 'Invalid target' });
      const target = await User.findById(id);
      if (!target) return res.sendStatus(404);
      if (target.role === 'ADMIN') return res.status(403).json({ error: 'Admins cannot be banned' });
      target.banned = banned;
      target.banReason = banned ? str(req.body?.reason, 200) : undefined;
      await target.save();
      if (banned) io.in(`user:${id}`).disconnectSockets(true);
      res.json({ user: target });
    } catch (e) { next(e); }
  };
  r.post('/users/:id/ban', setBan(true));
  r.post('/users/:id/unban', setBan(false));

  return r;
}
