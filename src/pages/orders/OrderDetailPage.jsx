import { useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ordersApi } from '@/api/orders'
import { formatAmount, formatDateTime, orderStatusLabel, orderTypeLabel } from '@/lib/formatters'
import { OrderStatusBadge } from '@/components/shared/StatusBadge'
import OrderItemRow from '@/components/orders/OrderItemRow'
import OrderLog from '@/components/orders/OrderLog'
import PageHeader from '@/components/shared/PageHeader'
import ReceiptPreview from '@/components/receipts/ReceiptPreview'
import KitchenPrintModal from '@/components/orders/KitchenPrintModal'
import { usePrint } from '@/hooks/usePrint'
import { usePermissions } from '@/hooks/usePermissions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Printer, ChefHat, CreditCard, ArrowLeft, Eye, RotateCcw } from 'lucide-react'

export default function OrderDetailPage() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { printReceipt, printNetworkReceipt } = usePrint()
  const { canManageOrders, isAdmin, isManager } = usePermissions()
  const [printModalOpen, setPrintModalOpen] = useState(false)

  const defaultTab = searchParams.get('tab') || 'items'

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn:  () => ordersApi.show(id).then(r => r.data),
  })

  const sendKitchenMutation = useMutation({
    mutationFn: () => ordersApi.sendToKitchen(id, {}),
    onSuccess:  () => {
        setPrintModalOpen(true);
        queryClient.invalidateQueries({ queryKey: ['order', id] });
    }
  })

  const reopenMutation = useMutation({
    mutationFn: () => ordersApi.reopen(id),
    onSuccess:  (res) => {
        alert(res.data?.message || "La commande a été réouverte.");
        queryClient.invalidateQueries({ queryKey: ['order', id] });
        navigate(`/pos?order=${id}`);
    },
    onError: (err) => {
        alert(err.response?.data?.message || "Erreur de réouverture");
    }
  })

  if (isLoading) return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-96" />
    </div>
  )

  if (!order) return <p>Commande introuvable</p>

  const orderDestinations = Array.from(new Set(
      order.items?.map(i => i.product?.category?.destination || 'kitchen') || ['kitchen']
  ));

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <PageHeader
        title={`Commande ${order.order_number}`}
        subtitle={formatDateTime(order.created_at)}
      >
        <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft size={14} className="mr-1.5" /> Retour
        </Button>
      </PageHeader>

      {/* Status + meta */}
      <div className="flex flex-wrap gap-3 items-center">
        <OrderStatusBadge status={order.status} cancellations={order.cancellations} />
        <span className="text-sm text-muted-foreground mr-1">
          {orderTypeLabel(order.type)}
        </span>
        {order.table && <span className="text-sm text-muted-foreground">Table {order.table.number}</span>}
        <span className="text-sm text-muted-foreground">{order.covers} couvert(s)</span>
        {order.customer_name && (
          <span className="text-sm font-black text-primary border border-primary/20 bg-primary/5 px-2 py-0.5 rounded-full uppercase italic">
            👤 {order.customer_name}
          </span>
        )}
      </div>

      <Tabs defaultValue={defaultTab}>
        <TabsList>
          <TabsTrigger value="items">Articles</TabsTrigger>
          <TabsTrigger value="receipt">Ticket</TabsTrigger>
          <TabsTrigger value="log">Historique</TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="mt-4">
          <Card>
            <CardContent className="p-4">
              {order.items?.map(item => (
                <OrderItemRow key={item.id} item={item} />
              ))}

              <Separator className="my-4" />

              {/* Totals */}
              <div className="space-y-1 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Sous-total</span>
                  <span>{formatAmount(order.subtotal)}</span>
                </div>
                {order.discount_amount > 0 && (
                  <div className="flex justify-between text-black font-bold">
                    <span>Remise ({order.discount_type === 'percent' ? `${order.discount_value}%` : 'fixe'})</span>
                    <span>-{formatAmount(order.discount_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-muted-foreground">
                  <span>TVA</span>
                  <span>{formatAmount(order.tax_amount)}</span>
                </div>
                <div className="flex justify-between font-black text-lg pt-2 border-t-2 border-black">
                  <span>Total</span>
                  <span className="text-black">{formatAmount(order.total)}</span>
                </div>
              </div>

              {/* Actions */}
              {canManageOrders && order.status !== 'paid' && order.status !== 'cancelled' && order.status !== 'collected' && order.status !== 'picked_up' && (
                <div className="flex gap-2 mt-4">
                  {order.status === 'open' && (
                    <Button
                      onClick={() => sendKitchenMutation.mutate()}
                      disabled={sendKitchenMutation.isPending}
                      className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      <ChefHat size={15} /> Envoyer en cuisine
                    </Button>
                  )}
                  <Button onClick={() => navigate(`/pos?order=${order.id}&pay=1`)} className="gap-2">
                    <CreditCard size={15} /> Encaisser
                  </Button>
                  <Button variant="outline" onClick={() => printReceipt(order.id)} className="gap-2">
                    <Printer size={15} /> PDF
                  </Button>
                  <Button 
                    variant="default" 
                    onClick={() => {
                        printNetworkReceipt(order.id)
                          .then(() => alert("Impression lancée !"))
                          .catch(err => alert("Erreur d'impression : " + (err.response?.data?.message || "Vérifiez l'imprimante")));
                    }} 
                    className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <Printer size={15} /> Imprimer Reçu (IP)
                  </Button>
                </div>
              )}

              {/* Bouton Réouvrir — Visible uniquement pour Admin/Manager sur commandes finalisées */}
              {(isAdmin || isManager) && (order.status === 'paid' || order.status === 'cancelled') && (
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="destructive"
                    onClick={() => {
                      if (window.confirm(`Êtes-vous sûr de vouloir réouvrir la commande ${order.order_number} ?\n\nCela annulera tous les paiements enregistrés et la commande redeviendra modifiable.`)) {
                        reopenMutation.mutate();
                      }
                    }}
                    disabled={reopenMutation.isPending}
                    className="gap-2"
                  >
                    <RotateCcw size={15} />
                    {reopenMutation.isPending ? 'Réouverture...' : 'Réouvrir la commande'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="receipt" className="mt-4">
          <ReceiptPreview orderId={order.id} />
        </TabsContent>

        <TabsContent value="log" className="mt-4">
          <Card>
            <CardContent className="p-4">
              <OrderLog logs={order.logs ?? []} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Serveur info */}
      {order.user && (
        <p className="text-xs text-muted-foreground">
          Serveur : {order.user.first_name} {order.user.last_name}
        </p>
      )}

      <KitchenPrintModal 
        open={printModalOpen} 
        onOpenChange={setPrintModalOpen} 
        orderId={order.id}
        requiredDestinations={orderDestinations}
      />
    </div>
  )
}
