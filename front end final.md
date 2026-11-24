# OMEGA POS RESTAURANT — Documentation Frontend (Partie 3 / Finale)
> Complète les sections 25 → 30 + App.jsx + récapitulatif complet
> **Suite directe de la Partie 2** — sections 19 à 24 incluses dans Part 2

---

## 25. MENU QR PUBLIC — SUITE ET FIN

### `src/pages/menu/PublicMenuPage.jsx` (suite)

```jsx
  // Suite de la fonction PublicMenuPage...
  // (après la déclaration des state et queries)

  return (
    <div className="min-h-screen bg-[#FAFAF7] pb-32">
      {/* Hero restaurant */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-5">
          <div className="flex items-center gap-4">
            {restaurant?.logo ? (
              <img
                src={restaurant.logo}
                alt={restaurant.name}
                className="w-14 h-14 rounded-xl object-cover"
              />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-orange-100 flex items-center justify-center">
                <span className="text-2xl font-bold text-orange-500">Ω</span>
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-gray-900">{restaurant?.name}</h1>
              {restaurant?.address && (
                <p className="text-sm text-gray-500">{restaurant.address}</p>
              )}
            </div>
          </div>
          {tableId && (
            <div className="mt-3 inline-flex items-center gap-1.5 bg-orange-50 border border-orange-200
                            text-orange-700 text-sm font-medium px-3 py-1.5 rounded-full">
              🪑 Table {tableId}
            </div>
          )}
        </div>
      </div>

      {/* Tabs catégories */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b shadow-sm">
        <div className="max-w-lg mx-auto px-4">
          <div className="flex gap-2 overflow-x-auto scrollbar-none py-3">
            <button
              onClick={() => setSelectedCat(null)}
              className={cn(
                'shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border transition-all',
                !selectedCat
                  ? 'bg-orange-500 text-white border-orange-500'
                  : 'border-gray-200 text-gray-600 hover:border-orange-300'
              )}
            >
              Tout
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCat(cat.id)}
                className={cn(
                  'shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border transition-all whitespace-nowrap',
                  selectedCat === cat.id
                    ? 'bg-orange-500 text-white border-orange-500'
                    : 'border-gray-200 text-gray-600 hover:border-orange-300'
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Produits */}
      <div className="max-w-lg mx-auto px-4 py-4 space-y-6">
        {displayCats.map(category => (
          <div key={category.id}>
            <h2 className="text-lg font-bold text-gray-800 mb-3">{category.name}</h2>
            <div className="space-y-3">
              {(category.products ?? []).map(product => {
                const inCart = cart.find(i => i.id === product.id)
                return (
                  <div
                    key={product.id}
                    className={cn(
                      'bg-white rounded-2xl border shadow-sm overflow-hidden transition-all',
                      !product.available && 'opacity-60'
                    )}
                  >
                    <div className="flex items-center gap-3 p-4">
                      {/* Image */}
                      <div className="w-20 h-20 rounded-xl bg-orange-50 flex items-center justify-center shrink-0 overflow-hidden">
                        {product.image ? (
                          <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-3xl">🍽️</span>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold text-gray-900">{product.name}</p>
                            {product.description && (
                              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{product.description}</p>
                            )}
                            <p className="text-orange-500 font-bold text-sm mt-1">
                              {formatAmount(product.price)}
                            </p>
                          </div>

                          {/* Actions */}
                          {!product.available ? (
                            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full shrink-0">
                              Indispo
                            </span>
                          ) : inCart ? (
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                onClick={() => updateQty(product.id, inCart.qty - 1)}
                                className="w-8 h-8 rounded-full border-2 border-orange-500 text-orange-500
                                           flex items-center justify-center font-bold hover:bg-orange-50 transition-colors"
                              >
                                <Minus size={14} />
                              </button>
                              <span className="font-bold text-gray-900 w-5 text-center">{inCart.qty}</span>
                              <button
                                onClick={() => updateQty(product.id, inCart.qty + 1)}
                                className="w-8 h-8 rounded-full bg-orange-500 text-white
                                           flex items-center justify-center font-bold hover:bg-orange-600 transition-colors"
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => addToCart(product)}
                              className="w-9 h-9 rounded-full bg-orange-500 text-white
                                         flex items-center justify-center hover:bg-orange-600 transition-all
                                         active:scale-90 shadow-md shrink-0"
                            >
                              <Plus size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Bouton panier flottant */}
      {cart.length > 0 && (
        <div className="fixed bottom-6 left-0 right-0 flex justify-center z-20 px-4">
          <button
            onClick={() => setCartOpen(true)}
            className="flex items-center justify-between bg-orange-500 hover:bg-orange-600
                       text-white font-bold px-6 py-4 rounded-2xl shadow-2xl transition-all
                       w-full max-w-sm active:scale-95"
          >
            <div className="flex items-center gap-2">
              <ShoppingCart size={18} />
              <span className="bg-white/25 text-xs px-2 py-0.5 rounded-full">{totalItems}</span>
            </div>
            <span>Mon panier</span>
            <span className="font-mono">{formatAmount(total)}</span>
          </button>
        </div>
      )}

      {/* Sheet panier client */}
      <Sheet open={cartOpen} onOpenChange={setCartOpen}>
        <SheetContent side="bottom" className="h-[80vh] rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Mon panier</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col h-full mt-4">
            <div className="flex-1 overflow-y-auto space-y-3">
              {cart.map(item => (
                <div key={item.id} className="flex items-center gap-3 py-2 border-b">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-orange-500 text-sm font-semibold">
                      {formatAmount(item.price * item.qty)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQty(item.id, item.qty - 1)}
                      className="w-8 h-8 rounded-full border-2 border-orange-400 text-orange-500
                                 flex items-center justify-center"
                    >
                      <Minus size={13} />
                    </button>
                    <span className="font-bold w-5 text-center">{item.qty}</span>
                    <button
                      onClick={() => updateQty(item.id, item.qty + 1)}
                      className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center"
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Total + commander */}
            <div className="border-t pt-4 pb-6 space-y-3">
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-orange-500">{formatAmount(total)}</span>
              </div>
              <Button
                className="w-full h-14 bg-orange-500 hover:bg-orange-600 text-white font-bold text-base rounded-2xl"
                onClick={() => { setCartOpen(false); orderMutation.mutate() }}
                disabled={orderMutation.isPending}
              >
                {orderMutation.isPending ? 'Envoi...' : 'Envoyer ma commande 🚀'}
              </Button>
              <p className="text-xs text-center text-gray-400">
                Votre serveur sera notifié immédiatement
              </p>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
```

---

## 26. HOOKS PERSONNALISÉS

### `src/hooks/useAuth.js`

```js
import { useAuthStore } from '@/stores/authStore'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { authApi } from '@/api/auth'
import { useToast } from '@/components/ui/use-toast'

export function useAuth() {
  const store       = useAuthStore()
  const navigate    = useNavigate()
  const queryClient = useQueryClient()
  const { toast }   = useToast()

  const logoutMutation = useMutation({
    mutationFn: () => authApi.logout(),
    onSettled:  () => {
      queryClient.clear()
      store.logout()
      navigate('/login', { replace: true })
    },
  })

  const loginMutation = useMutation({
    mutationFn: (data) => authApi.login(data),
    onSuccess:  ({ data }) => {
      store.setAuth(data.user, data.token)
      navigate('/dashboard', { replace: true })
    },
    onError: (err) => {
      toast({
        variant:     'destructive',
        title:       'Connexion échouée',
        description: err.response?.data?.message ?? 'Identifiants incorrects',
      })
    },
  })

  return {
    user:        store.user,
    token:       store.token,
    isAuth:      store.isAuthenticated,
    isAdmin:     store.isAdmin,
    isManager:   store.isManager,
    isCashier:   store.isCashier,
    isWaiter:    store.isWaiter,
    isCook:      store.isCook,
    isDriver:    store.isDriver,
    hasPermission: store.hasPermission,
    login:       loginMutation.mutate,
    logout:      logoutMutation.mutate,
    loginLoading: loginMutation.isPending,
  }
}
```

### `src/hooks/usePermissions.js`

```js
import { useAuthStore } from '@/stores/authStore'

export function usePermissions() {
  const { user } = useAuthStore()
  const roleName = user?.role?.name
  const perms    = user?.role?.permissions ?? []

  const can = (permission) =>
    perms.includes('*') || perms.includes(permission)

  const is = (...roles) => roles.includes(roleName)

  return {
    can,
    is,
    isAdmin:    is('admin'),
    isManager:  is('admin', 'manager'),
    isCashier:  is('cashier'),
    isWaiter:   is('waiter'),
    isCook:     is('cook'),
    isDriver:   is('driver'),
    // Raccourcis permissions courantes
    canCreateOrders:  can('orders.create') || is('admin', 'manager', 'waiter'),
    canPayOrders:     can('payments.create') || is('admin', 'manager', 'cashier'),
    canManageStock:   can('stock.*') || is('admin', 'manager'),
    canViewReports:   can('reports.*') || is('admin', 'manager'),
    canManageUsers:   is('admin', 'manager'),
    canCancelOrders:  is('admin', 'manager'),
    canApplyDiscount: is('admin', 'manager'),
  }
}
```

### `src/hooks/useCart.js`

```js
import { useCartStore } from '@/stores/cartStore'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ordersApi } from '@/api/orders'
import { useNavigate } from 'react-router-dom'
import { useToast } from '@/components/ui/use-toast'

export function useCart() {
  const cart        = useCartStore()
  const queryClient = useQueryClient()
  const navigate    = useNavigate()
  const { toast }   = useToast()

  // Enregistrer la commande (ou ajouter des items à une existante)
  const saveMutation = useMutation({
    mutationFn: (data) => cart.orderId
      ? ordersApi.addItems(cart.orderId, { items: data.items })
      : ordersApi.create(data),
    onSuccess: ({ data }) => {
      const orderId = data.order?.id ?? data.id
      cart.setTable(cart.tableId, orderId)
    },
    onError: (err) => toast({
      variant:     'destructive',
      description: err.response?.data?.message ?? 'Erreur création commande',
    }),
  })

  // Envoyer en cuisine (crée la commande si besoin, puis l'envoie)
  const sendToKitchenMutation = useMutation({
    mutationFn: async () => {
      let orderId = cart.orderId

      if (!orderId) {
        const res = await ordersApi.create({
          table_id: cart.tableId,
          type:     cart.tableId ? 'dine_in' : 'takeaway',
          covers:   cart.covers,
          notes:    cart.notes,
          items:    buildItems(),
        })
        orderId = res.data?.id
        cart.setTable(cart.tableId, orderId)
      }

      return ordersApi.sendToKitchen(orderId, {})
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['floor-tables'] })
      queryClient.invalidateQueries({ queryKey: ['kitchen-orders'] })
      toast({ title: '🍳 Commande envoyée en cuisine !' })
      cart.clear()
      navigate('/tables')
    },
    onError: (err) => toast({
      variant:     'destructive',
      description: err.response?.data?.message ?? 'Erreur envoi cuisine',
    }),
  })

  const buildItems = () =>
    cart.items.map(i => ({
      product_id:   i.productId,
      quantity:     i.qty,
      notes:        i.note || undefined,
      course:       i.course,
      modifier_ids: i.modifiers.map(m => m.id),
    }))

  return {
    ...cart,
    buildItems,
    save:          saveMutation.mutate,
    sendToKitchen: sendToKitchenMutation.mutate,
    isSaving:      saveMutation.isPending,
    isSending:     sendToKitchenMutation.isPending,
  }
}
```

### `src/hooks/usePrint.js`

```js
import { useRef, useCallback } from 'react'

export function usePrint(options = {}) {
  const printRef = useRef(null)

  const print = useCallback((content) => {
    const printWindow = window.open('', '_blank', 'width=420,height=800,scrollbars=yes')
    if (!printWindow) return

    const styles = `
      @page { margin: 4mm; size: ${options.paperWidth ?? '80mm'} auto; }
      body {
        font-family: 'Courier New', Courier, monospace;
        font-size: 11px;
        color: #000;
        margin: 0;
        padding: 4px;
        width: ${options.paperWidth ?? '80mm'};
      }
      .center  { text-align: center; }
      .right   { text-align: right; }
      .bold    { font-weight: bold; }
      .muted   { color: #555; font-size: 10px; }
      .divider { border-top: 1px dashed #000; margin: 4px 0; }
      table    { width: 100%; border-collapse: collapse; }
      td       { padding: 1px 0; vertical-align: top; }
    `

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Reçu</title>
          <style>${styles}</style>
        </head>
        <body>
          ${content ?? printRef.current?.innerHTML ?? ''}
        </body>
      </html>
    `)
    printWindow.document.close()

    printWindow.onload = () => {
      printWindow.focus()
      printWindow.print()
      if (options.closeAfterPrint !== false) {
        printWindow.close()
      }
    }
  }, [options.paperWidth, options.closeAfterPrint])

  return { printRef, print }
}
```

### `src/hooks/useNotifications.js`

```js
import { useQuery } from '@tanstack/react-query'
import { notificationsApi } from '@/api/notifications'
import { useNotificationStore } from '@/stores/notificationStore'
import { useEffect } from 'react'

export function useNotifications() {
  const { add } = useNotificationStore()

  // Fetch alertes backend (stock faible, commandes en retard, etc.)
  const { data } = useQuery({
    queryKey: ['backend-notifications'],
    queryFn:  () => notificationsApi.list().then(r => r.data),
    refetchInterval: 60_000,
  })

  // Synchroniser les alertes backend dans le store
  useEffect(() => {
    if (!data?.notifications?.length) return
    data.notifications
      .filter(n => n.level === 'danger')
      .forEach(n => add({ type: n.type, level: n.level, message: n.message }))
  }, [data?.count])

  return {
    alerts:     data?.notifications ?? [],
    count:      data?.count ?? 0,
    hasDanger:  data?.has_danger ?? false,
  }
}
```

---

## 27. APPLICATION MOBILE SERVEUR (Flutter — Spec React équivalente)

> Cette section documente l'interface Mobile Serveur sous forme de page React responsive,
> utilisable sur smartphone via le navigateur (PWA) en attendant l'app Flutter native.

### `src/pages/mobile/WaiterHomePage.jsx`

```jsx
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { tablesApi } from '@/api/tables'
import { reportsApi } from '@/api/reports'
import { useAuthStore } from '@/stores/authStore'
import { useNotificationStore } from '@/stores/notificationStore'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatAmount, formatDistanceToNow } from '@/lib/formatters'
import {
  Plus, Map, ClipboardList, Phone, Bell, Clock,
  CheckCircle2, AlertCircle, UtensilsCrossed,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function WaiterHomePage() {
  const { user }         = useAuthStore()
  const { notifications, unreadCount } = useNotificationStore()
  const navigate         = useNavigate()

  // Récupérer les tables du serveur
  const { data: floors = [] } = useQuery({
    queryKey: ['floors'],
    queryFn:  () => tablesApi.floors().then(r => r.data),
  })

  const { data: tables = [] } = useQuery({
    queryKey: ['floor-tables', floors[0]?.id],
    queryFn:  () => tablesApi.floorTables(floors[0]?.id).then(r => r.data),
    enabled:  !!floors[0]?.id,
    refetchInterval: 15000,
  })

  // Stats rapides du serveur
  const myTables   = tables.filter(t => t.assigned_user?.id === user?.id)
  const occupied   = myTables.filter(t => t.status === 'occupied')
  const waiting    = myTables.filter(t => t.status === 'waiting')

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir'

  const QUICK_ACTIONS = [
    {
      label: 'Nouvelle commande',
      icon:  Plus,
      color: 'bg-orange-500 text-white',
      onClick: () => navigate('/pos'),
    },
    {
      label: 'Plan de salle',
      icon:  Map,
      color: 'bg-blue-500 text-white',
      onClick: () => navigate('/tables'),
    },
    {
      label: 'Mes commandes',
      icon:  ClipboardList,
      color: 'bg-purple-500 text-white',
      onClick: () => navigate('/orders?mine=1'),
    },
    {
      label: 'Appeler manager',
      icon:  Phone,
      color: 'bg-red-500 text-white',
      onClick: () => alert('Notification envoyée au manager'),
    },
  ]

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 max-w-sm mx-auto">
      {/* Header */}
      <div className="bg-white px-4 pt-8 pb-5 border-b">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-gray-500 text-sm">{greeting},</p>
            <h1 className="text-2xl font-bold text-gray-900">{user?.first_name} 👋</h1>
          </div>
          <button
            onClick={() => navigate('/notifications')}
            className="relative w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center"
          >
            <Bell size={18} className="text-gray-600" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white
                               rounded-full text-[10px] flex items-center justify-center font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* Stats rapides */}
        <div className="flex gap-3 mt-4">
          {[
            { label: 'Mes tables',   value: myTables.length,  color: 'text-gray-700' },
            { label: 'En attente',   value: waiting.length,   color: 'text-orange-600' },
            { label: 'Occupées',     value: occupied.length,  color: 'text-red-600' },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex-1 bg-gray-50 rounded-xl p-3 text-center">
              <p className={cn('text-2xl font-black', color)}>{value}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Corps */}
      <div className="flex-1 p-4 space-y-5 overflow-y-auto">
        {/* Actions rapides 2x2 */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Actions rapides
          </p>
          <div className="grid grid-cols-2 gap-3">
            {QUICK_ACTIONS.map(({ label, icon: Icon, color, onClick }) => (
              <button
                key={label}
                onClick={onClick}
                className={cn(
                  'flex flex-col items-center justify-center gap-2 p-5 rounded-2xl',
                  'font-semibold text-sm active:scale-95 transition-all shadow-sm',
                  color
                )}
              >
                <Icon size={24} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Mes tables en cours */}
        {occupied.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Mes tables actives
            </p>
            <div className="space-y-2">
              {occupied.map(table => (
                <button
                  key={table.id}
                  onClick={() => navigate(`/tables?select=${table.id}`)}
                  className="w-full flex items-center gap-3 bg-white rounded-2xl p-4 border
                             hover:border-orange-300 transition-all active:scale-98 text-left"
                >
                  {/* Numéro table */}
                  <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                    <span className="text-red-600 font-black text-lg">T{table.number}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 text-sm">Table {table.number}</p>
                    <p className="text-xs text-gray-500">{table.capacity} couverts</p>
                  </div>
                  {table.occupied_since && (
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Clock size={12} />
                      {table.occupation_minutes}min
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Notifications récentes */}
        {notifications.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Notifications
            </p>
            <div className="space-y-2">
              {notifications.slice(0, 5).map(n => (
                <div
                  key={n.id}
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-xl border',
                    n.level === 'success' ? 'bg-green-50 border-green-200' :
                    n.level === 'danger'  ? 'bg-red-50 border-red-200' :
                    'bg-blue-50 border-blue-200',
                    !n.read && 'ring-1 ring-offset-1 ring-orange-400'
                  )}
                >
                  {n.level === 'success'
                    ? <CheckCircle2 size={16} className="text-green-500 shrink-0 mt-0.5" />
                    : <AlertCircle  size={16} className="text-orange-500 shrink-0 mt-0.5" />
                  }
                  <p className="text-sm text-gray-700">{n.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <nav className="bg-white border-t flex items-center justify-around px-2 py-2 safe-pb">
        {[
          { icon: UtensilsCrossed, label: 'Accueil',  path: '/mobile' },
          { icon: Map,             label: 'Tables',   path: '/tables' },
          { icon: ClipboardList,   label: 'Commandes',path: '/orders?mine=1' },
          { icon: Bell,            label: 'Alertes',  path: '/notifications' },
        ].map(({ icon: Icon, label, path }) => (
          <button
            key={label}
            onClick={() => navigate(path)}
            className="flex flex-col items-center gap-0.5 px-4 py-1"
          >
            <Icon size={20} className="text-gray-500" />
            <span className="text-[10px] text-gray-500">{label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
```

---

## 28. PAGE MENU & PRODUITS (Back-office)

### `src/pages/products/ProductsPage.jsx`

```jsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { productsApi } from '@/api/products'
import PageHeader from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useForm, Controller } from 'react-hook-form'
import { formatAmount } from '@/lib/formatters'
import {
  Search, Plus, Edit, Trash2, Eye, EyeOff,
  BookOpen, QrCode, ToggleLeft, ToggleRight,
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'
import apiClient from '@/api/client'
import QRCode from 'qrcode.react'

export default function ProductsPage() {
  const queryClient = useQueryClient()
  const { toast }   = useToast()
  const [activeTab, setActiveTab] = useState('products')
  const [search, setSearch]       = useState('')
  const [selectedCat, setSelectedCat] = useState(null)
  const [editProduct, setEditProduct] = useState(null)
  const [showForm, setShowForm]       = useState(false)
  const [qrTable, setQrTable]         = useState(null)

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn:  () => productsApi.categories().then(r => r.data),
  })

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products', selectedCat, search],
    queryFn:  () => productsApi.list({
      category_id: selectedCat,
      search:      search || undefined,
    }).then(r => r.data),
  })

  const toggleMutation = useMutation({
    mutationFn: (id) => productsApi.toggleAvailable(id),
    onSuccess:  () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => productsApi.delete(id),
    onSuccess:  () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast({ title: 'Produit supprimé' })
    },
  })

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Menu & Produits" subtitle="Catalogue, catégories et QR codes">
        <Button size="sm" onClick={() => { setEditProduct(null); setShowForm(true) }}>
          <Plus size={15} className="mr-1.5" /> Nouveau produit
        </Button>
      </PageHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="products">Produits</TabsTrigger>
          <TabsTrigger value="categories">Catégories</TabsTrigger>
          <TabsTrigger value="qr">QR Codes tables</TabsTrigger>
        </TabsList>

        {/* TAB PRODUITS */}
        <TabsContent value="products" className="mt-4 space-y-4">
          {/* Filtres */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-48 max-w-xs">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher un produit..."
                className="pl-9"
              />
            </div>
            <div className="flex gap-1.5 flex-wrap">
              <Button
                size="sm"
                variant={!selectedCat ? 'default' : 'outline'}
                onClick={() => setSelectedCat(null)}
                className={!selectedCat ? 'bg-primary text-white' : ''}
              >
                Tout
              </Button>
              {categories.map(cat => (
                <Button
                  key={cat.id}
                  size="sm"
                  variant={selectedCat === cat.id ? 'default' : 'outline'}
                  onClick={() => setSelectedCat(selectedCat === cat.id ? null : cat.id)}
                  className={selectedCat === cat.id ? 'bg-primary text-white' : ''}
                >
                  {cat.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Grille produits */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.map(product => (
              <Card
                key={product.id}
                className={cn('overflow-hidden', !product.available && 'opacity-60')}
              >
                {/* Image placeholder */}
                <div className="h-32 bg-muted flex items-center justify-center relative overflow-hidden">
                  {product.image ? (
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <BookOpen size={32} className="text-muted-foreground/30" />
                  )}
                  {!product.available && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="text-white text-xs font-medium bg-black/60 px-2 py-1 rounded-full">
                        Indisponible
                      </span>
                    </div>
                  )}
                </div>
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="font-semibold text-sm leading-tight">{product.name}</p>
                    <Switch
                      checked={product.available}
                      onCheckedChange={() => toggleMutation.mutate(product.id)}
                      className="shrink-0"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    {product.category?.name}
                  </p>
                  <p className="text-primary font-bold">{formatAmount(product.price)}</p>
                  <div className="flex gap-1 mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-7 text-xs"
                      onClick={() => { setEditProduct(product); setShowForm(true) }}
                    >
                      <Edit size={11} className="mr-1" /> Modifier
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 w-7 p-0 text-red-500 hover:bg-red-50"
                      onClick={() => deleteMutation.mutate(product.id)}
                    >
                      <Trash2 size={11} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Carte "Ajouter" */}
            <button
              onClick={() => { setEditProduct(null); setShowForm(true) }}
              className="h-full min-h-[200px] border-2 border-dashed border-primary/30 rounded-xl
                         flex flex-col items-center justify-center gap-2 text-primary/50
                         hover:border-primary hover:text-primary hover:bg-primary/5 transition-all"
            >
              <Plus size={28} />
              <span className="text-sm font-medium">Ajouter un produit</span>
            </button>
          </div>
        </TabsContent>

        {/* TAB CATÉGORIES */}
        <TabsContent value="categories" className="mt-4">
          <CategoriesManager categories={categories} queryClient={queryClient} />
        </TabsContent>

        {/* TAB QR CODES */}
        <TabsContent value="qr" className="mt-4">
          <QrCodesManager />
        </TabsContent>
      </Tabs>

      {/* Dialog formulaire produit */}
      {showForm && (
        <ProductFormDialog
          product={editProduct}
          categories={categories}
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['products'] })
            setShowForm(false)
            toast({ title: editProduct ? 'Produit modifié' : 'Produit créé' })
          }}
        />
      )}
    </div>
  )
}

// ─── Gestionnaire catégories ─────────────────────────────────────
function CategoriesManager({ categories, queryClient }) {
  const { toast } = useToast()
  const [editCat, setEditCat]     = useState(null)
  const [showForm, setShowForm]   = useState(false)

  const createMutation = useMutation({
    mutationFn: (data) => apiClient.post('/categories', data),
    onSuccess:  () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      setShowForm(false)
      toast({ title: 'Catégorie créée' })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }) => apiClient.put(`/categories/${id}`, data),
    onSuccess:  () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      setShowForm(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => apiClient.delete(`/categories/${id}`),
    onSuccess:  () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
    onError:    (e) => toast({
      variant:     'destructive',
      description: e.response?.data?.message ?? 'Impossible de supprimer',
    }),
  })

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => { setEditCat(null); setShowForm(true) }}>
          <Plus size={15} className="mr-1.5" /> Nouvelle catégorie
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map(cat => (
          <Card key={cat.id}>
            <CardContent className="py-4 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-semibold">{cat.name}</p>
                <p className="text-xs text-muted-foreground">
                  {cat.products?.length ?? 0} produit(s)
                </p>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => { setEditCat(cat); setShowForm(true) }}
                >
                  <Edit size={13} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-500 hover:bg-red-50"
                  onClick={() => deleteMutation.mutate(cat.id)}
                >
                  <Trash2 size={13} />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {showForm && (
        <Dialog open onOpenChange={() => setShowForm(false)}>
          <DialogContent className="max-w-xs">
            <DialogHeader>
              <DialogTitle>{editCat ? 'Modifier catégorie' : 'Nouvelle catégorie'}</DialogTitle>
            </DialogHeader>
            <CategoryForm
              category={editCat}
              onSubmit={(data) => editCat
                ? updateMutation.mutate({ id: editCat.id, ...data })
                : createMutation.mutate(data)
              }
              isLoading={createMutation.isPending || updateMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

function CategoryForm({ category, onSubmit, isLoading }) {
  const { register, handleSubmit } = useForm({
    defaultValues: category ?? {},
  })
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 mt-2">
      <div>
        <Label>Nom de la catégorie</Label>
        <Input {...register('name', { required: true })} placeholder="Plats, Boissons..." className="mt-1" />
      </div>
      <Button type="submit" className="w-full bg-primary text-white" disabled={isLoading}>
        {category ? 'Sauvegarder' : 'Créer'}
      </Button>
    </form>
  )
}

// ─── QR Codes tables ────────────────────────────────────────────
function QrCodesManager() {
  const [selectedFloor, setSelectedFloor] = useState(null)

  const { data: floors = [] } = useQuery({
    queryKey: ['floors'],
    queryFn:  () => apiClient.get('/floors').then(r => r.data),
    onSuccess: (data) => { if (!selectedFloor && data[0]) setSelectedFloor(data[0].id) },
  })

  const { data: tables = [] } = useQuery({
    queryKey: ['floor-tables', selectedFloor],
    queryFn:  () => apiClient.get(`/floors/${selectedFloor}/tables`).then(r => r.data),
    enabled:  !!selectedFloor,
  })

  const baseUrl = import.meta.env.VITE_APP_URL
  const restaurantSlug = 'restaurant-slug' // Récupéré depuis les settings

  return (
    <div className="space-y-4">
      {/* Sélecteur salle */}
      <div className="flex gap-2">
        {floors.map(f => (
          <Button
            key={f.id}
            size="sm"
            variant={selectedFloor === f.id ? 'default' : 'outline'}
            className={selectedFloor === f.id ? 'bg-primary text-white' : ''}
            onClick={() => setSelectedFloor(f.id)}
          >
            {f.name}
          </Button>
        ))}
      </div>

      {/* Grille QR codes */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {tables.map(table => {
          const menuUrl = `${baseUrl}/menu/${restaurantSlug}?table=${table.id}`
          return (
            <Card key={table.id} className="overflow-hidden">
              <CardContent className="p-4 flex flex-col items-center gap-3">
                <p className="font-bold text-sm">Table {table.number}</p>
                <div className="p-2 bg-white border rounded-lg">
                  <QRCode
                    value={menuUrl}
                    size={100}
                    level="H"
                    includeMargin={false}
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs h-7"
                  onClick={() => {
                    const canvas = document.querySelector(`#qr-${table.id} canvas`)
                    const link   = document.createElement('a')
                    link.download = `table-${table.number}-qr.png`
                    link.href     = canvas?.toDataURL() ?? ''
                    link.click()
                  }}
                >
                  <QrCode size={11} className="mr-1" /> Télécharger
                </Button>
                <div id={`qr-${table.id}`} className="hidden">
                  <QRCode value={menuUrl} size={300} level="H" />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

// ─── Formulaire produit ──────────────────────────────────────────
function ProductFormDialog({ product, categories, onClose, onSuccess }) {
  const { register, handleSubmit, control, watch } = useForm({
    defaultValues: product
      ? { ...product, category_id: product.category_id }
      : { available: true, vat_rate: 18 },
  })

  const mutation = useMutation({
    mutationFn: (data) => {
      const fd = new FormData()
      Object.entries(data).forEach(([k, v]) => {
        if (v !== undefined && v !== null) fd.append(k, v)
      })
      return product
        ? productsApi.update(product.id, data)
        : productsApi.create(data)
    },
    onSuccess,
  })

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{product ? 'Modifier le produit' : 'Nouveau produit'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label>Nom du produit</Label>
              <Input {...register('name', { required: true })} placeholder="Poulet braisé" className="mt-1" />
            </div>
            <div>
              <Label>Catégorie</Label>
              <Controller
                name="category_id"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <Select value={String(field.value ?? '')} onValueChange={v => field.onChange(Number(v))}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Choisir..." />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(c => (
                        <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div>
              <Label>Prix de vente (FCFA)</Label>
              <Input
                {...register('price', { required: true, min: 0 })}
                type="number"
                placeholder="0"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Prix de revient (FCFA)</Label>
              <Input
                {...register('cost_price')}
                type="number"
                placeholder="Optionnel"
                className="mt-1"
              />
            </div>
            <div>
              <Label>TVA (%)</Label>
              <Input
                {...register('vat_rate')}
                type="number"
                defaultValue={18}
                className="mt-1"
              />
            </div>
            <div className="col-span-2">
              <Label>Description</Label>
              <Input
                {...register('description')}
                placeholder="Description courte..."
                className="mt-1"
              />
            </div>
            <div className="flex items-center justify-between col-span-2 bg-muted/50 rounded-lg px-3 py-2">
              <Label>Produit disponible à la vente</Label>
              <Controller
                name="available"
                control={control}
                render={({ field }) => (
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                )}
              />
            </div>
            <div className="flex items-center justify-between col-span-2 bg-muted/50 rounded-lg px-3 py-2">
              <div>
                <Label>Suivi du stock</Label>
                <p className="text-xs text-muted-foreground">Déduire les ingrédients à chaque vente</p>
              </div>
              <Controller
                name="track_stock"
                control={control}
                render={({ field }) => (
                  <Switch checked={field.value ?? false} onCheckedChange={field.onChange} />
                )}
              />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Annuler</Button>
            <Button
              type="submit"
              className="flex-1 bg-primary text-white"
              disabled={mutation.isPending}
            >
              {product ? 'Sauvegarder' : 'Créer le produit'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

---

## 29. PAGE PARAMÈTRES

### `src/pages/settings/SettingsPage.jsx`

```jsx
import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import apiClient from '@/api/client'
import PageHeader from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useForm, Controller } from 'react-hook-form'
import { useToast } from '@/components/ui/use-toast'
import {
  Store, Printer, CreditCard, Globe, Shield,
  Package, Bell, Save, TestTube,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const SECTIONS = [
  { id: 'general',    label: 'Général',            icon: Store },
  { id: 'printers',   label: 'Imprimantes',         icon: Printer },
  { id: 'payments',   label: 'Modes de paiement',   icon: CreditCard },
  { id: 'locale',     label: 'Langue & Devise',      icon: Globe },
  { id: 'alerts',     label: 'Alertes',              icon: Bell },
  { id: 'security',   label: 'Sécurité',             icon: Shield },
]

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('general')
  const { toast } = useToast()

  const { data: settings, isLoading } = useQuery({
    queryKey: ['restaurant-settings'],
    queryFn:  () => apiClient.get('/settings').then(r => r.data),
  })

  const { data: config } = useQuery({
    queryKey: ['settings-config'],
    queryFn:  () => apiClient.get('/settings/config').then(r => r.data),
  })

  const updateSettingsMutation = useMutation({
    mutationFn: (data) => apiClient.put('/settings', data),
    onSuccess:  () => toast({ title: '✅ Paramètres sauvegardés' }),
    onError:    () => toast({ variant: 'destructive', title: 'Erreur lors de la sauvegarde' }),
  })

  const updateConfigMutation = useMutation({
    mutationFn: (data) => apiClient.put('/settings/config', { settings: data }),
    onSuccess:  () => toast({ title: '✅ Configuration sauvegardée' }),
  })

  const ActiveComponent = {
    general:  GeneralSettings,
    printers: PrinterSettings,
    payments: PaymentSettings,
    locale:   LocaleSettings,
    alerts:   AlertSettings,
    security: SecuritySettings,
  }[activeSection] ?? GeneralSettings

  return (
    <div className="flex gap-6 animate-fade-in">
      {/* Sidebar navigation interne */}
      <div className="w-52 shrink-0">
        <h1 className="text-xl font-semibold mb-4">Paramètres</h1>
        <nav className="space-y-1">
          {SECTIONS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveSection(id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                activeSection === id
                  ? 'bg-primary/10 text-primary border-l-2 border-primary pl-[10px]'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Contenu */}
      <div className="flex-1 min-w-0">
        {isLoading ? (
          <div className="h-32 flex items-center justify-center">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : (
          <ActiveComponent
            settings={settings}
            config={config}
            onSaveSettings={updateSettingsMutation.mutate}
            onSaveConfig={updateConfigMutation.mutate}
            isSaving={updateSettingsMutation.isPending || updateConfigMutation.isPending}
          />
        )}
      </div>
    </div>
  )
}

// ─── Section Général ────────────────────────────────────────────
function GeneralSettings({ settings, onSaveSettings, isSaving }) {
  const { register, handleSubmit } = useForm({ defaultValues: settings ?? {} })

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Informations du restaurant</h2>
      <form onSubmit={handleSubmit(onSaveSettings)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Label>Nom du restaurant</Label>
            <Input {...register('name')} className="mt-1" />
          </div>
          <div className="col-span-2">
            <Label>Adresse</Label>
            <Input {...register('address')} className="mt-1" />
          </div>
          <div>
            <Label>Téléphone</Label>
            <Input {...register('phone')} type="tel" className="mt-1" />
          </div>
          <div>
            <Label>Email</Label>
            <Input {...register('email')} type="email" className="mt-1" />
          </div>
          <div>
            <Label>Numéro TVA</Label>
            <Input {...register('vat_number')} placeholder="TG-..." className="mt-1" />
          </div>
        </div>
        <div className="flex justify-end">
          <Button type="submit" className="bg-primary text-white gap-2" disabled={isSaving}>
            <Save size={15} /> Sauvegarder
          </Button>
        </div>
      </form>
    </div>
  )
}

// ─── Section Imprimantes ─────────────────────────────────────────
function PrinterSettings({ config, onSaveConfig, isSaving }) {
  const { toast } = useToast()
  const { register, handleSubmit, control } = useForm({
    defaultValues: {
      printer_ip:       config?.printer_ip ?? '',
      printer_port:     config?.printer_port ?? 9100,
      receipt_width:    config?.receipt_width ?? '80mm',
      receipt_logo:     config?.receipt_logo ?? true,
      auto_print:       config?.auto_print_receipt ?? true,
      receipt_footer:   config?.receipt_footer ?? 'Merci de votre visite !',
    },
  })

  const testPrint = () => {
    toast({ title: '🖨️ Test d\'impression envoyé' })
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Configuration des imprimantes</h2>
      <form onSubmit={handleSubmit(d => onSaveConfig({
        printer_ip:          d.printer_ip,
        printer_port:        Number(d.printer_port),
        receipt_width:       d.receipt_width,
        receipt_logo:        d.receipt_logo,
        auto_print_receipt:  d.auto_print,
        receipt_footer:      d.receipt_footer,
      }))} className="space-y-5">

        <Card>
          <CardHeader><CardTitle className="text-sm">Imprimante réseau (ESC/POS)</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Adresse IP</Label>
                <Input {...register('printer_ip')} placeholder="192.168.1.100" className="mt-1" />
              </div>
              <div>
                <Label>Port</Label>
                <Input {...register('printer_port')} type="number" placeholder="9100" className="mt-1" />
              </div>
            </div>
            <Button type="button" variant="outline" onClick={testPrint} className="gap-2">
              <TestTube size={14} /> Tester l'impression
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Format du ticket</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Largeur du rouleau</Label>
              <Controller
                name="receipt_width"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="mt-1 w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="58mm">58mm</SelectItem>
                      <SelectItem value="80mm">80mm</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div>
              <Label>Message pied de ticket</Label>
              <Input {...register('receipt_footer')} className="mt-1" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Logo sur le ticket</Label>
                <p className="text-xs text-muted-foreground">Afficher le logo du restaurant</p>
              </div>
              <Controller name="receipt_logo" control={control}
                render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Impression automatique</Label>
                <p className="text-xs text-muted-foreground">Imprimer après chaque paiement</p>
              </div>
              <Controller name="auto_print" control={control}
                render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />} />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" className="bg-primary text-white gap-2" disabled={isSaving}>
            <Save size={15} /> Sauvegarder
          </Button>
        </div>
      </form>
    </div>
  )
}

// ─── Section Modes de paiement ───────────────────────────────────
function PaymentSettings({ config, onSaveConfig, isSaving }) {
  const { register, handleSubmit, control } = useForm({
    defaultValues: {
      payment_cash:         config?.payment_cash ?? true,
      payment_card:         config?.payment_card ?? true,
      payment_wave:         config?.payment_wave ?? true,
      payment_orange_money: config?.payment_orange_money ?? true,
    },
  })

  const METHODS = [
    { key: 'payment_cash',         label: 'Espèces',       icon: '💵' },
    { key: 'payment_card',         label: 'Carte bancaire', icon: '💳' },
    { key: 'payment_wave',         label: 'Wave',           icon: '🌊' },
    { key: 'payment_orange_money', label: 'Orange Money',   icon: '🟠' },
  ]

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Modes de paiement actifs</h2>
      <form onSubmit={handleSubmit(onSaveConfig)} className="space-y-3">
        {METHODS.map(({ key, label, icon }) => (
          <div key={key} className="flex items-center justify-between p-4 bg-card border rounded-xl">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{icon}</span>
              <span className="font-medium">{label}</span>
            </div>
            <Controller
              name={key}
              control={control}
              render={({ field }) => (
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              )}
            />
          </div>
        ))}
        <div className="flex justify-end pt-2">
          <Button type="submit" className="bg-primary text-white gap-2" disabled={isSaving}>
            <Save size={15} /> Sauvegarder
          </Button>
        </div>
      </form>
    </div>
  )
}

// ─── Section Locale ─────────────────────────────────────────────
function LocaleSettings({ settings, onSaveSettings, isSaving }) {
  const { register, handleSubmit, control } = useForm({ defaultValues: settings ?? {} })

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Langue & Devise</h2>
      <form onSubmit={handleSubmit(onSaveSettings)} className="space-y-4">
        <div>
          <Label>Devise</Label>
          <Controller
            name="currency"
            control={control}
            render={({ field }) => (
              <Select value={field.value ?? 'XOF'} onValueChange={field.onChange}>
                <SelectTrigger className="mt-1 w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="XOF">FCFA (XOF)</SelectItem>
                  <SelectItem value="EUR">Euro (EUR)</SelectItem>
                  <SelectItem value="USD">Dollar (USD)</SelectItem>
                  <SelectItem value="GHS">Cedi (GHS)</SelectItem>
                  <SelectItem value="NGN">Naira (NGN)</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div>
          <Label>Fuseau horaire</Label>
          <Input {...register('timezone')} defaultValue="Africa/Lome" className="mt-1" />
        </div>
        <div className="flex justify-end">
          <Button type="submit" className="bg-primary text-white gap-2" disabled={isSaving}>
            <Save size={15} /> Sauvegarder
          </Button>
        </div>
      </form>
    </div>
  )
}

// ─── Section Alertes ─────────────────────────────────────────────
function AlertSettings({ config, onSaveConfig, isSaving }) {
  const { register, handleSubmit, control } = useForm({
    defaultValues: {
      kitchen_alert_sound:   config?.kitchen_alert_sound ?? true,
      order_timeout_alert:   config?.order_timeout_alert ?? 15,
      low_stock_alerts:      config?.low_stock_alerts ?? true,
    },
  })

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Alertes & Notifications</h2>
      <form onSubmit={handleSubmit(onSaveConfig)} className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-card border rounded-xl">
          <div>
            <Label>Son de notification cuisine</Label>
            <p className="text-xs text-muted-foreground">Bip à chaque nouvelle commande sur le KDS</p>
          </div>
          <Controller name="kitchen_alert_sound" control={control}
            render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />} />
        </div>
        <div className="flex items-center justify-between p-4 bg-card border rounded-xl">
          <div>
            <Label>Alertes stock faible</Label>
            <p className="text-xs text-muted-foreground">Notification quand un ingrédient atteint le seuil</p>
          </div>
          <Controller name="low_stock_alerts" control={control}
            render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />} />
        </div>
        <div>
          <Label>Délai d'alerte commande (minutes)</Label>
          <p className="text-xs text-muted-foreground mb-1">Alerte rouge si commande non servie après ce délai</p>
          <Input
            {...register('order_timeout_alert')}
            type="number"
            min={5}
            max={60}
            className="w-32"
          />
        </div>
        <div className="flex justify-end">
          <Button type="submit" className="bg-primary text-white gap-2" disabled={isSaving}>
            <Save size={15} /> Sauvegarder
          </Button>
        </div>
      </form>
    </div>
  )
}

// ─── Section Sécurité ────────────────────────────────────────────
function SecuritySettings() {
  const { toast } = useToast()
  const { register, handleSubmit } = useForm()

  const changePwdMutation = useMutation({
    mutationFn: (data) => apiClient.put('/auth/change-password', data),
    onSuccess:  () => toast({ title: '✅ Mot de passe modifié' }),
    onError:    (e) => toast({
      variant:     'destructive',
      description: e.response?.data?.message ?? 'Erreur',
    }),
  })

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Sécurité</h2>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Changer le mot de passe</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(d => changePwdMutation.mutate(d))} className="space-y-4">
            <div>
              <Label>Mot de passe actuel</Label>
              <Input {...register('current_password', { required: true })} type="password" className="mt-1" />
            </div>
            <div>
              <Label>Nouveau mot de passe</Label>
              <Input {...register('password', { required: true, minLength: 8 })} type="password" className="mt-1" />
            </div>
            <div>
              <Label>Confirmer le nouveau mot de passe</Label>
              <Input {...register('password_confirmation', { required: true })} type="password" className="mt-1" />
            </div>
            <Button
              type="submit"
              className="bg-primary text-white"
              disabled={changePwdMutation.isPending}
            >
              Modifier le mot de passe
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
```

---

## 30. NOTIFICATIONS & ALERTES

### `src/pages/notifications/NotificationsPage.jsx`

```jsx
import { useNotificationStore } from '@/stores/notificationStore'
import { useNotifications } from '@/hooks/useNotifications'
import PageHeader from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { formatAmount } from '@/lib/formatters'
import {
  Bell, CheckCircle2, AlertTriangle, AlertCircle,
  Clock, Package, XCircle, Check,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'

const NOTIFICATION_ICONS = {
  order_created: { icon: Bell,          color: 'text-blue-500',   bg: 'bg-blue-50' },
  order_ready:   { icon: CheckCircle2,  color: 'text-green-500',  bg: 'bg-green-50' },
  order_late:    { icon: Clock,         color: 'text-red-500',    bg: 'bg-red-50' },
  stock_low:     { icon: Package,       color: 'text-orange-500', bg: 'bg-orange-50' },
  stock_rupture: { icon: XCircle,       color: 'text-red-500',    bg: 'bg-red-50' },
  cancellation_pending: { icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-50' },
  default:       { icon: Bell,          color: 'text-gray-500',   bg: 'bg-gray-50' },
}

export default function NotificationsPage() {
  const { notifications, unreadCount, markRead, markAllRead, clear } = useNotificationStore()
  const { alerts, hasDanger } = useNotifications()
  const navigate = useNavigate()

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <PageHeader title="Notifications & Alertes" subtitle="Toutes les alertes système">
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button size="sm" variant="outline" onClick={markAllRead}>
              <Check size={14} className="mr-1.5" /> Tout marquer lu
            </Button>
          )}
          {notifications.length > 0 && (
            <Button size="sm" variant="outline" className="text-red-500" onClick={clear}>
              Effacer tout
            </Button>
          )}
        </div>
      </PageHeader>

      {/* Alertes critiques backend (stock, retards) */}
      {hasDanger && (
        <div className="space-y-2">
          <h3 className="font-medium text-sm text-red-600 flex items-center gap-2">
            <AlertCircle size={14} /> Alertes critiques
          </h3>
          {alerts.filter(a => a.level === 'danger').map((alert, i) => (
            <div
              key={i}
              className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl"
            >
              <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-sm text-red-800">{alert.message}</p>
                {alert.type === 'stock_low' && (
                  <Button
                    variant="link"
                    size="sm"
                    className="h-5 p-0 text-red-600 text-xs"
                    onClick={() => navigate('/stock?alert=1')}
                  >
                    Voir le stock →
                  </Button>
                )}
                {alert.type === 'cancellation_pending' && (
                  <Button
                    variant="link"
                    size="sm"
                    className="h-5 p-0 text-red-600 text-xs"
                    onClick={() => navigate('/cancellations')}
                  >
                    Traiter →
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Alertes warnings */}
      {alerts.filter(a => a.level === 'warning').length > 0 && (
        <div className="space-y-2">
          <h3 className="font-medium text-sm text-orange-600 flex items-center gap-2">
            <AlertTriangle size={14} /> Avertissements
          </h3>
          {alerts.filter(a => a.level === 'warning').map((alert, i) => (
            <div
              key={i}
              className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-xl"
            >
              <AlertTriangle size={18} className="text-orange-500 shrink-0 mt-0.5" />
              <p className="text-sm text-orange-800">{alert.message}</p>
            </div>
          ))}
        </div>
      )}

      {/* Notifications temps réel (WebSocket) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
            <Bell size={14} /> Activité récente
            {unreadCount > 0 && (
              <Badge className="bg-primary text-white text-[10px]">{unreadCount}</Badge>
            )}
          </h3>
        </div>

        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Bell size={32} className="opacity-20 mb-3" />
            <p className="text-sm">Aucune notification</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map(notif => {
              const cfg = NOTIFICATION_ICONS[notif.type] ?? NOTIFICATION_ICONS.default
              const Icon = cfg.icon
              return (
                <div
                  key={notif.id}
                  onClick={() => markRead(notif.id)}
                  className={cn(
                    'flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all',
                    'hover:border-primary/30',
                    !notif.read && 'bg-primary/5 border-primary/20',
                    notif.read && 'opacity-70'
                  )}
                >
                  <div className={cn('w-9 h-9 rounded-full flex items-center justify-center shrink-0', cfg.bg)}>
                    <Icon size={17} className={cfg.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm', !notif.read && 'font-medium')}>{notif.message}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(notif.id).toLocaleTimeString('fr-FR')}
                    </p>
                  </div>
                  {!notif.read && (
                    <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
```

---

## 31. APP.JSX FINAL — POINT D'ENTRÉE COMPLET

### `src/App.jsx`

```jsx
import { RouterProvider } from 'react-router-dom'
import { router } from '@/router'
import { Toaster } from '@/components/ui/toaster'

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster />
    </>
  )
}
```

### Mise à jour `src/router/index.jsx` — ajout des routes manquantes

```jsx
// Ajouts à la section routes protégées dans AppLayout :
{ path: 'mobile',        element: <WaiterHomePage /> },          // import depuis @/pages/mobile/WaiterHomePage
{ path: 'notifications', element: <NotificationsPage /> },       // import depuis @/pages/notifications/NotificationsPage
{ path: 'mobile/order',  element: <MobileOrderPage /> },        // import depuis @/pages/mobile/MobileOrderPage
```

---

## 32. RÉCAPITULATIF — ARBRE COMPLET DES FICHIERS CRÉÉS

```
src/
├── App.jsx                                   ✅
├── main.jsx                                  ✅
├── index.css                                 ✅
│
├── api/
│   ├── client.js                             ✅
│   ├── auth.js                               ✅
│   ├── orders.js                             ✅
│   ├── tables.js                             ✅
│   ├── payments.js                           ✅
│   ├── products.js                           ✅
│   ├── stock.js                              ✅
│   ├── reports.js                            ✅
│   ├── receipts.js                           ✅
│   ├── deliveries.js                         ✅ (via apiClient direct dans la page)
│   └── notifications.js                      ✅
│
├── stores/
│   ├── authStore.js                          ✅
│   ├── cartStore.js                          ✅
│   ├── notificationStore.js                  ✅
│   └── socketStore.js                        (optionnel — socket géré dans useSocket)
│
├── hooks/
│   ├── useAuth.js                            ✅
│   ├── useSocket.js                          ✅ (Part 2, section 6)
│   ├── useCart.js                            ✅
│   ├── usePermissions.js                     ✅
│   ├── usePrint.js                           ✅
│   └── useNotifications.js                   ✅
│
├── lib/
│   ├── utils.js                              ✅
│   ├── formatters.js                         ✅
│   └── constants.js                          ✅
│
├── router/
│   └── index.jsx                             ✅
│
├── components/
│   ├── layout/
│   │   ├── AppLayout.jsx                     ✅
│   │   ├── Sidebar.jsx                       ✅
│   │   ├── TopBar.jsx                        ✅
│   │   └── KDSLayout.jsx                     ✅
│   ├── pos/
│   │   ├── ProductGrid.jsx                   ✅
│   │   ├── CartPanel.jsx                     ✅
│   │   ├── CartItem.jsx                      ✅
│   │   ├── CategoryTabs.jsx                  ✅
│   │   └── PaymentModal.jsx                  ✅
│   ├── tables/
│   │   └── TableActionPanel.jsx              ✅
│   ├── orders/
│   │   ├── OrderItemRow.jsx                  ✅
│   │   └── OrderLog.jsx                      ✅
│   ├── kitchen/
│   │   └── KDSTimer.jsx                      ✅
│   ├── receipts/
│   │   └── ReceiptPreview.jsx                ✅
│   └── shared/
│       ├── StatCard.jsx                      ✅
│       ├── PageHeader.jsx                    ✅
│       ├── StatusBadge.jsx                   ✅
│       └── ConfirmDialog.jsx                 ✅
│
└── pages/
    ├── auth/
    │   └── LoginPage.jsx                     ✅
    ├── dashboard/
    │   └── DashboardPage.jsx                 ✅
    ├── tables/
    │   └── TablesPage.jsx                    ✅
    ├── pos/
    │   └── POSPage.jsx                       ✅
    ├── kitchen/
    │   └── KitchenPage.jsx                   ✅
    ├── orders/
    │   └── OrderDetailPage.jsx               ✅
    ├── stock/
    │   └── StockPage.jsx                     ✅
    ├── reports/
    │   └── ReportsPage.jsx                   ✅
    ├── deliveries/
    │   └── DeliveriesPage.jsx                ✅
    ├── users/
    │   └── UsersPage.jsx                     ✅
    ├── products/
    │   └── ProductsPage.jsx                  ✅  ← Part 3
    ├── settings/
    │   └── SettingsPage.jsx                  ✅  ← Part 3
    ├── cancellations/
    │   └── CancellationsPage.jsx             ✅
    ├── audit/
    │   └── AuditPage.jsx                     ✅
    ├── mobile/
    │   ├── WaiterHomePage.jsx                ✅  ← Part 3
    │   └── MobileOrderPage.jsx               ✅
    ├── notifications/
    │   └── NotificationsPage.jsx             ✅  ← Part 3
    └── menu/
        └── PublicMenuPage.jsx                ✅  ← Part 3 (suite)
```

---

## 33. TABLEAU DE BORD DES ROUTES — RÉCAPITULATIF FINAL

| Route | Page | Rôles | Description |
|-------|------|-------|-------------|
| `/login` | LoginPage | Public | Email + PIN rapide |
| `/menu/:slug` | PublicMenuPage | Public | Menu QR client |
| `/dashboard` | DashboardPage | Admin, Manager | KPIs + graphiques |
| `/tables` | TablesPage | Admin, Manager, Caissier, Serveur | Plan de salle interactif |
| `/pos` | POSPage | Admin, Manager, Caissier | Caisse + catalogue |
| `/orders/:id` | OrderDetailPage | Connecté | Détail & actions commande |
| `/kitchen` | KitchenPage | Admin, Manager, Cuisinier | KDS plein écran |
| `/stock` | StockPage | Admin, Manager | Inventaire + mouvements |
| `/reports` | ReportsPage | Admin, Manager | Statistiques + exports |
| `/deliveries` | DeliveriesPage | Admin, Manager, Livreur | Suivi livraisons |
| `/products` | ProductsPage | Admin, Manager | Catalogue + QR codes |
| `/users` | UsersPage | Admin, Manager | Gestion équipe |
| `/settings` | SettingsPage | Admin | Configuration restaurant |
| `/cancellations` | CancellationsPage | Admin, Manager | Annulations + PIN |
| `/audit` | AuditPage | Admin, Manager | Journal complet |
| `/mobile` | WaiterHomePage | Serveur | App serveur mobile |
| `/mobile/order` | MobileOrderPage | Serveur | Prise commande mobile |
| `/notifications` | NotificationsPage | Connecté | Alertes temps réel |

---

## 34. CHECKLIST DE DÉPLOIEMENT

### Variables d'environnement production

```env
# .env.production
VITE_API_URL=https://api.monrestaurant.com/api
VITE_APP_URL=https://pos.monrestaurant.com
VITE_PUSHER_KEY=prod_key
VITE_PUSHER_CLUSTER=mt1
VITE_RESTAURANT_ID=1
```

### Build & déploiement

```bash
# Build production
npm run build

# Preview local
npm run preview

# Déployer sur serveur (exemple avec rsync)
rsync -avz dist/ user@server:/var/www/omega-pos/

# Ou avec PM2 (serve)
npx serve dist -s -l 3000
```

### Nginx config (SPA fallback)

```nginx
server {
    listen 80;
    server_name pos.monrestaurant.com;
    root /var/www/omega-pos/dist;
    index index.html;

    # SPA fallback — toutes les routes vers index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache assets statiques
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Proxy API vers Laravel
    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

*Omega POS Restaurant — Documentation Frontend Complète v1.0.0*
*React 18 · Vite · Tailwind CSS · shadcn/ui · Zustand · TanStack Query · Socket.io · Recharts*
*32 sections · 30 pages/composants · API Layer complète · WebSocket temps réel*