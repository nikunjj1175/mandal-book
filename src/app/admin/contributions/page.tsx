import { requireAdmin } from '@/lib/rbac';
import AdminContribClient from './pending-clients';

export default async function AdminContribPage() {
  await requireAdmin();
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Pending contributions</h1>
      <AdminContribClient />
    </div>
  );
}