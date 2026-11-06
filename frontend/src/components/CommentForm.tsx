import { FormEvent, useRef, useState } from 'react';
import { socket } from '../socket';

export default function CommentForm({ cardId, parentId, onDone }: { cardId: string; parentId?: string; onDone?: () => void }) {
  const [text, setText] = useState('');
  const lastTyping = useRef(0);

  const onChange = (value: string) => {
    setText(value);
    // Throttle: at most one 'typing' event per second while the user keeps typing
    const now = Date.now();
    if (value && now - lastTyping.current > 1000) {
      lastTyping.current = now;
      socket.emit('typing', { cardId });
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    socket.emit('commentAdded', { cardId, parentId, commentText: text });
    setText('');
    onDone?.();
  };

  return (
    <form onSubmit={submit} className="row">
      <input className="grow" value={text} onChange={(e) => onChange(e.target.value)} placeholder={parentId ? 'Reply' : 'Add a comment'} />
      <button>Send</button>
    </form>
  );
}
