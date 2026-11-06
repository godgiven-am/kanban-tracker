import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useAppSelector } from '../store';
import { isVerified } from '../entities/user/model';
import type { Column as Col } from '../types';
import Card from './Card';
import CardModal from './CardModal';

export default function Column({ column }: { column: Col }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const cards = useAppSelector((s) => s.cards);
  const canEdit = useAppSelector((s) => isVerified(s.session.user));
  const [creating, setCreating] = useState(false);

  // Cards render in the order given by column.cardIds
  const ordered = column.cardIds.map((id) => cards.find((c) => c.id === id)).filter((c) => !!c);

  return (
    <div ref={setNodeRef} className={`col${isOver ? ' over' : ''}`}>
      <h3>{column.title} ({ordered.length})</h3>
      {ordered.map((c) => <Card key={c!.id} card={c!} />)}
      {canEdit && <button onClick={() => setCreating(true)}>+ Add card</button>}
      {creating && <CardModal columnId={column.id} onClose={() => setCreating(false)} />}
    </div>
  );
}
