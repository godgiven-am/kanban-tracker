import mongoose from 'mongoose';
import User from '../models/User.js';
import { verifyToken } from '../auth/tokens.js';

const RANK = { UNVERIFIED: 0, VERIFIED: 1, ADMIN: 2 };

export const hasRole = (user, min) => RANK[user.role] >= RANK[min];

export async function userFromToken(token) {
  const id = verifyToken(token);
  return id && mongoose.isValidObjectId(id) ? User.findById(id) : null;
}

export async function authenticate(req, res, next) {
  try {
    const [scheme, token] = (req.headers.authorization ?? '').split(' ');
    const user = scheme === 'Bearer' && token ? await userFromToken(token) : null;
    if (!user) return res.status(401).json({ error: 'Authentication required' });
    if (user.banned) return res.status(403).json({ error: 'Account banned', reason: user.banReason });
    req.user = user;
    next();
  } catch (e) { next(e); }
}

export const requireRole = (min) => (req, res, next) =>
  hasRole(req.user, min) ? next() : res.status(403).json({ error: 'Forbidden' });
