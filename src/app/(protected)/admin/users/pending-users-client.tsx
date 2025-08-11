"use client";
import { useEffect, useState } from 'react';

type PendingUser = { _id: string; name: string; email: string; createdAt?: string };

export default function PendingUsersClient() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<PendingUser[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    const res = await fetch('/api/admin/users/pending');
    if (!res.ok) {
      setError('Failed to load');
      setLoading(false);
      return;
    }
    const data = await res.json();
    setUsers(data.users || []);
    setLoading(false);
  }

  async function approve(userId: string) {
    const res = await fetch('/api/admin/users/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
    if (res.ok) {
      setUsers((prev) => prev.filter((u) => u._id !== userId));
    } else {
      alert('Approval failed');
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) return <p className="text-sm text-muted-foreground">Loading...</p>;
  if (error) return <p className="text-sm text-red-600">{error}</p>;

  if (users.length === 0) return <p className="text-sm text-muted-foreground">No pending users.</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full table-auto border-collapse text-sm">
        <thead>
          <tr className="border-b bg-muted/40 text-left">
            <th className="p-2">Name</th>
            <th className="p-2">Email</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u._id} className="border-b">
              <td className="p-2">{u.name}</td>
              <td className="p-2">{u.email}</td>
              <td className="p-2">
                <button onClick={() => approve(u._id)} className="rounded-md border px-3 py-1 hover:bg-accent">
                  Approve
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


