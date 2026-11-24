import { useCart } from '@/hooks/useCart'
import CartItem from './CartItem'
import { formatAmount } from '@/lib/formatters'
import { ShoppingCart, Trash2, Printer, FileText, Send, CreditCard, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import useCartStore from '@/stores/cartStore'
import { cn } from '@/lib/utils'
import { usePermissions } from '@/hooks/usePermissions'

export default function CartPanel({ onPay, onSend, onPrintReceipt, orderId, onClose, activeOrder, onUpdateQty: onUpdateQtyProp, onRemove: onRemoveProp, onToggleTakeaway, onOrderTypeChange, isSyncing }) {
  const { items, subtotal, discountAmount, vatAmount, total, updateQty, removeItem, toggleTakeaway, clear, isEmpty, itemCount, orderType, setOrderType } = useCart()
  
  const handleUpdateQty = onUpdateQtyProp || updateQty
  const handleRemove = onRemoveProp || removeItem
  const handleToggleTakeaway = onToggleTakeaway || toggleTakeaway
  const handleOrderTypeChange = onOrderTypeChange || setOrderType
  const store = useCartStore()
  const vatRate = store.vatRate || 0

  const { isAdmin, isManager } = usePermissions()
  // Restrictions actives UNIQUEMENT sur une commande déjà envoyée en cuisine (orderId défini)
  const isActiveOrder = !!orderId
  const canClearCart = !isActiveOrder || isAdmin || isManager

  const hasPendingCancellation = activeOrder?.cancellations?.length > 0
  const cancellingItems = activeOrder?.items?.filter(i => i.cancellations?.length > 0) || []

  return (
    <div className={cn(
        "flex flex-col h-full bg-card relative transition-colors duration-300",
        onClose && "fixed inset-0 z-[9999] lg:relative lg:z-0",
        isSyncing && "opacity-70 pointer-events-none"
    )}>
      {/* Sync Overlay */}
      {isSyncing && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] z-[100] flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary animate-pulse">Synchronisation...</span>
              </div>
          </div>
      )}

      {/* Alerte Annulation en cours */}
      {hasPendingCancellation && (
        <div className="bg-destructive animate-pulse text-destructive-foreground p-2 text-center text-[10px] font-black uppercase tracking-[0.2em] z-20">
           ⚠️ Annulation en cours de validation ⚠️
        </div>
      )}

      {/* Header Mobile */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-muted border-b border-border">
         <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[10px] bg-primary flex items-center justify-center shadow-md">
               <ShoppingCart size={20} className="text-primary-foreground" />
            </div>
            <div className="flex flex-col">
               <span className="text-sm font-black text-foreground uppercase italic leading-none">Votre Panier</span>
               <span className="text-[10px] font-bold text-primary uppercase tracking-widest mt-1 leading-none">{itemCount} articles</span>
            </div>
         </div>
         {onClose && (
            <Button 
               onClick={onClose}
               className="h-10 px-4 bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/20 rounded-[10px] font-black uppercase text-[10px] tracking-widest flex items-center gap-2"
            >
               <X size={16} />
               Fermer
            </Button>
         )}
      </div>

      {/* Header Desktop */}
      <div className="hidden lg:flex p-4 border-b border-border flex-col gap-3">
        <div className="flex items-center justify-between">
            <div className="flex flex-col">
                <h2 className="text-base font-black text-foreground tracking-tight uppercase italic">Panier actuel</h2>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-0.5">{itemCount} articles</p>
            </div>
            {!isEmpty && canClearCart && (
                <Button variant="ghost" size="icon" onClick={clear} className="h-8 w-8 text-muted-foreground hover:text-red-500 transition-colors" title="Vider le panier">
                    <Trash2 size={16} />
                </Button>
            )}
        </div>

        {/* Sélecteur de type supprimé car redondant avec l'en-tête principal */}

      </div>

      {/* Items Section */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2 scrollbar-hide">
        {isEmpty ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground/10 p-4 text-center">
            <div className="w-16 h-16 rounded-[10px] bg-muted flex items-center justify-center mb-4">
               <ShoppingCart size={28} className="opacity-20" />
            </div>
            <p className="text-sm font-black text-muted-foreground/30">Votre panier est vide</p>
            <p className="text-[10px] font-bold mt-1 uppercase tracking-tighter opacity-40">Sélectionnez des produits</p>
          </div>
        ) : (
          items.map(item => (
            <CartItem
              key={item.key}
              item={item}
              isActiveOrder={isActiveOrder}
              onUpdateQty={handleUpdateQty}
              onRemove={handleRemove}
              onToggleTakeaway={handleToggleTakeaway}
            />
          ))
        )}
      </div>

      {/* Totals & Sticky Actions */}
      {!isEmpty && (
        <div className="mt-auto bg-background/95 backdrop-blur-md p-2 space-y-2 rounded-t-[10px] border-t border-border">
          <div className="mb-1">
            <textarea 
               value={store.notes}
               onChange={(e) => store.setNotes(e.target.value)}
               placeholder="Commentaire cuisine..."
               className="w-full text-[10px] bg-muted/50 border border-border rounded-[6px] p-1.5 resize-none h-8 focus:ring-1 focus:ring-primary focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              <span>{store.orderType === 'gozem' ? 'Sous-total (Gozem)' : 'Sous-total'}</span>
              <span className="text-foreground">{formatAmount(store.orderType === 'gozem' ? total : subtotal)}</span>
            </div>
            {store.promoActive && store.promoRate > 0 && (
              <div className="flex justify-between items-center text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
                <span>Promotion ({store.promoRate}%)</span>
                <span>-{formatAmount(store.promoAmount())}</span>
              </div>
            )}
            
            {/* Ligne Remise affichée pour les commandes standards */}
            {store.orderType !== 'gozem' && store.manualDiscountAmount() > 0 && (
              <div className="flex justify-between items-center text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
                <span>
                  {store.discount.type === 'percent' 
                    ? `Remise (${store.discount.value}%)${store.discount.reason ? ` [${store.discount.reason}]` : ''}` 
                    : `Remise${store.discount.reason ? ` [${store.discount.reason}]` : ''}`}
                </span>
                <span>-{formatAmount(store.manualDiscountAmount())}</span>
              </div>
            )}
            
            {/* Ligne Remise affichée UNIQUEMENT si c'est une commande GOZEM */}
            {store.orderType === 'gozem' && store.manualDiscountAmount() > 0 && (
              <div className="flex justify-between items-center text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
                <span>Remise Gozem ({store.gozemRate}%)</span>
                <span>-{formatAmount(store.manualDiscountAmount())}</span>
              </div>
            )}
            
            <div className="pt-1.5 mt-1 border-t border-border flex justify-between items-center">
              <div className="flex flex-col">
                <span className="text-xs font-black text-muted-foreground uppercase tracking-widest">Total TTC</span>
              </div>
              <span className="text-xl font-black text-foreground tracking-tighter italic leading-none">
                {formatAmount(total)}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            {!orderId ? (
              <>
                <Button
                   onClick={onSend}
                   className="flex-1 h-9 bg-muted hover:bg-muted/80 text-foreground font-black uppercase text-[10px] tracking-widest border border-border rounded-[10px] transition-all flex items-center justify-center gap-1.5"
                >
                   <Send size={14} className="text-blue-500" /> Cuisine
                </Button>
                <Button
                   onClick={onPay}
                   className="w-1/2 h-9 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase text-[10px] tracking-widest rounded-[10px] shadow-md shadow-primary/10 transition-all flex items-center justify-center gap-1"
                >
                   Payer
                </Button>
              </>
            ) : (
                <div className="flex flex-col w-full gap-2">
                    <div className="grid grid-cols-3 gap-2">
                        <Button 
                            onClick={onSend}
                            className="h-8 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase text-[9px] tracking-widest rounded-[8px] transition-all gap-1.5"
                        >
                            <Send size={12} /> Cuisine
                        </Button>
                        <Button 
                            onClick={() => onPrintReceipt ? onPrintReceipt() : window.open(`${import.meta.env.VITE_API_URL}/orders/${orderId}/ticket?type=receipt`, '_blank')}
                            className="h-8 bg-muted hover:bg-muted/80 text-foreground font-black uppercase text-[9px] tracking-widest rounded-[8px] border border-border gap-1.5"
                        >
                            <Printer size={12} className="text-primary" /> Ticket
                        </Button>
                        <Button 
                            onClick={() => window.open(`${import.meta.env.VITE_API_URL}/orders/${orderId}/ticket?type=invoice`, '_blank')}
                            className="h-8 bg-muted hover:bg-muted/80 text-foreground font-black uppercase text-[9px] tracking-widest rounded-[8px] border border-border gap-1.5"
                        >
                            <FileText size={12} className="text-indigo-500" /> Facture
                        </Button>
                    </div>
                    <Button
                        onClick={onPay}
                        className="w-full h-9 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase text-[10px] tracking-widest rounded-[8px] shadow-md gap-1.5"
                    >
                        <CreditCard size={14} /> Encaisser
                    </Button>
                </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
