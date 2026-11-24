import { Badge } from '@/components/ui/badge'
import { orderStatusLabel, orderStatusColor, itemStatusColor } from '@/lib/formatters'
import { cn } from '@/lib/utils'

export function OrderStatusBadge({ status, cancellations = [] }) {
  const hasPending = cancellations?.some(c => c.status === 'pending')
  const displayStatus = hasPending ? 'cancelling' : status

  return (
    <Badge className={cn('text-xs font-black uppercase tracking-widest', orderStatusColor(displayStatus))}>
      {orderStatusLabel(displayStatus)}
    </Badge>
  )
}

export function ItemStatusBadge({ status, cancellations = [] }) {
  const hasPending = cancellations?.some(c => c.status === 'pending')
  const labels = {
    pending:   'En attente',
    preparing: 'En préparation',
    done:      'Prêt',
    served:    'Servi',
    cancelled: 'Annulé',
    cancelling: 'Annulation en cours',
  }
  const displayStatus = hasPending ? 'cancelling' : status
  
  return (
    <Badge className={cn('text-[11px] font-black uppercase tracking-widest', itemStatusColor(displayStatus))}>
      {labels[displayStatus] ?? displayStatus}
    </Badge>
  )
}
