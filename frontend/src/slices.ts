import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Card, Column, Comment } from './types';
import * as A from './actions';

export { cardsSlice } from './store/cardsSlice';

export const columnsSlice = createSlice({
  name: 'columns',
  initialState: [] as Column[],
  reducers: {},
  extraReducers: (b) =>
    b
      .addCase(A.fetchBoard.fulfilled, (_, a) => a.payload.columns)
      .addCase(A.cardCreated, (s, a) => {
        const col = s.find((c) => c.id === a.payload.columnId);
        if (col && !col.cardIds.includes(a.payload.id)) col.cardIds.push(a.payload.id);
      })
      .addCase(A.cardDeleted, (s, a) => { s.forEach((c) => { c.cardIds = c.cardIds.filter((id) => id !== a.payload); }); })
      .addCase(A.cardMoved, (s, { payload: { cardId, toColumnId } }) => {
        s.forEach((c) => { c.cardIds = c.cardIds.filter((id) => id !== cardId); }); // remove everywhere
        s.find((c) => c.id === toColumnId)?.cardIds.push(cardId);
      }),
});

interface CommentsState { items: Comment[]; typing: Record<string, boolean> }
export const commentsSlice = createSlice({
  name: 'comments',
  initialState: { items: [], typing: {} } as CommentsState,
  reducers: {
    typingChanged: (s, a: PayloadAction<{ cardId: string; typing: boolean }>) => { s.typing[a.payload.cardId] = a.payload.typing; },
  },
  extraReducers: (b) =>
    b
      .addCase(A.fetchBoard.fulfilled, (s, a) => { s.items = a.payload.comments; })
      .addCase(A.commentAdded, (s, a) => {
        if (!s.items.some((c) => c.id === a.payload.id)) s.items.push(a.payload);
        s.typing[a.payload.cardId] = false; // a sent comment ends "typing..."
      })
      .addCase(A.commentUpdated, (s, a) => { const c = s.items.find((x) => x.id === a.payload.commentId); if (c) c.text = a.payload.text; })
      .addCase(A.commentDeleted, (s, a) => { s.items = s.items.filter((c) => c.id !== a.payload); })
      .addCase(A.cardDeleted, (s, a) => { s.items = s.items.filter((c) => c.cardId !== a.payload); }),
});
export const { typingChanged } = commentsSlice.actions;
