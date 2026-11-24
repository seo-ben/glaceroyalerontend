# OMEGA POS RESTAURANT — Documentation Frontend Complète
> **Stack** : React 18 + Vite · Tailwind CSS · shadcn/ui · React Router v6 · Zustand · TanStack Query · Socket.io · Recharts
> **Version** : 1.0.0 | Tous appareils : Desktop · Tablette 10" · Mobile · KDS

---

## TABLE DES MATIÈRES

1. [Architecture & Setup](#1-architecture--setup)
2. [Structure des dossiers](#2-structure-des-dossiers)
3. [Configuration & Thème](#3-configuration--thème)
4. [Store Global — Zustand](#4-store-global--zustand)
5. [API Client — TanStack Query](#5-api-client--tanstack-query)
6. [WebSocket — Temps réel](#6-websocket--temps-réel)
7. [Router & Navigation](#7-router--navigation)
8. [Layouts](#8-layouts)
9. [Page Login](#9-page-login)
10. [Page Dashboard](#10-page-dashboard)
11. [Page Plan de Salle](#11-page-plan-de-salle)
12. [Page POS Caisse](#12-page-pos-caisse)
13. [Modal Paiement](#13-modal-paiement)
14. [Page Commande Table](#14-page-commande-table)
15. [Page KDS Cuisine](#15-page-kds-cuisine)
16. [Page Prise de Commande Mobile](#16-page-prise-de-commande-mobile)
17. [Page Stock & Inventaire](#17-page-stock--inventaire)
18. [Page Rapports](#18-page-rapports)
19. [Page Livraisons](#19-page-livraisons)
20. [Page Utilisateurs & Rôles](#20-page-utilisateurs--rôles)
21. [Page Menu & Produits](#21-page-menu--produits)
22. [Page Paramètres](#22-page-paramètres)
23. [Page Annulations](#23-page-annulations)
24. [Page Audit Trail](#24-page-audit-trail)
25. [Composants Réutilisables](#25-composants-réutilisables)
26. [Hooks Personnalisés](#26-hooks-personnalisés)
27. [Menu QR Client](#27-menu-qr-client)
28. [App Mobile Serveur](#28-app-mobile-serveur)
29. [Notifications & Alertes](#29-notifications--alertes)
30. [Génération & Aperçu Reçu](#30-génération--aperçu-reçu)

---

## 1. ARCHITECTURE & SETUP

### 1.1 Création du projet

```bash
# Créer le projet React + Vite
npm create vite@latest omega-pos-frontend -- --template react
cd omega-pos-frontend

# Dépendances principales
npm install react-router-dom@6
npm install @tanstack/react-query @tanstack/react-query-devtools
npm install zustand
npm install socket.io-client
npm install axios
npm install recharts
npm install date-fns
npm install react-hook-form @hookform/resolvers zod
npm install lucide-react
npm install clsx tailwind-merge
npm install class-variance-authority
npm install @radix-ui/react-dialog
npm install @radix-ui/react-dropdown-menu
npm install @radix-ui/react-select
npm install @radix-ui/react-tabs
npm install @radix-ui/react-toast
npm install @radix-ui/react-avatar
npm install @radix-ui/react-badge
npm install @radix-ui/react-switch
npm install @radix-ui/react-checkbox
npm install @radix-ui/react-separator
npm install @radix-ui/react-popover
npm install react-dnd react-dnd-html5-backend
npm install framer-motion
npm install qrcode.react
npm install react-to-print

# Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# shadcn/ui init
npx shadcn-ui@latest init
```

### 1.2 Variables d'environnement `.env`

```env
VITE_API_URL=http://localhost:8000/api
VITE_APP_URL=http://localhost:5173
VITE_PUSHER_KEY=your_pusher_key
VITE_PUSHER_CLUSTER=mt1
VITE_SOKETI_HOST=127.0.0.1
VITE_SOKETI_PORT=6001
VITE_APP_NAME="Omega POS"
```

### 1.3 `vite.config.js`

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
```

---

## 2. STRUCTURE DES DOSSIERS

```
src/
├── api/
│   ├── client.js          # Axios instance + intercepteurs
│   ├── auth.js
│   ├── orders.js
│   ├── tables.js
│   ├── payments.js
│   ├── products.js
│   ├── stock.js
│   ├── reports.js
│   ├── receipts.js
│   ├── deliveries.js
│   ├── cancellations.js
│   ├── users.js
│   └── notifications.js
├── components/
│   ├── ui/                # shadcn/ui components
│   ├── layout/
│   │   ├── AppLayout.jsx
│   │   ├── Sidebar.jsx
│   │   ├── TopBar.jsx
│   │   ├── KDSLayout.jsx
│   │   └── MobileLayout.jsx
│   ├── pos/
│   │   ├── ProductGrid.jsx
│   │   ├── CartPanel.jsx
│   │   ├── CartItem.jsx
│   │   └── CategoryTabs.jsx
│   ├── tables/
│   │   ├── FloorMap.jsx
│   │   ├── TableCard.jsx
│   │   └── TableActionPanel.jsx
│   ├── orders/
│   │   ├── OrderCard.jsx
│   │   ├── OrderItemRow.jsx
│   │   └── OrderLog.jsx
│   ├── kitchen/
│   │   ├── KDSTicket.jsx
│   │   └── KDSTimer.jsx
│   ├── receipts/
│   │   ├── ReceiptPreview.jsx
│   │   └── ReceiptPrint.jsx
│   └── shared/
│       ├── StatCard.jsx
│       ├── PageHeader.jsx
│       ├── DataTable.jsx
│       ├── SearchInput.jsx
│       ├── StatusBadge.jsx
│       ├── ConfirmDialog.jsx
│       ├── LoadingSpinner.jsx
│       └── EmptyState.jsx
├── hooks/
│   ├── useAuth.js
│   ├── useSocket.js
│   ├── useCart.js
│   ├── usePermissions.js
│   ├── usePrint.js
│   └── useNotifications.js
├── pages/
│   ├── auth/
│   │   └── LoginPage.jsx
│   ├── dashboard/
│   │   └── DashboardPage.jsx
│   ├── tables/
│   │   └── TablesPage.jsx
│   ├── pos/
│   │   └── POSPage.jsx
│   ├── kitchen/
│   │   └── KitchenPage.jsx
│   ├── orders/
│   │   └── OrderDetailPage.jsx
│   ├── stock/
│   │   └── StockPage.jsx
│   ├── reports/
│   │   └── ReportsPage.jsx
│   ├── deliveries/
│   │   └── DeliveriesPage.jsx
│   ├── users/
│   │   └── UsersPage.jsx
│   ├── products/
│   │   └── ProductsPage.jsx
│   ├── settings/
│   │   └── SettingsPage.jsx
│   ├── cancellations/
│   │   └── CancellationsPage.jsx
│   ├── audit/
│   │   └── AuditPage.jsx
│   └── menu/
│       └── PublicMenuPage.jsx
├── stores/
│   ├── authStore.js
│   ├── cartStore.js
│   ├── notificationStore.js
│   └── socketStore.js
├── lib/
│   ├── utils.js
│   ├── constants.js
│   └── formatters.js
├── router/
│   └── index.jsx
├── App.jsx
└── main.jsx
```

---

## 3. CONFIGURATION & THÈME

### 3.1 `tailwind.config.js`

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx,js,jsx}',
    './components/**/*.{ts,tsx,js,jsx}',
    './app/**/*.{ts,tsx,js,jsx}',
    './src/**/*.{ts,tsx,js,jsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: { '2xl': '1400px' },
    },
    extend: {
      colors: {
        // Couleur principale Omega POS — Orange professionnel
        primary: {
          DEFAULT: '#F97316',
          50:  '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          300: '#FDBA74',
          400: '#FB923C',
          500: '#F97316',
          600: '#EA580C',
          700: '#C2410C',
          800: '#9A3412',
          900: '#7C2D12',
        },
        // Fond sombre POS
        pos: {
          bg:      '#0F172A',
          surface: '#1E293B',
          card:    '#263148',
          border:  '#334155',
          muted:   '#64748B',
        },
        border:     'hsl(var(--border))',
        input:      'hsl(var(--input))',
        ring:       'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        secondary: {
          DEFAULT:    'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT:    'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT:    'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT:    'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        card: {
          DEFAULT:    'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: 0 },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: 0 },
        },
        'slide-in': {
          from: { transform: 'translateX(100%)' },
          to:   { transform: 'translateX(0)' },
        },
        'fade-in': {
          from: { opacity: 0, transform: 'translateY(8px)' },
          to:   { opacity: 1, transform: 'translateY(0)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: 1 },
          '50%':       { opacity: 0.6 },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up':   'accordion-up 0.2s ease-out',
        'slide-in':       'slide-in 0.3s ease-out',
        'fade-in':        'fade-in 0.2s ease-out',
        'pulse-soft':     'pulse-soft 2s ease-in-out infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
```

### 3.2 `src/index.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 24 95% 53%;
    --primary-foreground: 0 0% 100%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 24 95% 53%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 24 95% 53%;
    --primary-foreground: 0 0% 100%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 24 95% 53%;
  }
}

@layer base {
  * { @apply border-border; }
  body { @apply bg-background text-foreground font-sans antialiased; }
}

/* Styles POS dark theme */
.pos-dark {
  background-color: #0F172A;
  color: #F1F5F9;
}

/* Scrollbar custom */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: #475569; }

/* Touch optimization pour tablettes */
@media (max-width: 1024px) {
  button, [role="button"] { min-height: 44px; min-width: 44px; }
}

/* KDS full screen */
.kds-screen {
  background: #000;
  color: #fff;
  min-height: 100vh;
}

/* Print styles pour reçu */
@media print {
  body * { visibility: hidden; }
  #receipt-print, #receipt-print * { visibility: visible; }
  #receipt-print {
    position: absolute;
    left: 0; top: 0;
    width: 80mm;
    font-family: 'Courier New', monospace;
  }
}
```

### 3.3 `src/lib/utils.js`

```js
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
```

### 3.4 `src/lib/formatters.js`

```js
import { format, formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

// Formatage montant
export const formatAmount = (amount, currency = 'FCFA', position = 'after') => {
  const formatted = new Intl.NumberFormat('fr-FR').format(Math.round(amount))
  return position === 'before' ? `${currency} ${formatted}` : `${formatted} ${currency}`
}

// Formatage date
export const formatDate = (date, pattern = 'dd/MM/yyyy') =>
  format(new Date(date), pattern, { locale: fr })

export const formatDateTime = (date) =>
  format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: fr })

export const formatTime = (date) =>
  format(new Date(date), 'HH:mm', { locale: fr })

export const timeAgo = (date) =>
  formatDistanceToNow(new Date(date), { addSuffix: true, locale: fr })

// Labels
export const paymentMethodLabel = (method) => ({
  cash:         'Espèces',
  card:         'Carte bancaire',
  wave:         'Wave',
  orange_money: 'Orange Money',
  momo:         'Mobile Money',
  other:        'Autre',
}[method] ?? method)

export const orderStatusLabel = (status) => ({
  open:               'Ouvert',
  sent_to_kitchen:    'En cuisine',
  partially_served:   'Partiellement servi',
  served:             'Servi',
  paid:               'Payé',
  cancelled:          'Annulé',
}[status] ?? status)

export const orderStatusColor = (status) => ({
  open:               'bg-blue-100 text-blue-800',
  sent_to_kitchen:    'bg-orange-100 text-orange-800',
  partially_served:   'bg-yellow-100 text-yellow-800',
  served:             'bg-green-100 text-green-800',
  paid:               'bg-emerald-100 text-emerald-800',
  cancelled:          'bg-red-100 text-red-800',
}[status] ?? 'bg-gray-100 text-gray-800')

export const tableStatusColor = (status) => ({
  free:     'border-green-500 bg-green-500/10',
  occupied: 'border-red-500 bg-red-500/10',
  waiting:  'border-orange-500 bg-orange-500/10',
  reserved: 'border-blue-500 bg-blue-500/10',
}[status] ?? '')

export const itemStatusColor = (status) => ({
  pending:   'bg-slate-100 text-slate-700',
  preparing: 'bg-orange-100 text-orange-700',
  done:      'bg-green-100 text-green-700',
  served:    'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700',
}[status] ?? '')
```

### 3.5 `src/lib/constants.js`

```js
export const ROLES = {
  ADMIN:   'admin',
  MANAGER: 'manager',
  CASHIER: 'cashier',
  WAITER:  'waiter',
  COOK:    'cook',
  DRIVER:  'driver',
}

export const ORDER_TYPES = {
  DINE_IN:  'dine_in',
  TAKEAWAY: 'takeaway',
  DELIVERY: 'delivery',
}

export const PAYMENT_METHODS = [
  { value: 'cash',         label: 'Espèces',        icon: '💵' },
  { value: 'card',         label: 'Carte bancaire',  icon: '💳' },
  { value: 'wave',         label: 'Wave',            icon: '📱' },
  { value: 'orange_money', label: 'Orange Money',    icon: '📲' },
  { value: 'momo',         label: 'Mobile Money',    icon: '📲' },
]

export const KITCHEN_ALERT_MINUTES = 15
export const STOCK_ALERT_THRESHOLD = 1.0 // ratio qty/min_qty
```

---

## 4. STORE GLOBAL — ZUSTAND

### 4.1 `src/stores/authStore.js`

```js
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user:  null,
      token: null,
      isAuthenticated: false,

      setAuth: (user, token) => set({
        user,
        token,
        isAuthenticated: true,
      }),

      logout: () => set({
        user:  null,
        token: null,
        isAuthenticated: false,
      }),

      updateUser: (data) => set((state) => ({
        user: { ...state.user, ...data },
      })),

      // Helpers
      isAdmin:   () => get().user?.role?.name === 'admin',
      isManager: () => ['admin', 'manager'].includes(get().user?.role?.name),
      isCashier: () => get().user?.role?.name === 'cashier',
      isWaiter:  () => get().user?.role?.name === 'waiter',
      isCook:    () => get().user?.role?.name === 'cook',
      isDriver:  () => get().user?.role?.name === 'driver',

      hasPermission: (permission) => {
        const perms = get().user?.role?.permissions ?? []
        return perms.includes('*') || perms.includes(permission)
      },

      restaurantId: () => get().user?.restaurant_id,
    }),
    {
      name: 'omega-auth',
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
    }
  )
)
```

### 4.2 `src/stores/cartStore.js`

```js
import { create } from 'zustand'

export const useCartStore = create((set, get) => ({
  items:    [],
  tableId:  null,
  orderId:  null,
  covers:   1,
  notes:    '',
  discount: { type: null, value: 0, reason: '' },

  setTable: (tableId, orderId = null) => set({ tableId, orderId }),
  setCovers: (covers) => set({ covers }),
  setNotes: (notes) => set({ notes }),

  addItem: (product, qty = 1, modifiers = [], note = '') => {
    const items = get().items
    const key   = product.id + '-' + modifiers.map(m => m.id).join(',')
    const exists = items.find(i => i.key === key)

    if (exists) {
      set({ items: items.map(i => i.key === key ? { ...i, qty: i.qty + qty } : i) })
    } else {
      set({
        items: [...items, {
          key,
          productId:   product.id,
          name:        product.name,
          price:       product.price,
          qty,
          modifiers,
          note,
          course:      1,
          status:      'pending',
        }]
      })
    }
  },

  updateQty: (key, qty) => {
    if (qty <= 0) {
      set({ items: get().items.filter(i => i.key !== key) })
    } else {
      set({ items: get().items.map(i => i.key === key ? { ...i, qty } : i) })
    }
  },

  removeItem: (key) => set({ items: get().items.filter(i => i.key !== key) }),

  setDiscount: (type, value, reason) => set({ discount: { type, value, reason } }),

  subtotal: () => get().items.reduce((sum, item) => {
    const modExtra = item.modifiers.reduce((s, m) => s + (m.extra_price || 0), 0)
    return sum + (item.price + modExtra) * item.qty
  }, 0),

  discountAmount: () => {
    const sub  = get().subtotal()
    const disc = get().discount
    if (!disc.type) return 0
    return disc.type === 'percent'
      ? Math.round(sub * disc.value / 100)
      : Math.min(disc.value, sub)
  },

  vatAmount: () => Math.round((get().subtotal() - get().discountAmount()) * 0.18),

  total: () => get().subtotal() - get().discountAmount() + get().vatAmount(),

  clear: () => set({
    items: [], tableId: null, orderId: null,
    covers: 1, notes: '', discount: { type: null, value: 0, reason: '' },
  }),
}))
```

### 4.3 `src/stores/notificationStore.js`

```js
import { create } from 'zustand'

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount:   0,

  add: (notification) => set((state) => ({
    notifications: [{ ...notification, id: Date.now(), read: false }, ...state.notifications].slice(0, 50),
    unreadCount:   state.unreadCount + 1,
  })),

  markRead: (id) => set((state) => ({
    notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n),
    unreadCount:   Math.max(0, state.unreadCount - 1),
  })),

  markAllRead: () => set((state) => ({
    notifications: state.notifications.map(n => ({ ...n, read: true })),
    unreadCount:   0,
  })),

  clear: () => set({ notifications: [], unreadCount: 0 }),
}))
```

---

## 5. API CLIENT — TANSTACK QUERY

### 5.1 `src/api/client.js`

```js
import axios from 'axios'
import { useAuthStore } from '@/stores/authStore'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  withCredentials: true,
})

// Injecter le token automatiquement
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Gérer les erreurs globalement
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default apiClient
```

### 5.2 `src/api/auth.js`

```js
import apiClient from './client'

export const authApi = {
  login:          (data)  => apiClient.post('/auth/login', data),
  loginPin:       (data)  => apiClient.post('/auth/login-pin', data),
  logout:         ()      => apiClient.post('/auth/logout'),
  me:             ()      => apiClient.get('/auth/me'),
  changePassword: (data)  => apiClient.put('/auth/change-password', data),
}
```

### 5.3 `src/api/orders.js`

```js
import apiClient from './client'

export const ordersApi = {
  list:             (params) => apiClient.get('/orders', { params }),
  show:             (id)     => apiClient.get(`/orders/${id}`),
  create:           (data)   => apiClient.post('/orders', data),
  currentByTable:   (tid)    => apiClient.get(`/orders/table/${tid}/current`),
  updateItems:      (id, d)  => apiClient.put(`/orders/${id}/items`, d),
  addItems:         (id, d)  => apiClient.post(`/orders/${id}/add-items`, d),
  sendToKitchen:    (id, d)  => apiClient.post(`/orders/${id}/send-to-kitchen`, d),
  applyDiscount:    (id, d)  => apiClient.put(`/orders/${id}/discount`, d),
  updateStatus:     (id, d)  => apiClient.put(`/orders/${id}/status`, d),
}
```

### 5.4 `src/api/tables.js`

```js
import apiClient from './client'

export const tablesApi = {
  floors:       ()       => apiClient.get('/floors'),
  floorTables:  (fid)   => apiClient.get(`/floors/${fid}/tables`),
  updateStatus: (id, d) => apiClient.put(`/tables/${id}/status`, d),
  transfer:     (id, d) => apiClient.post(`/tables/${id}/transfer`, d),
  merge:        (d)     => apiClient.post('/tables/merge', d),
  assign:       (id, d) => apiClient.put(`/tables/${id}/assign`, d),
  reserve:      (id, d) => apiClient.post(`/tables/${id}/reserve`, d),
  updateLayout: (id, d) => apiClient.put(`/tables/${id}/layout`, d),
}
```

### 5.5 `src/api/payments.js`

```js
import apiClient from './client'

export const paymentsApi = {
  pay:          (data) => apiClient.post('/payments', data),
  split:        (data) => apiClient.post('/payments/split', data),
  currentSession: ()   => apiClient.get('/cash-sessions/current'),
  openSession:  (data) => apiClient.post('/cash-sessions/open', data),
  closeSession: (id, d) => apiClient.post(`/cash-sessions/${id}/close`, d),
  sessions:     (params) => apiClient.get('/cash-sessions', { params }),
}
```

### 5.6 `src/api/receipts.js`

```js
import apiClient from './client'

export const receiptsApi = {
  show:      (id)  => apiClient.get(`/receipts/${id}`),
  pdf:       (id)  => apiClient.get(`/receipts/${id}/pdf`, { responseType: 'blob' }),
  html:      (id)  => apiClient.get(`/receipts/${id}/html`),
  sendSms:   (id, d) => apiClient.post(`/receipts/${id}/send-sms`, d),
  sendEmail: (id, d) => apiClient.post(`/receipts/${id}/send-email`, d),
}
```

### 5.7 `src/api/reports.js`

```js
import apiClient from './client'

export const reportsApi = {
  dashboard:   ()      => apiClient.get('/reports/dashboard'),
  sales:       (p)     => apiClient.get('/reports/sales', { params: p }),
  topProducts: (p)     => apiClient.get('/reports/top-products', { params: p }),
  byWaiter:    (p)     => apiClient.get('/reports/by-waiter', { params: p }),
  byCategory:  (p)     => apiClient.get('/reports/by-category', { params: p }),
  cashSummary: (p)     => apiClient.get('/reports/cash-summary', { params: p }),
}
```

### 5.8 `src/api/products.js`

```js
import apiClient from './client'

export const productsApi = {
  list:            (p)    => apiClient.get('/products', { params: p }),
  categories:      ()     => apiClient.get('/categories'),
  categoriesFlat:  ()     => apiClient.get('/categories-flat'),
  publicMenu:      (slug) => apiClient.get(`/menu/${slug}`),
  create:          (d)    => apiClient.post('/products', d),
  update:          (id,d) => apiClient.put(`/products/${id}`, d),
  delete:          (id)   => apiClient.delete(`/products/${id}`),
  toggleAvailable: (id)   => apiClient.patch(`/products/${id}/toggle-available`),
  reorder:         (d)    => apiClient.post('/products/reorder', d),
  qrUrl:           (tid)  => apiClient.get(`/qr/${tid}/url`),
  qrImage:         (tid)  => apiClient.get(`/qr/${tid}`, { responseType: 'blob' }),
}
```

### 5.9 `src/api/stock.js`

```js
import apiClient from './client'

export const stockApi = {
  ingredients:  (p)    => apiClient.get('/ingredients', { params: p }),
  alerts:       ()     => apiClient.get('/stock/alerts'),
  value:        ()     => apiClient.get('/stock/value'),
  movement:     (d)    => apiClient.post('/stock/movements', d),
  movements:    (id,p) => apiClient.get(`/ingredients/${id}/movements`, { params: p }),
  recipe:       (pid)  => apiClient.get(`/recipes/${pid}`),
  saveRecipe:   (d)    => apiClient.post('/recipes', d),
  create:       (d)    => apiClient.post('/ingredients', d),
  update:       (id,d) => apiClient.put(`/ingredients/${id}`, d),
}
```

### 5.10 `src/api/notifications.js`

```js
import apiClient from './client'

export const notificationsApi = {
  list: () => apiClient.get('/notifications'),
}
```

### 5.11 `src/main.jsx` — Bootstrap

```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Toaster } from '@/components/ui/toaster'
import App from './App'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:   1000 * 60 * 2, // 2 minutes
      retry:       1,
      refetchOnWindowFocus: false,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </React.StrictMode>
)
```

---

## 6. WEBSOCKET — TEMPS RÉEL

### 6.1 `src/hooks/useSocket.js`

```js
import { useEffect, useRef } from 'react'
import Pusher from 'pusher-js'
import { useAuthStore } from '@/stores/authStore'
import { useNotificationStore } from '@/stores/notificationStore'
import { useQueryClient } from '@tanstack/react-query'

let pusherInstance = null

export function useSocket() {
  const { user, token } = useAuthStore()
  const addNotification  = useNotificationStore(s => s.add)
  const queryClient      = useQueryClient()

  useEffect(() => {
    if (!user || !token) return

    // Initialiser Pusher / Soketi
    pusherInstance = new Pusher(import.meta.env.VITE_PUSHER_KEY, {
      cluster:       import.meta.env.VITE_PUSHER_CLUSTER || 'mt1',
      wsHost:        import.meta.env.VITE_SOKETI_HOST,
      wsPort:        import.meta.env.VITE_SOKETI_PORT || 6001,
      forceTLS:      false,
      enabledTransports: ['ws'],
      authEndpoint:  `${import.meta.env.VITE_API_URL}/broadcasting/auth`,
      auth: {
        headers: { Authorization: `Bearer ${token}` },
      },
    })

    const restaurantChannel = pusherInstance.subscribe(
      `restaurant.${user.restaurant_id}`
    )

    // Nouvelle commande → rafraîchir les listes
    restaurantChannel.bind('order.created', (data) => {
      queryClient.invalidateQueries({ queryKey: ['kitchen-orders'] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      addNotification({
        type:    'order_created',
        level:   'info',
        message: `Nouvelle commande ${data.order_number} — Table ${data.table?.number ?? 'Livraison'}`,
      })
    })

    // Statut item cuisine mis à jour
    restaurantChannel.bind('order.item.status', (data) => {
      queryClient.invalidateQueries({ queryKey: ['order', data.order_id] })
      queryClient.invalidateQueries({ queryKey: ['kitchen-orders'] })
    })

    // Commande prête
    restaurantChannel.bind('order.ready', (data) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['floor-tables'] })
      addNotification({
        type:    'order_ready',
        level:   'success',
        message: `Commande ${data.order_number} prête — Table ${data.table_number}`,
      })
      // Son de notification
      playNotificationSound('ready')
    })

    // Changement statut table
    restaurantChannel.bind('table.status', (data) => {
      queryClient.invalidateQueries({ queryKey: ['floor-tables'] })
    })

    // Mise à jour livraison
    restaurantChannel.bind('delivery.updated', () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] })
    })

    return () => {
      pusherInstance?.unsubscribe(`restaurant.${user.restaurant_id}`)
      pusherInstance?.disconnect()
    }
  }, [user?.id, token])

  return { pusher: pusherInstance }
}

function playNotificationSound(type) {
  const sounds = { ready: '/sounds/order-ready.mp3', new: '/sounds/new-order.mp3' }
  const audio  = new Audio(sounds[type] ?? sounds.new)
  audio.volume = 0.6
  audio.play().catch(() => {}) // Ignorer si autoplay bloqué
}
```

---

## 7. ROUTER & NAVIGATION

### 7.1 `src/router/index.jsx`

```jsx
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

// Layouts
import AppLayout    from '@/components/layout/AppLayout'
import KDSLayout    from '@/components/layout/KDSLayout'
import MobileLayout from '@/components/layout/MobileLayout'

// Pages
import LoginPage         from '@/pages/auth/LoginPage'
import DashboardPage     from '@/pages/dashboard/DashboardPage'
import TablesPage        from '@/pages/tables/TablesPage'
import POSPage           from '@/pages/pos/POSPage'
import KitchenPage       from '@/pages/kitchen/KitchenPage'
import OrderDetailPage   from '@/pages/orders/OrderDetailPage'
import StockPage         from '@/pages/stock/StockPage'
import ReportsPage       from '@/pages/reports/ReportsPage'
import DeliveriesPage    from '@/pages/deliveries/DeliveriesPage'
import UsersPage         from '@/pages/users/UsersPage'
import ProductsPage      from '@/pages/products/ProductsPage'
import SettingsPage      from '@/pages/settings/SettingsPage'
import CancellationsPage from '@/pages/cancellations/CancellationsPage'
import AuditPage         from '@/pages/audit/AuditPage'
import PublicMenuPage    from '@/pages/menu/PublicMenuPage'

// Guard
function PrivateRoute({ children, roles = [] }) {
  const { isAuthenticated, user } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (roles.length && !roles.includes(user?.role?.name)) {
    return <Navigate to="/dashboard" replace />
  }
  return children
}

function PublicRoute({ children }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children
}

export const router = createBrowserRouter([
  // Public
  {
    path: '/login',
    element: <PublicRoute><LoginPage /></PublicRoute>,
  },
  {
    path: '/menu/:slug',
    element: <PublicMenuPage />,
  },

  // App principale (desktop + tablette)
  {
    path: '/',
    element: <PrivateRoute><AppLayout /></PrivateRoute>,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard',     element: <DashboardPage /> },
      { path: 'tables',        element: <TablesPage /> },
      { path: 'pos',           element: <POSPage /> },
      { path: 'orders/:id',    element: <OrderDetailPage /> },
      { path: 'stock',         element: <StockPage /> },
      { path: 'reports',       element: <ReportsPage /> },
      { path: 'deliveries',    element: <DeliveriesPage /> },
      { path: 'products',      element: <ProductsPage /> },
      { path: 'users',         element: <UsersPage />, },
      { path: 'settings',      element: <SettingsPage /> },
      { path: 'cancellations', element: <CancellationsPage /> },
      { path: 'audit',         element: <AuditPage /> },
    ],
  },

  // KDS Cuisine (grand écran dédié)
  {
    path: '/kitchen',
    element: (
      <PrivateRoute roles={['admin', 'manager', 'cook']}>
        <KDSLayout><KitchenPage /></KDSLayout>
      </PrivateRoute>
    ),
  },

  // 404
  { path: '*', element: <Navigate to="/dashboard" replace /> },
])
```

---

## 8. LAYOUTS

### 8.1 `src/components/layout/AppLayout.jsx`

```jsx
import { Outlet } from 'react-router-dom'
import { useEffect } from 'react'
import Sidebar from './Sidebar'
import TopBar  from './TopBar'
import { useSocket } from '@/hooks/useSocket'

export default function AppLayout() {
  useSocket() // Active les WebSockets pour tout le layout

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Contenu principal */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
```

### 8.2 `src/components/layout/Sidebar.jsx`

```jsx
import { NavLink, useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import { authApi } from '@/api/auth'
import { useQueryClient } from '@tanstack/react-query'
import {
  LayoutDashboard, UtensilsCrossed, CreditCard, ChefHat,
  Package, BarChart3, Truck, Users, Settings, FileText,
  ShieldAlert, LogOut, BookOpen,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip'

const NAV_ITEMS = [
  { path: '/dashboard',     icon: LayoutDashboard,  label: 'Dashboard',      roles: ['admin','manager'] },
  { path: '/tables',        icon: UtensilsCrossed,  label: 'Tables',          roles: ['admin','manager','cashier','waiter'] },
  { path: '/pos',           icon: CreditCard,       label: 'Caisse POS',      roles: ['admin','manager','cashier'] },
  { path: '/kitchen',       icon: ChefHat,          label: 'Cuisine KDS',     roles: ['admin','manager','cook'] },
  { path: '/products',      icon: BookOpen,         label: 'Menu / Produits', roles: ['admin','manager'] },
  { path: '/stock',         icon: Package,          label: 'Stock',           roles: ['admin','manager'] },
  { path: '/deliveries',    icon: Truck,            label: 'Livraisons',      roles: ['admin','manager','driver'] },
  { path: '/reports',       icon: BarChart3,        label: 'Rapports',        roles: ['admin','manager'] },
  { path: '/users',         icon: Users,            label: 'Utilisateurs',    roles: ['admin','manager'] },
  { path: '/cancellations', icon: ShieldAlert,      label: 'Annulations',     roles: ['admin','manager'] },
  { path: '/audit',         icon: FileText,         label: 'Audit Trail',     roles: ['admin','manager'] },
  { path: '/settings',      icon: Settings,         label: 'Paramètres',      roles: ['admin'] },
]

export default function Sidebar() {
  const { user, logout, isManager } = useAuthStore()
  const navigate    = useNavigate()
  const queryClient = useQueryClient()

  const handleLogout = async () => {
    await authApi.logout().catch(() => {})
    queryClient.clear()
    logout()
    navigate('/login')
  }

  const visibleItems = NAV_ITEMS.filter(item =>
    item.roles.includes(user?.role?.name)
  )

  return (
    <TooltipProvider delayDuration={0}>
      <aside className="hidden md:flex flex-col w-16 lg:w-56 bg-pos-bg border-r border-pos-border shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-3 px-3 lg:px-4 py-5 border-b border-pos-border">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-lg shrink-0">
            Ω
          </div>
          <span className="hidden lg:block text-white font-semibold text-sm">
            Omega POS
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {visibleItems.map(({ path, icon: Icon, label }) => (
            <Tooltip key={path}>
              <TooltipTrigger asChild>
                <NavLink
                  to={path}
                  className={({ isActive }) => cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium',
                    isActive
                      ? 'bg-primary text-white'
                      : 'text-slate-400 hover:text-white hover:bg-pos-surface'
                  )}
                >
                  <Icon size={18} className="shrink-0" />
                  <span className="hidden lg:block">{label}</span>
                </NavLink>
              </TooltipTrigger>
              <TooltipContent side="right" className="lg:hidden">
                {label}
              </TooltipContent>
            </Tooltip>
          ))}
        </nav>

        {/* User + Logout */}
        <div className="p-2 lg:p-3 border-t border-pos-border">
          <div className="hidden lg:flex items-center gap-3 px-2 py-2 mb-2">
            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-medium truncate">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-slate-500 text-xs capitalize">
                {user?.role?.display_name}
              </p>
            </div>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="w-full text-slate-400 hover:text-red-400 hover:bg-red-400/10 justify-start gap-3"
              >
                <LogOut size={16} />
                <span className="hidden lg:block">Déconnexion</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="lg:hidden">Déconnexion</TooltipContent>
          </Tooltip>
        </div>
      </aside>
    </TooltipProvider>
  )
}
```

### 8.3 `src/components/layout/TopBar.jsx`

```jsx
import { Bell, Menu } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useNotificationStore } from '@/stores/notificationStore'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { formatDateTime } from '@/lib/formatters'

export default function TopBar() {
  const { user } = useAuthStore()
  const { notifications, unreadCount, markRead, markAllRead } = useNotificationStore()

  return (
    <header className="h-14 border-b bg-background flex items-center justify-between px-4 shrink-0">
      {/* Mobile menu trigger */}
      <Button variant="ghost" size="icon" className="md:hidden">
        <Menu size={18} />
      </Button>

      {/* Breadcrumb / Page title — rempli par les pages */}
      <div id="topbar-title" className="flex-1" />

      {/* Actions droite */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell size={18} />
              {unreadCount > 0 && (
                <Badge
                  className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px] bg-red-500"
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="flex items-center justify-between px-3 py-2">
              <span className="font-medium text-sm">Notifications</span>
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" className="text-xs h-6" onClick={markAllRead}>
                  Tout marquer lu
                </Button>
              )}
            </div>
            <DropdownMenuSeparator />
            {notifications.length === 0 ? (
              <div className="px-3 py-6 text-center text-muted-foreground text-sm">
                Aucune notification
              </div>
            ) : (
              notifications.slice(0, 8).map(n => (
                <DropdownMenuItem
                  key={n.id}
                  onClick={() => markRead(n.id)}
                  className={cn('flex flex-col items-start gap-0.5 px-3 py-2',
                    !n.read && 'bg-primary/5'
                  )}
                >
                  <span className="text-sm">{n.message}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDateTime(new Date(n.id))}
                  </span>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Avatar user */}
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold cursor-pointer">
          {user?.first_name?.[0]}{user?.last_name?.[0]}
        </div>
      </div>
    </header>
  )
}
```

### 8.4 `src/components/layout/KDSLayout.jsx`

```jsx
import { Clock } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useSocket } from '@/hooks/useSocket'
import { formatTime } from '@/lib/formatters'

export default function KDSLayout({ children }) {
  useSocket()
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="kds-screen flex flex-col">
      {/* KDS TopBar */}
      <div className="flex items-center justify-between px-6 py-3 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-white font-bold">Ω</div>
          <span className="text-white font-semibold">Cuisine — Omega POS</span>
        </div>
        <div className="flex items-center gap-2 text-gray-400">
          <Clock size={16} />
          <span className="text-lg font-mono text-white">{formatTime(time)}</span>
        </div>
      </div>

      {/* Contenu KDS */}
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  )
}
```

---

## 9. PAGE LOGIN

### `src/pages/auth/LoginPage.jsx`

```jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

const loginSchema = z.object({
  email:    z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
})

const pinSchema = z.object({
  restaurant_id: z.string().min(1, 'ID restaurant requis'),
  pin:           z.string().min(4, 'PIN requis'),
})

export default function LoginPage() {
  const navigate  = useNavigate()
  const setAuth   = useAuthStore(s => s.setAuth)
  const { toast } = useToast()
  const [showPass, setShowPass] = useState(false)
  const [pinDigits, setPinDigits] = useState('')

  // Login email
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
  })

  const loginMutation = useMutation({
    mutationFn: (data) => authApi.login(data),
    onSuccess: ({ data }) => {
      setAuth(data.user, data.token)
      navigate('/dashboard')
    },
    onError: (err) => {
      toast({
        variant: 'destructive',
        title:   'Connexion échouée',
        description: err.response?.data?.message ?? 'Identifiants incorrects',
      })
    },
  })

  // Login PIN
  const pinMutation = useMutation({
    mutationFn: (data) => authApi.loginPin(data),
    onSuccess: ({ data }) => {
      setAuth(data.user, data.token)
      navigate('/tables')
    },
    onError: () => {
      toast({ variant: 'destructive', title: 'PIN incorrect' })
      setPinDigits('')
    },
  })

  const handlePinDigit = (digit) => {
    const next = pinDigits + digit
    setPinDigits(next)
    if (next.length === 4) {
      pinMutation.mutate({
        restaurant_id: import.meta.env.VITE_RESTAURANT_ID ?? '1',
        pin: next,
      })
    }
  }

  return (
    <div className="min-h-screen bg-pos-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary mx-auto flex items-center justify-center text-white text-3xl font-bold mb-4">
            Ω
          </div>
          <h1 className="text-2xl font-bold text-white">Omega POS</h1>
          <p className="text-slate-400 text-sm mt-1">Système de caisse restaurant</p>
        </div>

        <Card className="bg-pos-surface border-pos-border">
          <CardContent className="pt-6">
            <Tabs defaultValue="email">
              <TabsList className="w-full bg-pos-card mb-6">
                <TabsTrigger value="email" className="flex-1">Email</TabsTrigger>
                <TabsTrigger value="pin"   className="flex-1">PIN rapide</TabsTrigger>
              </TabsList>

              {/* TAB EMAIL */}
              <TabsContent value="email">
                <form onSubmit={handleSubmit(d => loginMutation.mutate(d))} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-slate-300">Email</Label>
                    <Input
                      {...register('email')}
                      type="email"
                      placeholder="admin@omega.tg"
                      className="bg-pos-card border-pos-border text-white placeholder:text-slate-500"
                    />
                    {errors.email && (
                      <p className="text-red-400 text-xs">{errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-slate-300">Mot de passe</Label>
                    <div className="relative">
                      <Input
                        {...register('password')}
                        type={showPass ? 'text' : 'password'}
                        placeholder="••••••••"
                        className="bg-pos-card border-pos-border text-white placeholder:text-slate-500 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass(!showPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-red-400 text-xs">{errors.password.message}</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary-600 text-white font-medium h-11"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending
                      ? <><Loader2 size={16} className="animate-spin mr-2" />Connexion...</>
                      : 'Se connecter'
                    }
                  </Button>
                </form>
              </TabsContent>

              {/* TAB PIN */}
              <TabsContent value="pin">
                <div className="space-y-6">
                  {/* Affichage PIN */}
                  <div className="flex justify-center gap-3">
                    {[0,1,2,3].map(i => (
                      <div
                        key={i}
                        className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center text-2xl transition-all ${
                          i < pinDigits.length
                            ? 'border-primary bg-primary/20 text-white'
                            : 'border-pos-border bg-pos-card'
                        }`}
                      >
                        {i < pinDigits.length ? '●' : ''}
                      </div>
                    ))}
                  </div>

                  {/* Clavier numérique */}
                  <div className="grid grid-cols-3 gap-3">
                    {[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map((key, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          if (key === '⌫') setPinDigits(p => p.slice(0,-1))
                          else if (key !== '') handlePinDigit(String(key))
                        }}
                        disabled={pinMutation.isPending}
                        className={`h-14 rounded-xl text-xl font-semibold transition-all active:scale-95 ${
                          key === ''
                            ? 'invisible'
                            : key === '⌫'
                            ? 'bg-pos-card border border-pos-border text-slate-400 hover:text-white hover:border-slate-500'
                            : 'bg-pos-card border border-pos-border text-white hover:bg-pos-border hover:border-primary'
                        }`}
                      >
                        {pinMutation.isPending && pinDigits.length === 4
                          ? <Loader2 size={20} className="animate-spin mx-auto" />
                          : key
                        }
                      </button>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
```

---

## 10. PAGE DASHBOARD

### `src/pages/dashboard/DashboardPage.jsx`

```jsx
import { useQuery } from '@tanstack/react-query'
import { reportsApi } from '@/api/reports'
import { notificationsApi } from '@/api/notifications'
import StatCard from '@/components/shared/StatCard'
import PageHeader from '@/components/shared/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts'
import { formatAmount, formatTime, orderStatusColor } from '@/lib/formatters'
import { TrendingUp, TrendingDown, Users, UtensilsCrossed, CreditCard, AlertTriangle } from 'lucide-react'
import { format, subDays } from 'date-fns'
import { fr } from 'date-fns/locale'

const PIE_COLORS = ['#F97316','#3B82F6','#10B981','#8B5CF6','#EC4899']

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn:  () => reportsApi.dashboard().then(r => r.data),
    refetchInterval: 30000, // Rafraîchir toutes les 30s
  })

  const { data: salesData } = useQuery({
    queryKey: ['sales-week'],
    queryFn:  () => reportsApi.sales({
      from: format(subDays(new Date(), 6), 'yyyy-MM-dd'),
      to:   format(new Date(), 'yyyy-MM-dd'),
    }).then(r => r.data),
  })

  const { data: topProducts } = useQuery({
    queryKey: ['top-products-today'],
    queryFn:  () => reportsApi.topProducts({
      from:  format(new Date(), 'yyyy-MM-dd'),
      to:    format(new Date(), 'yyyy-MM-dd'),
      limit: 5,
    }).then(r => r.data),
  })

  const { data: alerts } = useQuery({
    queryKey: ['notifications'],
    queryFn:  () => notificationsApi.list().then(r => r.data),
    refetchInterval: 60000,
  })

  if (isLoading) return <DashboardSkeleton />

  const growthPositive = (stats?.growth_percent ?? 0) >= 0

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Tableau de bord"
        subtitle={`${format(new Date(), "EEEE d MMMM yyyy", { locale: fr })} · Service en cours`}
      >
        <Badge variant={growthPositive ? 'default' : 'destructive'} className="gap-1">
          {growthPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {Math.abs(stats?.growth_percent ?? 0).toFixed(1)}% vs hier
        </Badge>
      </PageHeader>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="CA du jour"
          value={formatAmount(stats?.revenue_today ?? 0)}
          icon={CreditCard}
          trend={stats?.growth_percent}
          color="orange"
        />
        <StatCard
          label="Commandes"
          value={stats?.orders_today ?? 0}
          icon={UtensilsCrossed}
          color="blue"
        />
        <StatCard
          label="Ticket moyen"
          value={formatAmount(stats?.avg_ticket ?? 0)}
          icon={TrendingUp}
          color="green"
        />
        <StatCard
          label="Tables actives"
          value={`${stats?.tables?.occupied?.count ?? 0}/${
            Object.values(stats?.tables ?? {}).reduce((s, t) => s + (t.count ?? 0), 0)
          }`}
          icon={Users}
          color="purple"
          subtitle={`${stats?.tables?.waiting?.count ?? 0} en attente`}
        />
      </div>

      {/* Alertes */}
      {alerts?.has_danger && (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/30">
          <AlertTriangle size={18} className="text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-red-400 font-medium text-sm">
              {alerts.count} alerte{alerts.count > 1 ? 's' : ''} active{alerts.count > 1 ? 's' : ''}
            </p>
            <p className="text-red-400/70 text-xs mt-0.5">
              {alerts.notifications.filter(n => n.level === 'danger').map(n => n.message).join(' · ')}
            </p>
          </div>
        </div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Courbe CA semaine */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Ventes — 7 derniers jours</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={salesData?.by_day ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  tickFormatter={d => format(new Date(d), 'dd/MM')}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={v => `${(v/1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(v) => [formatAmount(v), 'CA']}
                  labelFormatter={d => format(new Date(d), 'dd MMMM', { locale: fr })}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#F97316"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#F97316' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top produits */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Top produits du jour</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(topProducts ?? []).slice(0, 5).map((item, i) => (
                <div key={item.product_id} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-4 shrink-0">
                    #{i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {item.product?.name}
                    </p>
                    <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                      <div
                        className="bg-primary h-1.5 rounded-full"
                        style={{ width: `${Math.min(100, (item.total_qty / (topProducts[0]?.total_qty || 1)) * 100)}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    ×{item.total_qty}
                  </span>
                </div>
              ))}
              {(!topProducts || topProducts.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Aucune vente aujourd'hui
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Statuts tables */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { key: 'free',     label: 'Libres',     color: 'bg-green-500' },
          { key: 'occupied', label: 'Occupées',   color: 'bg-red-500' },
          { key: 'waiting',  label: 'En attente', color: 'bg-orange-500' },
          { key: 'reserved', label: 'Réservées',  color: 'bg-blue-500' },
        ].map(({ key, label, color }) => (
          <div key={key} className="bg-card border rounded-lg p-4 flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${color}`} />
            <div>
              <p className="text-2xl font-bold">{stats?.tables?.[key]?.count ?? 0}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Skeleton className="lg:col-span-2 h-72" />
        <Skeleton className="h-72" />
      </div>
    </div>
  )
}
```

---

## 11. PAGE PLAN DE SALLE

### `src/pages/tables/TablesPage.jsx`

```jsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { tablesApi } from '@/api/tables'
import { cn } from '@/lib/utils'
import { tableStatusColor } from '@/lib/formatters'
import PageHeader from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import TableActionPanel from '@/components/tables/TableActionPanel'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Users, Clock, ChefHat, RefreshCw } from 'lucide-react'

const STATUS_LABELS = {
  free:     { label: 'Libre',      dot: 'bg-green-500' },
  occupied: { label: 'Occupée',    dot: 'bg-red-500' },
  waiting:  { label: 'En attente', dot: 'bg-orange-500' },
  reserved: { label: 'Réservée',   dot: 'bg-blue-500' },
}

export default function TablesPage() {
  const queryClient = useQueryClient()
  const navigate    = useNavigate()
  const [activeFloor, setActiveFloor]   = useState(null)
  const [selectedTable, setSelectedTable] = useState(null)

  // Récupérer les salles
  const { data: floors = [] } = useQuery({
    queryKey: ['floors'],
    queryFn:  () => tablesApi.floors().then(r => r.data),
    onSuccess: (data) => { if (!activeFloor && data[0]) setActiveFloor(data[0].id) },
  })

  // Tables de la salle active
  const { data: tables = [], isLoading } = useQuery({
    queryKey: ['floor-tables', activeFloor],
    queryFn:  () => tablesApi.floorTables(activeFloor).then(r => r.data),
    enabled:  !!activeFloor,
    refetchInterval: 10000,
  })

  const currentFloor = floors.find(f => f.id === activeFloor)

  // Stats par statut
  const stats = tables.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1
    return acc
  }, {})

  return (
    <div className="flex h-full gap-4 animate-fade-in overflow-hidden">
      {/* Panneau principal */}
      <div className="flex-1 flex flex-col min-w-0">
        <PageHeader title="Plan de salle" subtitle="Gestion des tables en temps réel">
          <Button
            variant="outline"
            size="sm"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['floor-tables'] })}
          >
            <RefreshCw size={14} className="mr-2" />
            Actualiser
          </Button>
        </PageHeader>

        {/* Légende statuts */}
        <div className="flex items-center gap-4 mb-4 flex-wrap">
          {Object.entries(STATUS_LABELS).map(([key, { label, dot }]) => (
            <div key={key} className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <div className={`w-2.5 h-2.5 rounded-full ${dot}`} />
              {label}
              {stats[key] ? (
                <span className="font-medium text-foreground">({stats[key]})</span>
              ) : null}
            </div>
          ))}
        </div>

        {/* Onglets salles */}
        {floors.length > 1 && (
          <Tabs
            value={String(activeFloor)}
            onValueChange={v => { setActiveFloor(Number(v)); setSelectedTable(null) }}
            className="mb-4"
          >
            <TabsList>
              {floors.map(f => (
                <TabsTrigger key={f.id} value={String(f.id)}>
                  {f.name}
                  <Badge variant="secondary" className="ml-2 text-[10px]">
                    {f.occupied_count}/{f.tables_count}
                  </Badge>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        )}

        {/* Grille des tables */}
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : (
          <div
            className="flex-1 relative bg-slate-50 dark:bg-slate-900/50 rounded-xl border overflow-auto p-4"
            style={{ minHeight: '400px' }}
          >
            {/* Tables positionnées sur la carte */}
            {tables.map(table => (
              <TableCard
                key={table.id}
                table={table}
                isSelected={selectedTable?.id === table.id}
                onClick={() => setSelectedTable(
                  selectedTable?.id === table.id ? null : table
                )}
              />
            ))}
            {tables.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-muted-foreground text-sm">Aucune table dans cette salle</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Panel action table sélectionnée */}
      {selectedTable && (
        <div className="w-72 shrink-0">
          <TableActionPanel
            table={selectedTable}
            onClose={() => setSelectedTable(null)}
            onAction={() => {
              queryClient.invalidateQueries({ queryKey: ['floor-tables'] })
              setSelectedTable(null)
            }}
          />
        </div>
      )}
    </div>
  )
}

function TableCard({ table, isSelected, onClick }) {
  const s = STATUS_LABELS[table.status]
  const occupiedMins = table.occupation_minutes

  return (
    <div
      onClick={onClick}
      style={{
        position:   'absolute',
        left:       table.position_x,
        top:        table.position_y,
        width:      table.width ?? 120,
        height:     table.height ?? 80,
        borderRadius: table.shape === 'round' ? '50%' : '12px',
      }}
      className={cn(
        'cursor-pointer border-2 flex flex-col items-center justify-center transition-all select-none',
        tableStatusColor(table.status),
        isSelected ? 'ring-2 ring-offset-2 ring-primary scale-105 z-10' : 'hover:scale-102 hover:z-10'
      )}
    >
      <span className="font-bold text-base">T{table.number}</span>
      <span className="text-xs opacity-70">{table.capacity} pers.</span>
      {table.status === 'occupied' && occupiedMins && (
        <span className="text-xs opacity-60 flex items-center gap-0.5 mt-0.5">
          <Clock size={9} />
          {occupiedMins}min
        </span>
      )}
      {table.assigned_user && (
        <span className="text-[10px] opacity-60 truncate px-1">
          {table.assigned_user.first_name}
        </span>
      )}
    </div>
  )
}
```

### `src/components/tables/TableActionPanel.jsx`

```jsx
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { tablesApi } from '@/api/tables'
import { ordersApi } from '@/api/orders'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { formatAmount, formatDistanceToNow } from '@/lib/formatters'
import {
  X, Eye, Plus, ChefHat, Scissors, ArrowRight,
  Tag, CreditCard, Trash2,
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'

export default function TableActionPanel({ table, onClose, onAction }) {
  const navigate    = useNavigate()
  const { toast }   = useToast()
  const { isManager } = useAuthStore()
  const queryClient = useQueryClient()

  // Commande active
  const { data: orderData } = useQuery({
    queryKey: ['current-order', table.id],
    queryFn:  () => ordersApi.currentByTable(table.id).then(r => r.data),
    enabled:  table.status === 'occupied',
    retry:    false,
  })

  const freeTableMutation = useMutation({
    mutationFn: () => tablesApi.updateStatus(table.id, { status: 'free' }),
    onSuccess:  () => { toast({ title: 'Table libérée' }); onAction() },
    onError:    (e) => toast({ variant: 'destructive', description: e.response?.data?.message }),
  })

  const order = orderData?.order

  const ACTIONS = [
    {
      label:   'Voir la commande',
      icon:    Eye,
      color:   'default',
      show:    table.status === 'occupied',
      onClick: () => order && navigate(`/orders/${order.id}`),
    },
    {
      label:   'Nouvelle commande',
      icon:    Plus,
      color:   'default',
      show:    table.status === 'free',
      onClick: () => navigate(`/pos?table=${table.id}`),
    },
    {
      label:   'Ajouter des articles',
      icon:    Plus,
      color:   'outline',
      show:    table.status === 'occupied',
      onClick: () => navigate(`/pos?table=${table.id}&order=${order?.id}`),
    },
    {
      label:   'Envoyer en cuisine',
      icon:    ChefHat,
      color:   'warning',
      show:    table.status === 'occupied',
      onClick: () => order && navigate(`/orders/${order.id}#kitchen`),
    },
    {
      label:   'Diviser la facture',
      icon:    Scissors,
      color:   'outline',
      show:    table.status === 'occupied',
      onClick: () => order && navigate(`/orders/${order.id}?action=split`),
    },
    {
      label:   'Transférer',
      icon:    ArrowRight,
      color:   'outline',
      show:    table.status === 'occupied',
      onClick: () => order && navigate(`/orders/${order.id}?action=transfer`),
    },
    {
      label:   'Appliquer une remise',
      icon:    Tag,
      color:   'outline',
      show:    table.status === 'occupied' && isManager(),
      onClick: () => order && navigate(`/orders/${order.id}?action=discount`),
    },
    {
      label:   'Encaisser',
      icon:    CreditCard,
      color:   'primary',
      show:    table.status === 'occupied',
      onClick: () => order && navigate(`/pos?order=${order.id}&pay=1`),
    },
    {
      label:   'Libérer la table',
      icon:    Trash2,
      color:   'destructive',
      show:    table.status === 'occupied' && isManager(),
      onClick: () => freeTableMutation.mutate(),
    },
  ]

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Table {table.number}</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7">
            <X size={14} />
          </Button>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{table.capacity} couverts</span>
          <span>·</span>
          <Badge variant={
            table.status === 'free'     ? 'success' :
            table.status === 'occupied' ? 'destructive' :
            table.status === 'waiting'  ? 'warning' : 'secondary'
          }>
            {table.status === 'free'     ? 'Libre' :
             table.status === 'occupied' ? 'Occupée' :
             table.status === 'waiting'  ? 'En attente' : 'Réservée'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-3 overflow-y-auto">
        {/* Résumé commande */}
        {order && (
          <div className="p-3 rounded-lg bg-muted/50 text-sm space-y-1">
            <div className="flex justify-between font-medium">
              <span>{order.order_number}</span>
              <span>{formatAmount(order.total)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground text-xs">
              <span>{order.items?.length ?? 0} article(s)</span>
              <span>{order.covers} couvert(s)</span>
            </div>
          </div>
        )}

        <Separator />

        {/* Actions */}
        <div className="space-y-2">
          {ACTIONS.filter(a => a.show).map(({ label, icon: Icon, color, onClick }) => (
            <Button
              key={label}
              variant={color === 'primary' ? 'default' : color === 'warning' ? 'outline' : color}
              className={cn(
                'w-full justify-start gap-2 text-sm',
                color === 'primary'     && 'bg-primary hover:bg-primary-600 text-white',
                color === 'warning'     && 'border-orange-500 text-orange-600 hover:bg-orange-50',
                color === 'destructive' && 'border-red-500 text-red-600 hover:bg-red-50',
              )}
              onClick={onClick}
              disabled={freeTableMutation.isPending}
            >
              <Icon size={15} />
              {label}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}