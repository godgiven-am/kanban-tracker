import { useEffect, useState } from 'react';
import { useAppDispatch } from '../../store';
import { loadSession, verifyEmail } from '../../entities/user/model';
import { getToken } from '../../shared/api/http';

export function useEmailVerification() {
  const dispatch = useAppDispatch();
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const token = new URLSearchParams(location.search).get('verify');
    if (!token) return;
    history.replaceState(null, '', location.pathname);
    dispatch(verifyEmail(token)).then((r) => {
      const ok = r.meta.requestStatus === 'fulfilled';
      setMessage(ok ? 'Email verified.' : 'Verification link is invalid or expired.');
      if (ok && getToken()) dispatch(loadSession());
    });
  }, [dispatch]);

  return message;
}
