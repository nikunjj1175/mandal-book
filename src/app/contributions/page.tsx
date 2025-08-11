import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import MyContributionsClient from './submit-client';

export default async function ContributionsPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return (
      <div className="space-y-2">
        <h1 className="text-xl font-semibold">Contributions</h1>
        <p className="text-sm text-muted-foreground">Please sign in.</p>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Contributions</h1>
      <MyContributionsClient />
    </div>
  );
}