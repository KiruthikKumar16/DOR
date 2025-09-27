// auth.ts
import NextAuth, { type DefaultSession, type User, type Account, type Profile, type Session } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import type { JWT } from "next-auth/jwt";
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
      try {
        // If url is relative, combine with baseUrl
        if (url.startsWith("/")) {
          return `${baseUrl}${url}`;
        }
        // If url is absolute and matches baseUrl origin, allow it
        const urlObj = new URL(url, baseUrl);
        if (urlObj.origin === baseUrl) {
          return url;
        }
      } catch (e) {
        console.error(`Invalid intended URL in redirect callback: ${url}`, e);
      }
      return baseUrl;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (session.user) {
        session.user.id = token.sub as string;
      }
      return session;
    },
    async signIn({ user, account, profile, email, credentials }): Promise<boolean> {
      console.log("Sign-in attempt with Google", user);
      return true;
    },
    async jwt({ token, user, account, profile, isNewUser, trigger, session }: { token: JWT; user: User; account?: Account | null; profile?: Profile; isNewUser?: boolean; trigger?: "signIn" | "signUp" | "update"; session?: any }): Promise<JWT> {
      if (user) {
        token.id = user.id;
        token.sub = user.id;
      }
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
