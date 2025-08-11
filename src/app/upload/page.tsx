"use client";
import { useState } from 'react';

export default function UploadDemoPage() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  async function upload() {
    if (!file) return;
    setStatus('Signing…');
    const signRes = await fetch('/api/upload/sign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folder: 'mandal-book/demo' })
    });
    if (!signRes.ok) {
      setStatus('Failed to sign');
      return;
    }
    const { cloudName, apiKey, timestamp, folder, signature } = await signRes.json();

    setStatus('Uploading…');
    const form = new FormData();
    form.append('file', file);
    form.append('api_key', apiKey);
    form.append('timestamp', timestamp);
    form.append('signature', signature);
    form.append('folder', folder);

    const cloudUrl = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;
    const upRes = await fetch(cloudUrl, { method: 'POST', body: form });
    const data = await upRes.json();
    if (upRes.ok) setStatus(`Uploaded: ${data.secure_url}`);
    else setStatus('Upload failed');
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Upload demo</h1>
      <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
      <button onClick={upload} className="rounded-md border px-3 py-2 text-sm hover:bg-accent" disabled={!file}>
        Upload
      </button>
      {status && <p className="text-sm text-muted-foreground">{status}</p>}
    </div>
  );
}