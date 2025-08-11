"use client";
import { FormEvent, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function SignInPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement & {
      email: { value: string };
      password: { value: string };
    };
    const res = await signIn('credentials', {
      email: form.email.value,
      password: form.password.value,
      redirect: false
    });
    
    if (res?.ok) router.push('/');
    else setError('Invalid credentials');
  };
  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-4 text-xl font-semibold">Sign in</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input name="email" type="email" placeholder="Email" className="w-full rounded-md border px-3 py-2" required />
        <input name="password" type="password" placeholder="Password" className="w-full rounded-md border px-3 py-2" required />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="w-full rounded-md bg-primary px-3 py-2 text-white">Sign in</button>
      </form>
    </div>
  );
}