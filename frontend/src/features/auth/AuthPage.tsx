import { FormEvent, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { login, register } from '../../entities/user/model';
import { errorMessage } from '../../shared/api/http';
import { Button } from '../../shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../shared/ui/card';
import { Input } from '../../shared/ui/input';
import { Label } from '../../shared/ui/label';

export default function AuthPage({ message }: { message: string | null }) {
  const dispatch = useAppDispatch();
  const notice = useAppSelector((s) => s.session.notice);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [form, setForm] = useState({ email: '', name: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (key: keyof typeof form) => (e: { target: { value: string } }) => setForm({ ...form, [key]: e.target.value });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await dispatch(mode === 'login' ? login(form) : register(form)).unwrap();
    } catch (err) { setError(errorMessage(err)); }
    setBusy(false);
  };

  return (
    <div className="ui mx-auto mt-16 max-w-sm px-3">
      <Card>
        <CardHeader><CardTitle>{mode === 'login' ? 'Sign in' : 'Create account'}</CardTitle></CardHeader>
        <CardContent>
          {(message || notice) && <p className="mb-3 text-sm text-muted-foreground">{message ?? notice}</p>}
          <form onSubmit={submit} className="grid gap-3">
            <div className="grid gap-1"><Label htmlFor="email">Email</Label><Input id="email" type="email" required autoComplete="email" value={form.email} onChange={set('email')} /></div>
            {mode === 'register' && (
              <div className="grid gap-1"><Label htmlFor="name">Name</Label><Input id="name" required minLength={2} maxLength={50} value={form.name} onChange={set('name')} /></div>
            )}
            <div className="grid gap-1">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required minLength={8} maxLength={72} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={form.password} onChange={set('password')} />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button disabled={busy}>{mode === 'login' ? 'Sign in' : 'Register'}</Button>
            <Button type="button" variant="ghost" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>
              {mode === 'login' ? 'Need an account? Register' : 'Have an account? Sign in'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
