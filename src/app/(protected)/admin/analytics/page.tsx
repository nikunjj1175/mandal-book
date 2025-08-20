import dynamic from 'next/dynamic';

const AdminAnalyticsClient = dynamic(() => import('./ui-client'), { ssr: false });

export default function AdminAnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Analytics</h1>
        <p className="text-sm text-muted-foreground">Members, contributions, and proof uploads</p>
      </div>
      <AdminAnalyticsClient />
    </div>
  );
}


