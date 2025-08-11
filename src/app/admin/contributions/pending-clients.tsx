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
};

export default function AdminContribClient() {
  const [items, setItems] = useState<Item[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    const res = await fetch('/api/admin/contributions/pending');
    if (!res.ok) {
      setError('Failed to load');
      return;
    }
    const data = await res.json();
    setItems(data.items || []);
  }

  useEffect(() => { load(); }, []);

  async function act(id: string, action: 'verify' | 'reject') {
    const res = await fetch('/api/admin/contributions/verify', {
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
            <th className="p-2">UTR</th>
            <th className="p-2">Proof</th>
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
              <td className="p-2">{it.proof?.url ? <a href={it.proof.url} className="text-blue-600 underline" target="_blank">View</a> : '-'}</td>
              <td className="p-2 space-x-2">
                <button onClick={() => act(it._id, 'verify')} className="rounded-md border px-3 py-1 hover:bg-accent">Verify</button>
                <button onClick={() => act(it._id, 'reject')} className="rounded-md border px-3 py-1 hover:bg-accent">Reject</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


