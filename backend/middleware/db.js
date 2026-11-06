import mongoose from 'mongoose';

export const dbReady = () => mongoose.connection.readyState === 1;

export const requireDb = (_req, res, next) =>
  dbReady() ? next() : res.status(503).json({ error: 'Database unavailable' });
