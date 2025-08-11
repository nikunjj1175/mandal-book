import { requireAdmin } from '@/lib/rbac';
import PendingUsersClient from './pending-users-client';
import Link from 'next/link';

export default async function AdminUsersPage() {
  await requireAdmin();
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Pending users</h1>
      <p className="text-sm text-muted-foreground">Approve new registrations to allow sign in.</p>
      <Link href="/admin/reminders" className="rounded-md border px-3 py-2 text-sm hover:bg-accent">Reminders</Link>
      <PendingUsersClient />
    </div>
  );
}