import { Minus, Plus, Trash2, Lock, Package } from 'lucide-react'
import { formatAmount } from '@/lib/formatters'
import { cn } from '@/lib/utils'

export default function CartItem({ item, onUpdateQty, onRemove, onToggleTakeaway, isActiveOrder = false }) {
  const price = Number(item.price || 0)
  const qty   = Number(item.qty || 0)
  const totalMod = (item.modifiers || []).reduce((s, m) => s + Number(m.extra_price || 0), 0)
  const lineTotal = (price + totalMod) * qty

  const isCancelling = item.cancellations?.length > 0
  const isSentToKitchen = item.status && item.status !== 'pending'

  // La suppression est autorisée (avec déclenchement de la modale PIN si l'article est en cuisine)
  const canDelete = true

  const handleDecrement = () => {
    if (qty > 1) {
      onUpdateQty(item.key, qty - 1)
    } else if (canDelete) {
      onRemove(item.key)
    }
  }

  return (
    <div className={cn(
        "group relative flex flex-col p-2.5 rounded-xl bg-muted/30 border border-border transition-all outline-none",
        isCancelling ? "bg-red-500/5 border-red-500/20 opacity-80" : "hover:bg-muted/50",
        item.isTakeaway && "border-orange-500/50 bg-orange-500/5"
    )}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className={cn("text-[11px] font-bold text-foreground truncate uppercase tracking-tight", isCancelling && "line-through opacity-50")}>
              {item.name}
            </p>
            {item.isTakeaway && (
                <span className="flex items-center gap-0.5 px-1 bg-orange-500 text-white text-[7px] font-black uppercase rounded-[2px] animate-in zoom-in-50">
                    <Package size={8} /> Colis
                </span>
            )}
            {isSentToKitchen && !isCancelling && (
                <span className="flex items-center gap-0.5 px-1 bg-blue-500/10 text-blue-500 border border-blue-500/20 text-[7px] font-black uppercase rounded-[2px]">
                    Cuisine
                </span>
            )}
          </div>
          {isCancelling && <p className="text-[8px] font-black text-red-500 uppercase animate-pulse leading-none mt-0.5">Annulation en cours</p>}
        </div>
        
        <div className="text-right shrink-0">
          <p className={cn("text-[11px] font-black text-foreground", isCancelling && "opacity-50 line-through")}>{formatAmount(lineTotal)}</p>
        </div>

        {!isCancelling && (
          <div className="flex items-center gap-1 ml-2">
            {/* Toggle Emporté */}
            <button
                onClick={() => onToggleTakeaway(item.key)}
                className={cn(
                    "w-6 h-6 flex items-center justify-center rounded-md border transition-all",
                    item.isTakeaway 
                        ? "bg-orange-500 border-orange-600 text-white shadow-sm" 
                        : "bg-muted/50 border-border text-muted-foreground hover:bg-muted"
                )}
                title="Marquer comme à emballer (Colis)"
            >
                <Package size={12} />
            </button>

            {/* Boutons − / + */}
            <div className="flex items-center bg-muted/80 border border-border rounded p-0.5 shrink-0">
              <button
                onClick={handleDecrement}
                className={cn(
                  "w-5 h-5 flex flex-col items-center justify-center rounded-sm transition-colors",
                  isSentToKitchen 
                    ? "text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10" 
                    : "text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                )}
                title={isSentToKitchen ? "Article en cuisine : validation Admin requise pour décrémenter" : undefined}
              >
                {qty === 1 ? <Trash2 size={11} /> : <Minus size={11} />}
              </button>
              <span className="text-[10px] font-black text-foreground w-6 text-center">{qty}</span>
              <button
                onClick={() => onUpdateQty(item.key, qty + 1)}
                className="w-5 h-5 flex flex-col items-center justify-center text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10 rounded-sm transition-colors"
                title={isSentToKitchen ? "Ajouter un article supplémentaire pour la cuisine" : undefined}
              >
                <Plus size={11} />
              </button>
            </div>

            {/* Bouton suppression rapide */}
            {canDelete && (
              <button
                onClick={() => onRemove(item.key)}
                className={cn(
                  "w-5 h-5 flex items-center justify-center transition-colors rounded-sm",
                  isSentToKitchen
                    ? "text-amber-500 hover:bg-amber-500/10"
                    : "text-muted-foreground/30 hover:text-destructive hover:bg-destructive/10"
                )}
                title={isSentToKitchen ? "Article en cuisine : validation Admin requise pour supprimer" : "Supprimer l'article"}
              >
                {isSentToKitchen ? <Lock size={11} /> : <Trash2 size={10} />}
              </button>
            )}
          </div>
        )}
      </div>

      {(item.modifiers.length > 0 || item.note) && (
        <div className="mt-1 space-y-0.5">
          {item.modifiers.map(m => (
            <p key={m.id} className="text-[9px] font-bold text-orange-400 italic truncate">• {m.name}</p>
          ))}
          {item.note && (
            <p className="text-[9px] font-bold text-orange-400 italic truncate">📝 {item.note}</p>
          )}
        </div>
      )}
    </div>
  )
}
