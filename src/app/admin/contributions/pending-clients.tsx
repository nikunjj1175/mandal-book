"use client";
import { useEffect, useState } from 'react';

type Item = {
  _id: string;
  period: string;
  amount: number;
  status: string;
  utr?: string;
  proof?: { url: string };
  userId?: { name?: string; email?: string };
  payments?: { amount: number; utr?: string; proof?: { url: string }; createdAt?: string }[];
  required?: number;
  remaining?: number;
};

export default function AdminContribClient() {
  const [items, setItems] = useState<Item[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    const res = await fetch('/api/contributions/pending');
    if (!res.ok) {
      setError('Failed to load');
      return;
    }
    const data = await res.json();
    setItems(data.items || []);
  }

  useEffect(() => { load(); }, []);

  async function act(id: string, action: 'verify' | 'reject') {
    const res = await fetch('/api/contributions/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action })
    });
    if (res.ok) setItems((prev) => prev.filter((it) => it._id !== id));
  }

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (items.length === 0) return <p className="text-sm text-muted-foreground">No pending items.</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full table-auto border-collapse text-sm">
        <thead>
          <tr className="border-b bg-muted/40 text-left">
            <th className="p-2">User</th>
            <th className="p-2">Period</th>
            <th className="p-2">Amount</th>
            <th className="p-2">Required</th>
            <th className="p-2">Remaining</th>
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
              <td className="p-2">{it.required ?? '-'}</td>
              <td className={`p-2 ${it.remaining && it.remaining > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>{it.remaining ?? '-'}</td>
              <td className="p-2">{it.utr}</td>
              <td className="p-2">
                {it.proof?.url ? (
                  <a href={it.proof.url} target="_blank" rel="noreferrer">
                    <img src={it.proof.url} alt="Proof" className="h-16 w-16 rounded-md object-cover ring-1 ring-border" />
                  </a>
                ) : (
                  '-'
                )}
              </td>
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
              <td className="p-2 space-x-2">
                <button onClick={() => act(it._id, 'verify')} className="rounded-md bg-emerald-500/10 px-3 py-1 text-emerald-700 hover:bg-emerald-500/20">Verify</button>
                <button onClick={() => act(it._id, 'reject')} className="rounded-md bg-rose-500/10 px-3 py-1 text-rose-700 hover:bg-rose-500/20">Reject</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


