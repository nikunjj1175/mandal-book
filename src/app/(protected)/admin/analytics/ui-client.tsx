"use client";
import { useEffect, useMemo, useState } from 'react';
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

type Monthly = {
  period: string;
  totalAmount: number;
  contributions: number;
  uniqueUsers: number;
  withProof: number;
};

type Analytics = {
  ok: boolean;
  membersAll: number;
  membersActive: number;
  uniqueContributors: number;
  totalAmount: number;
  totalCount: number;
  withProof: number;
  monthly: Monthly[];
};

export default function AdminAnalyticsClient() {
  const [data, setData] = useState<Analytics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [start, setStart] = useState<string>('');
  const [end, setEnd] = useState<string>('');
  const [hasProof, setHasProof] = useState<'any' | 'with' | 'without'>('any');

  const qs = useMemo(() => {
    const params = new URLSearchParams();
    if (start) params.set('start', start);
    if (end) params.set('end', end);
    if (hasProof !== 'any') params.set('hasProof', hasProof);
    return params.toString();
  }, [start, end, hasProof]);

  useEffect(() => {
    const url = qs ? `/api/admin/analytics?${qs}` : '/api/admin/analytics';
    fetch(url)
      .then((r) => r.json())
      .then((j) => {
        if (!j?.ok) throw new Error('Failed');
        setData(j);
      })
      .catch(() => setError('Failed to load analytics'));
  }, [qs]);

  if (error) return <p className="text-sm text-destructive">{error}</p>;
  if (!data) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div>
            <p className="text-xs text-muted-foreground">Members (all)</p>
            <p className="text-2xl font-bold">{data.membersAll}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Members (active)</p>
            <p className="text-2xl font-bold">{data.membersActive}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Contributors</p>
            <p className="text-2xl font-bold">{data.uniqueContributors}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Proof uploads</p>
            <p className="text-2xl font-bold">{data.withProof}</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border p-4">
        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Start (YYYY-MM)</label>
            <input value={start} onChange={(e) => setStart(e.target.value)} placeholder="2025-01" className="w-full rounded-md border px-3 py-2" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">End (YYYY-MM)</label>
            <input value={end} onChange={(e) => setEnd(e.target.value)} placeholder="2025-12" className="w-full rounded-md border px-3 py-2" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Image</label>
            <select value={hasProof} onChange={(e) => setHasProof(e.target.value as any)} className="w-full rounded-md border px-3 py-2">
              <option value="any">Any</option>
              <option value="with">With image</option>
              <option value="without">Without image</option>
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={() => { /* rerun via deps */ }} className="w-full rounded-md border px-3 py-2 hover:bg-accent">Apply</button>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.monthly} margin={{ left: 12, right: 12 }}>
              <defs>
                <linearGradient id="adminAmount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="totalAmount" name="Amount" stroke="#22c55e" fill="url(#adminAmount)" />
              <Area type="monotone" dataKey="contributions" name="Submissions" stroke="#60a5fa" fillOpacity={0} />
              <Area type="monotone" dataKey="uniqueUsers" name="Users" stroke="#a78bfa" fillOpacity={0} />
              <Area type="monotone" dataKey="withProof" name="With image" stroke="#f472b6" fillOpacity={0} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl border p-4">
        <p className="mb-3 font-medium">Monthly breakdown</p>
        <div className="overflow-x-auto">
          <table className="w-full table-auto border-collapse text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left">
                <th className="p-2">Period</th>
                <th className="p-2">Amount</th>
                <th className="p-2">Submissions</th>
                <th className="p-2">Users</th>
                <th className="p-2">With image</th>
              </tr>
            </thead>
            <tbody>
              {data.monthly.map((m) => (
                <tr key={m.period} className="border-b">
                  <td className="p-2">{m.period}</td>
                  <td className="p-2">₹{m.totalAmount.toLocaleString()}</td>
                  <td className="p-2">{m.contributions}</td>
                  <td className="p-2">{m.uniqueUsers}</td>
                  <td className="p-2">{m.withProof}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


