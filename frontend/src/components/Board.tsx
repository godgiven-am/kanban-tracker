import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { useAppDispatch, useAppSelector } from '../store';
import { cardMoved } from '../actions';
import { socket } from '../socket';
import Column from './Column';

export default function Board() {
  const dispatch = useAppDispatch();
  const columns = useAppSelector((s) => s.columns);
  const cards = useAppSelector((s) => s.cards);
  // Small distance threshold so taps on buttons are not mistaken for drags
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    const card = cards.find((c) => c.id === active.id);
    if (!card || !over || card.columnId === over.id) return;
    const move = { cardId: card.id, fromColumnId: card.columnId, toColumnId: String(over.id) };
    dispatch(cardMoved(move));  // optimistic local update
    socket.emit('cardMoved', move); // server validates and broadcasts to everyone
  };

  return (
    <DndContext sensors={sensors} onDragEnd={onDragEnd}>
      <div className="board">
        {columns.map((col) => (
          <Column key={col.id} column={col} />
        ))}
      </div>
    </DndContext>
  );
}
