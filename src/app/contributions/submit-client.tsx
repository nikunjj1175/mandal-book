"use client";
import { useEffect, useState } from 'react';

type Item = {
  _id: string;
  period: string;
  amount: number;
  status: string;
  utr?: string;
  proof?: { url: string };
};

export default function MyContributionsClient() {
  const [amount, setAmount] = useState('');
  const [utr, setUtr] = useState('');
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [proofPublicId, setProofPublicId] = useState<string | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [status, setStatus] = useState<string | null>(null);

  async function load() {
    const res = await fetch('/api/contributions/mine');
    const data = await res.json();
    setItems(data.contributions || []);
  }

  useEffect(() => { load(); }, []);

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
    const { cloudName, apiKey, timestamp, folder, signature } = await signUpload('mandal-book/contributions');
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
    const res = await fetch('/api/contributions/submit', {
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
                  <th className="p-2">Amount</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Proof</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr key={it._id} className="border-b">
                    <td className="p-2">{it.period}</td>
                    <td className="p-2">{it.amount}</td>
                    <td className="p-2">{it.status}</td>
                    <td className="p-2">{it.proof?.url ? <a className="text-blue-600 underline" href={it.proof.url} target="_blank">View</a> : '-'}</td>
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


