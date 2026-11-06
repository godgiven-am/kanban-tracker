import { useState } from 'react';
import { useAppSelector } from '../store';
import { socket } from '../socket';
import { request, errorMessage } from '../shared/api/http';

export default function CommentList({ cardId }: { cardId: string }) {
  const comments = useAppSelector((s) => s.comments.items.filter((c) => c.cardId === cardId));
  const typing = useAppSelector((s) => s.comments.typing[cardId]);
  const user = useAppSelector((s) => s.session.user);
  const [editId, setEditId] = useState<string | null>(null);
  const [text, setText] = useState('');

  const save = (commentId: string) => {
    if (text.trim()) socket.emit('commentUpdated', { commentId, text });
    setEditId(null);
  };

  return (
    <div>
      {comments.map((c) => (
        <div key={c.id} className="row">
          {editId === c.id ? (
            <input className="grow" value={text} onChange={(e) => setText(e.target.value)} />
          ) : (
            <span className="grow">{c.authorName && <b>{c.authorName}: </b>}{c.text} <small>{new Date(c.timestamp).toLocaleTimeString()}</small></span>
          )}
          {user && user.role !== 'UNVERIFIED' && (user.role === 'ADMIN' || c.authorId === user.id) && (
            <>
              <button onClick={() => (editId === c.id ? save(c.id) : (setEditId(c.id), setText(c.text)))}>
                {editId === c.id ? 'Save' : 'Edit'}
              </button>
              <button onClick={() => socket.emit('commentDeleted', { commentId: c.id })}>🗑</button>
            </>
          )}
          {user?.role === 'ADMIN' && (
            <button onClick={() => request(`/moderation/comments/${c.id}/hide`, { method: 'POST', body: {} }).catch((e) => alert(errorMessage(e)))}>Hide</button>
          )}
        </div>
      ))}
      {typing && <small>Someone is typing...</small>}
    </div>
  );
}
