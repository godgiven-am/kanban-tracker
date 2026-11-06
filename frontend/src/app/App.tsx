import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { fetchBoard } from '../actions';
import { bindSocket, socket } from '../socket';
import { isAdmin, loadSession, logout } from '../entities/user/model';
import AuthPage from '../features/auth/AuthPage';
import VerifyBanner from '../features/auth/VerifyBanner';
import { useEmailVerification } from '../features/auth/useEmailVerification';
import ProfilePage from '../features/profile/ProfilePage';
import ModerationPanel from '../features/moderation/ModerationPanel';
import { Button } from '../shared/ui/button';
import Board from '../components/Board';

type View = 'board' | 'profile' | 'moderation';

export default function App() {
  const dispatch = useAppDispatch();
  const { user, token, loading } = useAppSelector((s) => s.session);
  const verifyMessage = useEmailVerification();
  const [view, setView] = useState<View>('board');

  useEffect(() => { if (token) dispatch(loadSession()); }, [dispatch, token]);

  const userId = user?.id;
  useEffect(() => {
    if (!userId || !token) return;
    dispatch(fetchBoard());          // initial load over REST
    socket.auth = { token };
    socket.connect();
    const unbind = bindSocket(dispatch); // live updates over WebSocket
    return () => { unbind(); socket.disconnect(); };
  }, [dispatch, userId, token]);

  if (loading) return null;
  if (!user) return <AuthPage message={verifyMessage} />;

  const tabs: View[] = isAdmin(user) ? ['board', 'profile', 'moderation'] : ['board', 'profile'];
  return (
    <>
      <header className="ui flex items-center gap-2 border-b bg-background px-3 py-2">
        {tabs.map((t) => (
          <Button key={t} size="sm" variant={view === t ? 'default' : 'ghost'} onClick={() => setView(t)} className="capitalize">{t}</Button>
        ))}
        <span className="ml-auto text-sm text-muted-foreground">{user.name}</span>
        <Button size="sm" variant="secondary" onClick={() => dispatch(logout())}>Sign out</Button>
      </header>
      {user.role === 'UNVERIFIED' && <VerifyBanner />}
      {verifyMessage && <p className="ui px-3 pt-2 text-sm text-muted-foreground">{verifyMessage}</p>}
      {view === 'board' && <Board />}
      {view === 'profile' && <ProfilePage />}
      {view === 'moderation' && isAdmin(user) && <ModerationPanel />}
    </>
  );
}
