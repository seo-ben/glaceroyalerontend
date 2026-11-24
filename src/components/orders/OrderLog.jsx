import { formatDateTime } from '@/lib/formatters'

export default function OrderLog({ logs = [] }) {
  if (!logs.length) return null

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-muted-foreground">Historique</h3>
      <div className="space-y-1">
        {logs.map((log, i) => (
          <div key={i} className="flex items-start gap-3 text-xs py-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-foreground">{log.description ?? log.action}</p>
              <p className="text-muted-foreground">
                {log.user?.first_name} · {formatDateTime(log.created_at)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
