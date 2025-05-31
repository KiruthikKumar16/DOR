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
import { authConfig } from "./auth.config";
import Google from "next-auth/providers/google";

declare module "next-auth" {
  interface Session {
    user: {
      id: string; // Keep id as we expect it in the JWT/session
    } & DefaultSession['user']; // Extend the default user type with id
  }

  interface JWT {
    id?: string; // Make id optional as it might not be immediately available
    sub?: string; // Add sub to JWT type as it comes from Google
    isNewUser?: boolean; // Add isNewUser flag to JWT type
  }
}

export const { auth, signIn, signOut, handlers } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      // Handle relative URLs
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }
      // Handle absolute URLs
      else if (new URL(url).origin === baseUrl) {
        return url;
      }
      return baseUrl;
    },
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
    async signIn({ user, account, profile, email, credentials }): Promise<boolean> {
      console.log("Sign-in attempt with Google", user);
      return true;
    },
    async jwt({ token, user, account, profile, isNewUser, trigger, session }: { token: JWT; user: AdapterUser | User; account?: Account | null | undefined; profile?: Profile | undefined; isNewUser?: boolean | undefined; trigger?: "signIn" | "signUp" | "update" | undefined; session?: any }): Promise<JWT> {
      if (user) {
        token.sub = user.id;
      }
      // Add isNewUser to the token
      if (isNewUser !== undefined) {
        token.isNewUser = isNewUser;
      }
      return token; 
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
});
