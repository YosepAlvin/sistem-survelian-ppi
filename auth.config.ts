import type { NextAuthConfig } from "next-auth"

export const authConfig = {
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      console.log("[JWT] trigger=", trigger, "session=", JSON.stringify(session, null, 2), "user=", JSON.stringify(user, null, 2))
      console.log("[JWT] token before=", JSON.stringify(token, null, 2))

      // Handle update trigger — session comes as { user: { profileImage: ... } } from useSession().update()
      if (trigger === "update" && session) {
        // Merge top-level fields AND nested user fields into the token root level
        const merged: any = { ...token }
        if (session.user && typeof session.user === "object") {
          Object.assign(merged, session.user)
        }
        // Also merge any direct session-level fields (non-user ones)
        const { user: _userField, ...sessionRest } = session as any
        Object.assign(merged, sessionRest)
        console.log("[JWT] token AFTER update trigger=", JSON.stringify(merged, null, 2))
        return merged
      }
      
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.role = (user as any).role;
        token.ruanganId = (user as any).ruanganId;
        token.ruangan = (user as any).ruangan;
        token.profileImage = (user as any).profileImage;
        token.createdAt = (user as any).createdAt;
      }
      console.log("[JWT] token final=", JSON.stringify(token, null, 2))
      return token
    },
    async session({ session, token }) {
      console.log("[SESSION] token=", JSON.stringify(token, null, 2))
      console.log("[SESSION] session before=", JSON.stringify(session, null, 2))
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = token.role as string;
        (session.user as any).ruanganId = token.ruanganId;
        (session.user as any).ruangan = token.ruangan;
        (session.user as any).profileImage = token.profileImage;
        (session.user as any).createdAt = token.createdAt;
        console.log("[SESSION] user.profileImage after set=", (session.user as any).profileImage)
      }
      console.log("[SESSION] session after=", JSON.stringify(session, null, 2))
      return session
    },
  },
  providers: [], // Add empty providers to satisfy NextAuthConfig
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  trustHost: true,
  secret: process.env.NEXTAUTH_SECRET,
} satisfies NextAuthConfig
