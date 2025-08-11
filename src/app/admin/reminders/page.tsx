import { requireAdmin } from '@/lib/rbac';
import RemindersClient from './reminders-client';

export default async function AdminRemindersPage() {
  await requireAdmin();
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Reminders</h1>
      <p className="text-sm text-muted-foreground">Trigger the monthly reminder email run manually.</p>
      <RemindersClient />
    </div>
  );
}