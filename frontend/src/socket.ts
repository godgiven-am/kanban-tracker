import { io } from 'socket.io-client';
import { API } from './actions';
import * as A from './actions';
import { typingChanged } from './slices';
import { reportUpserted } from './features/report/model/reportsSlice';
import { loadSession } from './entities/user/model';
import type { AppDispatch } from './store';

// Connected by the app once a user is signed in (the token is sent in the handshake)
export const socket = io(API, { autoConnect: false });

// Route every server broadcast into the Redux store
export function bindSocket(dispatch: AppDispatch) {
  const typingTimers: Record<string, number> = {};

  socket.on('cardCreated', (p) => dispatch(A.cardCreated(p)));
  socket.on('cardDeleted', (p) => dispatch(A.cardDeleted(p)));
  socket.on('cardMoved', (p) => dispatch(A.cardMoved(p)));
  socket.on('cardUpdated', (p) => dispatch(A.cardUpdated(p)));
  socket.on('commentAdded', (p) => dispatch(A.commentAdded(p)));
  socket.on('commentUpdated', (p) => dispatch(A.commentUpdated(p)));
  socket.on('commentDeleted', (p) => dispatch(A.commentDeleted(p)));

  // Only sockets the server placed in the 'admins' room (role ADMIN, checked on handshake) receive these
  socket.on('reportCreated', (p) => dispatch(reportUpserted(p)));
  socket.on('reportResolved', (p) => dispatch(reportUpserted(p)));

  // "Typing..." expires on its own if no further keystroke event arrives
  // Server-side rejections (validation, DB down) are surfaced to the user
  socket.on('error', (e: { error: string }) => alert(e.error));

  socket.on('typing', ({ cardId }: { cardId: string }) => {
    dispatch(typingChanged({ cardId, typing: true }));
    clearTimeout(typingTimers[cardId]);
    typingTimers[cardId] = window.setTimeout(() => dispatch(typingChanged({ cardId, typing: false })), 2000);
  });

  // Rejected handshake or server-side disconnect (ban, revoked token): re-check the session
  socket.on('connect_error', (e) => e.message === 'unauthorized' && dispatch(loadSession()));
  socket.on('disconnect', (reason) => reason === 'io server disconnect' && dispatch(loadSession()));

  // Events missed while offline are gone, so reload the board after reconnecting
  socket.io.on('reconnect', () => dispatch(A.fetchBoard()));

  return () => { socket.off(); socket.io.off('reconnect'); };
}
