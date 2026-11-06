import { FormEvent, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { updateProfile } from '../../entities/user/model';
import { errorMessage } from '../../shared/api/http';
import { Badge } from '../../shared/ui/badge';
import { Button } from '../../shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../shared/ui/card';
import { Input } from '../../shared/ui/input';
import { Label } from '../../shared/ui/label';

export default function ProfilePage() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.session.user)!;
  const [name, setName] = useState(user.name);
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });
  const [status, setStatus] = useState('');

  const save = (body: Parameters<typeof updateProfile>[0], done: () => void) => async (e: FormEvent) => {
    e.preventDefault();
    try {
      await dispatch(updateProfile(body)).unwrap();
      setStatus('Saved');
      done();
    } catch (err) { setStatus(errorMessage(err)); }
  };

  return (
    <div className="ui mx-auto mt-6 grid max-w-md gap-4 px-3">
      <Card>
        <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex items-center gap-2 text-sm"><span>{user.email}</span><Badge>{user.role}</Badge></div>
          <form onSubmit={save({ name }, () => undefined)} className="grid gap-2">
            <Label htmlFor="pname">Name</Label>
            <Input id="pname" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={50} />
            <Button disabled={name.trim() === user.name}>Save name</Button>
          </form>
          <form onSubmit={save(passwords, () => setPasswords({ currentPassword: '', newPassword: '' }))} className="grid gap-2">
            <Label htmlFor="cur">Current password</Label>
            <Input id="cur" type="password" autoComplete="current-password" required value={passwords.currentPassword} onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })} />
            <Label htmlFor="new">New password</Label>
            <Input id="new" type="password" autoComplete="new-password" required minLength={8} maxLength={72} value={passwords.newPassword} onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })} />
            <Button>Change password</Button>
          </form>
          {status && <p className="text-sm text-muted-foreground">{status}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
