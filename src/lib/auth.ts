import { MongoDBAdapter } from '@auth/mongodb-adapter';
import clientPromise from '@/lib/mongodb';
import NextAuth, { type NextAuthOptions } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { connectToDatabase } from './db';
import { UserModel } from '@/models/User';

export const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  adapter: MongoDBAdapter((clientPromise as unknown) as any),
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: { email: {}, password: {} },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        await connectToDatabase();
        const user = await UserModel.findOne({ email: parsed.data.email }).lean();        
        if (!user || !user.passwordHash) return null;
        const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!ok) return null;
        if (user.status !== 'active') return null;
        return {
          id: String(user._id),
          email: user.email,
          name: user.name,
          role: user.role
        } as any;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role || 'member';
      }
      return token;
    },
    async session({ session, token }) {
      (session as any).user.role = token.role;
      return session;
    }
  }
};