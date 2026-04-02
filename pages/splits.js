import { useEffect } from 'react';
import { useRouter } from 'next/router';

/** Old route — shared bills now live under /trips */
export default function SplitsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/trips');
  }, [router]);
  return (
    <div className="min-h-[40vh] flex items-center justify-center text-slate-600">
      <p>Redirecting…</p>
    </div>
  );
}
