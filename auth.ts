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
    isNewUser?: boolean; // Add isNewUser flag to JWT type
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
    async signIn({ user, account, profile, email, credentials }): Promise<boolean> {
      console.log("Sign-in attempt with Google", user);
      return true;
    },
    async session({ session, token }: { session: Session; token: JWT }): Promise<Session> {
      if (token.sub) {
        session.user.id = token.sub;
      }
      return session;
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
    async redirect({ url, baseUrl, token }: { url: string; baseUrl: string; token?: JWT }): Promise<string> {
      // --- Custom Redirection Logic ---

      // If the user was trying to access a specific page before login (tracked by the 'url' parameter),
      // redirect them back there after successful authentication.
      // Otherwise, if they logged in directly (from / or /login), redirect them to the main page (/).
      let intendedUrl = url === baseUrl || url === `${baseUrl}/login` ? `${baseUrl}/` : url;
      
      // Validate the 'intendedUrl' before creating a URL object (should ideally be handled by NextAuth, but adding a check)
      let urlObject;
      try {
        urlObject = new URL(intendedUrl);
      } catch (e) {
        console.error(`Invalid intended URL in redirect callback: ${intendedUrl}`, e);
        // Fallback to base URL if intendedUrl is invalid
        urlObject = new URL(baseUrl);
         intendedUrl = baseUrl; // Reset intendedUrl to baseUrl
      }


      let userId: string | undefined;
      
      // --- Prioritize getting userId from token.sub ---
      // Also check if the user is new. New users always go to profile.
      const isJustNewUser = token?.isNewUser === true; // Check the flag from the token

      if (isJustNewUser) {
         console.log(`User is new, redirecting to /profile`);
         return `${baseUrl}/profile`;
      }

      // If not a new user, proceed to get userId and check profile completeness
      if (token?.sub) {
        userId = token.sub;
        console.log(`Got userId ${userId} from token.sub`);
      } else {
        // Fallback to getting userId from search params if not in token
        userId = urlObject.searchParams.get('id') || undefined; // Use urlObject which is guaranteed valid
         if (userId) {
             console.log(`Got userId ${userId} from URL search params`);
         } else {
             console.log(`Could not get userId from token or URL search params.`);
         }
      }
      // --- End userId retrieval ---

      // If we have a user ID (meaning it's an existing user), check their profile completeness
      if (userId) {
         try {
           const userProfile = await prisma.user.findUnique({
             where: { id: userId },
             select: {
               profile: {
                 select: {
                   bodyType: true, // Select bodyType directly
                   preferences: true, // Select the entire preferences JSON field
                 }
               }
             }
           });

           // Parse preferences JSON and check for gender and bodyType
           const preferences = userProfile?.profile?.preferences as any; // Cast to any for flexible access
           const gender = preferences?.gender; // Access gender from parsed preferences
           const bodyType = userProfile?.profile?.bodyType; // Access bodyType directly

           const profileComplete = gender && bodyType; // Check if both are present

           // If profile is incomplete, redirect to profile page (override intendedUrl)
           if (!profileComplete) {
             console.log(`Existing user ${userId} profile incomplete, redirecting to /profile`);
             return `${baseUrl}/profile`;
           }

           // If profile is complete, redirect to the intended URL
            console.log(`Existing user ${userId} profile complete, redirecting to intended URL: ${intendedUrl}`);
            return intendedUrl;

         } catch (error) {
            console.error('Error checking profile completeness in redirect callback for existing user:', error);
            // In case of error during profile check, fall back to the intended URL
            return intendedUrl; // Redirect to the intended URL
         }
     }

     // If no userId was obtained (should be rare after successful sign-in with adapter),
     // fall back to intendedUrl (which will be / or the original page)
     console.log(`Could not determine userId for redirection. Falling back to intended URL: ${intendedUrl}`);
     return intendedUrl;
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
});
