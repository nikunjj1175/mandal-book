"use client";
import { useEffect, useMemo, useState } from 'react';

type Row = { _id: string; name: string; email: string; status: 'pending'|'active'|'suspended'; role: 'admin'|'member'; createdAt?: string; updatedAt?: string };

export default function UsersManager() {
  const [rows, setRows] = useState<Row[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<'all'|'pending'|'active'|'suspended'>('all');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    if (status) p.set('status', status);
    if (query) p.set('query', query.trim());
    p.set('page', String(page));
    p.set('pageSize', String(pageSize));
    return p.toString();
  }, [status, query, page, pageSize]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const url = qs ? `/api/admin/users/list?${qs}` : '/api/admin/users/list';
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error('Failed');
      setRows(data.items);
      setTotal(data.total);
    } catch (e) {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [qs]);

  async function setUserStatus(userId: string, nextStatus: Row['status']) {
    const res = await fetch('/api/admin/users/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, status: nextStatus })
    });
    if (res.ok) {
      setRows((prev) => prev.map((r) => (r._id === userId ? { ...r, status: nextStatus } : r)));
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-4">
      <div className="rounded-xl border p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Status</label>
            <select value={status} onChange={(e) => { setPage(1); setStatus(e.target.value as any); }} className="w-full rounded-md border px-3 py-2">
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs text-muted-foreground">Search</label>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Name or email" className="w-full rounded-md border px-3 py-2" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Page size</label>
            <input type="number" value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} className="w-full rounded-md border px-3 py-2" />
          </div>
          <div className="flex items-end">
            <button onClick={() => setPage(1)} className="w-full rounded-md border px-3 py-2 hover:bg-accent">Apply</button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border p-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No users found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-auto border-collapse text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left">
                  <th className="p-2">Name</th>
                  <th className="p-2">Email</th>
                  <th className="p-2">Role</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Created</th>
                  <th className="p-2">Updated</th>
                  <th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r._id} className="border-b">
                    <td className="p-2">{r.name}</td>
                    <td className="p-2">{r.email}</td>
                    <td className="p-2">{r.role}</td>
                    <td className="p-2">
                      <span className={`rounded-md px-2 py-1 text-xs ${r.status === 'active' ? 'bg-emerald-500/10 text-emerald-700' : r.status === 'pending' ? 'bg-amber-500/10 text-amber-700' : 'bg-rose-500/10 text-rose-700'}`}>{r.status}</span>
                    </td>
                    <td className="p-2 whitespace-nowrap">{r.createdAt ? new Date(r.createdAt).toLocaleString() : '-'}</td>
                    <td className="p-2 whitespace-nowrap">{r.updatedAt ? new Date(r.updatedAt).toLocaleString() : '-'}</td>
                    <td className="p-2 space-x-2">
                      {r.status !== 'pending' && (
                        <button onClick={() => setUserStatus(r._id, 'pending')} className="rounded-md bg-amber-500/10 px-3 py-1 text-amber-700 hover:bg-amber-500/20">Set pending</button>
                      )}
                      {r.status !== 'active' && (
                        <button onClick={() => setUserStatus(r._id, 'active')} className="rounded-md bg-emerald-500/10 px-3 py-1 text-emerald-700 hover:bg-emerald-500/20">Activate</button>
                      )}
                      {r.status !== 'suspended' && (
                        <button onClick={() => setUserStatus(r._id, 'suspended')} className="rounded-md bg-rose-500/10 px-3 py-1 text-rose-700 hover:bg-rose-500/20">Suspend</button>
                      )}
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


