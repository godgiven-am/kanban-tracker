import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store';
import { ACCOUNT_STATUS_LABELS, MSG, REASON_LABELS, REPORT_STATUS_LABELS } from '../../../shared/config/messages';
import { formatDate } from '../../../shared/lib/format';
import { Badge } from '../../../shared/ui/badge';
import { Button } from '../../../shared/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../../shared/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../shared/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../../shared/ui/tooltip';
import { fetchReports, resolveReport, type Report, type ResolveAction } from '../../report/model/reportsSlice';

const STATUS_STYLE = { pending: 'bg-yellow-100', resolved: 'bg-green-100', dismissed: '' } as const;
const M = MSG.moderation;

// Menu entry with a tooltip explaining what the action does
function Action({ label, hint, onSelect }: { label: string; hint: string; onSelect: () => void }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild><DropdownMenuItem onSelect={onSelect}>{label}</DropdownMenuItem></TooltipTrigger>
      <TooltipContent side="left">{hint}</TooltipContent>
    </Tooltip>
  );
}

export default function ModerationTable() {
  const dispatch = useAppDispatch();
  const { items, loading, error } = useAppSelector((s) => s.reports);
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [actionError, setActionError] = useState('');

  useEffect(() => { dispatch(fetchReports()); }, [dispatch]);

  const toggle = (id: string) => setOpen((s) => { const n = new Set(s); if (!n.delete(id)) n.add(id); return n; });

  const resolve = async (r: Report, action: ResolveAction, banDurationDays?: number, confirmText?: string) => {
    if (confirmText && !window.confirm(confirmText)) return;
    const res = await dispatch(resolveReport({ id: r.id, action, banDurationDays }));
    setActionError(resolveReport.rejected.match(res) ? res.payload ?? MSG.errors.generic : '');
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="ui mx-auto mt-6 max-w-5xl px-3">
        <h1 className="mb-3 text-xl font-semibold">{M.title}</h1>
        {(error || actionError) && <p role="alert" className="mb-2 text-sm text-destructive">{error || actionError}</p>}
        {loading && !items.length && <p className="text-sm text-muted-foreground">{MSG.common.loading}</p>}
        {!loading && !items.length && !error && <p className="text-sm text-muted-foreground">{M.empty}</p>}
        {items.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>{Object.values(M.columns).map((h) => <TableHead key={h}>{h}</TableHead>)}</TableRow>
            </TableHeader>
            <TableBody>
              {items.map((r) => {
                const expanded = open.has(r.id);
                const a = r.author;
                return (
                  <TableRow key={r.id}>
                    <TableCell className="max-w-xs">
                      <p className={`whitespace-pre-wrap break-words ${expanded ? '' : 'line-clamp-2'}`}>{r.commentSnapshot.text}</p>
                      {r.commentSnapshot.text.length > 80 && (
                        <button className="text-xs text-muted-foreground underline" onClick={() => toggle(r.id)}>{expanded ? M.collapse : M.expand}</button>
                      )}
                    </TableCell>
                    <TableCell>
                      {a ? (
                        <>
                          <div className="font-medium">{a.name}</div>
                          <div className="text-xs text-muted-foreground">{a.email}</div>
                          <Badge>{ACCOUNT_STATUS_LABELS[a.status]}{a.status === 'MUTED' && a.bannedUntil ? ` ${M.bannedUntil(formatDate(a.bannedUntil))}` : ''}</Badge>
                        </>
                      ) : <span className="text-muted-foreground">{r.commentSnapshot.authorName ?? M.unknownAuthor}</span>}
                    </TableCell>
                    <TableCell>{r.reportedBy.userName}</TableCell>
                    <TableCell>
                      {REASON_LABELS[r.reason]}
                      {r.details && <div className="max-w-[12rem] break-words text-xs text-muted-foreground">{r.details}</div>}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{formatDate(r.createdAt)}</TableCell>
                    <TableCell><Badge className={STATUS_STYLE[r.status]}>{REPORT_STATUS_LABELS[r.status]}</Badge></TableCell>
                    <TableCell>
                      {r.status === 'pending' && (
                        <DropdownMenu>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <DropdownMenuTrigger asChild><Button size="sm" variant="secondary">{M.actions} ▾</Button></DropdownMenuTrigger>
                            </TooltipTrigger>
                            <TooltipContent>{M.actionsTooltip}</TooltipContent>
                          </Tooltip>
                          <DropdownMenuContent align="end">
                            <Action label={M.dismiss} hint={M.dismissTooltip} onSelect={() => resolve(r, 'dismiss')} />
                            <Action label={M.deleteComment} hint={M.deleteTooltip} onSelect={() => resolve(r, 'deleteComment', undefined, M.confirmDelete)} />
                            <Action label={M.ban7} hint={M.banTooltip} onSelect={() => resolve(r, 'banAuthor', 7)} />
                            <Action label={M.banForever} hint={M.banTooltip} onSelect={() => resolve(r, 'banAuthor', undefined, M.confirmBanForever)} />
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </TooltipProvider>
  );
}
