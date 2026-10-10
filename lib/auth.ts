import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcryptjs from "bcryptjs"
import { db } from "@/lib/db"
import { authConfig } from "@/auth.config"

export const { auth, handlers, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "email@example.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials")
        }

        try {
          const user = await db.user.findUnique({
            where: { email: credentials.email as string },
            include: { role: true, ruangan: true },
          })

          if (!user || !user.isActive) {
            throw new Error("User not found or inactive")
          }

          const isPasswordValid = await bcryptjs.compare(
            credentials.password as string,
            user.password
          )

          if (!isPasswordValid) {
            throw new Error("Invalid password")
          }

          return {
            id: user.id.toString(),
            email: user.email,
            name: user.name,
            role: user.role.name.toUpperCase(),
            ruanganId: user.ruanganId,
            ruangan: user.ruangan?.nama,
            profileImage: user.profileImage,
            createdAt: user.createdAt.toISOString(),
          }
        } catch (error) {
          return null
        }
      },
    }),
  ],
})
