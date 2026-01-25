/**
 * Authentication Configuration
 *
 * Implements two authentication modes:
 * - Guest: Auto-created ephemeral users for demos (no signup required)
 * - Regular: Email/password credentials stored in database
 *
 * Uses NextAuth v5 with custom credential providers.
 * Session data includes user.id and user.type for authorization checks.
 */
import { compare } from "bcrypt-ts";
import NextAuth, { type DefaultSession } from "next-auth";
import type { DefaultJWT } from "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";
import { DUMMY_PASSWORD } from "@/lib/constants";
import { createGuestUser, getUser } from "@/lib/db/queries";
import { authConfig } from "./auth.config";

/** User types determine entitlements and rate limits */
export type UserType = "guest" | "regular";

// Extend NextAuth types to include our custom properties
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      type: UserType;
    } & DefaultSession["user"];
  }

  // biome-ignore lint/nursery/useConsistentTypeDefinitions: "Required"
  interface User {
    id?: string;
    email?: string | null;
    type: UserType;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    type: UserType;
  }
}

/**
 * NextAuth configuration with two credential providers.
 *
 * Security note: Both valid and invalid login attempts use bcrypt.compare()
 * to prevent timing attacks that could reveal whether an email exists.
 */
export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  providers: [
    // Standard email/password authentication
    Credentials({
      credentials: {},
      async authorize({ email, password }: any) {
        const users = await getUser(email);

        if (users.length === 0) {
          // Compare against dummy password to prevent timing attacks
          // This ensures invalid emails take the same time as invalid passwords
          await compare(password, DUMMY_PASSWORD);
          return null;
        }

        const [user] = users;

        if (!user.password) {
          // Same timing attack prevention for users without passwords
          await compare(password, DUMMY_PASSWORD);
          return null;
        }

        const passwordsMatch = await compare(password, user.password);

        if (!passwordsMatch) {
          return null;
        }

        return { ...user, type: "regular" };
      },
    }),
    // Guest authentication - creates ephemeral user on demand
    Credentials({
      id: "guest",
      credentials: {},
      async authorize() {
        const [guestUser] = await createGuestUser();
        return { ...guestUser, type: "guest" };
      },
    }),
  ],
  callbacks: {
    // Persist user info in JWT token
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.type = user.type;
      }

      return token;
    },
    // Expose user info to session for client-side access
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.type = token.type;
      }

      return session;
    },
  },
});
