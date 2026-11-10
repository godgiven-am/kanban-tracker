import { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { request, errorMessage } from '../shared/api/http';
import { isVerified } from '../entities/user/model';
import { useAppSelector } from '../store';
import type { Card as CardT } from '../types';
import CommentSection from '../features/comment/ui/CommentSection';
import CardModal from './CardModal';

export default function Card({ card }: { card: CardT }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: card.id });
  const canEdit = useAppSelector((s) => isVerified(s.session.user));
  const [editing, setEditing] = useState(false);
  const [open, setOpen] = useState(false);

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
        <strong className="grow">{card.title}</strong>
        {canEdit && <button onClick={() => setEditing(true)}>Edit</button>}
        {canEdit && <button onClick={remove}>🗑</button>}
      </div>
      {card.description && <p>{card.description}</p>}
      <button onClick={() => setOpen(!open)}>{open ? 'Hide' : 'Comments'}</button>
      {open && <CommentSection cardId={card.id} />}
      {editing && <CardModal card={card} onClose={() => setEditing(false)} />}
    </div>
  );
}
