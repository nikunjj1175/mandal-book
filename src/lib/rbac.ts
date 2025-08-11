import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import { redirect } from 'next/navigation';

export async function requireAuth() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/signin');
  return session;
}

export async function requireAdmin() {
  const session = await requireAuth();
  console.log(session);
  
  if ((session.user as any).role !== 'admin') redirect('/');
  return session;
}