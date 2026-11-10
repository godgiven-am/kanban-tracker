import { createAsyncThunk } from '@reduxjs/toolkit';
import { commentAdded, commentDeleted, commentUpdated } from '../../../actions';
import { request } from '../../../shared/api/http';
import { errorText } from '../../../shared/config/messages';
import type { Comment } from '../../../entities/comment/model/types';
import type { RootState } from '../../../store';

// Comment state itself lives in the shared `comments` slice (slices.ts), which already reduces the
// socket events commentAdded / commentUpdated / commentDeleted. These thunks reuse those actions for
// optimistic updates: apply locally, call the API, roll back on failure. Reducers are idempotent, so
// the server's broadcast of the same change is harmless.
type Config = { state: RootState; rejectValue: string };
const find = (s: RootState, id: string) => s.comments.items.find((c) => c.id === id);

export const fetchComments = createAsyncThunk<void, string, Config>('comments/fetch', async (cardId, { dispatch, rejectWithValue }) => {
  try {
    (await request<Comment[]>(`/api/comments?cardId=${encodeURIComponent(cardId)}`)).forEach((c) => dispatch(commentAdded(c)));
  } catch (e) { return rejectWithValue(errorText(e)); }
});

export const addComment = createAsyncThunk<void, { cardId: string; text: string }, Config>(
  'comments/add',
  async ({ cardId, text }, { dispatch, getState, rejectWithValue }) => {
    const user = getState().session.user;
    const tempId = `tmp-${Date.now()}`;
    dispatch(commentAdded({ id: tempId, cardId, text, timestamp: Date.now(), authorId: user?.id, authorName: user?.name }));
    try {
      dispatch(commentAdded(await request<Comment>('/api/comments', { body: { cardId, text } })));
    } catch (e) { return rejectWithValue(errorText(e)); }
    finally { dispatch(commentDeleted(tempId)); }
  }
);

export const updateComment = createAsyncThunk<void, { id: string; text: string }, Config>(
  'comments/update',
  async ({ id, text }, { dispatch, getState, rejectWithValue }) => {
    const prev = find(getState(), id);
    dispatch(commentUpdated({ commentId: id, text, updatedAt: Date.now() }));
    try {
      dispatch(commentUpdated(await request<{ commentId: string; text: string; updatedAt: number }>(`/api/comments/${id}`, { method: 'PUT', body: { text } })));
    } catch (e) {
      if (prev) dispatch(commentUpdated({ commentId: id, text: prev.text, updatedAt: prev.updatedAt }));
      return rejectWithValue(errorText(e));
    }
  }
);

export const deleteComment = createAsyncThunk<void, string, Config>('comments/delete', async (id, { dispatch, getState, rejectWithValue }) => {
  const prev = find(getState(), id);
  dispatch(commentDeleted(id));
  try {
    await request(`/api/comments/${id}`, { method: 'DELETE' });
  } catch (e) {
    if (prev) dispatch(commentAdded(prev));
    return rejectWithValue(errorText(e));
  }
});
