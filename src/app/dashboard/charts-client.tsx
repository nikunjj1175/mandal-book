"use client";
import { useEffect, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

type Monthly = { period: string; totalAmount: number; contributions: number };

type Summary = {
  ok: boolean;
  isAdmin: boolean;
  monthly: Monthly[];
  totalAmount: number;
  totalCount: number;
};

export default function DashboardCharts() {
  const [data, setData] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/dashboard/summary')
      .then((r) => r.json())
      .then((json) => {
        if (!json?.ok) throw new Error('Failed');
        setData(json);
      })
      .catch(() => setError('Failed to load data'));
  }, []);

  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }
  if (!data) {
    return <p className="text-sm text-muted-foreground">Loading charts…</p>;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border p-4">
        <div className="mb-3 flex items-end justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Total amount</p>
            <p className="text-2xl font-bold">₹{data.totalAmount.toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total contributions</p>
            <p className="text-2xl font-bold">{data.totalCount.toLocaleString()}</p>
          </div>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.monthly} margin={{ left: 12, right: 12 }}>
              <defs>
                <linearGradient id="amountGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="totalAmount" name="Amount" stroke="#22c55e" fill="url(#amountGradient)" />
              <Area type="monotone" dataKey="contributions" name="Count" stroke="#60a5fa" fillOpacity={0} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {data.isAdmin ? 'Admin view: totals across all members' : 'Your contributions over time'}
        </p>
      </div>
    </div>
  );
}


