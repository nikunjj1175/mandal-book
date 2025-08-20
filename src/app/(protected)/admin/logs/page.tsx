import dynamic from 'next/dynamic';

const LogsClient = dynamic(() => import('@/app/(protected)/admin/logs/ui-client'), { ssr: false });

export default function AdminLogsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Audit Logs</h1>
        <p className="text-sm text-muted-foreground">User logins, profile updates, and contribution status changes</p>
      </div>
      <LogsClient />
    </div>
  );
}


