"use client";
import { useState } from 'react';

export default function RemindersClient() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);

  async function run() {
    setStatus('sending');
    setMessage(null);
    const res = await fetch('/api/reminders', { method: 'POST' });
    if (res.ok) {
      setStatus('done');
      setMessage('Triggered reminder job');
    } else {
      setStatus('error');
      setMessage('Failed to trigger');
    }
  }

  return (
    <div className="space-y-3">
      <button onClick={run} className="rounded-md border px-3 py-2 text-sm hover:bg-accent" disabled={status==='sending'}>
        {status === 'sending' ? 'Triggering…' : 'Trigger reminder run'}
      </button>
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
    </div>
  );
}