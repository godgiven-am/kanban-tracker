import { FormEvent, useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useAppSelector } from '../store';
import { request, errorMessage } from '../shared/api/http';
import { isVerified } from '../entities/user/model';
import type { Column as Col } from '../types';
import Card from './Card';

export default function Column({ column }: { column: Col }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const cards = useAppSelector((s) => s.cards);
  const canEdit = useAppSelector((s) => isVerified(s.session.user));
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');

  // Cards render in the order given by column.cardIds
  const ordered = column.cardIds.map((id) => cards.find((c) => c.id === id)).filter((c) => !!c);

  const add = async (e: FormEvent) => {
    e.preventDefault();
    if (title.trim().length < 3) return setError('Title needs at least 3 characters');
    // The created card arrives back through the 'cardCreated' socket event
    try {
      await request('/cards', { body: { title: title.trim(), columnId: column.id } });
    } catch (e) { return setError(errorMessage(e)); }
    setError('');
    setTitle('');
  };

  return (
    <div ref={setNodeRef} className={`col${isOver ? ' over' : ''}`}>
      <h3>{column.title} ({ordered.length})</h3>
      {ordered.map((c) => <Card key={c!.id} card={c!} />)}
      {canEdit && <form onSubmit={add} className="row">
        <input className="grow" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="New card" />
        <button>+</button>
      </form>}
      {error && <small style={{ color: '#c00' }}>{error}</small>}
    </div>
  );
}
