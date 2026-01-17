import { createAuthClient } from "better-auth/react"
import { polarClient } from "@polar-sh/better-auth"

export const authClient = createAuthClient({
  baseURL: "https://sketch-ai-beta.vercel.app",
  plugins: [polarClient()],
})