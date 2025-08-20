import { requireAdmin } from '@/lib/rbac';
import AdminContribClient from './pending-clients';
import dynamic from 'next/dynamic';

const VerifiedList = dynamic(() => import('./verified-client'), { ssr: false });

export default async function AdminContribPage() {
  await requireAdmin();
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Contributions</h1>
        <p className="text-sm text-muted-foreground">Verify and finalize member payments</p>
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Pending verification</h2>
        <AdminContribClient />
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Verified (awaiting finalize)</h2>
        <VerifiedList />
      </div>
    </div>
  );
}