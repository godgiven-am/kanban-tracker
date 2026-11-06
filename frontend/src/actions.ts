import { createAction, createAsyncThunk } from '@reduxjs/toolkit';
import { request } from './shared/api/http';
import type { Card, Column, Comment } from './types';

export { API } from './shared/api/http';

// Shared actions: dispatched for both local changes and incoming socket events,
// so several slices (cards + columns + comments) react to one event.
export const fetchBoard = createAsyncThunk('board/fetch', () =>
  request<{ columns: Column[]; cards: Card[]; comments: Comment[] }>('/boards'));
export const cardCreated = createAction<Card>('cardCreated');
export const cardDeleted = createAction<string>('cardDeleted');
export const cardMoved = createAction<{ cardId: string; fromColumnId: string; toColumnId: string }>('cardMoved');
export const cardUpdated = createAction<{ cardId: string; updates: Partial<Pick<Card, 'title' | 'description'>> }>('cardUpdated');
export const commentAdded = createAction<Comment>('commentAdded');
export const commentUpdated = createAction<{ commentId: string; text: string }>('commentUpdated');
export const commentDeleted = createAction<string>('commentDeleted');
