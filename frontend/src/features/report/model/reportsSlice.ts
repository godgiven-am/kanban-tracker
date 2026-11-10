import { createAction, createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { request } from '../../../shared/api/http';
import { errorText } from '../../../shared/config/messages';

export type ReportReason = 'spam' | 'abuse' | 'harassment' | 'other';
export type ReportStatus = 'pending' | 'resolved' | 'dismissed';
export type ResolveAction = 'dismiss' | 'deleteComment' | 'banAuthor';

export interface Report {
  id: string;
  commentId: string;
  commentSnapshot: { text: string; authorId?: string; authorName?: string };
  reportedBy: { userId: string; userName: string };
  reason: ReportReason;
  details?: string;
  status: ReportStatus;
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  author?: { id: string; name: string; email: string; status: 'UNVERIFIED' | 'VERIFIED' | 'ADMIN' | 'BANNED' | 'MUTED'; bannedUntil?: string };
}

// Pushed to the 'admins' socket room (reportCreated) or returned by PATCH (resolve)
export const reportUpserted = createAction<Report>('reports/upserted');

type Config = { rejectValue: string };

export const createReport = createAsyncThunk<void, { commentId: string; reason: ReportReason; details?: string }, Config>(
  'reports/create',
  async (body, { rejectWithValue }) => {
    try { await request('/api/reports', { body }); } catch (e) { return rejectWithValue(errorText(e)); }
  }
);

export const fetchReports = createAsyncThunk<Report[], void, Config>('reports/fetch', async (_, { rejectWithValue }) => {
  try { return await request<Report[]>('/api/reports'); } catch (e) { return rejectWithValue(errorText(e)); }
});

export const resolveReport = createAsyncThunk<Report, { id: string; action: ResolveAction; banDurationDays?: number }, Config>(
  'reports/resolve',
  async ({ id, ...body }, { rejectWithValue }) => {
    try { return await request<Report>(`/api/reports/${id}/resolve`, { method: 'PATCH', body }); } catch (e) { return rejectWithValue(errorText(e)); }
  }
);

interface State { items: Report[]; loading: boolean; error: string | null }

const upsert = (s: State, r: Report) => {
  const i = s.items.findIndex((x) => x.id === r.id);
  if (i >= 0) s.items[i] = r; else s.items.unshift(r);
};

export const reportsSlice = createSlice({
  name: 'reports',
  initialState: { items: [], loading: false, error: null } as State,
  reducers: {},
  extraReducers: (b) =>
    b
      .addCase(fetchReports.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchReports.fulfilled, (s, a) => { s.loading = false; s.items = a.payload; })
      .addCase(fetchReports.rejected, (s, a) => { s.loading = false; s.error = a.payload ?? null; })
      .addCase(resolveReport.fulfilled, (s, a) => upsert(s, a.payload))
      .addCase(reportUpserted, (s, a) => upsert(s, a.payload)),
});
