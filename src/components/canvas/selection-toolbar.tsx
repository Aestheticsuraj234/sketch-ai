import { Sparkles, Eye, Code2, Download, Smartphone, Tablet, Monitor } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export type DeviceSize = "mobile" | "tablet" | "desktop"

interface SelectionToolbarProps {
  onEdit: () => void
  onPreview: (device: DeviceSize) => void
  onViewCode: () => void
  onExport: () => void
}

export function SelectionToolbar({
  onEdit,
  onPreview,
  onViewCode,
  onExport,
}: SelectionToolbarProps) {
  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-1 bg-background/95 backdrop-blur-md shadow-lg border border-border/50 rounded-xl px-2 py-1.5">
        {/* Edit with AI */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit}
              className="gap-2 text-primary hover:text-primary"
            >
              <Sparkles className="h-4 w-4" />
              <span className="font-medium">Edit with AI</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Modify this variant using AI</p>
          </TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Preview */}
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <Eye className="h-4 w-4" />
                  <span>Preview</span>
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Preview in different device sizes</p>
            </TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="center">
            <DropdownMenuItem onClick={() => onPreview("mobile")} className="gap-2">
              <Smartphone className="h-4 w-4" />
              <span>Mobile (375×812)</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onPreview("tablet")} className="gap-2">
              <Tablet className="h-4 w-4" />
              <span>Tablet (768×1024)</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onPreview("desktop")} className="gap-2">
              <Monitor className="h-4 w-4" />
              <span>Desktop (1440×900)</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* View Code */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="sm" onClick={onViewCode} className="gap-2">
              <Code2 className="h-4 w-4" />
              <span>Code</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>View and copy the code</p>
          </TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Export */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="sm" onClick={onExport} className="gap-2">
              <Download className="h-4 w-4" />
              <span>Export</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Export as HTML or image</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
}
