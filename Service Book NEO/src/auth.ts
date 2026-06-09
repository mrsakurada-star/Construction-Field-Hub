import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"


if (!process.env.AUTH_GOOGLE_ID || !process.env.AUTH_GOOGLE_SECRET) {
    console.warn("⚠️  WARNING: Google OAuth environment variables (AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET) are missing. Login will likely fail.")
}

export const { handlers, auth, signIn, signOut } = NextAuth({
    adapter: PrismaAdapter(prisma),
    session: { strategy: "jwt" },
    providers: [
        Google({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
        }),
        Credentials({
            name: "Development Login",
            credentials: {
                email: { label: "Email", type: "email", placeholder: "test@example.com" },
            },
            async authorize(credentials) {
                // Development only: Allow any login
                if (process.env.NODE_ENV === "development") {
                    const email = credentials.email as string || "test@example.com"

                    // Upsert dev user so FK constraints are satisfied
                    const user = await prisma.user.upsert({
                        where: { email },
                        update: {},
                        create: {
                            email,
                            name: "Dev User",
                            image: "https://github.com/shadcn.png",
                        },
                    })
                    return {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        image: user.image,
                    }
                }
                return null
            }
        })
    ],
    callbacks: {
        jwt({ token, user }) {
            if (user) {
                token.id = user.id
            }
            return token
        },
        session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string
            }
            return session
        },
    },
    pages: {
        signIn: "/login",
    },
})
