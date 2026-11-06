import { useState } from 'react';
import { errorMessage, request } from '../../shared/api/http';
import { Button } from '../../shared/ui/button';

export default function VerifyBanner() {
  const [status, setStatus] = useState('');

  const resend = async () => {
    try {
      await request('/auth/resend', { method: 'POST' });
      setStatus('Verification email sent.');
    } catch (e) { setStatus(errorMessage(e)); }
  };

  return (
    <div className="ui flex flex-wrap items-center gap-2 bg-secondary px-3 py-2 text-sm">
      <span>Verify your email to edit the board and comment. The link is valid for 24 hours.</span>
      <Button size="sm" variant="secondary" onClick={resend}>Resend email</Button>
      {status && <span className="text-muted-foreground">{status}</span>}
    </div>
  );
}
