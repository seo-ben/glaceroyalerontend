import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-full max-w-sm">
      {toasts.map(({ id, title, description, variant, open, ...props }) => (
        <div
          key={id}
          className={cn(
            "pointer-events-auto relative flex w-full items-center justify-between overflow-hidden rounded-lg border p-4 shadow-lg transition-all",
            open ? "animate-slide-in" : "animate-slide-out",
            variant === "destructive"
              ? "border-red-500/50 bg-red-50 text-red-900"
              : "border-border bg-background"
          )}
        >
            <div className="grid gap-1">
              {title && <p className="text-sm font-semibold">{title}</p>}
              {description && <p className="text-sm opacity-90">{description}</p>}
            </div>
            <button
              onClick={() => props.onOpenChange?.(false)}
              className="ml-4 shrink-0 rounded-md p-1 opacity-50 hover:opacity-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
      ))}
    </div>
  )
}
