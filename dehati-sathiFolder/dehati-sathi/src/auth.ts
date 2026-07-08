import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import connectDb from "@/lib/db"
import bcrypt from "bcryptjs"
import { normalizeIndianMobile } from "@/lib/phone"
import { generateUniqueReferralCode } from "@/lib/referral"
import User from "@/app/models/user.model"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),

    Credentials({
      name: "password-login",
      credentials: {
        mobile: { label: "Mobile", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        await connectDb()

        const rawMobile = credentials.mobile as string
        const password = credentials.password as string

        if (!rawMobile || !password) {
          throw new Error("Missing credentials")
        }

        // normalizeIndianMobile throws on invalid numbers
        const normalized = normalizeIndianMobile(rawMobile)
        const user = await User.findOne({ mobile: normalized.mobile })

        if (!user) {
          throw new Error("User not found. Please register first.")
        }

        if (user.isBlocked) {
          throw new Error("This account is blocked. Please contact support.")
        }

        if (!user.password) {
          throw new Error("Please login with Google or reset your password.")
        }

        const isMatch = await bcrypt.compare(password, user.password)

        if (!isMatch) {
          throw new Error("Invalid password")
        }

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          mobile: user.mobile,
          role: user.role,
          isNewUser: user.isNewUser,
          sellerStatus: user.sellerStatus || "none",
          connectedHub: user.connectedHub ? user.connectedHub.toString() : null,
        }
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        await connectDb()
        try {
          if (!user.email) return false

          const existingUser = await User.findOne({ email: user.email })
          if (existingUser?.isBlocked) return false

          if (!existingUser) {
            await User.create({
              name: user.name || "Dehati User",
              email: user.email,
              image: user.image || "",
              role: "user",
              isNewUser: true,
              referralCode: await generateUniqueReferralCode(),
            })
          }
          return true
        } catch (err) {
          console.error("Error in Google SignIn:", err)
          return false
        }
      }
      return true
    },

    async jwt({ token, user, account, trigger, session }) {
      // 1. Initial Sign In
      if (user) {
        if (account?.provider === "google") {
          await connectDb()
          const dbUser = await User.findOne({ email: user.email })
          if (dbUser) {
            token.id = dbUser._id.toString()
            token.role = dbUser.role
            token.sellerStatus = dbUser.sellerStatus
            token.mobile = dbUser.mobile
            token.isNewUser = dbUser.isNewUser
            token.connectedHub = dbUser.connectedHub
              ? dbUser.connectedHub.toString()
              : null
          }
        } else {
          token.id = user.id
          token.role = user.role
          token.mobile = user.mobile
          token.isNewUser = user.isNewUser
          token.sellerStatus = user.sellerStatus
          token.connectedHub = user.connectedHub
            ? user.connectedHub.toString()
            : null
        }
      }

      // 2. Token Refresh: Periodically fetch fresh data from DB (every 2 mins)
      const now = Date.now()
      const lastRefresh = (token.lastRefresh as number) || 0

      if (
        token.id &&
        (trigger === "update" || now - lastRefresh > 2 * 60 * 1000)
      ) {
        await connectDb()
        const dbUser = await User.findById(token.id)

        if (dbUser) {
          token.role = dbUser.role
          token.sellerStatus = dbUser.sellerStatus
          token.mobile = dbUser.mobile
          token.isNewUser = dbUser.isNewUser
          token.name = dbUser.name
          token.connectedHub = dbUser.connectedHub
            ? dbUser.connectedHub.toString()
            : null
          token.lastRefresh = now
        }
      }

      // 3. Handle Manual Client-Side Updates
      if (trigger === "update" && session) {
        if (session.name) token.name = session.name
        if (session.connectedHub !== undefined) token.connectedHub = session.connectedHub
        if (session.isNewUser !== undefined) token.isNewUser = session.isNewUser
      }

      return token
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as
          | "user"
          | "admin"
          | "seller"
          | "deliveryBoy"
          | "hub"
        session.user.mobile = token.mobile as string
        session.user.isNewUser = token.isNewUser as boolean
        session.user.sellerStatus = token.sellerStatus as string
        session.user.connectedHub = token.connectedHub as string | null
      }
      return session
    },
  },

  pages: {
    signIn: "/register",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 Days
  },
  secret: process.env.AUTH_SECRET,
})
