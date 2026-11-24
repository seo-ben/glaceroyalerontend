## 12. PAGE POS CAISSE

### `src/pages/pos/POSPage.jsx`

```jsx
import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { productsApi } from '@/api/products'
import { ordersApi } from '@/api/orders'
import { useCartStore } from '@/stores/cartStore'
import CategoryTabs from '@/components/pos/CategoryTabs'
import ProductGrid  from '@/components/pos/ProductGrid'
import CartPanel    from '@/components/pos/CartPanel'
import PaymentModal from '@/components/pos/PaymentModal'
import { Button }   from '@/components/ui/button'
import { Input }    from '@/components/ui/input'
import { Badge }    from '@/components/ui/badge'
import { Search, X } from 'lucide-react'
import { useToast }  from '@/components/ui/use-toast'

export default function POSPage() {
  const [searchParams]  = useSearchParams()
  const navigate        = useNavigate()
  const { toast }       = useToast()
  const tableId         = searchParams.get('table') ? Number(searchParams.get('table')) : null
  const existingOrderId = searchParams.get('order') ? Number(searchParams.get('order')) : null
  const autoPayMode     = searchParams.get('pay') === '1'

  const [selectedCategory, setSelectedCategory] = useState(null)
  const [search, setSearch]                     = useState('')
  const [showPayment, setShowPayment]           = useState(autoPayMode)

  const cart = useCartStore()

  // Initialiser le panier avec la table
  useEffect(() => {
    cart.setTable(tableId, existingOrderId)
  }, [tableId, existingOrderId])

  // Catégories
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn:  () => productsApi.categories().then(r => r.data),
  })

  // Produits
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products', selectedCategory, search],
    queryFn:  () => productsApi.list({
      category_id: selectedCategory,
      search:      search || undefined,
    }).then(r => r.data),
  })

  // Créer ou mettre à jour commande
  const orderMutation = useMutation({
    mutationFn: (data) => existingOrderId
      ? ordersApi.addItems(existingOrderId, { items: data.items })
      : ordersApi.create(data),
    onSuccess: ({ data }) => {
      const orderId = data.order?.id ?? data.id
      cart.setTable(tableId, orderId)
      toast({ title: 'Commande enregistrée' })
    },
    onError: (e) => toast({
      variant: 'destructive',
      description: e.response?.data?.message ?? 'Erreur',
    }),
  })

  // Envoyer en cuisine
  const kitchenMutation = useMutation({
    mutationFn: (orderId) => ordersApi.sendToKitchen(orderId, {}),
    onSuccess: () => {
      toast({ title: 'Envoyé en cuisine !' })
      cart.clear()
      navigate('/tables')
    },
  })

  const handleSendToKitchen = async () => {
    if (!cart.items.length) return

    let orderId = cart.orderId
    if (!orderId) {
      const res = await orderMutation.mutateAsync({
        table_id: tableId,
        type:     'dine_in',
        covers:   cart.covers,
        notes:    cart.notes,
        items:    cart.items.map(i => ({
          product_id:   i.productId,
          quantity:     i.qty,
          notes:        i.note,
          modifier_ids: i.modifiers.map(m => m.id),
        })),
      })
      orderId = res.data?.id
    }
    if (orderId) kitchenMutation.mutate(orderId)
  }

  return (
    <div className="flex h-full gap-0 overflow-hidden -m-4 md:-m-6">
      {/* Zone catalogue — 60% */}
      <div className="flex flex-col flex-1 min-w-0 bg-pos-bg">
        {/* Header POS */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-pos-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { cart.clear(); navigate('/tables') }}
            className="text-slate-400 hover:text-white"
          >
            <X size={16} />
          </Button>
          <span className="text-white font-semibold">
            {tableId ? `Table ${tableId}` : 'Nouvelle commande'}
          </span>
          {cart.items.length > 0 && (
            <Badge className="bg-primary text-white">{cart.items.length}</Badge>
          )}
          <div className="flex-1" />
          {/* Couverts */}
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <span>Couverts :</span>
            <div className="flex gap-1">
              {[1,2,3,4,5,6].map(n => (
                <button
                  key={n}
                  onClick={() => cart.setCovers(n)}
                  className={`w-7 h-7 rounded text-xs font-medium transition-all ${
                    cart.covers === n
                      ? 'bg-primary text-white'
                      : 'bg-pos-surface text-slate-400 hover:text-white'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Recherche */}
        <div className="px-4 py-2 border-b border-pos-border">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un produit..."
              className="pl-8 bg-pos-surface border-pos-border text-white placeholder:text-slate-500 h-9"
            />
          </div>
        </div>

        {/* Catégories */}
        <CategoryTabs
          categories={categories}
          active={selectedCategory}
          onChange={setSelectedCategory}
        />

        {/* Grille produits */}
        <div className="flex-1 overflow-y-auto p-4">
          <ProductGrid
            products={products}
            isLoading={isLoading}
            onAdd={(product) => cart.addItem(product)}
          />
        </div>
      </div>

      {/* Panier — 40% */}
      <div className="w-80 xl:w-96 shrink-0 border-l border-pos-border bg-pos-surface flex flex-col">
        <CartPanel
          onSendToKitchen={handleSendToKitchen}
          onPay={() => setShowPayment(true)}
          isLoading={orderMutation.isPending || kitchenMutation.isPending}
        />
      </div>

      {/* Modal paiement */}
      {showPayment && (
        <PaymentModal
          orderId={cart.orderId}
          total={cart.total()}
          onClose={() => setShowPayment(false)}
          onSuccess={() => {
            cart.clear()
            navigate('/tables')
          }}
        />
      )}
    </div>
  )
}
```

### `src/components/pos/ProductGrid.jsx`

```jsx
import { cn } from '@/lib/utils'
import { formatAmount } from '@/lib/formatters'
import { Plus } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

export default function ProductGrid({ products, isLoading, onAdd }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[...Array(9)].map((_, i) => (
          <Skeleton key={i} className="h-24 bg-pos-card rounded-xl" />
        ))}
      </div>
    )
  }

  if (!products.length) {
    return (
      <div className="flex items-center justify-center h-40 text-slate-500 text-sm">
        Aucun produit trouvé
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {products.map(product => (
        <button
          key={product.id}
          onClick={() => product.available && onAdd(product)}
          disabled={!product.available}
          className={cn(
            'relative group flex flex-col items-start p-3 rounded-xl border transition-all text-left',
            product.available
              ? 'bg-pos-card border-pos-border hover:border-primary/50 hover:bg-pos-card/80 active:scale-95'
              : 'bg-pos-card/40 border-pos-border opacity-50 cursor-not-allowed'
          )}
        >
          {/* Badge indispo */}
          {!product.available && (
            <span className="absolute top-2 right-2 text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded">
              Indispo
            </span>
          )}

          {/* Nom */}
          <span className="text-white text-sm font-medium leading-tight line-clamp-2">
            {product.name}
          </span>

          {/* Prix */}
          <span className="text-primary text-sm font-bold mt-auto pt-2">
            {formatAmount(product.price)}
          </span>

          {/* Bouton + au hover */}
          {product.available && (
            <div className="absolute bottom-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Plus size={13} className="text-white" />
            </div>
          )}
        </button>
      ))}
    </div>
  )
}
```

### `src/components/pos/CategoryTabs.jsx`

```jsx
import { cn } from '@/lib/utils'

export default function CategoryTabs({ categories, active, onChange }) {
  return (
    <div className="flex gap-2 px-4 py-2 overflow-x-auto scrollbar-none border-b border-pos-border">
      <button
        onClick={() => onChange(null)}
        className={cn(
          'shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all',
          !active
            ? 'bg-primary text-white'
            : 'bg-pos-card text-slate-400 hover:text-white'
        )}
      >
        Tout
      </button>
      {categories.map(cat => (
        <button
          key={cat.id}
          onClick={() => onChange(cat.id)}
          className={cn(
            'shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap',
            active === cat.id
              ? 'bg-primary text-white'
              : 'bg-pos-card text-slate-400 hover:text-white'
          )}
        >
          {cat.name}
        </button>
      ))}
    </div>
  )
}
```

### `src/components/pos/CartPanel.jsx`

```jsx
import { useCartStore } from '@/stores/cartStore'
import { formatAmount } from '@/lib/formatters'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ChefHat, CreditCard, Trash2 } from 'lucide-react'
import CartItem from './CartItem'

export default function CartPanel({ onSendToKitchen, onPay, isLoading }) {
  const cart = useCartStore()

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-pos-border">
        <span className="text-white font-medium text-sm">
          {cart.tableId ? `Table ${cart.tableId}` : 'Commande'}
        </span>
        {cart.items.length > 0 && (
          <button
            onClick={cart.clear}
            className="text-slate-500 hover:text-red-400 transition-colors"
          >
            <Trash2 size={15} />
          </button>
        )}
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto">
        {cart.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 text-sm gap-2">
            <span className="text-3xl opacity-30">🛒</span>
            Panier vide
          </div>
        ) : (
          <div className="divide-y divide-pos-border">
            {cart.items.map(item => (
              <CartItem
                key={item.key}
                item={item}
                onUpdateQty={(qty) => cart.updateQty(item.key, qty)}
                onRemove={() => cart.removeItem(item.key)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Totaux + Actions */}
      {cart.items.length > 0 && (
        <div className="border-t border-pos-border p-4 space-y-3">
          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-slate-400">
              <span>Sous-total</span>
              <span>{formatAmount(cart.subtotal())}</span>
            </div>
            {cart.discountAmount() > 0 && (
              <div className="flex justify-between text-green-400">
                <span>Remise</span>
                <span>-{formatAmount(cart.discountAmount())}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-400">
              <span>TVA (18%)</span>
              <span>{formatAmount(cart.vatAmount())}</span>
            </div>
            <Separator className="bg-pos-border" />
            <div className="flex justify-between text-white font-bold text-base">
              <span>Total</span>
              <span className="text-primary">{formatAmount(cart.total())}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              className="border-orange-500 text-orange-400 hover:bg-orange-500/10 gap-1.5"
              onClick={onSendToKitchen}
              disabled={isLoading}
            >
              <ChefHat size={15} />
              Cuisine
            </Button>
            <Button
              className="bg-primary hover:bg-primary-600 text-white gap-1.5"
              onClick={onPay}
            >
              <CreditCard size={15} />
              Encaisser
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
```

### `src/components/pos/CartItem.jsx`

```jsx
import { formatAmount } from '@/lib/formatters'
import { Minus, Plus, X } from 'lucide-react'

export default function CartItem({ item, onUpdateQty, onRemove }) {
  const modExtra = item.modifiers.reduce((s, m) => s + (m.extra_price || 0), 0)
  const unitTotal = (item.price + modExtra) * item.qty

  return (
    <div className="flex items-start gap-2 px-4 py-3">
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-medium truncate">{item.name}</p>
        {item.modifiers.map(m => (
          <span key={m.id} className="text-xs text-slate-500 block">
            + {m.name} {m.extra_price > 0 ? `(+${formatAmount(m.extra_price)})` : ''}
          </span>
        ))}
        {item.note && (
          <span className="text-xs text-slate-600 italic">{item.note}</span>
        )}
        <span className="text-primary text-sm font-semibold">
          {formatAmount(unitTotal)}
        </span>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => onUpdateQty(item.qty - 1)}
          className="w-6 h-6 rounded-md bg-pos-border flex items-center justify-center text-slate-400 hover:text-white hover:bg-pos-border/80 transition-all"
        >
          <Minus size={11} />
        </button>
        <span className="w-6 text-center text-white text-sm font-medium">
          {item.qty}
        </span>
        <button
          onClick={() => onUpdateQty(item.qty + 1)}
          className="w-6 h-6 rounded-md bg-pos-border flex items-center justify-center text-slate-400 hover:text-white hover:bg-pos-border/80 transition-all"
        >
          <Plus size={11} />
        </button>
      </div>
    </div>
  )
}
```

---

## 13. MODAL PAIEMENT

### `src/components/pos/PaymentModal.jsx`

```jsx
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { paymentsApi } from '@/api/payments'
import { useCartStore } from '@/stores/cartStore'
import { formatAmount } from '@/lib/formatters'
import { PAYMENT_METHODS } from '@/lib/constants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, X, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function PaymentModal({ orderId, total, onClose, onSuccess }) {
  const { toast }   = useToast()
  const queryClient = useQueryClient()
  const cart        = useCartStore()

  const [method, setMethod]       = useState('cash')
  const [amountGiven, setAmountGiven] = useState('')
  const [reference, setReference] = useState('')
  const [splits, setSplits]       = useState([]) // paiements multiples
  const [splitMode, setSplitMode] = useState(false)

  const change = method === 'cash' && amountGiven
    ? Math.max(0, Number(amountGiven) - total)
    : 0

  const payMutation = useMutation({
    mutationFn: (data) => paymentsApi.pay(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['floor-tables'] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      toast({ title: 'Paiement enregistré !' })
      onSuccess()
    },
    onError: (e) => toast({
      variant: 'destructive',
      description: e.response?.data?.message ?? 'Erreur paiement',
    }),
  })

  const handlePay = () => {
    if (!orderId) { toast({ variant: 'destructive', description: 'Commande non enregistrée.' }); return }
    payMutation.mutate({
      order_id:     orderId,
      amount:       total,
      method,
      reference:    reference || undefined,
      amount_given: method === 'cash' && amountGiven ? Number(amountGiven) : undefined,
    })
  }

  // Clavier numérique pour espèces
  const handleNumpad = (key) => {
    if (key === '⌫') setAmountGiven(p => p.slice(0, -1))
    else if (key === 'C') setAmountGiven('')
    else setAmountGiven(p => p + key)
  }

  const QUICK_AMOUNTS = [total, Math.ceil(total / 1000) * 1000, Math.ceil(total / 5000) * 5000]
    .filter((v, i, a) => a.indexOf(v) === i)
    .slice(0, 3)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-pos-surface rounded-2xl w-full max-w-md mx-4 overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-pos-border">
          <div>
            <h2 className="text-white font-semibold">Encaissement</h2>
            <p className="text-slate-400 text-sm">Commande #{orderId}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Total */}
          <div className="text-center">
            <p className="text-slate-400 text-sm">Montant à payer</p>
            <p className="text-4xl font-bold text-primary mt-1">{formatAmount(total)}</p>
          </div>

          {/* Méthodes de paiement */}
          <div>
            <Label className="text-slate-300 text-xs mb-2 block">Mode de paiement</Label>
            <div className="grid grid-cols-3 gap-2">
              {PAYMENT_METHODS.map(m => (
                <button
                  key={m.value}
                  onClick={() => setMethod(m.value)}
                  className={cn(
                    'flex flex-col items-center gap-1 p-3 rounded-xl border transition-all',
                    method === m.value
                      ? 'border-primary bg-primary/20 text-primary'
                      : 'border-pos-border bg-pos-card text-slate-400 hover:text-white hover:border-slate-500'
                  )}
                >
                  <span className="text-lg">{m.icon}</span>
                  <span className="text-xs font-medium">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Référence pour Mobile Money */}
          {['wave', 'orange_money', 'momo'].includes(method) && (
            <div>
              <Label className="text-slate-300 text-xs mb-1.5 block">Référence transaction</Label>
              <Input
                value={reference}
                onChange={e => setReference(e.target.value)}
                placeholder="Ex: WV-12345678"
                className="bg-pos-card border-pos-border text-white placeholder:text-slate-500"
              />
            </div>
          )}

          {/* Espèces : montant reçu + monnaie */}
          {method === 'cash' && (
            <div className="space-y-3">
              {/* Montants rapides */}
              <div className="flex gap-2">
                {QUICK_AMOUNTS.map(a => (
                  <button
                    key={a}
                    onClick={() => setAmountGiven(String(a))}
                    className={cn(
                      'flex-1 py-2 rounded-lg text-xs font-medium border transition-all',
                      amountGiven === String(a)
                        ? 'border-primary bg-primary/20 text-primary'
                        : 'border-pos-border bg-pos-card text-slate-400 hover:text-white'
                    )}
                  >
                    {formatAmount(a)}
                  </button>
                ))}
              </div>

              {/* Montant reçu */}
              <div className="bg-pos-card border border-pos-border rounded-xl p-3 text-right">
                <p className="text-slate-400 text-xs mb-1">Reçu</p>
                <p className="text-white text-2xl font-bold">
                  {amountGiven ? formatAmount(Number(amountGiven)) : '—'}
                </p>
              </div>

              {/* Monnaie à rendre */}
              {change > 0 && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 text-right">
                  <p className="text-green-400 text-xs mb-1">Monnaie à rendre</p>
                  <p className="text-green-400 text-2xl font-bold">{formatAmount(change)}</p>
                </div>
              )}

              {/* Clavier */}
              <div className="grid grid-cols-3 gap-2">
                {['7','8','9','4','5','6','1','2','3','C','0','⌫'].map(key => (
                  <button
                    key={key}
                    onClick={() => handleNumpad(key)}
                    className={cn(
                      'h-11 rounded-xl font-semibold text-base transition-all active:scale-95',
                      key === 'C' || key === '⌫'
                        ? 'bg-pos-border text-slate-300 hover:text-white'
                        : 'bg-pos-card border border-pos-border text-white hover:border-primary/50'
                    )}
                  >
                    {key}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Bouton valider */}
          <Button
            className="w-full h-12 bg-primary hover:bg-primary-600 text-white font-semibold text-base gap-2"
            onClick={handlePay}
            disabled={payMutation.isPending}
          >
            {payMutation.isPending
              ? <><Loader2 size={18} className="animate-spin" />Traitement...</>
              : <><Check size={18} />Valider le paiement</>
            }
          </Button>
        </div>
      </div>
    </div>
  )
}
```

---

## 14. PAGE COMMANDE TABLE (Détail)

### `src/pages/orders/OrderDetailPage.jsx`

```jsx
import { useState } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ordersApi } from '@/api/orders'
import { receiptsApi } from '@/api/receipts'
import PageHeader from '@/components/shared/PageHeader'
import OrderItemRow from '@/components/orders/OrderItemRow'
import OrderLog from '@/components/orders/OrderLog'
import PaymentModal from '@/components/pos/PaymentModal'
import ReceiptPreview from '@/components/receipts/ReceiptPreview'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  ChefHat, CreditCard, Scissors, ArrowRight,
  Tag, Printer, RotateCcw, Clock,
} from 'lucide-react'
import { formatAmount, formatDateTime, orderStatusColor, orderStatusLabel } from '@/lib/formatters'
import { useToast } from '@/components/ui/use-toast'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'

export default function OrderDetailPage() {
  const { id }          = useParams()
  const [searchParams]  = useSearchParams()
  const navigate        = useNavigate()
  const { toast }       = useToast()
  const { isManager }   = useAuthStore()
  const queryClient     = useQueryClient()

  const [showPayment,  setShowPayment]  = useState(searchParams.get('pay') === '1')
  const [showReceipt,  setShowReceipt]  = useState(false)
  const [editingItems, setEditingItems] = useState({})

  const { data, isLoading } = useQuery({
    queryKey: ['order', Number(id)],
    queryFn:  () => ordersApi.show(id).then(r => r.data),
  })

  const { data: receiptData } = useQuery({
    queryKey: ['receipt', Number(id)],
    queryFn:  () => receiptsApi.show(id).then(r => r.data),
    enabled:  showReceipt,
  })

  const order = data

  const kitchenMutation = useMutation({
    mutationFn: () => ordersApi.sendToKitchen(id, {}),
    onSuccess:  () => {
      toast({ title: 'Envoyé en cuisine !' })
      queryClient.invalidateQueries({ queryKey: ['order', Number(id)] })
    },
  })

  const updateItemsMutation = useMutation({
    mutationFn: (items) => ordersApi.updateItems(id, { items }),
    onSuccess:  () => {
      queryClient.invalidateQueries({ queryKey: ['order', Number(id)] })
      setEditingItems({})
      toast({ title: 'Commande mise à jour' })
    },
  })

  const handleQtyChange = (itemId, qty) => {
    setEditingItems(prev => ({ ...prev, [itemId]: qty }))
  }

  const handleSaveChanges = () => {
    const items = Object.entries(editingItems).map(([id, quantity]) => ({
      id: Number(id), quantity,
    }))
    updateItemsMutation.mutate(items)
  }

  const hasChanges = Object.keys(editingItems).length > 0

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
    </div>
  }

  if (!order) return null

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <PageHeader
        title={`Commande ${order.order_number}`}
        subtitle={`${formatDateTime(order.created_at)} · ${order.table ? 'Table ' + order.table.number : 'À emporter'}`}
        onBack={() => navigate('/tables')}
      >
        <Badge className={cn('text-xs', orderStatusColor(order.status))}>
          {orderStatusLabel(order.status)}
        </Badge>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Articles */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Articles commandés</CardTitle>
                {hasChanges && (
                  <Button
                    size="sm"
                    onClick={handleSaveChanges}
                    disabled={updateItemsMutation.isPending}
                  >
                    Sauvegarder
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {order.items?.map(item => (
                <OrderItemRow
                  key={item.id}
                  item={item}
                  editQty={editingItems[item.id] ?? item.quantity}
                  onQtyChange={(qty) => handleQtyChange(item.id, qty)}
                  canEdit={!['paid','cancelled'].includes(order.status)}
                  isManager={isManager()}
                />
              ))}
            </CardContent>
          </Card>

          {/* Totaux */}
          <Card>
            <CardContent className="py-4 space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Sous-total</span>
                <span>{formatAmount(order.subtotal)}</span>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Remise ({order.discount_reason})</span>
                  <span>-{formatAmount(order.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between text-muted-foreground">
                <span>TVA (18%)</span>
                <span>{formatAmount(order.vat_amount)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-base">
                <span>Total</span>
                <span className="text-primary">{formatAmount(order.total)}</span>
              </div>
              {order.status === 'paid' && (
                <div className="flex justify-between text-green-600 text-xs">
                  <span>Montant payé</span>
                  <span>{formatAmount(order.payments?.reduce((s,p) => s + p.amount, 0) ?? 0)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Journal */}
          <OrderLog logs={order.logs ?? []} />
        </div>

        {/* Actions */}
        <div className="space-y-4">
          {/* Info commande */}
          <Card>
            <CardContent className="py-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Serveur</span>
                <span className="font-medium">{order.waiter?.first_name} {order.waiter?.last_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Couverts</span>
                <span className="font-medium">{order.covers}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type</span>
                <span className="font-medium capitalize">{order.type}</span>
              </div>
              {order.sent_to_kitchen_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Clock size={12} /> En cuisine
                  </span>
                  <span className="font-medium text-xs">{formatDateTime(order.sent_to_kitchen_at)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Boutons action */}
          {!['paid', 'cancelled'].includes(order.status) && (
            <Card>
              <CardContent className="py-4 space-y-2">
                <Button
                  className="w-full gap-2 bg-orange-500 hover:bg-orange-600 text-white"
                  onClick={() => kitchenMutation.mutate()}
                  disabled={kitchenMutation.isPending}
                >
                  <ChefHat size={15} /> Envoyer en cuisine
                </Button>
                <Button
                  className="w-full gap-2 bg-primary hover:bg-primary-600 text-white"
                  onClick={() => setShowPayment(true)}
                >
                  <CreditCard size={15} /> Encaisser
                </Button>
                {isManager() && (
                  <Button variant="outline" className="w-full gap-2">
                    <Tag size={15} /> Appliquer remise
                  </Button>
                )}
                <Button variant="outline" className="w-full gap-2">
                  <ArrowRight size={15} /> Transférer table
                </Button>
                <Button variant="outline" className="w-full gap-2">
                  <Scissors size={15} /> Diviser facture
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Reçu (si payé) */}
          {order.status === 'paid' && (
            <Card>
              <CardContent className="py-4 space-y-2">
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => setShowReceipt(true)}
                >
                  <Printer size={15} /> Imprimer le reçu
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Annulation */}
          {isManager() && !['paid', 'cancelled'].includes(order.status) && (
            <Button
              variant="outline"
              className="w-full gap-2 text-red-500 border-red-500/50 hover:bg-red-50"
              onClick={() => navigate(`/cancellations?order=${order.id}`)}
            >
              <RotateCcw size={15} /> Annuler la commande
            </Button>
          )}
        </div>
      </div>

      {/* Modals */}
      {showPayment && (
        <PaymentModal
          orderId={order.id}
          total={order.total - (order.payments?.reduce((s,p) => s + p.amount, 0) ?? 0)}
          onClose={() => setShowPayment(false)}
          onSuccess={() => {
            setShowPayment(false)
            queryClient.invalidateQueries({ queryKey: ['order', Number(id)] })
          }}
        />
      )}

      {showReceipt && receiptData && (
        <ReceiptPreview
          receipt={receiptData}
          onClose={() => setShowReceipt(false)}
        />
      )}
    </div>
  )
}
```

### `src/components/orders/OrderItemRow.jsx`

```jsx
import { cn } from '@/lib/utils'
import { formatAmount } from '@/lib/formatters'
import { itemStatusColor } from '@/lib/formatters'
import { Badge } from '@/components/ui/badge'
import { Minus, Plus } from 'lucide-react'

const STATUS_LABELS = {
  pending:   'En attente',
  preparing: 'En cuisine',
  done:      'Prêt',
  served:    'Servi',
  cancelled: 'Annulé',
}

export default function OrderItemRow({ item, editQty, onQtyChange, canEdit, isManager }) {
  const lineTotal = item.unit_price * editQty

  return (
    <div className={cn(
      'flex items-center gap-3 px-4 py-3 border-b last:border-0',
      item.status === 'cancelled' && 'opacity-50'
    )}>
      {/* Info produit */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{item.product?.name}</p>
        {item.notes && (
          <p className="text-xs text-muted-foreground italic">{item.notes}</p>
        )}
        {item.modifiers?.map(m => (
          <p key={m.id} className="text-xs text-muted-foreground">
            + {m.modifier?.name}
          </p>
        ))}
      </div>

      {/* Quantité éditable */}
      {canEdit && item.status !== 'cancelled' ? (
        <div className="flex items-center gap-1">
          <button
            onClick={() => onQtyChange(Math.max(0, editQty - 1))}
            className="w-6 h-6 rounded border border-border flex items-center justify-center hover:bg-muted transition-colors"
            disabled={item.status === 'done' && !isManager}
          >
            <Minus size={11} />
          </button>
          <span className="w-8 text-center text-sm font-medium">{editQty}</span>
          <button
            onClick={() => onQtyChange(editQty + 1)}
            className="w-6 h-6 rounded border border-border flex items-center justify-center hover:bg-muted transition-colors"
          >
            <Plus size={11} />
          </button>
        </div>
      ) : (
        <span className="text-sm font-medium w-8 text-center">×{editQty}</span>
      )}

      {/* Total ligne */}
      <span className="text-sm font-medium w-24 text-right">
        {formatAmount(lineTotal)}
      </span>

      {/* Statut */}
      <Badge className={cn('text-[10px] w-20 justify-center', itemStatusColor(item.status))}>
        {STATUS_LABELS[item.status] ?? item.status}
      </Badge>
    </div>
  )
}
```

### `src/components/orders/OrderLog.jsx`

```jsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDateTime } from '@/lib/formatters'
import { Clock } from 'lucide-react'

export default function OrderLog({ logs }) {
  if (!logs.length) return null

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
          <Clock size={12} /> Journal de la commande
        </CardTitle>
      </CardHeader>
      <CardContent className="py-2 space-y-1">
        {logs.slice(0, 10).map(log => (
          <div key={log.id} className="flex gap-3 text-xs py-1.5 border-b last:border-0">
            <span className="text-muted-foreground shrink-0 w-28">
              {formatDateTime(log.created_at)}
            </span>
            <span className="text-foreground">{log.message}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
```

---

## 15. PAGE KDS CUISINE

### `src/pages/kitchen/KitchenPage.jsx`

```jsx
import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ordersApi } from '@/api/orders'
import { cn } from '@/lib/utils'
import { itemStatusColor } from '@/lib/formatters'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Check, ChefHat } from 'lucide-react'
import KDSTimer from '@/components/kitchen/KDSTimer'
import apiClient from '@/api/client'

export default function KitchenPage() {
  const queryClient = useQueryClient()
  const audioRef    = useRef(null)
  const prevCountRef = useRef(0)

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['kitchen-orders'],
    queryFn:  () => apiClient.get('/kitchen/orders').then(r => r.data),
    refetchInterval: 8000,
  })

  // Son quand nouvelle commande arrive
  useEffect(() => {
    if (orders.length > prevCountRef.current && prevCountRef.current > 0) {
      audioRef.current?.play().catch(() => {})
    }
    prevCountRef.current = orders.length
  }, [orders.length])

  const validateItemMutation = useMutation({
    mutationFn: ({ itemId, status }) =>
      apiClient.put(`/kitchen/items/${itemId}/status`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['kitchen-orders'] }),
  })

  const validateAllMutation = useMutation({
    mutationFn: (orderId) => apiClient.put(`/kitchen/orders/${orderId}/validate-all`),
    onSuccess:  () => queryClient.invalidateQueries({ queryKey: ['kitchen-orders'] }),
  })

  const pendingCount   = orders.filter(o => o.items.some(i => i.status === 'pending')).length
  const preparingCount = orders.filter(o => o.items.some(i => i.status === 'preparing')).length

  return (
    <div className="flex flex-col h-full bg-black text-white overflow-hidden">
      {/* Audio notification */}
      <audio ref={audioRef} src="/sounds/new-order.mp3" preload="auto" />

      {/* Stats bar */}
      <div className="flex items-center gap-6 px-6 py-3 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse" />
          <span className="text-sm text-gray-400">En attente</span>
          <span className="text-white font-bold">{pendingCount}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
          <span className="text-sm text-gray-400">En préparation</span>
          <span className="text-white font-bold">{preparingCount}</span>
        </div>
        <div className="flex items-center gap-2 ml-auto text-gray-500 text-sm">
          <ChefHat size={14} />
          Omega KDS — Cuisine
        </div>
      </div>

      {/* Grille tickets */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin w-10 h-10 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : orders.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-600 gap-3">
          <ChefHat size={48} />
          <p className="text-xl">Aucune commande en attente</p>
        </div>
      ) : (
        <div className="flex-1 overflow-auto p-4">
          <div className="grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {orders.map(order => (
              <KDSTicket
                key={order.id}
                order={order}
                onValidateItem={(itemId, status) =>
                  validateItemMutation.mutate({ itemId, status })
                }
                onValidateAll={() => validateAllMutation.mutate(order.id)}
                isValidating={validateAllMutation.isPending}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function KDSTicket({ order, onValidateItem, onValidateAll, isValidating }) {
  const urgency = order.minutes_since_sent > 15 ? 'urgent'
    : order.minutes_since_sent > 10 ? 'warning' : 'normal'

  const borderColor = {
    urgent:  'border-red-600',
    warning: 'border-orange-500',
    normal:  'border-gray-700',
  }[urgency]

  const headerColor = {
    urgent:  'bg-red-900/50',
    warning: 'bg-orange-900/40',
    normal:  'bg-gray-800',
  }[urgency]

  const pendingItems = order.items.filter(i => ['pending','preparing'].includes(i.status))
  const allDone      = pendingItems.length === 0

  return (
    <div className={cn('rounded-xl border-2 overflow-hidden flex flex-col', borderColor)}>
      {/* Header ticket */}
      <div className={cn('flex items-center justify-between px-4 py-3', headerColor)}>
        <div>
          <span className="font-bold text-lg">{order.order_number}</span>
          <span className="text-gray-400 text-sm ml-2">
            {order.table ? `Table ${order.table.number}` : 'Livraison'}
          </span>
        </div>
        <KDSTimer minutes={order.minutes_since_sent} urgency={urgency} />
      </div>

      {/* Items */}
      <div className="flex-1 p-3 bg-gray-900 space-y-2">
        {order.items.map(item => (
          <div
            key={item.id}
            className={cn(
              'flex items-start gap-2 p-2 rounded-lg cursor-pointer transition-all',
              item.status === 'done'
                ? 'bg-green-900/30 opacity-60'
                : 'bg-gray-800 hover:bg-gray-700'
            )}
            onClick={() => {
              if (item.status === 'pending')   onValidateItem(item.id, 'preparing')
              if (item.status === 'preparing') onValidateItem(item.id, 'done')
            }}
          >
            {/* Checkbox status */}
            <div className={cn(
              'w-5 h-5 rounded mt-0.5 border-2 flex items-center justify-center shrink-0 transition-all',
              item.status === 'done'     ? 'bg-green-500 border-green-500' :
              item.status === 'preparing'? 'border-blue-400 bg-blue-400/20' :
              'border-gray-600'
            )}>
              {item.status === 'done' && <Check size={12} />}
              {item.status === 'preparing' && (
                <div className="w-2 h-2 rounded-full bg-blue-400" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className={cn(
                'font-bold text-base leading-tight',
                item.status === 'done' && 'line-through text-gray-500'
              )}>
                ×{item.quantity} {item.product?.name}
              </p>
              {item.notes && (
                <p className="text-orange-300 text-sm mt-0.5">{item.notes}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-3 py-2 bg-gray-900 border-t border-gray-800">
        <Button
          className={cn(
            'w-full text-sm font-semibold',
            allDone
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-primary hover:bg-primary-600 text-white'
          )}
          onClick={onValidateAll}
          disabled={isValidating || allDone}
        >
          {allDone ? (
            <><Check size={14} className="mr-1.5" /> Prêt à servir</>
          ) : (
            'Valider tout'
          )}
        </Button>
      </div>
    </div>
  )
}
```

### `src/components/kitchen/KDSTimer.jsx`

```jsx
import { cn } from '@/lib/utils'
import { Clock } from 'lucide-react'

export default function KDSTimer({ minutes, urgency }) {
  return (
    <div className={cn(
      'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-mono font-bold',
      urgency === 'urgent'  && 'bg-red-600 text-white animate-pulse-soft',
      urgency === 'warning' && 'bg-orange-500 text-white',
      urgency === 'normal'  && 'bg-gray-700 text-gray-300',
    )}>
      <Clock size={13} />
      {minutes}min
    </div>
  )
}
```

---

## 16. PAGE PRISE DE COMMANDE MOBILE (Serveur)

### `src/pages/mobile/MobileOrderPage.jsx`

```jsx
import { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { productsApi } from '@/api/products'
import { ordersApi } from '@/api/orders'
import { useCartStore } from '@/stores/cartStore'
import { cn } from '@/lib/utils'
import { formatAmount } from '@/lib/formatters'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { ArrowLeft, Search, ShoppingCart, Plus, Minus, ChefHat } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

export default function MobileOrderPage() {
  const [searchParams]  = useSearchParams()
  const navigate        = useNavigate()
  const { toast }       = useToast()
  const tableId         = searchParams.get('table') ? Number(searchParams.get('table')) : null

  const cart = useCartStore()

  const [selectedCat, setSelectedCat] = useState(null)
  const [search, setSearch]           = useState('')
  const [cartOpen, setCartOpen]       = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [productNote, setProductNote] = useState('')

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn:  () => productsApi.categories().then(r => r.data),
  })

  const { data: products = [] } = useQuery({
    queryKey: ['products', selectedCat, search],
    queryFn:  () => productsApi.list({ category_id: selectedCat, search: search || undefined }).then(r => r.data),
  })

  const orderMutation = useMutation({
    mutationFn: (data) => ordersApi.create(data),
    onSuccess:  ({ data }) => {
      // Envoyer directement en cuisine
      ordersApi.sendToKitchen(data.id, {}).then(() => {
        toast({ title: 'Commande envoyée en cuisine !' })
        cart.clear()
        navigate('/tables')
      })
    },
  })

  const handleAddToCart = (product, modifiers = []) => {
    cart.addItem(product, 1, modifiers, productNote)
    setSelectedProduct(null)
    setProductNote('')
  }

  const handleSend = () => {
    if (!cart.items.length) return
    orderMutation.mutate({
      table_id: tableId,
      type:     'dine_in',
      covers:   cart.covers,
      items:    cart.items.map(i => ({
        product_id:   i.productId,
        quantity:     i.qty,
        notes:        i.note,
        modifier_ids: i.modifiers.map(m => m.id),
      })),
    })
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header mobile */}
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-background sticky top-0 z-20">
        <button onClick={() => navigate('/tables')} className="text-muted-foreground">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="font-semibold text-sm">Nouvelle commande</h1>
          {tableId && <p className="text-xs text-muted-foreground">Table {tableId}</p>}
        </div>
        <button
          className="relative"
          onClick={() => setCartOpen(true)}
        >
          <ShoppingCart size={22} />
          {cart.items.length > 0 && (
            <Badge className="absolute -top-2 -right-2 h-4 w-4 p-0 flex items-center justify-center text-[10px] bg-primary">
              {cart.items.reduce((s, i) => s + i.qty, 0)}
            </Badge>
          )}
        </button>
      </div>

      {/* Recherche */}
      <div className="px-4 py-2 border-b">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher..."
            className="pl-9 h-9"
          />
        </div>
      </div>

      {/* Catégories */}
      <div className="flex gap-2 px-4 py-2 overflow-x-auto scrollbar-none border-b">
        <button
          onClick={() => setSelectedCat(null)}
          className={cn(
            'shrink-0 px-3 py-1 rounded-full text-xs font-medium border',
            !selectedCat ? 'bg-primary text-white border-primary' : 'border-border text-muted-foreground'
          )}
        >
          Tout
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCat(cat.id)}
            className={cn(
              'shrink-0 px-3 py-1 rounded-full text-xs font-medium border whitespace-nowrap',
              selectedCat === cat.id ? 'bg-primary text-white border-primary' : 'border-border text-muted-foreground'
            )}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Liste produits (1 colonne pour mobile) */}
      <div className="flex-1 overflow-y-auto">
        {products.map(product => {
          const inCart = cart.items.find(i => i.productId === product.id)
          return (
            <div
              key={product.id}
              className={cn(
                'flex items-center gap-3 px-4 py-3 border-b active:bg-muted/50',
                !product.available && 'opacity-50'
              )}
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{product.name}</p>
                {product.description && (
                  <p className="text-xs text-muted-foreground truncate">{product.description}</p>
                )}
                <p className="text-primary font-semibold text-sm">{formatAmount(product.price)}</p>
              </div>

              {/* Stepper ou bouton ajouter */}
              {inCart ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => cart.updateQty(inCart.key, inCart.qty - 1)}
                    className="w-8 h-8 rounded-full border border-border flex items-center justify-center"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="font-bold w-5 text-center">{inCart.qty}</span>
                  <button
                    onClick={() => cart.updateQty(inCart.key, inCart.qty + 1)}
                    className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              ) : (
                <button
                  disabled={!product.available}
                  onClick={() => {
                    if (product.modifier_groups?.length) {
                      setSelectedProduct(product)
                    } else {
                      cart.addItem(product)
                    }
                  }}
                  className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center disabled:opacity-30"
                >
                  <Plus size={14} />
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Bouton flottant envoyer cuisine */}
      {cart.items.length > 0 && (
        <div className="sticky bottom-0 p-4 bg-background border-t">
          <Button
            className="w-full h-12 bg-primary text-white gap-2 text-base font-semibold"
            onClick={handleSend}
            disabled={orderMutation.isPending}
          >
            <ChefHat size={18} />
            Envoyer en cuisine · {formatAmount(cart.total())}
          </Button>
        </div>
      )}

      {/* Sheet panier */}
      <Sheet open={cartOpen} onOpenChange={setCartOpen}>
        <SheetContent side="right" className="w-80">
          <SheetHeader>
            <SheetTitle>Panier</SheetTitle>
          </SheetHeader>
          <div className="mt-4 flex flex-col h-full">
            <div className="flex-1 overflow-y-auto space-y-2">
              {cart.items.map(item => (
                <div key={item.key} className="flex items-center gap-2 py-2 border-b">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{formatAmount(item.price * item.qty)}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => cart.updateQty(item.key, item.qty - 1)}
                      className="w-6 h-6 rounded border flex items-center justify-center"
                    >
                      <Minus size={11} />
                    </button>
                    <span className="w-5 text-center text-sm">{item.qty}</span>
                    <button
                      onClick={() => cart.updateQty(item.key, item.qty + 1)}
                      className="w-6 h-6 rounded border flex items-center justify-center"
                    >
                      <Plus size={11} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-4 border-t">
              <div className="flex justify-between font-bold mb-3">
                <span>Total</span>
                <span className="text-primary">{formatAmount(cart.total())}</span>
              </div>
              <Button
                className="w-full bg-primary text-white"
                onClick={() => { setCartOpen(false); handleSend() }}
              >
                <ChefHat size={15} className="mr-2" />
                Envoyer en cuisine
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
```

---

## 17. PAGE STOCK & INVENTAIRE

### `src/pages/stock/StockPage.jsx`

```jsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { stockApi } from '@/api/stock'
import PageHeader from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { formatAmount } from '@/lib/formatters'
import { Package, AlertTriangle, Plus, ArrowUp, ArrowDown, Search } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { useForm, Controller } from 'react-hook-form'

export default function StockPage() {
  const queryClient = useQueryClient()
  const { toast }   = useToast()
  const [search, setSearch]   = useState('')
  const [alertOnly, setAlertOnly] = useState(false)
  const [movementFor, setMovementFor] = useState(null) // ingredient sélectionné

  const { data: ingredients = [], isLoading } = useQuery({
    queryKey: ['ingredients', search, alertOnly],
    queryFn:  () => stockApi.ingredients({ search: search || undefined, alert: alertOnly || undefined }).then(r => r.data.data),
  })

  const { data: alerts } = useQuery({
    queryKey: ['stock-alerts'],
    queryFn:  () => stockApi.alerts().then(r => r.data),
    refetchInterval: 60000,
  })

  const { data: totalValue } = useQuery({
    queryKey: ['stock-value'],
    queryFn:  () => stockApi.value().then(r => r.data),
  })

  const movementMutation = useMutation({
    mutationFn: (data) => stockApi.movement(data),
    onSuccess:  () => {
      queryClient.invalidateQueries({ queryKey: ['ingredients'] })
      queryClient.invalidateQueries({ queryKey: ['stock-alerts'] })
      queryClient.invalidateQueries({ queryKey: ['stock-value'] })
      setMovementFor(null)
      toast({ title: 'Mouvement de stock enregistré' })
    },
    onError: (e) => toast({ variant: 'destructive', description: e.response?.data?.message }),
  })

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Gestion du stock" subtitle="Inventaire et mouvements">
        <Button size="sm" onClick={() => setMovementFor({ id: null })}>
          <Plus size={15} className="mr-1.5" />
          Entrée de stock
        </Button>
      </PageHeader>

      {/* KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="py-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <Package size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total produits</p>
              <p className="text-2xl font-bold">{ingredients.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
              <AlertTriangle size={20} className="text-red-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">En alerte</p>
              <p className="text-2xl font-bold text-red-600">{alerts?.length ?? 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
              <span className="text-green-600 font-bold text-sm">CFA</span>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Valeur stock</p>
              <p className="text-2xl font-bold">{formatAmount(totalValue?.total_value ?? 0)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un ingrédient..."
            className="pl-9"
          />
        </div>
        <Button
          variant={alertOnly ? 'default' : 'outline'}
          size="sm"
          onClick={() => setAlertOnly(!alertOnly)}
          className={alertOnly ? 'bg-red-500 hover:bg-red-600 text-white' : ''}
        >
          <AlertTriangle size={14} className="mr-1.5" />
          Alertes seulement
        </Button>
      </div>

      {/* Table stock */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Produit</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Catégorie</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Stock actuel</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Minimum</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Statut</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {ingredients.map(ingredient => {
                const level = ingredient.quantity <= 0 ? 'rupture'
                  : ingredient.quantity <= ingredient.min_quantity ? 'faible' : 'ok'
                return (
                  <tr key={ingredient.id} className="border-b hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-medium">{ingredient.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{ingredient.category ?? '—'}</td>
                    <td className="px-4 py-3 text-right font-mono">
                      {ingredient.quantity} {ingredient.unit}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground font-mono">
                      {ingredient.min_quantity} {ingredient.unit}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge className={
                        level === 'rupture' ? 'bg-red-100 text-red-700' :
                        level === 'faible'  ? 'bg-orange-100 text-orange-700' :
                        'bg-green-100 text-green-700'
                      }>
                        {level === 'rupture' ? 'Rupture' : level === 'faible' ? 'Faible' : 'OK'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={() => setMovementFor({ ...ingredient, defaultType: 'in' })}
                        >
                          <ArrowUp size={13} className="mr-1" /> Entrée
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => setMovementFor({ ...ingredient, defaultType: 'out' })}
                        >
                          <ArrowDown size={13} className="mr-1" /> Sortie
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {!isLoading && ingredients.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                    Aucun ingrédient trouvé
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Dialog mouvement */}
      {movementFor && (
        <MovementDialog
          ingredient={movementFor}
          onClose={() => setMovementFor(null)}
          onSubmit={(data) => movementMutation.mutate(data)}
          isLoading={movementMutation.isPending}
        />
      )}
    </div>
  )
}

function MovementDialog({ ingredient, onClose, onSubmit, isLoading }) {
  const { register, handleSubmit, control, watch } = useForm({
    defaultValues: {
      ingredient_id: ingredient.id,
      type:          ingredient.defaultType ?? 'in',
      quantity:      '',
      reason:        '',
      reference:     '',
    },
  })

  const type = watch('type')

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {ingredient.name
              ? `Mouvement — ${ingredient.name}`
              : 'Entrée de stock'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div>
            <Label>Type de mouvement</Label>
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in">Entrée (livraison)</SelectItem>
                    <SelectItem value="out">Sortie manuelle</SelectItem>
                    <SelectItem value="adjustment">Ajustement inventaire</SelectItem>
                    <SelectItem value="waste">Perte / Déchet</SelectItem>
                    <SelectItem value="return">Retour fournisseur</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div>
            <Label>Quantité ({ingredient.unit})</Label>
            <Input
              {...register('quantity', { required: true, min: 0.001 })}
              type="number"
              step="0.001"
              placeholder="0"
              className="mt-1"
            />
          </div>
          <div>
            <Label>Raison / Note</Label>
            <Input {...register('reason')} placeholder="Livraison hebdomadaire..." className="mt-1" />
          </div>
          {type === 'in' && (
            <div>
              <Label>Référence bon de livraison</Label>
              <Input {...register('reference')} placeholder="BL-2024-001" className="mt-1" />
            </div>
          )}
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" className="flex-1 bg-primary text-white" disabled={isLoading}>
              Enregistrer
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

---

## 18. PAGE RAPPORTS

### `src/pages/reports/ReportsPage.jsx`

```jsx
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { reportsApi } from '@/api/reports'
import { receiptsApi } from '@/api/receipts'
import PageHeader from '@/components/shared/PageHeader'
import StatCard from '@/components/shared/StatCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { formatAmount, formatDate, paymentMethodLabel } from '@/lib/formatters'
import { format, subDays, subMonths, startOfMonth, endOfMonth } from 'date-fns'
import { Download, TrendingUp, ShoppingBag, Users, CreditCard } from 'lucide-react'

const PERIODS = [
  { label: "Aujourd'hui", from: format(new Date(), 'yyyy-MM-dd'), to: format(new Date(), 'yyyy-MM-dd') },
  { label: '7 jours',  from: format(subDays(new Date(), 6), 'yyyy-MM-dd'), to: format(new Date(), 'yyyy-MM-dd') },
  { label: '30 jours', from: format(subDays(new Date(), 29), 'yyyy-MM-dd'), to: format(new Date(), 'yyyy-MM-dd') },
  { label: 'Ce mois',  from: format(startOfMonth(new Date()), 'yyyy-MM-dd'), to: format(endOfMonth(new Date()), 'yyyy-MM-dd') },
]

const PIE_COLORS = ['#F97316','#3B82F6','#10B981','#8B5CF6','#EC4899']

export default function ReportsPage() {
  const [period, setPeriod] = useState(PERIODS[1])

  const { data: sales } = useQuery({
    queryKey: ['sales', period.from, period.to],
    queryFn:  () => reportsApi.sales({ from: period.from, to: period.to }).then(r => r.data),
  })

  const { data: topProducts = [] } = useQuery({
    queryKey: ['top-products', period.from, period.to],
    queryFn:  () => reportsApi.topProducts({ from: period.from, to: period.to, limit: 10 }).then(r => r.data),
  })

  const { data: byCategory = [] } = useQuery({
    queryKey: ['by-category', period.from, period.to],
    queryFn:  () => reportsApi.byCategory({ from: period.from, to: period.to }).then(r => r.data),
  })

  const { data: byWaiter = [] } = useQuery({
    queryKey: ['by-waiter', period.from, period.to],
    queryFn:  () => reportsApi.byWaiter({ from: period.from, to: period.to }).then(r => r.data),
  })

  const { data: cashSummary } = useQuery({
    queryKey: ['cash-summary', period.from],
    queryFn:  () => reportsApi.cashSummary({ date: period.from }).then(r => r.data),
  })

  const summary = sales?.summary

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Rapports & Statistiques" subtitle="Analyse des performances">
        <Button variant="outline" size="sm">
          <Download size={14} className="mr-1.5" /> Export Excel
        </Button>
        <Button variant="outline" size="sm">
          <Download size={14} className="mr-1.5" /> Export PDF
        </Button>
      </PageHeader>

      {/* Sélecteur période */}
      <div className="flex gap-2 flex-wrap">
        {PERIODS.map(p => (
          <Button
            key={p.label}
            variant={period.label === p.label ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPeriod(p)}
            className={period.label === p.label ? 'bg-primary text-white' : ''}
          >
            {p.label}
          </Button>
        ))}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="CA total"
          value={formatAmount(summary?.revenue ?? 0)}
          icon={CreditCard}
          color="orange"
        />
        <StatCard
          label="Commandes"
          value={summary?.orders_count ?? 0}
          icon={ShoppingBag}
          color="blue"
        />
        <StatCard
          label="Ticket moyen"
          value={formatAmount(summary?.avg_ticket ?? 0)}
          icon={TrendingUp}
          color="green"
        />
        <StatCard
          label="Couverts"
          value={summary?.total_covers ?? 0}
          icon={Users}
          color="purple"
        />
      </div>

      <Tabs defaultValue="sales">
        <TabsList>
          <TabsTrigger value="sales">Ventes</TabsTrigger>
          <TabsTrigger value="products">Produits</TabsTrigger>
          <TabsTrigger value="team">Équipe</TabsTrigger>
          <TabsTrigger value="cash">Caisse</TabsTrigger>
        </TabsList>

        {/* TAB VENTES */}
        <TabsContent value="sales" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Évolution du CA</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={sales?.by_day ?? []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={d => format(new Date(d), 'dd/MM')} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                    <Tooltip
                      formatter={(v) => [formatAmount(v), 'CA']}
                      labelFormatter={d => formatDate(d, 'EEEE dd MMMM')}
                    />
                    <Line type="monotone" dataKey="revenue" stroke="#F97316" strokeWidth={2.5} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Répartition paiements</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={sales?.by_method ?? []}
                      dataKey="total"
                      nameKey="method"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ method, percent }) =>
                        `${paymentMethodLabel(method)} ${(percent * 100).toFixed(0)}%`
                      }
                      labelLine={false}
                    >
                      {(sales?.by_method ?? []).map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => formatAmount(v)} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB PRODUITS */}
        <TabsContent value="products" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Top 10 produits — Quantité</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topProducts} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis dataKey="product.name" type="category" tick={{ fontSize: 11 }} width={110} />
                    <Tooltip />
                    <Bar dataKey="total_qty" fill="#F97316" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Ventes par catégorie</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={byCategory} dataKey="revenue" nameKey="product.category.name" cx="50%" cy="50%" outerRadius={100}>
                      {byCategory.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => formatAmount(v)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB ÉQUIPE */}
        <TabsContent value="team" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Serveur</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Commandes</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">CA généré</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Ticket moyen</th>
                  </tr>
                </thead>
                <tbody>
                  {byWaiter.map(row => (
                    <tr key={row.user_id} className="border-b hover:bg-muted/20">
                      <td className="px-4 py-3 font-medium">
                        {row.waiter?.first_name} {row.waiter?.last_name}
                      </td>
                      <td className="px-4 py-3 text-right">{row.orders_count}</td>
                      <td className="px-4 py-3 text-right">{formatAmount(row.revenue)}</td>
                      <td className="px-4 py-3 text-right">{formatAmount(row.avg_ticket)}</td>
                    </tr>
                  ))}
                  {byWaiter.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                        Aucune donnée
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB CAISSE */}
        <TabsContent value="cash" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {(cashSummary?.payments ?? []).map((p, i) => (
              <Card key={i}>
                <CardContent className="py-4">
                  <p className="text-xs text-muted-foreground">{paymentMethodLabel(p.method)}</p>
                  <p className="text-xl font-bold mt-1">{formatAmount(p.total)}</p>
                  <p className="text-xs text-muted-foreground">{p.count} transaction(s)</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardContent className="py-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total encaissé</span>
                <span className="text-xl font-bold text-primary">
                  {formatAmount(cashSummary?.total ?? 0)}
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}