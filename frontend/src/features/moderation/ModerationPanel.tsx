import { useCallback, useEffect, useState } from 'react';
import { useAppSelector } from '../../store';
import type { User } from '../../entities/user/model';
import type { Comment } from '../../types';
import { errorMessage, request } from '../../shared/api/http';
import { Badge } from '../../shared/ui/badge';
import { Button } from '../../shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../shared/ui/card';
import { Input } from '../../shared/ui/input';

function useLoad<T>(path: string) {
  const [items, setItems] = useState<T[]>([]);
  const [error, setError] = useState('');
  const reload = useCallback(() => request<T[]>(path).then(setItems, (e) => setError(errorMessage(e))), [path]);
  useEffect(() => { reload(); }, [reload]);
  return { items, error, reload };
}

const Row = ({ children }: { children: React.ReactNode }) => <div className="flex items-center gap-2 border-t py-2 text-sm">{children}</div>;

function Comments({ onChange }: { onChange: () => void }) {
  const comments = useAppSelector((s) => s.comments.items);
  const hide = async (c: Comment) => { await request(`/moderation/comments/${c.id}/hide`, { method: 'POST', body: {} }).catch((e) => alert(errorMessage(e))); onChange(); };
  return (
    <>
      {comments.slice(-30).reverse().map((c) => (
        <Row key={c.id}>
          <span className="min-w-0 flex-1 break-words"><b>{c.authorName ?? 'Unknown'}:</b> {c.text}</span>
          <Button size="sm" variant="secondary" onClick={() => hide(c)}>Hide</Button>
        </Row>
      ))}
    </>
  );
}

function Hidden({ hidden }: { hidden: ReturnType<typeof useLoad<Comment>> }) {
  const restore = async (c: Comment) => { await request(`/moderation/comments/${c.id}/restore`, { method: 'POST', body: {} }).catch((e) => alert(errorMessage(e))); hidden.reload(); };
  return (
    <>
      {hidden.items.map((c) => (
        <Row key={c.id}>
          <span className="min-w-0 flex-1 break-words"><b>{c.authorName ?? 'Unknown'}:</b> {c.text}</span>
          <Button size="sm" variant="secondary" onClick={() => restore(c)}>Restore</Button>
        </Row>
      ))}
      {hidden.error && <p className="text-sm text-destructive">{hidden.error}</p>}
    </>
  );
}

function Users() {
  const { items, error, reload } = useLoad<User>('/users');
  const [reason, setReason] = useState('');
  const act = async (u: User) => {
    await request(`/users/${u.id}/${u.banned ? 'unban' : 'ban'}`, { method: 'POST', body: { reason } }).catch((e) => alert(errorMessage(e)));
    reload();
  };
  return (
    <>
      <Input placeholder="Ban reason (optional)" value={reason} onChange={(e) => setReason(e.target.value)} className="mb-2" />
      {items.map((u) => (
        <Row key={u.id}>
          <span className="min-w-0 flex-1 break-words">{u.name} <span className="text-muted-foreground">{u.email}</span></span>
          <Badge>{u.banned ? 'BANNED' : u.role}</Badge>
          {u.role !== 'ADMIN' && <Button size="sm" variant={u.banned ? 'secondary' : 'destructive'} onClick={() => act(u)}>{u.banned ? 'Unban' : 'Ban'}</Button>}
        </Row>
      ))}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </>
  );
}

export default function ModerationPanel() {
  const hidden = useLoad<Comment>('/moderation/comments');
  return (
    <div className="ui mx-auto mt-6 grid max-w-2xl gap-4 px-3">
      <Card><CardHeader><CardTitle>Recent comments</CardTitle></CardHeader><CardContent><Comments onChange={hidden.reload} /></CardContent></Card>
      <Card><CardHeader><CardTitle>Hidden comments</CardTitle></CardHeader><CardContent><Hidden hidden={hidden} /></CardContent></Card>
      <Card><CardHeader><CardTitle>Users</CardTitle></CardHeader><CardContent><Users /></CardContent></Card>
    </div>
  );
}
