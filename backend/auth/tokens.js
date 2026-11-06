import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const secret = process.env.JWT_SECRET;
if (!secret || secret.length < 32) throw new Error('JWT_SECRET (at least 32 characters) is required');

export const signToken = (userId) => jwt.sign({ sub: userId }, secret, { algorithm: 'HS256', expiresIn: '7d' });

export function verifyToken(token) {
  try { return jwt.verify(token, secret, { algorithms: ['HS256'] }).sub; } catch { return null; }
}

export const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

export function newVerification() {
  const token = crypto.randomBytes(32).toString('hex');
  return { token, verifyTokenHash: hashToken(token), verifyExpires: new Date(Date.now() + 24 * 60 * 60 * 1000) };
}
