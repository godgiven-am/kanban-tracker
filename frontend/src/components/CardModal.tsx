import { FormEvent, useState } from 'react';
import { request, errorMessage } from '../shared/api/http';
import { Button } from '../shared/ui/button';
import { Input } from '../shared/ui/input';
import { Label } from '../shared/ui/label';
import type { Card } from '../types';

interface Props { card?: Card; columnId?: string; onClose: () => void }

export default function CardModal({ card, columnId, onClose }: Props) {
  const [title, setTitle] = useState(card?.title ?? '');
  const [description, setDescription] = useState(card?.description ?? '');
  const [error, setError] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (title.trim().length < 3) return setError('Title needs at least 3 characters');
    const body = { title: title.trim(), description };
    try {
      await (card
        ? request(`/cards/${card.id}`, { method: 'PUT', body })
        : request('/cards', { body: { ...body, columnId } }));
      onClose();
    } catch (err) { setError(errorMessage(err)); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="w-96 space-y-3 rounded-md bg-white p-4 shadow-lg">
        <h2 className="font-semibold">{card ? 'Edit card' : 'New card'}</h2>
        <Label>Title<Input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus /></Label>
        <Label>Description<Input value={description} onChange={(e) => setDescription(e.target.value)} /></Label>
        {error && <small style={{ color: '#c00' }}>{error}</small>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit">Save</Button>
        </div>
      </form>
    </div>
  );
}
