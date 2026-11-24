import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/api/client'
import PageHeader from '@/components/shared/PageHeader'
import { formatDateTime, formatAmount } from '@/lib/formatters'
import { usePermissions } from '@/hooks/usePermissions'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertTriangle, CheckCircle, XCircle, Lock, ShieldAlert, User, Clock, MessageSquare, ClipboardCheck, Eye } from 'lucide-react'
import { cn } from '@/lib/utils'
import ReceiptPreview from '@/components/receipts/ReceiptPreview'

export default function CancellationsPage() {
  const queryClient = useQueryClient()
  const { canApproveCancellations } = usePermissions()
  const [pinDialog, setPinDialog] = useState(null)
  const [viewOrder, setViewOrder] = useState(null)
  const [page, setPage] = useState(1)

  const { data: pagination = {}, isLoading } = useQuery({
    queryKey: ['cancellations', page],
    queryFn:  () => apiClient.get('/cancellations', { params: { page } }).then(r => r.data),
    refetchInterval: 10000,
  })

  const cancellations = pagination.data || []

  const approveMut = useMutation({
    mutationFn: ({ id, pin }) => apiClient.post(`/cancellations/${id}/approve`, { manager_pin: pin }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['cancellations'] }); setPinDialog(null) },
  })

  const rejectMut = useMutation({
    mutationFn: (id) => apiClient.post(`/cancellations/${id}/reject`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cancellations'] }),
  })

  return (
    <div className="h-full flex flex-col gap-6 animate-fade-in pb-10">
      <div className="flex flex-col gap-1 lg:gap-2 px-1 lg:px-0">
          <Badge className="w-fit bg-red-500/10 text-red-500 border-none px-2 mb-1 text-[8px] font-black uppercase tracking-widest">Zone de sécurité</Badge>
          <div className="flex items-center justify-between">
             <h1 className="text-2xl lg:text-2xl font-black text-foreground italic uppercase tracking-tighter">Annulations</h1>
             <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center border border-border">
                <ShieldAlert size={20} className="text-red-500" />
             </div>
          </div>
          <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">Gestion des approbations critiques</p>
      </div>

      <div className="flex-1 bg-card rounded-[1rem] border border-border shadow-md flex flex-col min-h-0">
        <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="p-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest italic">Réf / Type</th>
                <th className="p-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest italic">Demandeur</th>
                <th className="p-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest italic">Heure</th>
                <th className="p-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest italic">Raison</th>
                <th className="p-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest italic text-center">Statut</th>
                <th className="p-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest italic text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr><td colSpan={6} className="p-20 text-center">
                  <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
                </td></tr>
              ) : cancellations.length === 0 ? (
                <tr><td colSpan={6} className="p-20 text-center opacity-40 italic font-black uppercase text-xs tracking-widest text-muted-foreground">Aucune demande</td></tr>
              ) : cancellations.map(c => (
                <tr key={c.id} className="hover:bg-muted/30 transition-colors group">
                  <td className="p-3 pl-6">
                    <div className="flex flex-col">
                       <span className="text-[10px] font-black text-primary uppercase tracking-tighter">
                         {c.cancellable?.order_number 
                            ? `ORD-${c.cancellable.order_number.split('-').pop()}` 
                            : (c.cancellable?.order?.order_number 
                                ? `ORD-${c.cancellable.order.order_number.split('-').pop()}` 
                                : `REF-${c.cancellable_id}`)}
                       </span>
                       <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                         {c.cancellable_type?.includes('OrderItem') ? 'Article' : c.cancellable_type?.includes('Payment') ? 'Paiement' : 'Total'}
                       </span>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                       <div className="w-6 h-6 rounded-lg bg-muted flex items-center justify-center text-[9px] font-black text-muted-foreground">{c.requester?.first_name?.charAt(0)}</div>
                       <span className="text-xs font-black text-foreground/80 italic tracking-tight">{c.requester?.first_name}</span>
                    </div>
                  </td>
                  <td className="p-3 text-[10px] font-black text-muted-foreground/80 italic uppercase tracking-tighter">
                    {formatDateTime(c.created_at).split(' ')[1]}
                  </td>
                  <td className="p-3">
                    <p className="text-[11px] font-bold text-muted-foreground italic line-clamp-1 max-w-[200px]" title={c.reason}>"{c.reason}"</p>
                  </td>
                  <td className="p-3 text-center">
                    <Badge className={cn(
                        "border-none px-2 py-0.5 text-[8px] font-black uppercase tracking-widest rounded-md",
                        c.status === 'pending' ? 'bg-orange-500/10 text-orange-500' :
                        c.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                    )}>{c.status === 'pending' ? 'En attente' : c.status === 'approved' ? 'OK' : 'REF'}</Badge>
                  </td>
                  <td className="p-3 pr-6 text-right">
                    <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      {/* View Button */}
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8 text-blue-500 hover:bg-blue-500 hover:text-white rounded-lg transition-all"
                        onClick={() => {
                          const orderId = c.cancellable?.order_id || (c.cancellable_type?.includes('Order') ? c.cancellable_id : c.cancellable?.order?.id);
                          if (orderId) setViewOrder(orderId);
                        }}
                      >
                        <Eye size={14} />
                      </Button>

                      {c.status === 'pending' && canApproveCancellations && (
                        <>
                          <Button 
                            size="icon" 
                            className="h-8 w-8 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-lg shadow-emerald-500/20"
                            onClick={() => setPinDialog(c)}
                          >
                            <CheckCircle size={14} />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-8 w-8 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-all"
                            onClick={() => { if(confirm('Refuser ?')) rejectMut.mutate(c.id) }}
                          >
                            <XCircle size={14} />
                          </Button>
                        </>
                      )}
                    </div>
                    {/* Toujours visible sur mobile via breakpoint tactile si besoin, sinon on garde l'opacité 0 par défaut PC */}
                    <div className="lg:hidden flex justify-end gap-1.5 ">
                       <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-7 w-7 text-blue-500 bg-muted hover:bg-blue-500 hover:text-white rounded-md"
                          onClick={() => {
                            const orderId = c.cancellable?.order_id || (c.cancellable_type?.includes('Order') ? c.cancellable_id : c.cancellable?.order?.id);
                            if (orderId) setViewOrder(orderId);
                          }}
                        >
                          <Eye size={12} />
                        </Button>
                       {c.status === 'pending' && canApproveCancellations && (
                         <>
                            <Button size="icon" className="h-7 w-7 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md" onClick={() => setPinDialog(c)}><CheckCircle size={12} /></Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500 bg-muted hover:bg-red-500 hover:text-white rounded-md" onClick={() => rejectMut.mutate(c.id)}><XCircle size={12} /></Button>
                         </>
                       )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Block */}
        {pagination.last_page > 1 && (
          <div className="p-4 border-t border-border bg-muted/20 flex items-center justify-between">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest italic">
               Total: <span className="text-foreground/70">{pagination.total}</span> demandes
            </p>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="bg-muted border-border text-[9px] font-black uppercase tracking-widest rounded-lg h-8 px-4 disabled:opacity-50 text-foreground"
              >Précédent</Button>
              <div className="px-3 h-8 flex items-center bg-primary/10 rounded-lg border border-primary/20">
                 <span className="text-[10px] font-black text-primary uppercase tracking-tighter">
                   {page} <span className="text-muted-foreground/40 mx-1">/</span> {pagination.last_page}
                 </span>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                disabled={page === pagination.last_page}
                onClick={() => setPage(p => p + 1)}
                className="bg-muted border-border text-[9px] font-black uppercase tracking-widest rounded-lg h-8 px-4 disabled:opacity-50 text-foreground"
              >Suivant</Button>
            </div>
          </div>
        )}
      </div>

      {viewOrder && (
        <Dialog open onOpenChange={() => setViewOrder(null)}>
          <DialogContent className="max-w-md bg-card border-border text-foreground rounded-[2rem] p-0 overflow-hidden shadow-2xl">
            <DialogHeader className="p-8 pb-4 bg-muted/40 border-b border-border">
              <DialogTitle className="text-xl font-black uppercase italic tracking-tighter">Détails de la Commande</DialogTitle>
            </DialogHeader>
            <div className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <ReceiptPreview orderId={viewOrder} />
            </div>
            <div className="p-6 bg-muted/20 border-t border-border flex justify-end">
              <Button 
                onClick={() => setViewOrder(null)}
                className="h-10 px-8 bg-primary text-primary-foreground font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-primary/90 transition-all"
              >
                Fermer
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {pinDialog && (
        <PinApproveDialog
          cancellation={pinDialog}
          onClose={() => setPinDialog(null)}
          onSubmit={(pin) => approveMut.mutate({ id: pinDialog.id, pin })}
          isLoading={approveMut.isPending}
        />
      )}
    </div>
  )
}

function PinApproveDialog({ cancellation, onClose, onSubmit, isLoading }) {
  const [pin, setPin] = useState('')

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-[20rem] bg-card border-border text-foreground rounded-[2.5rem] p-0 overflow-hidden shadow-2xl">
        <DialogHeader className="p-10 pb-4 bg-muted/40 border-b border-border space-y-4">
          <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center mx-auto shadow-xl shadow-primary/20">
             <Lock size={28} className="text-primary-foreground" />
          </div>
          <DialogTitle className="text-center text-xl font-black italic uppercase tracking-tighter leading-none text-foreground">Vérification Manager</DialogTitle>
          <p className="text-center text-[10px] text-muted-foreground font-black uppercase tracking-widest leading-relaxed">Veuillez composer votre code PIN de sécurité secret</p>
        </DialogHeader>
        <div className="p-10 pt-4 space-y-8">
            <Input
              type="password"
              value={pin}
              onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="••••"
              className="text-center text-4xl h-20 bg-muted/50 border-border font-black text-foreground tracking-[0.5em] rounded-2xl outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-inner"
              maxLength={4}
              inputMode="numeric"
            />
            
            <div className="grid grid-cols-2 gap-3">
              <Button variant="ghost" className="h-14 font-black uppercase text-[10px] tracking-widest text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl" onClick={onClose}>Abandonner</Button>
              <Button 
                className="h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase text-[10px] tracking-widest rounded-xl shadow-lg shadow-primary/20 transform active:scale-95 transition-all" 
                onClick={() => onSubmit(pin)} 
                disabled={pin.length < 4 || isLoading}
              >
                {isLoading ? <div className="animate-spin w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full" /> : "Débloquer"}
              </Button>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
