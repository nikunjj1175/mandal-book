"use client";
import { useEffect, useMemo, useState } from 'react';

type LogItem = {
  _id: string;
  action: string;
  targetType?: string;
  targetId?: string;
  before?: any;
  after?: any;
  meta?: any;
  createdAt: string;
  actorUserId?: { name?: string; email?: string } | string;
};

export default function LogsClient() {
  const [items, setItems] = useState<LogItem[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [action, setAction] = useState('');
  const [actor, setActor] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    if (action) p.set('action', action);
    if (actor) p.set('actor', actor);
    p.set('page', String(page));
    p.set('pageSize', String(pageSize));
    return p.toString();
  }, [action, actor, page, pageSize]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const url = qs ? `/api/admin/logs?${qs}` : '/api/admin/logs';
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error('Failed');
      setItems(data.items);
      setTotal(data.total);
    } catch (e) {
      setError('Failed to load logs');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [qs]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-4">
      <div className="rounded-xl border p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Action</label>
            <input value={action} onChange={(e) => setAction(e.target.value)} placeholder="login | kyc_update | contribution_*" className="w-full rounded-md border px-3 py-2" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Actor User ID</label>
            <input value={actor} onChange={(e) => setActor(e.target.value)} placeholder="MongoId" className="w-full rounded-md border px-3 py-2" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Page size</label>
            <input type="number" value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} className="w-full rounded-md border px-3 py-2" />
          </div>
          <div className="flex items-end">
            <button onClick={() => setPage(1)} className="w-full rounded-md border px-3 py-2 hover:bg-accent">Apply</button>
          </div>
          <div className="flex items-end justify-end text-sm text-muted-foreground">Total: {total}</div>
        </div>
      </div>

      <div className="rounded-xl border p-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-auto border-collapse text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left">
                  <th className="p-2">Time</th>
                  <th className="p-2">Actor</th>
                  <th className="p-2">Action</th>
                  <th className="p-2">Target</th>
                  <th className="p-2">Before → After</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr key={it._id} className="border-b align-top">
                    <td className="p-2 whitespace-nowrap">{new Date(it.createdAt).toLocaleString()}</td>
                    <td className="p-2">
                      {typeof it.actorUserId === 'string'
                        ? it.actorUserId
                        : `${it.actorUserId?.name || ''} (${it.actorUserId?.email || ''})`}
                    </td>
                    <td className="p-2">{it.action}</td>
                    <td className="p-2">{it.targetType || '-'} {it.targetId ? `#${it.targetId}` : ''}</td>
                    <td className="p-2">
                      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                        <pre className="overflow-auto rounded-md bg-muted/40 p-2 text-xs">{JSON.stringify(it.before || {}, null, 2)}</pre>
                        <pre className="overflow-auto rounded-md bg-muted/40 p-2 text-xs">{JSON.stringify(it.after || {}, null, 2)}</pre>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-3 flex items-center justify-between">
          <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded-md border px-3 py-1 disabled:opacity-50">Prev</button>
          <span className="text-sm text-muted-foreground">Page {page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="rounded-md border px-3 py-1 disabled:opacity-50">Next</button>
        </div>
      </div>
    </div>
  );
}


