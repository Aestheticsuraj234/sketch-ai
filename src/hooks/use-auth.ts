import { useQuery } from "@tanstack/react-query"
import { authClient } from "@/lib/auth-client"

export function useAuth() {
  const { data: session, isLoading, error } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      try {
        const result = await authClient.getSession()
        return result?.data ?? null
      } catch (error) {
        console.error("Failed to get session:", error)
        return null
      }
    },
    refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes
    refetchOnWindowFocus: true, // Refetch when window gains focus
    retry: false, // Don't retry on error
  })

  return {
    session,
    user: session?.user ?? null,
    isAuthenticated: !!session && !!session.user,
    isLoading,
    error,
  }
}

