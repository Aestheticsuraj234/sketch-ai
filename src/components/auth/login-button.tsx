import { Button } from "@/components/ui/button"
import { useNavigate } from "@tanstack/react-router"

export function LoginButton() {
  const navigate = useNavigate()

  const handleLogin = () => {
    navigate({ to: "/login" })
  }

  return (
    <Button onClick={handleLogin} variant="outline" size="sm">
      Login
    </Button>
  )
}

