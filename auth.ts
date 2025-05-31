// auth.ts
import NextAuth, { type DefaultSession, type User } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
// Import necessary types from next-auth and adapter
import { type Account, type Profile } from "next-auth";
import { type AdapterUser } from "@auth/core/adapters";
import type { JWT } from "next-auth/jwt";
import type { Session } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string; // Keep id as we expect it in the JWT/session
    } & DefaultSession['user']; // Extend the default user type with id
  }

  interface JWT {
    id?: string; // Make id optional as it might not be immediately available
    sub?: string; // Add sub to JWT type as it comes from Google
  }
}

export const { auth, handlers, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile, email, credentials }: { user: AdapterUser | User; account: Account | null | undefined; profile?: Profile | undefined; email?: { verificationRequest?: boolean }; credentials?: Record<string, any> }): Promise<boolean> {
      console.log("Sign-in attempt with Google", user);
      return true;
    },
    async session({ session, token }: { session: Session; token: JWT }): Promise<Session> {
      if (token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ token, user, account, profile, isNewUser, trigger, session }: { token: JWT; user?: AdapterUser | User | undefined; account: Account | null | undefined; profile?: Profile | undefined; isNewUser?: boolean | undefined; trigger?: "signIn" | "signUp" | "update"; session?: any }): Promise<JWT> {
      if (user) {
        token.sub = user.id;
      }
      return token; 
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
}); 