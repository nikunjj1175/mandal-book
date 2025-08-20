import { requireAdmin } from '@/lib/rbac';
import AdminSetupClient from '@/components/AdminSetupClient';

export default async function AdminSetupPage() {
  await requireAdmin();
  
  return <AdminSetupClient />;
}


