import { createAuthClient } from "better-auth/react"
import { polarClient } from "@polar-sh/better-auth"

export const authClient = createAuthClient({
  baseURL: "https://sketch-ai-seven.vercel.app",
  plugins: [polarClient()],
})