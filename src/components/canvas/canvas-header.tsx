import { Home, Download, Sparkles, Sun, Moon } from "lucide-react"
import { Link } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { useTheme } from "@/providers/theme-provider"

interface CanvasHeaderProps {
  title: string
}

export function CanvasHeader({ title }: CanvasHeaderProps) {
  const { theme, setTheme } = useTheme()

  const toggleTheme = () => {
    if (theme === "dark") {
      setTheme("light")
    } else if (theme === "light") {
      setTheme("dark")
    } else {
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches
      setTheme(isDark ? "light" : "dark")
    }
  }

  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 pointer-events-none">
      {/* Left side - Home button */}
      <div className="pointer-events-auto">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="bg-background/80 backdrop-blur-sm shadow-lg border-border/50 hover:bg-background"
              asChild
            >
              <Link to="/">
                <Home className="h-4 w-4" />
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Go Home</p>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Center - Title */}
      <div className="absolute left-1/2 -translate-x-1/2 pointer-events-auto">
        <div className="bg-background/80 backdrop-blur-sm shadow-lg border border-border/50 rounded-lg px-4 py-2">
          <h1 className="text-sm font-medium text-foreground truncate max-w-[200px] sm:max-w-[300px]">
            {title}
          </h1>
        </div>
      </div>

      {/* Right side - Theme toggle, Upgrade, and Export buttons */}
      <div className="flex items-center gap-2 pointer-events-auto">
        {/* Theme Toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={toggleTheme}
              className="bg-background/80 backdrop-blur-sm shadow-lg border-border/50 hover:bg-background"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Toggle theme</p>
          </TooltipContent>
        </Tooltip>

        {/* Upgrade to Pro */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="bg-background/80 backdrop-blur-sm shadow-lg border-border/50 hover:bg-background gap-1.5"
            >
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="hidden sm:inline">Upgrade to Pro</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Unlock premium features</p>
          </TooltipContent>
        </Tooltip>

        {/* Export */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="bg-background/80 backdrop-blur-sm shadow-lg border-border/50 hover:bg-background gap-1.5"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Export mockup</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </header>
  )
}
