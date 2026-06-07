import NextAuth, { DefaultSession } from "next-auth"
import { JWT } from "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: string
      mobile?: string
      isNewUser: boolean
      sellerStatus: string // Add this
      connectedHub?: string | null
    } & DefaultSession["user"]
  }

  interface User {
    id: string
    role: string
    mobile?: string
    isNewUser: boolean
    sellerStatus: string // Add this
    connectedHub?: string | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: string
    mobile?: string
    isNewUser: boolean
    sellerStatus: string // Add this
    connectedHub?: string | null
  }
}