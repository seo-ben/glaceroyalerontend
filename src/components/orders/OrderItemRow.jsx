import { ItemStatusBadge } from '@/components/shared/StatusBadge'
import { formatAmount } from '@/lib/formatters'

export default function OrderItemRow({ item }) {
  const modTotal = (item.modifiers ?? []).reduce((s, m) => s + (m.pivot?.extra_price ?? m.extra_price ?? 0), 0)

  return (
    <div className="flex items-center gap-3 py-2 border-b last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{item.quantity}×</span>
          <span className="text-sm font-medium truncate">{item.product?.name ?? item.name}</span>
        </div>
        {item.modifiers?.length > 0 && (
          <p className="text-xs text-muted-foreground ml-6">
            + {item.modifiers.map(m => m.name).join(', ')}
          </p>
        )}
        {item.note && (
          <p className="text-xs text-black font-bold italic ml-6">📝 {item.note}</p>
        )}
      </div>
      <ItemStatusBadge status={item.status} cancellations={item.cancellations} />
      <span className="text-sm font-medium shrink-0">
        {formatAmount((item.unit_price + modTotal) * item.quantity)}
      </span>
    </div>
  )
}
