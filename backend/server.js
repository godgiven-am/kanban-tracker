import 'dotenv/config';
import express from 'express';
import http from 'http';
import cors from 'cors';
import mongoose from 'mongoose';
import { Server } from 'socket.io';
import Card from './models/Card.js';
import Column from './models/Column.js';
import Comment from './models/Comment.js';
import User from './models/User.js';
import cardsRouter from './routes/cards.js';
import commentsRouter, { addComment, removeComment, canEdit, assertCanComment, cleanText } from './routes/comments.js';
import reportsRouter from './routes/reports.js';
import authRouter from './auth/routes.js';
import usersRouter from './users/routes.js';
import moderationRouter from './moderation/routes.js';
import { requireDb, dbReady } from './middleware/db.js';
import { hasRole, userFromToken } from './middleware/auth.js';

const app = express();
app.use(cors(), express.json({ limit: '10kb' }));
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// 503 for every route while Mongo is unreachable
app.use(requireDb, authRouter(), usersRouter(io), moderationRouter(io));
app.use(['/', '/api'], cardsRouter(io), commentsRouter(io), reportsRouter(io));
// Central error mapping: bad input -> 400, Mongo connectivity problems -> 503
app.use((err, _req, res, _next) => {
  if (err.type === 'entity.parse.failed' || err instanceof mongoose.Error.ValidationError || err instanceof mongoose.Error.CastError)
    return res.status(400).json({ error: err.message });
  if (err.name?.startsWith('Mongo')) return res.status(503).json({ error: 'Database unavailable' });
  console.error(err);
  res.status(500).json({ error: 'Internal error' });
});

// Only authenticated, non-banned users may connect; each joins a private room so a ban can disconnect them
io.use(async (socket, next) => {
  try {
    const user = dbReady() && (await userFromToken(socket.handshake.auth?.token));
    if (!user || user.banned) return next(new Error('unauthorized'));
    socket.data.userId = user.id;
    socket.join(`user:${user.id}`);
    if (user.role === 'ADMIN') socket.join('admins'); // only admins receive new reports
    next();
  } catch { next(new Error('unauthorized')); }
});

// Wraps a socket handler: re-checks role and ban status per event, drops events while the DB is down
// and reports failures to the sender only
const handler = (socket, minRole, fn) => async (payload = {}) => {
  if (!dbReady()) return socket.emit('error', { error: 'Database unavailable' });
  try {
    const user = await User.findById(socket.data.userId);
    if (!user || user.banned) return socket.disconnect(true);
    if (!hasRole(user, minRole)) return socket.emit('error', { error: 'Forbidden' });
    await fn(payload, user);
  } catch (e) { socket.emit('error', { error: e.message }); }
};

io.on('connection', (socket) => {
  socket.on('cardMoved', handler(socket, 'VERIFIED', async ({ cardId, toColumnId }) => {
    if (!mongoose.isValidObjectId(cardId) || !mongoose.isValidObjectId(toColumnId)) return;
    const [card, to] = await Promise.all([Card.findById(cardId), Column.exists({ _id: toColumnId })]);
    if (!card || !to || card.columnId === toColumnId) return;
    const fromColumnId = card.columnId;
    await Column.updateOne({ _id: fromColumnId }, { $pull: { cardIds: cardId } });
    await Column.updateOne({ _id: toColumnId }, { $addToSet: { cardIds: cardId } });
    card.columnId = toColumnId;
    await card.save();
    io.emit('cardMoved', { cardId, fromColumnId, toColumnId });
  }));

  socket.on('cardUpdated', handler(socket, 'VERIFIED', async ({ cardId, updates }) => {
    if (!mongoose.isValidObjectId(cardId)) return;
    const safe = {}; // whitelist: id and columnId cannot be changed through this event
    if (updates?.title !== undefined) safe.title = updates.title;
    if (updates?.description !== undefined) safe.description = updates.description;
    const card = await Card.findByIdAndUpdate(cardId, safe, { new: true, runValidators: true });
    if (card) io.emit('cardUpdated', { cardId, updates: safe });
  }));

  socket.on('commentAdded', handler(socket, 'VERIFIED', async ({ cardId, commentText, parentId }, user) => {
    const comment = await addComment({ cardId, text: commentText, parentId }, user);
    if (comment) io.emit('commentAdded', comment);
  }));

  socket.on('commentUpdated', handler(socket, 'VERIFIED', async ({ commentId, text: raw }, user) => {
    assertCanComment(user);
    const t = cleanText(raw);
    if (!mongoose.isValidObjectId(commentId) || !canEdit(await Comment.findById(commentId), user)) return;
    const updatedAt = Date.now();
    await Comment.updateOne({ _id: commentId }, { text: t, updatedAt });
    io.emit('commentUpdated', { commentId, text: t, updatedAt });
  }));

  socket.on('commentDeleted', handler(socket, 'VERIFIED', async ({ commentId }, user) => {
    (await removeComment(commentId, user)).forEach((id) => io.emit('commentDeleted', id));
  }));

  // Typing is ephemeral: relayed, never stored
  socket.on('typing', ({ cardId } = {}) => socket.broadcast.emit('typing', { cardId }));
});

async function start() {
  // Server listens even if Mongo is down; routes answer 503 until mongoose connects (it retries on its own)
  server.listen(process.env.PORT || 3001, () => console.log('API + Socket.IO up'));
  for (;;) {
    try {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/kanban', { serverSelectionTimeoutMS: 3000 });
      break;
    } catch (e) {
      console.error('Mongo connect failed, retrying:', e.message);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  if ((await Column.countDocuments()) === 0)
    await Column.insertMany(['To Do', 'In Progress', 'Done'].map((title) => ({ title })));
  console.log('MongoDB connected');
}
start();
