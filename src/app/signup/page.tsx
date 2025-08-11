"use client";
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SignUpPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget as HTMLFormElement & {
      name: { value: string };
      email: { value: string };
      password: { value: string };
    };
    const res = await fetch('/api/users/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name.value,
        email: form.email.value,
        password: form.password.value
      })
    });
    if (res.ok) {
      setSuccess(true);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data?.error || 'Registration failed');
    }
  }

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-4 text-xl font-semibold">Create account</h1>
      {success ? (
        <div className="rounded-md border p-3 text-sm">
          Registration submitted. An admin must approve your account before you can sign in.
          <div className="mt-3">
            <button onClick={() => router.push('/signin')} className="rounded-md border px-3 py-2 text-sm hover:bg-accent">
              Go to sign in
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-3">
          <input name="name" type="text" placeholder="Full name" className="w-full rounded-md border px-3 py-2" required />
          <input name="email" type="email" placeholder="Email" className="w-full rounded-md border px-3 py-2" required />
          <input name="password" type="password" placeholder="Password" className="w-full rounded-md border px-3 py-2" required />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button className="w-full rounded-md bg-primary px-3 py-2 text-white">Create account</button>
        </form>
      )}
    </div>
  );
}