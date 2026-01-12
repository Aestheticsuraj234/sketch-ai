import { Camera, Figma, FolderUp, Layout } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type QuickAction = {
  id: string
  label: string
  icon: React.ReactNode
  onClick?: () => void
}

const actions: QuickAction[] = [
  {
    id: 'clone-screenshot',
    label: 'Clone a Screenshot',
    icon: <Camera className="size-4" />,
  },
  {
    id: 'import-figma',
    label: 'Import from Figma',
    icon: <Figma className="size-4" />,
  },
  {
    id: 'upload-project',
    label: 'Upload a Project',
    icon: <FolderUp className="size-4" />,
  },
  {
    id: 'landing-page',
    label: 'Landing Page',
    icon: <Layout className="size-4" />,
  },
]

type QuickActionsProps = {
  disabled?: boolean
}

export function QuickActions({ disabled = false }: QuickActionsProps) {
  return (
    <div className={cn(
      "flex flex-wrap items-center justify-center gap-2",
      disabled && "opacity-50 pointer-events-none"
    )}>
      {actions.map((action) => (
        <Button
          key={action.id}
          variant="outline"
          size="sm"
          onClick={action.onClick}
          disabled={disabled}
          className="h-9 gap-2 rounded-full border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 hover:border-zinc-300 dark:hover:border-zinc-700 disabled:opacity-50"
        >
          {action.icon}
          <span>{action.label}</span>
        </Button>
      ))}
    </div>
  )
}
