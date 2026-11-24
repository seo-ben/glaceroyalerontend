import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export default function ConfirmDialog({ open, onOpenChange, title, description, onConfirm, confirmText = 'Confirmer', destructive = false }) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md bg-card border-border text-foreground rounded-[2rem] p-0 overflow-hidden shadow-2xl">
        <AlertDialogHeader className="p-8 bg-muted/40 border-b border-border">
          <AlertDialogTitle className="text-xl font-black uppercase italic tracking-tighter">{title}</AlertDialogTitle>
          {description && (
            <AlertDialogDescription className="text-muted-foreground text-xs font-medium mt-2 leading-relaxed">
              {description}
            </AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter className="p-8 bg-card flex gap-3">
          <AlertDialogCancel className="flex-1 h-12 rounded-xl border-border bg-muted/50 hover:bg-muted text-muted-foreground font-black uppercase text-[10px] tracking-widest mt-0">
            Annuler
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={cn(
                "flex-1 h-12 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary/10 transition-all active:scale-95",
                destructive 
                    ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-destructive/20' 
                    : 'bg-primary text-primary-foreground hover:bg-primary/90'
            )}
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
