import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/api/client'
import PageHeader from '@/components/shared/PageHeader'
import { formatAmount, formatDateTime, orderStatusLabel, orderTypeLabel } from '@/lib/formatters'
import { OrderStatusBadge } from '@/components/shared/StatusBadge'
import CakePaymentModal from '@/components/cakes/CakePaymentModal'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Eye, Filter, ShoppingBag, Edit, XCircle, Printer, CheckSquare, Square, Banknote } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { usePrint } from '@/hooks/usePrint'
import { useToast } from '@/components/ui/use-toast'
import { usePermissions } from '@/hooks/usePermissions'

export default function OrdersPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [date, setDate] = useState(new Date().toLocaleDateString('en-CA')) // YYYY-MM-DD local
  const [selectedUserId, setSelectedUserId] = useState('all')
  const [selectedOrders, setSelectedOrders] = useState([])

  const { isAdmin, isManager } = usePermissions()
  const isSupervisor = isAdmin || isManager

  const { toast } = useToast()
  const { printNetworkReceipt, bulkPrintNetwork, printCakeNetwork } = usePrint()

  const [cakePaymentOpen, setCakePaymentOpen] = useState(false)
  const [selectedCakeOrder, setSelectedCakeOrder] = useState(null)

  const payCakeMutation = useMutation({
    mutationFn: (d) => apiClient.post(`/cake-orders/${d.order_id}/collect`, {
        payment_method: d.method,
        amount: d.amount
    }),
    onSuccess: (res) => {
        queryClient.invalidateQueries({ queryKey: ['orders-list'] });
        setCakePaymentOpen(false);
        toast({ title: "Succès", description: "Paiement encaissé" });
        // Impression IP automatique sur l'imprimante de CAISSE
        const orderId = res.data.order?.id || res.data.id;
        if (orderId) {
            printCakeNetwork(orderId).catch(err => console.error("Auto print error", err));
        }
    },
    onError: (err) => toast({ 
        title: "Erreur", 
        description: err.response?.data?.message || "Échec du paiement", 
        variant: "destructive" 
    })
  });

  const toggleSelectAll = (orders) => {
    if (selectedOrders.length === orders.length) {
      setSelectedOrders([])
    } else {
      setSelectedOrders(orders.map(o => o.id))
    }
  }

  const toggleSelectOrder = (id) => {
    setSelectedOrders(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const handleBulkPrint = async () => {
    if (selectedOrders.length === 0) return;
    try {
      const response = await apiClient.post('/receipts/bulk-a4', { order_ids: selectedOrders }, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (err) {
      console.error(err);
      toast({ title: "Erreur", description: "Erreur lors de la génération du PDF", variant: "destructive" });
    }
  }

  const handleBulkPrintIP = async () => {
    if (selectedOrders.length === 0) return;
    try {
      await bulkPrintNetwork(selectedOrders);
      toast({ title: "Impression IP", description: `${selectedOrders.length} tickets envoyés` });
      setSelectedOrders([]);
    } catch (err) {
      console.error(err);
      toast({ title: "Erreur", description: err.response?.data?.message || "Erreur d'impression réseau", variant: "destructive" });
    }
  }

  const { data: usersData } = useQuery({
    queryKey: ['orders-cashiers-list'],
    queryFn: () => apiClient.get('/users', { params: { active: 1 } }).then(r => r.data),
    enabled: isSupervisor,
  })
  const usersList = Array.isArray(usersData?.data) ? usersData.data : (Array.isArray(usersData) ? usersData : [])

  const { data, isLoading } = useQuery({
    queryKey: ['orders-list', status, search, date, isSupervisor ? selectedUserId : 'me'],
    queryFn: () => apiClient.get('/orders', { 
      params: { 
        status: status === 'all' ? undefined : status,
        search: search || undefined,
        date: search ? undefined : date,
        user_id: isSupervisor && selectedUserId !== 'all' ? selectedUserId : undefined,
        per_page: 800,
        include_cakes: 1
      } 
    }).then(r => r.data),
    refetchInterval: 10000,
  })

  // Récupération séparée pour les annulations
  const { data: cancellationsData } = useQuery({
    queryKey: ['pending-cancellations'],
    queryFn: () => apiClient.get('/cancellations', { params: { status: 'pending' } }).then(r => r.data),
    refetchInterval: 10000,
  })

  const rawOrders = data?.data ?? []
  const allPendingCancellations = cancellationsData?.data ?? []

  // Tri personnalisé : les commandes non encaissées en premier, suivies des commandes encaissées (les plus récentes en premier)
  const orders = [...rawOrders].sort((a, b) => {
    const aIsPaid = a.status === 'paid';
    const bIsPaid = b.status === 'paid';
    
    if (aIsPaid && !bIsPaid) return 1;
    if (!aIsPaid && bIsPaid) return -1;
    
    return new Date(b.created_at) - new Date(a.created_at);
  });

  return (
    <div className="space-y-4 animate-fade-in p-2 lg:p-4">
      <PageHeader title="Commandes" subtitle="Historique et suivi">
          {selectedOrders.length > 0 && (
            <div className="flex gap-2 animate-in slide-in-from-right-2">
              <Button onClick={handleBulkPrint} className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-8 text-[10px]" size="sm">
                  <Printer size={14} className="mr-2" /> PDF ({selectedOrders.length})
              </Button>
              <Button onClick={handleBulkPrintIP} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-8 text-[10px]" size="sm">
                  <Printer size={14} className="mr-2" /> IP ({selectedOrders.length})
              </Button>
            </div>
          )}
      </PageHeader>

      <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/30" />
            <Input 
              value={search} onChange={e => setSearch(e.target.value)} 
              placeholder="Rechercher..." 
              className="pl-9 bg-muted border-border text-xs h-9 rounded-[10px]" 
            />
          </div>
          <div className="relative w-full sm:w-48">
            <Input 
              type="date"
              value={date} onChange={e => setDate(e.target.value)} 
              className="bg-muted border-border text-xs h-9 rounded-[10px]" 
            />
          </div>
          {isSupervisor && (
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="bg-muted border border-border text-xs h-9 rounded-[10px] px-3 font-bold text-foreground outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">Tous les caissiers</option>
              {usersList.map((u) => (
                <option key={u.id} value={String(u.id)}>
                  {u.first_name} {u.last_name || ''}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1 w-full lg:w-auto scrollbar-hide no-scrollbar">
          {['all', 'open', 'sent_to_kitchen', 'served', 'paid', 'cancelled'].map(s => (
            <Button
              key={s} variant="outline" size="sm" onClick={() => setStatus(s)}
              className={cn(
                "border-border text-[9px] uppercase font-black px-3 shrink-0 h-8 rounded-[8px]",
                status === s ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              {s === 'all' ? 'Toutes' : orderStatusLabel(s)}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10 opacity-50"><div className="animate-spin w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full" /></div>
      ) : (
        <Card className="border-border bg-card rounded-[10px] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-[9px] uppercase font-black tracking-widest text-muted-foreground/60">
                  <th className="px-4 py-2 w-10 text-center">
                    <button onClick={() => toggleSelectAll(orders)} className="text-muted-foreground hover:text-primary">
                      {selectedOrders.length === orders.length && orders.length > 0 ? <CheckSquare size={14} /> : <Square size={14} />}
                    </button>
                  </th>
                  <th className="text-left px-4 py-2 italic font-black uppercase">REF</th>
                  <th className="text-center px-4 py-2 italic font-black uppercase">Service</th>
                  <th className="text-center px-4 py-2 italic font-black uppercase">Statut</th>
                  <th className="text-center px-4 py-2 italic font-black uppercase">Montant</th>
                  <th className="text-center px-4 py-2 italic font-black uppercase">Heure</th>
                  <th className="text-right px-6 py-2 italic font-black uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {orders.map((order) => {
                  const hasOrderCancellation = order.cancellations?.some(c => c.status === 'pending') || allPendingCancellations.some(c => c.cancellable_type?.includes('Order') && !c.cancellable_type?.includes('OrderItem') && Number(c.cancellable_id) === Number(order.id));
                  const hasItemCancellation = order.items?.some(i => i.cancellations?.some(c => c.status === 'pending')) || allPendingCancellations.some(c => c.cancellable_type?.includes('OrderItem') && (Number(c.cancellable?.order_id) === Number(order.id) || Number(c.cancellable?.order?.id) === Number(order.id)));
                  const isCancelling = hasOrderCancellation || hasItemCancellation;
                  const unifiedCancellations = [...(order.cancellations || []), ...allPendingCancellations.filter(c => c.cancellable_type?.includes('Order') && !c.cancellable_type?.includes('OrderItem') && Number(c.cancellable_id) === Number(order.id)).map(c => ({ ...c, status: 'pending' }))];
                  
                  return (
                  <tr key={order.id} className={cn("hover:bg-muted/10 transition-all", selectedOrders.includes(order.id) && "bg-primary/5")}>
                    <td className="px-4 py-1.5 text-center">
                      <button onClick={() => toggleSelectOrder(order.id)} className={cn("transition-colors", selectedOrders.includes(order.id) ? "text-primary" : "text-muted-foreground/20")}>
                        {selectedOrders.includes(order.id) ? <CheckSquare size={14} /> : <Square size={14} />}
                      </button>
                    </td>
                    <td className="px-4 py-1.5 min-w-[120px]">
                      <p className="text-foreground font-black text-[10px] uppercase truncate">{order.order_number}</p>
                      {order.cashier && <p className="text-[8px] text-emerald-600 font-bold truncate">Caisse: {order.cashier.first_name}</p>}
                      {order.server_name && <p className="text-[8px] text-muted-foreground font-medium truncate italic">Srv: {order.server_name}</p>}
                      {order.customer_name && <p className="text-[8px] text-primary/60 font-medium truncate">{order.customer_name}</p>}
                    </td>
                    <td className="px-4 py-1.5 text-center">
                        <Badge variant="outline" className="text-[8px] font-black uppercase border-primary/20 bg-primary/5 text-primary tracking-tighter px-2 h-5 rounded-full">
                          {order.table?.number ? `TABLE ${order.table.number}` : orderTypeLabel(order.type)}
                        </Badge>
                    </td>
                    <td className="px-4 py-1.5 text-center">
                       {isCancelling ? (
                         <span className="inline-flex px-2 py-0.5 rounded-full font-black uppercase text-[8px] bg-red-600 text-white animate-pulse">RECANNULE</span>
                       ) : (
                         <OrderStatusBadge status={order.status} cancellations={unifiedCancellations} className="text-[8px] px-2 h-5 rounded-full"/>
                       )}
                    </td>
                    <td className="px-4 py-1.5 text-center">
                      <p className="text-foreground font-black italic">{formatAmount(order.total)}</p>
                    </td>
                    <td className="px-4 py-1.5 text-center text-muted-foreground text-[9px] font-medium">
                      {formatDateTime(order.created_at).split(' ').pop()}
                    </td>
                    <td className="px-6 py-1.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="w-7 h-7 text-muted-foreground hover:text-primary rounded-full hover:bg-primary/10" onClick={() => navigate(`/orders/${order.id}`)}>
                          <Eye size={14} />
                        </Button>
                        <Button variant="ghost" size="icon" className="w-7 h-7 text-emerald-500 hover:bg-emerald-50 rounded-full" onClick={() => printNetworkReceipt(order.id)}>
                          <Printer size={14} />
                        </Button>
                        {order.status !== 'paid' && order.status !== 'cancelled' && order.status !== 'collected' && order.status !== 'picked_up' && !isCancelling && (
                          <>
                            <Button variant="ghost" size="icon" className="w-7 h-7 text-emerald-600 hover:bg-emerald-50 rounded-full shadow-sm" 
                              title="Encaisser"
                              onClick={() => {
                                if (order.type === 'cake' || order.type === 'cakes' || order.is_cake) {
                                  setSelectedCakeOrder(order);
                                  setCakePaymentOpen(true);
                                }
                                else navigate(`/pos?order=${order.id}${order.table?.id ? `&table=${order.table.id}` : ''}&pay=1`);
                              }}>
                              <Banknote size={14} />
                            </Button>
                            <Button variant="ghost" size="icon" className="w-7 h-7 text-muted-foreground hover:text-primary rounded-full" onClick={() => navigate(`/pos?order=${order.id}`)}>
                              <Edit size={14} />
                            </Button>
                          </>
                        )}
                        {order.status !== 'paid' && order.status !== 'cancelled' && !isCancelling && (
                          <Button variant="ghost" size="icon" className="w-7 h-7 text-muted-foreground hover:text-red-500 rounded-full" 
                            onClick={() => {
                               const reason = window.prompt("Raison :");
                               if (reason) apiClient.post('/cancellations/request', { type: 'order', subject_id: order.id, reason }).then(() => queryClient.invalidateQueries({ queryKey: ['orders-list'] }));
                            }}>
                            <XCircle size={14} />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <CakePaymentModal 
        open={cakePaymentOpen}
        order={selectedCakeOrder}
        onClose={() => { setCakePaymentOpen(false); setSelectedCakeOrder(null); }}
        onSubmit={(data) => payCakeMutation.mutate(data)}
        isLoading={payCakeMutation.isPending}
      />
    </div>
  )
}
