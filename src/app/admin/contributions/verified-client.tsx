"use client";
import { useEffect, useState } from 'react';

type Item = {
  _id: string;
  period: string;
  amount: number;
  status: string;
  finalized?: boolean;
  utr?: string;
  proof?: { url: string };
  userId?: { name?: string; email?: string };
  payments?: { amount: number; utr?: string; proof?: { url: string }; createdAt?: string }[];
};

export default function VerifiedList() {
  const [items, setItems] = useState<Item[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [finalized, setFinalized] = useState<'false'|'true'|'any'>('false');

  async function load() {
    setError(null);
    const qs = new URLSearchParams();
    if (start) qs.set('start', start);
    if (end) qs.set('end', end);
    if (finalized) qs.set('finalized', finalized);
    const url = qs.toString() ? `/api/admin/contributions/verified?${qs}` : '/api/admin/contributions/verified';
    const res = await fetch(url);
    if (!res.ok) {
      setError('Failed to load');
      return;
    }
    const data = await res.json();
    setItems(data.items || []);
  }

  useEffect(() => { load(); }, [start, end, finalized]);

  async function finalize(id: string) {
    const res = await fetch('/api/admin/contributions/finalize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    if (res.ok) setItems((prev) => prev.filter((it) => it._id !== id));
  }

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (items.length === 0) return <p className="text-sm text-muted-foreground">No verified items awaiting finalize.</p>;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <input value={start} onChange={(e) => setStart(e.target.value)} placeholder="Start (YYYY-MM)" className="rounded-md border px-3 py-2" />
        <input value={end} onChange={(e) => setEnd(e.target.value)} placeholder="End (YYYY-MM)" className="rounded-md border px-3 py-2" />
        <select value={finalized} onChange={(e) => setFinalized(e.target.value as any)} className="rounded-md border px-3 py-2">
          <option value="false">Awaiting finalize</option>
          <option value="true">Finalized</option>
          <option value="any">Any</option>
        </select>
        <button onClick={() => load()} className="rounded-md border px-3 py-2 text-sm hover:bg-accent">Apply</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full table-auto border-collapse text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-left">
              <th className="p-2">User</th>
              <th className="p-2">Period</th>
              <th className="p-2">Amount</th>
              <th className="p-2">UTR</th>
              <th className="p-2">Proof</th>
              <th className="p-2">Payments</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it._id} className="border-b">
                <td className="p-2">{it.userId?.name} ({it.userId?.email})</td>
                <td className="p-2">{it.period}</td>
                <td className="p-2">{it.amount}</td>
                <td className="p-2">{it.utr}</td>
                <td className="p-2">{it.proof?.url ? (
                  <a href={it.proof.url} target="_blank" rel="noreferrer">
                    <img src={it.proof.url} alt="Proof" className="h-16 w-16 rounded-md object-cover ring-1 ring-border" />
                  </a>
                ) : (
                  '-' 
                )}</td>
                <td className="p-2">
                  {it.payments?.length ? (
                    <div className="flex flex-wrap gap-2">
                      {it.payments.map((p, idx) => (
                        <div key={idx} className="rounded-md border p-2">
                          <div className="text-xs">₹{p.amount}</div>
                          <div className="text-[10px] text-muted-foreground whitespace-nowrap">{p.createdAt ? new Date(p.createdAt).toLocaleString() : ''}</div>
                          {p.proof?.url && (
                            <a href={p.proof.url} target="_blank" rel="noreferrer">
                              <img src={p.proof.url} alt="p" className="mt-1 h-12 w-12 rounded object-cover ring-1 ring-border" />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : '-'}
                </td>
                <td className="p-2">
                  <button onClick={() => finalize(it._id)} className="rounded-md bg-sky-500/10 px-3 py-1 text-sky-700 hover:bg-sky-500/20">Finalize</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


