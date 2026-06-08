import type { Role } from "@/lib/role-permissions";
import type { NextAuthConfig } from "next-auth";

/** Edge middleware용 — Prisma·bcrypt 미사용 */
export const authConfig = {
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id!;
        token.role = user.role;
        token.studentId = user.studentId;
        token.email = user.email;
      }
      if (trigger === "update" && session?.user) {
        if ("studentId" in session.user) {
          token.studentId = session.user.studentId;
        }
        if ("email" in session.user) {
          token.email = session.user.email;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        session.user.studentId = token.studentId as string | null | undefined;
        if (token.email !== undefined && token.email !== null) {
          session.user.email = token.email;
        }
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
