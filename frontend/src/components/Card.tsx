import { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { request, errorMessage } from '../shared/api/http';
import { isVerified } from '../entities/user/model';
import { useAppSelector } from '../store';
import { socket } from '../socket';
import type { Card as CardT } from '../types';
import CommentList from './CommentList';
import CommentForm from './CommentForm';

export default function Card({ card }: { card: CardT }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: card.id });
  const canEdit = useAppSelector((s) => isVerified(s.session.user));
  const [editing, setEditing] = useState(false);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description ?? '');

  const save = () => {
    if (title.trim().length < 3) return alert('Title needs at least 3 characters');
    socket.emit('cardUpdated', { cardId: card.id, updates: { title: title.trim(), description } });
    setEditing(false);
  };
  const remove = () => request(`/cards/${card.id}`, { method: 'DELETE' }).catch((e) => alert(errorMessage(e)));

  return (
    <div
      ref={setNodeRef}
      className="card"
      style={{ transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.6 : 1, position: 'relative', zIndex: isDragging ? 10 : undefined }}
    >
      <div className="row">
        {/* Only the handle starts a drag, so scrolling and tapping still work on touch screens */}
        {canEdit && <span className="handle" {...listeners} {...attributes}>⠿</span>}
        {editing ? (
          <input className="grow" value={title} onChange={(e) => setTitle(e.target.value)} />
        ) : (
          <strong className="grow">{card.title}</strong>
        )}
        {canEdit && <button onClick={editing ? save : () => setEditing(true)}>{editing ? 'Save' : 'Edit'}</button>}
        {canEdit && <button onClick={remove}>🗑</button>}
      </div>
      {editing ? (
        <input style={{ width: '100%', boxSizing: 'border-box', marginTop: 6 }} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" />
      ) : (
        card.description && <p>{card.description}</p>
      )}
      <button onClick={() => setOpen(!open)}>{open ? 'Hide' : 'Comments'}</button>
      {open && (
        <>
          <CommentList cardId={card.id} />
          {canEdit && <CommentForm cardId={card.id} />}
        </>
      )}
    </div>
  );
}
