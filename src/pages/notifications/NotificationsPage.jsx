import { useNotificationStore } from '@/stores/notificationStore'
import { useNotifications } from '@/hooks/useNotifications'
import PageHeader from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'
import { Bell, CheckCircle2, AlertTriangle, AlertCircle, Clock, Package, XCircle, Check } from 'lucide-react'

const ICONS = {
  order_created: { icon: Bell, color: 'text-blue-500', bg: 'bg-blue-50' },
  order_ready: { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50' },
  order_late: { icon: Clock, color: 'text-red-500', bg: 'bg-red-50' },
  stock_low: { icon: Package, color: 'text-orange-500', bg: 'bg-orange-50' },
  stock_rupture: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50' },
  default: { icon: Bell, color: 'text-gray-500', bg: 'bg-gray-50' },
}

export default function NotificationsPage() {
  const { notifications, unreadCount, markRead, markAllRead, clear } = useNotificationStore()
  const { alerts, hasDanger } = useNotifications()
  const navigate = useNavigate()

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <PageHeader title="Notifications & Alertes" subtitle="Toutes les alertes système">
        <div className="flex gap-2">
          {unreadCount > 0 && <Button size="sm" variant="outline" onClick={markAllRead}><Check size={14} className="mr-1.5" /> Tout lu</Button>}
          {notifications.length > 0 && <Button size="sm" variant="outline" className="text-red-500" onClick={clear}>Effacer</Button>}
        </div>
      </PageHeader>

      {hasDanger && (
        <div className="space-y-2">
          <h3 className="font-medium text-sm text-red-600 flex items-center gap-2"><AlertCircle size={14} /> Alertes critiques</h3>
          {alerts.filter(a => a.level === 'danger').map((alert, i) => (
            <div key={i} className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
              <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-sm text-red-800">{alert.message}</p>
                {alert.type === 'stock_low' && <Button variant="link" size="sm" className="h-5 p-0 text-xs text-red-600" onClick={() => navigate('/stock?alert=1')}>Voir →</Button>}
              </div>
            </div>
          ))}
        </div>
      )}

      {alerts.filter(a => a.level === 'warning').length > 0 && (
        <div className="space-y-2">
          <h3 className="font-medium text-sm text-orange-600 flex items-center gap-2"><AlertTriangle size={14} /> Avertissements</h3>
          {alerts.filter(a => a.level === 'warning').map((alert, i) => (
            <div key={i} className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-xl">
              <AlertTriangle size={18} className="text-orange-500 shrink-0 mt-0.5" />
              <p className="text-sm text-orange-800">{alert.message}</p>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2">
        <h3 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
          <Bell size={14} /> Activité récente
          {unreadCount > 0 && <Badge className="bg-primary text-white text-[10px]">{unreadCount}</Badge>}
        </h3>
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-muted-foreground"><Bell size={32} className="opacity-20 mb-3" /><p className="text-sm">Aucune notification</p></div>
        ) : notifications.map(n => {
          const cfg = ICONS[n.type] ?? ICONS.default
          const Icon = cfg.icon
          return (
            <div key={n.id} onClick={() => markRead(n.id)} className={cn('flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all hover:border-primary/30', !n.read && 'bg-primary/5 border-primary/20', n.read && 'opacity-70')}>
              <div className={cn('w-9 h-9 rounded-full flex items-center justify-center shrink-0', cfg.bg)}><Icon size={17} className={cfg.color} /></div>
              <div className="flex-1 min-w-0">
                <p className={cn('text-sm', !n.read && 'font-medium')}>{n.message}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{new Date(n.id).toLocaleTimeString('fr-FR')}</p>
              </div>
              {!n.read && <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />}
            </div>
          )
        })}
      </div>
    </div>
  )
}
