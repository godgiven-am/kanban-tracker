import { createAction, createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { ApiError, getToken, request, setToken } from '../../shared/api/http';

export type Role = 'ADMIN' | 'VERIFIED' | 'UNVERIFIED';
export interface User { id: string; email: string; name: string; role: Role; banned: boolean; banReason?: string; createdAt: string }
interface Session { user: User; token: string }

export const logout = createAction('session/logout');
const failure = createAction<string>('session/failure');

const persist = (s: Session) => { setToken(s.token); return s; };

export const login = createAsyncThunk('session/login', async (body: { email: string; password: string }) =>
  persist(await request<Session>('/auth/login', { body })));

export const register = createAsyncThunk('session/register', async (body: { email: string; name: string; password: string }) =>
  persist(await request<Session>('/auth/register', { body })));

export const loadSession = createAsyncThunk('session/load', async (_, { dispatch }) => {
  try {
    return (await request<{ user: User }>('/auth/me')).user;
  } catch (e) {
    if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
      dispatch(failure(e.reason ? `${e.message}: ${e.reason}` : e.message));
      return null;
    }
    throw e;
  }
});

export const verifyEmail = createAsyncThunk('session/verify', async (token: string) =>
  (await request<{ user: User }>('/auth/verify', { body: { token } })).user);

export const updateProfile = createAsyncThunk('session/update', async (body: { name?: string; currentPassword?: string; newPassword?: string }) =>
  (await request<{ user: User }>('/users/me', { method: 'PATCH', body })).user);

interface State { user: User | null; token: string | null; loading: boolean; notice: string | null }

export const sessionSlice = createSlice({
  name: 'session',
  initialState: { user: null, token: getToken(), loading: !!getToken(), notice: null } as State,
  reducers: {},
  extraReducers: (b) => {
    const signedOut = (s: State, notice: string | null = null) => { setToken(null); s.user = null; s.token = null; s.loading = false; s.notice = notice; };
    const signedIn = (s: State, a: { payload: Session }) => { s.user = a.payload.user; s.token = a.payload.token; s.notice = null; };
    b.addCase(login.fulfilled, signedIn)
      .addCase(register.fulfilled, signedIn)
      .addCase(loadSession.fulfilled, (s, a) => { s.loading = false; if (a.payload) s.user = a.payload; })
      .addCase(loadSession.rejected, (s) => { s.loading = false; })
      .addCase(failure, (s, a) => signedOut(s, a.payload))
      .addCase(logout, (s) => signedOut(s))
      .addCase(verifyEmail.fulfilled, (s, a) => { if (s.user?.id === a.payload.id) s.user = a.payload; })
      .addCase(updateProfile.fulfilled, (s, a) => { s.user = a.payload; });
  },
});

export const isVerified = (u: User | null) => !!u && u.role !== 'UNVERIFIED';
export const isAdmin = (u: User | null) => u?.role === 'ADMIN';
