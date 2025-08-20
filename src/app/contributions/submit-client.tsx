"use client";
import { useEffect, useState } from 'react';

type Item = {
  _id: string;
  period: string;
  amount: number;
  status: string;
  utr?: string;
  proof?: { url: string };
  createdAt?: string;
  payments?: { amount: number; utr?: string; proof?: { url: string }; createdAt?: string }[];
  required?: number;
  remaining?: number;
};

export default function MyContributionsClient() {
  const [amount, setAmount] = useState('');
  const [utr, setUtr] = useState('');
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [proofPublicId, setProofPublicId] = useState<string | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all'|'pending'|'verified'|'rejected'>('all');

  async function load() {
    const qs = new URLSearchParams();
    if (start) qs.set('start', start);
    if (end) qs.set('end', end);
    if (statusFilter !== 'all') qs.set('status', statusFilter);
    const url = qs.toString() ? `/api/contributions/mine?${qs}` : '/api/contributions/mine';
    const res = await fetch(url);
    const data = await res.json();
    setItems(data.contributions || []);
  }

  useEffect(() => {
    load();
    fetch('/api/users/me')
      .then((r) => r.json())
      .then((j) => setUserName(j?.user?.name || 'user'))
      .catch(() => {});
  }, []);

  useEffect(() => { load(); }, [start, end]);

  function sanitizeFolderName(name: string) {
    return String(name)
      .toLowerCase()
      .replace(/[^a-z0-9\-\s_]/g, '')
      .trim()
      .replace(/\s+/g, '-');
  }

  async function signUpload(folder: string) {
    const res = await fetch('/api/upload/sign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folder })
    });
    if (!res.ok) throw new Error('sign failed');
    return res.json();
  }

  async function onFileSelected(file: File) {
    const folderBase = `mandal-book/users/${sanitizeFolderName(userName)}/contributions`;
    const { cloudName, apiKey, timestamp, folder, signature } = await signUpload(folderBase);
    const form = new FormData();
    form.append('file', file);
    form.append('api_key', apiKey);
    form.append('timestamp', timestamp);
    form.append('signature', signature);
    form.append('folder', folder);
    const url = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;
    const upRes = await fetch(url, { method: 'POST', body: form });
    const data = await upRes.json();
    if (upRes.ok) {
      setProofUrl(data.secure_url);
      setProofPublicId(data.public_id);
    }
  }

  async function submit() {
    setStatus(null);
    const payload: any = {
      amount: Number(amount),
      utr
    };
    if (proofUrl && proofPublicId) payload.proof = { url: proofUrl, publicId: proofPublicId };
    const res = await fetch('/api/contributions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      setStatus('Submitted');
      setAmount('');
      setUtr('');
      setProofUrl(null);
      setProofPublicId(null);
      load();
    } else setStatus('Failed');
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border p-4">
        <p className="mb-3 font-medium">Filter by month</p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <input value={start} onChange={(e) => setStart(e.target.value)} placeholder="Start (YYYY-MM)" className="rounded-md border px-3 py-2"/>
          <input value={end} onChange={(e) => setEnd(e.target.value)} placeholder="End (YYYY-MM)" className="rounded-md border px-3 py-2"/>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="rounded-md border px-3 py-2">
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
            <option value="rejected">Rejected</option>
          </select>
          <button onClick={() => load()} className="rounded-md border px-3 py-2 text-sm hover:bg-accent">Apply</button>
        </div>
      </div>

      <div className="rounded-lg border p-4">
        <p className="mb-3 font-medium">Submit contribution</p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" className="rounded-md border px-3 py-2"/>
          <input value={utr} onChange={(e) => setUtr(e.target.value)} placeholder="UPI UTR" className="rounded-md border px-3 py-2"/>
          <input type="file" onChange={(e) => e.target.files && onFileSelected(e.target.files[0])} />
        </div>
        <button onClick={submit} className="mt-3 rounded-md border px-3 py-2 text-sm hover:bg-accent">Submit</button>
        {status && <p className="mt-2 text-sm text-muted-foreground">{status}</p>}
      </div>

      <div className="rounded-lg border p-4">
        <p className="mb-3 font-medium">Your contributions</p>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No records yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-auto border-collapse text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left">
                  <th className="p-2">Period</th>
                  <th className="p-2">Created at</th>
                  <th className="p-2">Amount</th>
                  <th className="p-2">Required</th>
                  <th className="p-2">Remaining</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Proof</th>
                  <th className="p-2">Payments</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr key={it._id} className="border-b">
                    <td className="p-2">{it.period}</td>
                    <td className="p-2 whitespace-nowrap">{it.createdAt ? new Date(it.createdAt).toLocaleString() : '-'}</td>
                    <td className="p-2">{it.amount}</td>
                    <td className="p-2">{it.required ?? '-'}</td>
                    <td className={`p-2 ${it.remaining && it.remaining > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>{it.remaining ?? '-'}</td>
                    <td className="p-2">{it.status}</td>
                    <td className="p-2">{it.proof?.url ? <a className="text-blue-600 underline" href={it.proof.url} target="_blank">View</a> : '-'}</td>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}


