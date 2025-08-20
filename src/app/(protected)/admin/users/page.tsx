import { requireAdmin } from '@/lib/rbac';
import PendingUsersClient from './pending-users-client';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const UsersManager = dynamic(() => import('./users-manager-client'), { ssr: false });

export default async function AdminUsersPage() {
  await requireAdmin();
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Users</h1>
        <p className="text-sm text-muted-foreground">Manage user status and approvals</p>
      </div>
      <UsersManager />
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Pending approvals</h2>
        <p className="text-sm text-muted-foreground">Approve new registrations to allow sign in.</p>
        <Link href="/admin/reminders" className="inline-block rounded-md border px-3 py-2 text-sm hover:bg-accent">Reminders</Link>
        <PendingUsersClient />
      </div>
    </div>
  );
}