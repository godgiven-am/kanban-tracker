import { FormEvent, useState } from 'react';
import { useAppDispatch } from '../../../store';
import { LIMITS, MSG, REASON_LABELS } from '../../../shared/config/messages';
import { Button } from '../../../shared/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../../shared/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../shared/ui/select';
import { Textarea } from '../../../shared/ui/textarea';
import { createReport, type ReportReason } from '../model/reportsSlice';

interface Props { commentId: string | null; onClose: (sent: boolean) => void }

// Open while `commentId` is set; the parent re-mounts it per comment, so the form state resets
export default function ReportDialog({ commentId, onClose }: Props) {
  const dispatch = useAppDispatch();
  const [reason, setReason] = useState<ReportReason | ''>('');
  const [details, setDetails] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const close = (sent = false) => { setReason(''); setDetails(''); setError(''); onClose(sent); };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!reason) return setError(MSG.report.reasonRequired);
    if (details.length > LIMITS.details) return setError(MSG.report.tooLongError);
    setBusy(true);
    const res = await dispatch(createReport({ commentId: commentId!, reason, details: details.trim() || undefined }));
    setBusy(false);
    if (createReport.rejected.match(res)) setError(res.payload ?? MSG.errors.generic);
    else close(true);
  };

  return (
    <Dialog open={!!commentId} onOpenChange={(open) => !open && close()}>
      <DialogContent>
        <form onSubmit={submit} className="grid gap-3">
          <DialogHeader>
            <DialogTitle>{MSG.report.title}</DialogTitle>
            <DialogDescription>{MSG.report.description}</DialogDescription>
          </DialogHeader>
          <label className="grid gap-1 text-sm">
            {MSG.report.reason}
            <Select value={reason} onValueChange={(v) => { setReason(v as ReportReason); setError(''); }}>
              <SelectTrigger><SelectValue placeholder={MSG.report.reasonPlaceholder} /></SelectTrigger>
              <SelectContent>
                {Object.entries(REASON_LABELS).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
              </SelectContent>
            </Select>
          </label>
          <label className="grid gap-1 text-sm">
            {MSG.report.details}
            <Textarea value={details} onChange={(e) => setDetails(e.target.value)} placeholder={MSG.report.detailsPlaceholder} />
            <span className={`text-xs ${details.length > LIMITS.details ? 'text-destructive' : 'text-muted-foreground'}`}>{MSG.report.counter(details.length)}</span>
          </label>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => close()}>{MSG.common.cancel}</Button>
            <Button type="submit" disabled={busy}>{MSG.common.send}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
