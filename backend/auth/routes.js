import { Router } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimit.js';
import { signToken, hashToken, newVerification } from './tokens.js';
import { sendVerification } from './mailer.js';
import { validEmail, validName, validPassword } from './validate.js';

const COST = 12;
const DUMMY_HASH = bcrypt.hashSync('timing-equalizer', COST);

export default function authRouter() {
  const r = Router();
  r.use('/auth', authLimiter);

  r.post('/auth/register', async (req, res, next) => {
    try {
      const { email, name, password } = req.body ?? {};
      if (!validEmail(email) || !validName(name) || !validPassword(password))
        return res.status(400).json({ error: 'Valid email, name (2-50) and password (8-72 chars) are required' });
      const { token, ...verify } = newVerification();
      const user = await User.create({ email, name, passwordHash: await bcrypt.hash(password, COST), ...verify });
      sendVerification(user, token).catch((e) => console.error('Mail failed:', e.message));
      res.status(201).json({ token: signToken(user.id), user });
    } catch (e) { e.code === 11000 ? res.status(409).json({ error: 'Email already registered' }) : next(e); }
  });

  r.post('/auth/login', async (req, res, next) => {
    try {
      const { email, password } = req.body ?? {};
      if (typeof email !== 'string' || typeof password !== 'string') return res.status(400).json({ error: 'Email and password required' });
      const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+passwordHash');
      const match = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
      if (!user || !match) return res.status(401).json({ error: 'Invalid credentials' });
      if (user.banned) return res.status(403).json({ error: 'Account banned', reason: user.banReason });
      res.json({ token: signToken(user.id), user });
    } catch (e) { next(e); }
  });

  r.post('/auth/verify', async (req, res, next) => {
    try {
      const { token } = req.body ?? {};
      if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) return res.status(400).json({ error: 'Invalid token' });
      const user = await User.findOne({ verifyTokenHash: hashToken(token), verifyExpires: { $gt: new Date() } });
      if (!user) return res.status(400).json({ error: 'Token invalid or expired' });
      if (user.role === 'UNVERIFIED') user.role = user.email === process.env.ADMIN_EMAIL?.trim().toLowerCase() ? 'ADMIN' : 'VERIFIED';
      user.verifyTokenHash = undefined;
      user.verifyExpires = undefined;
      await user.save();
      res.json({ user });
    } catch (e) { next(e); }
  });

  r.post('/auth/resend', authenticate, async (req, res, next) => {
    try {
      if (req.user.role !== 'UNVERIFIED') return res.status(400).json({ error: 'Already verified' });
      const { token, ...verify } = newVerification();
      await req.user.updateOne(verify);
      await sendVerification(req.user, token);
      res.sendStatus(204);
    } catch (e) { next(e); }
  });

  r.get('/auth/me', authenticate, (req, res) => res.json({ user: req.user }));

  return r;
}
