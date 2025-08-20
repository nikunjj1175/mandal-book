import { requireAdmin } from '@/lib/rbac';
import Link from 'next/link';

export default async function AdminHome() {
  await requireAdmin();
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Admin</h1>
        <p className="text-sm text-muted-foreground">Quick links</p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Link href="/admin/contributions" className="rounded-lg border p-4 hover:bg-accent">
          <p className="font-medium">Contributions</p>
          <p className="text-sm text-muted-foreground">Approve and finalize member payments</p>
        </Link>
        <Link href="/admin/users" className="rounded-lg border p-4 hover:bg-accent">
          <p className="font-medium">Users</p>
          <p className="text-sm text-muted-foreground">Manage status and approvals</p>
        </Link>
        <Link href="/admin/analytics" className="rounded-lg border p-4 hover:bg-accent">
          <p className="font-medium">Analytics</p>
          <p className="text-sm text-muted-foreground">Totals and trends</p>
        </Link>
        <Link href="/admin/logs" className="rounded-lg border p-4 hover:bg-accent">
          <p className="font-medium">Audit Logs</p>
          <p className="text-sm text-muted-foreground">Logins and updates</p>
        </Link>
      </div>
    </div>
  );
}


