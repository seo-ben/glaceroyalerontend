import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { usePermissions } from '@/hooks/usePermissions'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, ShoppingCart, UtensilsCrossed, ChefHat, Package,
  BarChart3, Truck, Users, Settings, X, Grid3X3, FileText, ShieldCheck,
  ClipboardList, Bell, Smartphone, Wallet, Cookie, CreditCard,
  Moon, Sun, QrCode
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import logo from '@/assets/logo.png'
import { useTheme } from '@/contexts/ThemeContext'

const NAV = [
  { to: '/dashboard',     label: 'Dashboard',       icon: LayoutDashboard, roles: ['admin','manager','cashier'] },
  { to: '/cash',          label: 'Caisse',           icon: Wallet,          roles: ['admin','manager','cashier'] },
  { to: '/pos',           label: 'Vente (POS)',      icon: ShoppingCart,    roles: ['admin','manager','cashier'] },
  { to: '/orders',        label: 'Commandes',        icon: ClipboardList,   roles: ['admin','manager','cashier'] },
  { to: '/tables',        label: 'Plan de salle',    icon: Grid3X3,         roles: ['admin','manager','cashier','waiter'] },
  { to: '/tables/qr',     label: 'QR Codes',         icon: QrCode,          roles: ['admin','manager'] },
  { to: '/kitchen',       label: 'Cuisine (KDS)',    icon: ChefHat,         roles: ['admin','manager','cook'] },
  { to: '/stock',         label: 'Stock',            icon: Package,         roles: ['admin','manager'] },
  { to: '/reports',       label: 'Rapports',         icon: BarChart3,       roles: ['admin','manager'] },
  { to: '/analytics',     label: 'Analyses',         icon: BarChart3,       roles: ['admin','manager'] },
  { to: '/deliveries',    label: 'Livraisons',       icon: Truck,           roles: ['admin','manager','cashier','driver'] },
  { to: '/products',      label: 'Produits',         icon: UtensilsCrossed, roles: ['admin','manager'] },
  { to: '/categories',    label: 'Catégories',       icon: LayoutDashboard, roles: ['admin','manager'] },
  { to: '/users',         label: 'Utilisateurs',     icon: Users,           roles: ['admin','manager'] },
  { to: '/cancellations', label: 'Annulations',      icon: ClipboardList,   roles: ['admin','manager'] },
  { to: '/audit',         label: 'Audit',            icon: ShieldCheck,     roles: ['admin','manager'] },
  { to: '/tabs',          label: 'Ardoises',         icon: CreditCard,      roles: ['admin','manager','cashier'] },
  { to: '/cakes',         label: 'Gâteaux',          icon: Cookie,          roles: ['admin','manager','cashier','cook'] },
  { to: '/notifications', label: 'Notifications',    icon: Bell,            roles: ['admin','manager','cashier','waiter','cook'] },
  { to: '/settings',      label: 'Paramètres',       icon: Settings,        roles: ['admin'] },
]

export default function Sidebar({ open, onToggle }) {
  const { user }  = useAuthStore()
  const { role }  = usePermissions()
  const { theme, toggleTheme } = useTheme()

  const visibleNav = NAV.filter(n => n.roles.includes(role))

  return (
    <>
      {/* Overlay mobile */}
      {open && (
        <div className="fixed inset-0 bg-background/60 backdrop-blur-sm z-30 lg:hidden" onClick={onToggle} />
      )}

      <aside className={cn(
        'fixed lg:static inset-y-0 left-0 z-40 bg-card border-r border-border flex flex-col transition-all duration-300',
        open ? 'w-64' : 'w-0 lg:w-20',
        !open && 'overflow-hidden'
      )}>
        {/* Header Branding */}
        <div className="h-16 flex items-center px-6 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 shrink-0 p-1.5 overflow-hidden">
               <img src={logo} alt="Logo" className="w-full h-full object-contain invert grayscale brightness-[5]" />
            </div>
            {open && (
              <div className="flex flex-col flex-1">
                <span className="font-black text-foreground text-lg tracking-tighter leading-none uppercase">SmartFlow</span>
                <span className="text-[10px] font-bold text-primary uppercase tracking-widest mt-0.5 leading-none italic">Elite POS</span>
              </div>
            )}
            {open && (
              <Button 
                variant="ghost" size="icon" 
                onClick={onToggle}
                className="lg:hidden h-8 w-8 text-muted-foreground hover:text-foreground"
              >
                <X size={18} />
              </Button>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2 scrollbar-hide no-scrollbar">
          {visibleNav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => cn(
                'flex items-center gap-4 px-4 py-3.5 rounded-2xl text-xs font-bold transition-all group outline-none',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              <Icon size={20} className={cn('shrink-0 transition-transform group-hover:scale-110')} />
              {open && <span className="truncate uppercase tracking-wider">{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Bottom Toggle */}
        <div className="p-4 border-t border-border mt-auto mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className={cn(
                "w-full flex items-center justify-start gap-4 h-12 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all",
                "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              {theme === 'dark' ? <Sun size={20} className="text-yellow-500" /> : <Moon size={20} className="text-indigo-600" />}
              {open && <span>Mode {theme === 'dark' ? 'Éclairé' : 'Sombre'}</span>}
            </Button>
        </div>
      </aside>
    </>
  )
}
