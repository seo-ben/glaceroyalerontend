import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { tablesApi } from '@/api/tables'
import { ordersApi } from '@/api/orders'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { formatAmount } from '@/lib/formatters'
import {
  X, Eye, Plus, ChefHat, Scissors, ArrowRight,
  CreditCard, Trash2, Ban, Move
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/use-toast'
import apiClient from '@/api/client'

export default function TableActionPanel({ table, onClose, onAction }) {
  const navigate    = useNavigate()
  const { isManager } = useAuthStore()
  const queryClient = useQueryClient()

  const { data: orderData } = useQuery({
    queryKey: ['current-order', table.id],
    queryFn:  () => ordersApi.currentByTable(table.id).then(r => r.data),
    enabled:  table.status === 'occupied',
    retry:    false,
  })

  const { data: allTables = [] } = useQuery({
    queryKey: ['available-tables'],
    queryFn: () => apiClient.get('/tables').then(r => r.data),
    enabled: !!orderData,
  })

  const isTableFree = table.status === 'free' || table.status === 'available'

  const { data: config } = useQuery({
    queryKey: ['settings-config'],
    queryFn: () => apiClient.get('/settings/config').then(r => r.data),
    enabled: isTableFree,
  })

  const servers = config?.servers_list ? config.servers_list.split(',').map(s => s.trim()).filter(Boolean) : [];

  const [transferOpen, setTransferOpen] = useState(false)
  const [serverName, setServerName] = useState('')

  const freeTableMutation = useMutation({
    mutationFn: () => tablesApi.updateStatus(table.id, { status: 'free' }),
    onSuccess:  () => onAction(),
  })

  const cancelOrderMutation = useMutation({
    mutationFn: (id) => apiClient.post(`/orders/${id}/status`, { status: 'cancelled', reason: 'Annulation manuelle par le personnel' }),
    onSuccess: () => {
        toast({ title: "Commande annulée" });
        onAction();
    }
  });
  const transferMutation = useMutation({
    mutationFn: (targetId) => apiClient.post(`/tables/${table.id}/transfer`, { target_table_id: targetId }),
    onSuccess: (res) => {
        toast({ title: "Transfert réussi", description: `La commande est maintenant sur la table sélectionnée.` });
        setTransferOpen(false);
        onAction();
    },
    onError: (err) => toast({ title: "Erreur", description: err.response?.data?.message || "Échec du transfert", variant: "destructive" })
  });

  const order = orderData?.order

    const ACTIONS = [
    { label: 'Ouvrir Commande',   icon: Eye,        variant: 'glass',      show: table.status === 'occupied', onClick: () => order && navigate(`/pos?table=${table.id}&order=${order.id}`) },
    { label: 'Nouveau Client',    icon: Plus,       variant: 'primary',    show: isTableFree,     disabled: isTableFree && !serverName, onClick: () => {
        navigate(`/pos?table=${table.id}&server=${encodeURIComponent((serverName || '').trim())}`);
    } },
    { label: 'Ajouter Articles',  icon: Plus,       variant: 'glass',      show: table.status === 'occupied', onClick: () => navigate(`/pos?table=${table.id}&order=${order?.id}`) },
    { label: 'Envoyer Cuisine',   icon: ChefHat,    variant: 'glass',      show: table.status === 'occupied', onClick: () => order && navigate(`/orders/${order.id}#kitchen`) },
    { label: 'Changer de Table',  icon: Move,       variant: 'glass',      show: table.status === 'occupied', onClick: () => setTransferOpen(true) },
    { label: 'Annuler Commande',  icon: Ban,        variant: 'danger-outline', show: table.status === 'occupied' && isManager, onClick: () => {
        if(confirm('Annuler définitivement cette commande ?')) cancelOrderMutation.mutate(order.id)
    } },
    { label: 'ENCAISSER (PAYER)',  icon: CreditCard, variant: 'orange',     show: table.status === 'occupied', onClick: () => order && navigate(`/pos?order=${order.id}&pay=1`) },
    { label: 'Libérer Table',     icon: Trash2,      variant: 'danger',     show: table.status === 'occupied' && isManager, onClick: () => {
      if(confirm('Libérer manuellement cette table ?')) freeTableMutation.mutate()
    } },
  ]

  return (
    <div className="h-full bg-card rounded-2xl border border-border flex flex-col overflow-hidden shadow-2xl transition-colors duration-300">
      <div className="p-4 bg-muted border-b border-border flex items-center justify-between">
        <div>
           <Badge className="bg-primary/10 text-primary border-none px-2 mb-1.5 text-[8px] font-black uppercase tracking-widest">Table en direct</Badge>
           <h2 className="text-xl font-black text-foreground tracking-tighter uppercase italic leading-none">Table {table.number}</h2>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-9 w-9 text-muted-foreground/40 hover:text-foreground bg-muted hover:bg-accent rounded-xl transition-all"><X size={16} /></Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5">
        {order ? (
          <div className="p-5 rounded-2xl bg-muted/40 border border-border space-y-3 shadow-inner">
            <div className="flex justify-between items-start">
               <div>
                  <p className="text-[9px] uppercase font-black tracking-[0.2em] text-muted-foreground italic">Facture en cours</p>
                  <p className="text-2xl font-black text-foreground mt-1 tracking-tighter italic">{formatAmount(order.total)}</p>
               </div>
               <Badge className="bg-emerald-500/10 text-emerald-600 border-none text-[9px] font-black px-2.5 py-1 uppercase">{order.items?.length ?? 0} ITEMS</Badge>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center bg-muted/20 rounded-2xl border border-dashed border-border flex flex-col items-center justify-center gap-2">
             <Plus size={24} className="text-muted-foreground/20 mb-1" />
             <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] italic mb-2">Table prête pour service</p>
             <div className="w-full relative">
                 <Select value={serverName} onValueChange={setServerName}>
                     <SelectTrigger className="w-full text-center text-xs font-bold bg-background border-border h-11 rounded-xl shadow-inner placeholder:text-muted-foreground/40 placeholder:font-medium focus-visible:ring-primary/20">
                         <SelectValue placeholder="SÉLECTIONNEZ LE SERVEUR" />
                     </SelectTrigger>
                     <SelectContent className="bg-card border-border">
                         {servers.length > 0 ? servers.map(s => (
                             <SelectItem key={s} value={s}>{s}</SelectItem>
                         )) : <div className="p-2 text-xs text-muted-foreground text-center">Aucun serveur configuré</div>}
                     </SelectContent>
                 </Select>
             </div>
          </div>
        )}

        <div className="space-y-2.5">
          <p className="text-[9px] uppercase font-black tracking-widest text-muted-foreground/40 ml-2">Actions logistiques</p>
          {ACTIONS.filter(a => a.show).map(({ label, icon: Icon, variant, onClick, disabled: actionDisabled }) => (
            <Button
              key={label}
              onClick={onClick}
              className={cn(
                'w-full justify-start gap-4 px-5 rounded-2xl font-black uppercase tracking-widest transition-all duration-300 shadow-sm border',
                variant === 'primary' && 'bg-primary hover:bg-primary/90 text-primary-foreground border-primary/20 h-12 text-[10px]',
                variant === 'orange'  && 'bg-primary hover:bg-primary/90 text-primary-foreground border-primary/20 h-14 text-xs font-black',
                variant === 'glass'   && 'bg-muted hover:bg-accent text-foreground/70 hover:text-foreground border-border h-12 text-[10px]',
                variant === 'danger'  && 'bg-red-500/10 hover:bg-red-600 text-red-500 hover:text-white border-red-500/10 h-12 text-[10px]',
                variant === 'danger-outline' && 'bg-transparent hover:bg-red-500/10 text-red-500 border-red-500/10 h-12 text-[10px]'
              )}
              disabled={freeTableMutation.isPending || cancelOrderMutation.isPending || actionDisabled}
            >
              <Icon size={16} className="shrink-0" />
              {label}
            </Button>
          ))}
        </div>
      </div>

      <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
          <DialogContent className="max-w-xl bg-card border-border text-foreground rounded-[2.5rem] p-0 overflow-hidden shadow-2xl transition-colors">
            <DialogHeader className="p-10 pb-4 bg-muted/40 border-b border-border">
                <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-4 text-foreground">
                    <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                        <Move className="text-primary-foreground" size={20} />
                    </div>
                    Déplacer vers une table libre
                </DialogTitle>
                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mt-2 ml-14">Sélectionnez la destination pour la table {table.number}</p>
            </DialogHeader>
            <div className="p-10">

            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3 mt-8 max-h-[50vh] overflow-y-auto p-2 no-scrollbar">
                {allTables.filter(t => t.status === 'free').map(t => (
                    <Button
                        key={t.id}
                        disabled={transferMutation.isPending}
                        onClick={() => transferMutation.mutate(t.id)}
                        className="aspect-square rounded-2xl border border-border bg-muted hover:bg-primary hover:border-primary hover:text-primary-foreground flex flex-col items-center justify-center gap-1 transition-all group p-0 text-foreground"
                    >
                        <span className="text-xl font-black italic tracking-tighter group-hover:scale-110 transition-transform">{t.number}</span>
                        <span className="text-[8px] font-black uppercase opacity-30 group-hover:opacity-60">{t.capacity}P</span>
                    </Button>
                ))}
            </div>

            {allTables.filter(t => t.status === 'free').length === 0 && (
                <div className="py-20 text-center text-muted-foreground/20 font-black uppercase text-xs tracking-widest italic border border-dashed border-border rounded-3xl mt-6">
                    Aucune table libre disponible
                </div>
            )}
            </div>
         </DialogContent>
      </Dialog>

      <div className="p-4 bg-muted border-t border-border mt-auto">
         <p className="text-[8px] font-bold text-muted-foreground/30 uppercase tracking-[0.3em] text-center italic mt-0.5">SmartFlow Logistics Engine v2.0</p>
      </div>
    </div>
  )
}
