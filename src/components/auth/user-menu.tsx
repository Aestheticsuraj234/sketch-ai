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
import { useNavigate } from "@tanstack/react-router"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { LogOut, User } from "lucide-react"
import { useState } from "react"

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

export function UserMenu({  session}: UserMenuProps) {
  const navigate = useNavigate()  
  const [isPending, setIsPending] = useState(false)
  
  const logout = async () => {
    setIsPending(true)
    await authClient.signOut({
      fetchOptions:{
        onSuccess: () => {
          toast.success("Logged out successfully")
          navigate({ to: "/login" })
        },
        onError: ({ error }) => {
          toast.error(error.message)
        },
      }
    })
    setIsPending(false)
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
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{session?.user?.name || "User"}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {session?.user?.email || "No email"}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
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