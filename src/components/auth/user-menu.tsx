import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { authClient } from "@/lib/auth-client"
import { toast } from "sonner"
import { Link, useNavigate } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { LogOut, User, Crown, Zap, Sparkles } from "lucide-react"
import { useState } from "react"
import { getUserCredits, FREE_TIER_CREDITS } from "@/server/credits"

interface UserMenuProps {
session: {
  session: {
      id: string;
      createdAt: Date;
      updatedAt: Date;
      userId: string;
      expiresAt: Date;
      token: string;
      ipAddress?: string | null | undefined | undefined;
      userAgent?: string | null | undefined | undefined;
  };
  user: {
      id: string;
      createdAt: Date;
      updatedAt: Date;
      email: string;
      emailVerified: boolean;
      name: string;
      image?: string | null | undefined | undefined;
  };
}
}

export function UserMenu({ session }: UserMenuProps) {
  const navigate = useNavigate()  
  const [isPending, setIsPending] = useState(false)

  // Fetch user credits
  const { data: credits } = useQuery({
    queryKey: ["user-credits"],
    queryFn: () => getUserCredits(),
    refetchInterval: 30000, // Refetch every 30 seconds
  })

  const isPro = credits?.plan === "pro"
  
  const logout = async () => {
    // Prevent multi-click re-entry
    if (isPending) {
      return
    }

    setIsPending(true)
    
    try {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            toast.success("Logged out successfully")
            navigate({ to: "/login" })
          },
          onError: ({ error }) => {
            toast.error(error.message || "Failed to logout. Please try again.")
            setIsPending(false)
          },
        }
      })
    } catch (error) {
      // Handle any exceptions that occur before callbacks
      toast.error("Failed to logout. Please try again.")
      setIsPending(false)
    } finally {
      // Ensure isPending is reset even if navigation happens
      // Note: We don't reset here if onSuccess navigates, as component will unmount
      // But we reset in onError and catch to handle errors
    }
  }


  const initials =
  session?.user?.name
      ?.split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) ||
      session?.user?.email?.[0]?.toUpperCase() ||
    "U"

  const handleLogout = () => {
    logout()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-9 w-9 rounded-full">
          <Avatar className="h-9 w-9">
            <AvatarImage src={session?.user?.image || undefined} alt={session?.user?.name || "User"} />
            <AvatarFallback className="bg-emerald-500 text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium leading-none">{session?.user?.name || "User"}</p>
              {isPro ? (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
                  <Crown className="w-3 h-3" />
                  Pro
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 text-xs font-medium">
                  Free
                </span>
              )}
            </div>
            <p className="text-xs leading-none text-muted-foreground">
              {session?.user?.email || "No email"}
            </p>
          </div>
        </DropdownMenuLabel>

        {/* Credits Display */}
        {credits && (
          <>
            <DropdownMenuSeparator />
            <div className="px-2 py-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">
                  {isPro ? "Unlimited generations" : "Monthly generations"}
                </span>
                {isPro ? (
                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Unlimited
                  </span>
                ) : (
                  <span className="text-xs font-medium">
                    {credits.creditsUsed} / {FREE_TIER_CREDITS}
                  </span>
                )}
              </div>
              {!isPro && (
                <div className="h-1.5 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-300"
                    style={{
                      width: `${Math.min(100, (credits.creditsUsed / FREE_TIER_CREDITS) * 100)}%`,
                    }}
                  />
                </div>
              )}
            </div>
          </>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/upgrade" className="flex items-center cursor-pointer">
            <Zap className="mr-2 h-4 w-4 text-emerald-500" />
            <span>{isPro ? "Manage Plan" : "Upgrade to Pro"}</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <User className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleLogout}
          disabled={isPending}
          className="text-red-500 hover:bg-red-500/10"
        >
          <LogOut className="mr-2 h-4 w-4 text-red-500" />
          <span>{isPending ? "Logging out..." : "Log out"}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}