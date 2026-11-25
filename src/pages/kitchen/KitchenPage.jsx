import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/api/client'
import { useSocket } from '@/hooks/useSocket'
import { useAuthStore } from '@/stores/authStore'
import KDSTimer from '@/components/kitchen/KDSTimer'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, RefreshCw, Volume2, ChefHat, Utensils, Flame } from 'lucide-react'

export default function KitchenPage() {
  const queryClient = useQueryClient()
  const { user }    = useAuthStore()
  const [destination, setDestination] = useState('kitchen')

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['kitchen-orders', destination],
    queryFn:  () => apiClient.get('/kitchen/orders', { params: { destination } }).then(r => r.data),
    refetchInterval: 5000,
  })

  // Real-time updates
  useSocket(
    `restaurant.${user?.restaurant_id}`,
    '.order.sent-to-kitchen',
    useCallback(() => queryClient.invalidateQueries({ queryKey: ['kitchen-orders'] }), [queryClient])
  )

  const markItemMutation = useMutation({
    mutationFn: ({ itemId, status }) => apiClient.put(`/kitchen/items/${itemId}/status`, { status }),
    onSuccess:  () => queryClient.invalidateQueries({ queryKey: ['kitchen-orders'] }),
  })

  const markAllDoneMutation = useMutation({
    mutationFn: (orderId) => apiClient.put(`/kitchen/orders/${orderId}/validate-all`),
    onSuccess:  () => queryClient.invalidateQueries({ queryKey: ['kitchen-orders'] }),
  })

  const stats = {
    pending:   orders.filter(o => o.items.some(i => i.status === 'pending')).length,
    preparing: orders.filter(o => o.status === 'partially_served' || o.items.some(i => i.status === 'preparing')).length,
    ready:     orders.filter(o => o.status === 'served').length,
  }

  const KITCHENS = [
      { id: 'kitchen', label: 'Cuisine', icon: ChefHat },
      { id: 'bar', label: 'Glaces', icon: Utensils },
  ]

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col transition-colors duration-300">
      {/* Top Professional Header */}
      <div className="h-16 border-b border-border flex items-center justify-between px-6 bg-card/80 backdrop-blur-md sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-10">
          <div className="flex bg-muted p-1 rounded-xl border border-border">
              {KITCHENS.map(k => (
                  <button 
                    key={k.id}
                    onClick={() => setDestination(k.id)}
                    className={cn(
                        "px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                        destination === k.id ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                      {k.label}
                  </button>
              ))}
          </div>
          <div className="bg-muted px-3 py-1.5 rounded-lg border border-border hidden md:flex items-center gap-2">
            <span className="text-primary font-mono font-bold tracking-tighter">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge className="bg-orange-500/10 text-orange-600 border-none px-4 py-1 font-black">
            ATTENTE <span className="ml-2">{stats.pending}</span>
          </Badge>
          <Badge className="bg-blue-500/10 text-blue-600 border-none px-4 py-1 font-black">
            PRÉPARATION <span className="ml-2">{stats.preparing}</span>
          </Badge>
          <Badge className="bg-green-500/10 text-green-600 border-none px-4 py-1 font-black">
            PRÊTS <span className="ml-2">{stats.ready}</span>
          </Badge>
          <div className="ml-4 flex items-center gap-2">
             <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center relative">
               <Volume2 size={18} className="text-muted-foreground" />
               <div className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full animate-pulse" />
             </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Orders Grid with horizontal layout */}
        <main className="flex-1 overflow-x-auto p-6 bg-background custom-scrollbar">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : orders.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground/20">
              <span className="text-8xl mb-6">✨</span>
              <p className="text-2xl font-bold tracking-tighter">Cuisine à jour !</p>
            </div>
          ) : (
            <div className="flex gap-6 h-full pb-4 scrollbar-thin">
              {orders.map(order => (
                <KDSCard
                  key={order.id}
                  order={order}
                  onMarkItem={(itemId, status) => markItemMutation.mutate({ itemId, status })}
                  onMarkAll={() => markAllDoneMutation.mutate(order.id)}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Floating Refresh */}
      <button 
        onClick={() => queryClient.invalidateQueries({ queryKey: ['kitchen-orders'] })}
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full flex items-center justify-center shadow-xl shadow-primary/20 transition-all z-30"
      >
        <RefreshCw size={24} />
      </button>
    </div>
  )
}

function KDSCard({ order, onMarkItem, onMarkAll }) {
  const hasOrderCancellation = order.cancellations?.length > 0
  const hasItemCancellation = order.items?.some(i => i.cancellations?.length > 0)
  const hasCancelling = hasOrderCancellation || hasItemCancellation
  
  const pendingItems = order.items?.filter(i => ['pending','preparing'].includes(i.status) && !(i.cancellations?.length > 0)) ?? []
  const allDone = pendingItems.length === 0 && !hasCancelling
  
  // Logic from screen5.png: determine badge and color
  const diffMinutes = order.sent_to_kitchen_at ? Math.floor((new Date() - new Date(order.sent_to_kitchen_at)) / 60000) : 0
  const isCritical = diffMinutes > 15
  const isWarning  = diffMinutes > 10

  return (
    <div className={cn(
      'w-80 flex-shrink-0 flex flex-col rounded-2xl border-2 transition-all overflow-hidden bg-card shadow-xl',
      hasCancelling ? 'border-red-600 animate-pulse' :
      allDone ? 'border-emerald-500/30' : 
      isCritical ? 'border-orange-600' : 
      isWarning ? 'border-orange-400' : 'border-border'
    )}>
      {/* Card Header matching screen5.png */}
      <div className={cn(
        'p-4 flex items-center justify-between',
        hasCancelling ? 'bg-red-600/10' :
        allDone ? 'bg-emerald-500/10' : 
        isCritical ? 'bg-orange-600/10' : 
        isWarning ? 'bg-orange-400/10' : 'bg-muted/50'
      )}>
        <div>
          <h3 className="text-2xl font-black tracking-tighter">#{order.order_number.split('-').pop()}</h3>
          <p className="text-xs font-bold opacity-60">Table {order.table?.number} • {order.waiter?.first_name}</p>
        </div>
        <div className="text-right">
          <p className={cn(
            'text-lg font-black font-mono',
            isCritical ? 'text-orange-500' : 'text-foreground'
          )}>
            {order.sent_to_kitchen_at ? new Date(order.sent_to_kitchen_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
          </p>
          {hasCancelling && <Badge className="bg-red-600 text-[8px] font-black h-4 border-none px-1 animate-bounce">ANNULATION !!!</Badge>}
          {isCritical && !hasCancelling && <Badge className="bg-red-500 text-[8px] font-black h-4 border-none px-1">RETARD CRITIQUE</Badge>}
          {isWarning && !isCritical && !hasCancelling && <Badge className="bg-orange-500 text-[8px] font-black h-4 border-none px-1">À SURVEILLER</Badge>}
        </div>
      </div>

      {/* Ribbon for NEW ORDER or CANCELLATION REQUEST */}
      {hasCancelling ? (
        <div className="bg-red-600 text-[10px] font-black text-center py-1 uppercase tracking-widest animate-pulse">
           Arrêt immédiat - Annulation demandée
        </div>
      ) : (!allDone && diffMinutes < 2 && (
        <div className="bg-orange-500 text-[10px] font-black text-center py-1 uppercase tracking-widest">
           Nouvelle commande
        </div>
      ))}

      {/* Items Area */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {order.items?.map(item => {
          const isItemCancelling = item.cancellations?.length > 0
          return (
          <div key={item.id} className="relative">
            {isItemCancelling && (
                <div className="absolute inset-0 bg-red-600/10 border-2 border-red-600 rounded-lg flex items-center justify-center z-10">
                    <span className="bg-red-600 text-white text-[8px] font-black uppercase px-2 py-0.5 rounded rotate-[-5deg] shadow-xl">ANNULATION</span>
                </div>
            )}
            <div className={cn("flex items-start gap-4", isItemCancelling && "opacity-60")}>
               {/* Checkbox style indicator */}
                <button 
                 onClick={() => !isItemCancelling && onMarkItem(item.id, item.status === 'done' ? 'preparing' : 'done')}
                 className={cn(
                   'w-7 h-7 rounded-md border-2 flex items-center justify-center transition-all mt-0.5',
                   item.status === 'done' ? 'bg-primary border-primary text-primary-foreground' : 'border-border text-transparent hover:border-primary'
                 )}
                >
                 <CheckCircle size={16} />
               </button>

               <div className="flex-1">
                 <div className="flex justify-between items-baseline">
                   <p className={cn(
                     'text-lg font-bold leading-tight',
                     item.status === 'done' ? 'text-muted-foreground/30 line-through' : 'text-foreground'
                   )}>
                     <span className="text-2xl mr-2">{item.quantity}x</span>
                     {item.product?.name}
                   </p>
                 </div>
                 
                 {/* Modifiers orange text from screen5 */}
                 {(item.modifiers?.length > 0 || item.notes) && (
                   <div className="mt-1 space-y-0.5">
                     {item.modifiers?.map(m => (
                       <p key={m.id} className="text-orange-500 italic text-xs font-bold leading-none">
                         • {m.name}
                       </p>
                     ))}
                     {item.notes && (
                       <p className="text-orange-500 italic text-xs font-bold leading-none">
                         + {item.notes}
                       </p>
                     )}
                   </div>
                 )}
               </div>
            </div>
          </div>
          )
         })}
       </div>

      {/* Footer Actions */}
      <div className="p-4 bg-muted/30 border-t border-border space-y-3">
         <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            <Badge variant="outline" className="text-[9px] border-border uppercase text-muted-foreground">
              {order.type === 'dine_in' ? 'Sur place' : 'Emporter'}
            </Badge>
            <span>Reçu à {order.sent_to_kitchen_at ? new Date(order.sent_to_kitchen_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</span>
         </div>
         
         {!allDone && (
           <Button 
            onClick={onMarkAll}
            className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-black text-sm uppercase tracking-tighter shadow-lg shadow-primary/20"
           >
             Valider tout
           </Button>
         )}
         
         {allDone && (
           <div className="w-full h-12 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-md flex items-center justify-center font-black text-sm uppercase">
             Envoyé
           </div>
         )}
      </div>
    </div>
  )
}
