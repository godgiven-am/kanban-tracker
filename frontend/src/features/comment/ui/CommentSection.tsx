import { useEffect, useMemo, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store';
import { socket } from '../../../socket';
import { LIMITS, MSG } from '../../../shared/config/messages';
import { formatDate } from '../../../shared/lib/format';
import type { Comment } from '../../../entities/comment/model/types';
import { Avatar, AvatarFallback } from '../../../shared/ui/avatar';
import { Button } from '../../../shared/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../../shared/ui/dropdown-menu';
import { Textarea } from '../../../shared/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../../shared/ui/tooltip';
import ReportDialog from '../../report/ui/ReportDialog';
import { addComment, deleteComment, fetchComments, updateComment } from '../model/commentsSlice';

// Returns a Russian validation message, or '' when the text is fine
const validate = (text: string) => (!text.trim() ? MSG.comments.emptyError : text.length > LIMITS.comment ? MSG.comments.tooLongError : '');

function Composer({ value, onChange, onSubmit, onCancel, submitLabel, placeholder, error, autoFocus }: {
  value: string; onChange: (v: string) => void; onSubmit: () => void; onCancel?: () => void;
  submitLabel: string; placeholder: string; error: string; autoFocus?: boolean;
}) {
  return (
    <div className="grid gap-1">
      <Textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} autoFocus={autoFocus} aria-invalid={!!error} />
      <div className="flex items-center gap-2">
        <span className={`text-xs ${error ? 'text-destructive' : 'text-muted-foreground'}`} role={error ? 'alert' : undefined}>{error || MSG.comments.counter(value.length)}</span>
        <span className="ml-auto flex gap-2">
          {onCancel && <Button type="button" size="sm" variant="secondary" onClick={onCancel}>{MSG.common.cancel}</Button>}
          <Button type="button" size="sm" onClick={onSubmit}>{submitLabel}</Button>
        </span>
      </div>
    </div>
  );
}

export default function CommentSection({ cardId }: { cardId: string }) {
  const dispatch = useAppDispatch();
  const items = useAppSelector((s) => s.comments.items);
  const typing = useAppSelector((s) => s.comments.typing[cardId]);
  const user = useAppSelector((s) => s.session.user);
  const comments = useMemo(() => items.filter((c) => c.cardId === cardId).sort((a, b) => a.timestamp - b.timestamp), [items, cardId]);

  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editError, setEditError] = useState('');
  const [reportId, setReportId] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const lastTyping = useRef(0);

  useEffect(() => { dispatch(fetchComments(cardId)); }, [dispatch, cardId]);

  const canWrite = !!user && user.role !== 'UNVERIFIED';
  const canModify = (c: Comment) => canWrite && !!user && (user.role === 'ADMIN' || c.authorId === user.id);
  const run = async (start: () => Promise<{ meta: { requestStatus: string }; payload?: unknown }>, fail: (m: string) => void) => {
    const res = await start();
    if (res.meta.requestStatus === 'rejected') fail((res.payload as string | undefined) ?? MSG.errors.generic);
  };

  const onType = (v: string) => {
    setText(v); setError('');
    const now = Date.now(); // typing indicator is throttled to one event per second
    if (v && now - lastTyping.current > 1000) { lastTyping.current = now; socket.emit('typing', { cardId }); }
  };

  const send = () => {
    const problem = validate(text);
    if (problem) return setError(problem);
    run(() => dispatch(addComment({ cardId, text: text.trim() })), setError);
    setText('');
  };

  const save = (id: string) => {
    const problem = validate(editText);
    if (problem) return setEditError(problem);
    run(() => dispatch(updateComment({ id, text: editText.trim() })), setError);
    setEditId(null);
  };

  return (
    <TooltipProvider delayDuration={300}>
      <section className="ui mt-2 grid gap-3 text-sm" aria-label={MSG.comments.title}>
        {comments.length === 0 && <p className="text-muted-foreground">{MSG.comments.empty}</p>}

        {comments.map((c) => (
          <article key={c.id} className="flex gap-2">
            <Avatar><AvatarFallback>{(c.authorName ?? '?').slice(0, 1).toUpperCase()}</AvatarFallback></Avatar>
            <div className="min-w-0 flex-1">
              <header className="flex items-center gap-2">
                <b className="truncate">{c.authorName ?? '—'}</b>
                <time className="text-xs text-muted-foreground">{formatDate(c.timestamp)}</time>
                {c.updatedAt && <span className="text-xs text-muted-foreground">{MSG.comments.edited}</span>}
                {!c.id.startsWith('tmp-') && (
                  <DropdownMenu>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="ghost" className="ml-auto h-6 px-2" aria-label={MSG.comments.actions}>⋯</Button>
                        </DropdownMenuTrigger>
                      </TooltipTrigger>
                      <TooltipContent>{MSG.comments.actions}</TooltipContent>
                    </Tooltip>
                    <DropdownMenuContent align="end">
                      {canModify(c) && <DropdownMenuItem onSelect={() => { setEditId(c.id); setEditText(c.text); setEditError(''); }}>{MSG.common.edit}</DropdownMenuItem>}
                      {canModify(c) && <DropdownMenuItem onSelect={() => run(() => dispatch(deleteComment(c.id)), setError)}>{MSG.common.delete}</DropdownMenuItem>}
                      {c.authorId !== user?.id && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <DropdownMenuItem onSelect={() => setReportId(c.id)}>{MSG.common.report}</DropdownMenuItem>
                          </TooltipTrigger>
                          <TooltipContent side="left">{MSG.comments.reportTooltip}</TooltipContent>
                        </Tooltip>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </header>
              {editId === c.id ? (
                <Composer value={editText} onChange={(v) => { setEditText(v); setEditError(''); }} onSubmit={() => save(c.id)} onCancel={() => setEditId(null)}
                  submitLabel={MSG.common.save} placeholder={MSG.comments.editPlaceholder} error={editError} autoFocus />
              ) : (
                <p className="whitespace-pre-wrap break-words">{c.text}</p>
              )}
            </div>
          </article>
        ))}

        {typing && <small className="text-muted-foreground">{MSG.comments.typing}</small>}
        {notice && <p role="status" className="text-xs text-muted-foreground">{notice}</p>}

        {canWrite
          ? <Composer value={text} onChange={onType} onSubmit={send} submitLabel={MSG.common.send} placeholder={MSG.comments.placeholder} error={error} />
          : <p className="text-muted-foreground">{MSG.comments.unverified}</p>}

        <ReportDialog commentId={reportId} onClose={(sent) => { setReportId(null); if (sent) setNotice(MSG.comments.reportSent); }} />
      </section>
    </TooltipProvider>
  );
}
