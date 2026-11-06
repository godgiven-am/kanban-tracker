import { createSlice } from '@reduxjs/toolkit';
import type { Card } from '../types';
import * as A from '../actions';

// Idempotent: the sender applies a move optimistically, then receives the server's broadcast of it
export const cardsSlice = createSlice({
  name: 'cards',
  initialState: [] as Card[],
  reducers: {},
  extraReducers: (b) =>
    b
      .addCase(A.fetchBoard.fulfilled, (_, a) => a.payload.cards)
      .addCase(A.cardCreated, (s, a) => { if (!s.some((c) => c.id === a.payload.id)) s.push(a.payload); })
      .addCase(A.cardDeleted, (s, a) => s.filter((c) => c.id !== a.payload))
      .addCase(A.cardMoved, (s, a) => { const c = s.find((x) => x.id === a.payload.cardId); if (c) c.columnId = a.payload.toColumnId; })
      .addCase(A.cardUpdated, (s, a) => { const c = s.find((x) => x.id === a.payload.cardId); if (c) Object.assign(c, a.payload.updates); }),
});
