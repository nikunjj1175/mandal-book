"use client";
import { FormEvent, useState } from 'react';

export default function KycPage() {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    const form = e.currentTarget as HTMLFormElement & {
      name: { value: string };
      aadhaarNumber: { value: string };
      panNumber: { value: string };
      addressLine1: { value: string };
      city: { value: string };
      state: { value: string };
      postalCode: { value: string };
      accountHolderName: { value: string };
      accountNumber: { value: string };
      ifsc: { value: string };
      bankName: { value: string };
      branch: { value: string };
    };
    const res = await fetch('/api/users/kyc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name.value,
        aadhaarNumber: form.aadhaarNumber.value,
        panNumber: form.panNumber.value,
        address: {
          line1: form.addressLine1.value,
          city: form.city.value,
          state: form.state.value,
          postalCode: form.postalCode.value
        },
        bank: {
          accountHolderName: form.accountHolderName.value,
          accountNumber: form.accountNumber.value,
          ifsc: form.ifsc.value,
          bankName: form.bankName.value,
          branch: form.branch.value
        }
      })
    });
    if (res.ok) setMessage('Saved');
    else setError('Failed');
  }

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="text-xl font-semibold">KYC details</h1>
      {message && <p className="text-sm text-green-600">{message}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <form onSubmit={onSubmit} className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <input name="name" placeholder="Full name" className="rounded-md border px-3 py-2 md:col-span-2" required />
        <input name="aadhaarNumber" placeholder="Aadhaar number" className="rounded-md border px-3 py-2" />
        <input name="panNumber" placeholder="PAN number" className="rounded-md border px-3 py-2" />
        <input name="addressLine1" placeholder="Address line 1" className="rounded-md border px-3 py-2 md:col-span-2" />
        <input name="city" placeholder="City" className="rounded-md border px-3 py-2" />
        <input name="state" placeholder="State" className="rounded-md border px-3 py-2" />
        <input name="postalCode" placeholder="Postal code" className="rounded-md border px-3 py-2" />
        <input name="accountHolderName" placeholder="Account holder name" className="rounded-md border px-3 py-2 md:col-span-2" />
        <input name="accountNumber" placeholder="Account number" className="rounded-md border px-3 py-2" />
        <input name="ifsc" placeholder="IFSC" className="rounded-md border px-3 py-2" />
        <input name="bankName" placeholder="Bank name" className="rounded-md border px-3 py-2" />
        <input name="branch" placeholder="Branch" className="rounded-md border px-3 py-2" />
        <button className="col-span-1 md:col-span-2 rounded-md bg-primary px-3 py-2 text-white">Save</button>
      </form>
    </div>
  );
}