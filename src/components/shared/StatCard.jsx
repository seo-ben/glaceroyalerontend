import { cn } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'

const COLORS = {
  orange: 'from-primary/10 to-transparent',
  blue:   'from-blue-500/10 to-transparent',
  green:  'from-green-500/10 to-transparent',
  purple: 'from-purple-500/10 to-transparent',
  red:    'from-red-500/10 to-transparent',
}

const ICON_COLORS = {
  orange: 'bg-primary text-primary-foreground',
  blue:   'bg-blue-500 text-white',
  green:  'bg-green-500 text-white',
  purple: 'bg-purple-500 text-white',
  red:    'bg-red-500 text-white',
}

export default function StatCard({ label, value, icon: Icon, trend, color = 'orange', description, progress }) {
  return (
    <div className={cn(
      'rounded-2xl border border-border p-5 bg-card bg-gradient-to-br transition-all hover:scale-[1.02] duration-300 relative overflow-hidden',
      COLORS[color]
    )}>
      {/* Container */}
      <div className="relative z-10 flex items-start justify-between mb-4">
        <div className="space-y-1">
          <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">{label}</p>
          <p className="text-2xl font-black text-foreground">{value}</p>
        </div>
        {Icon && (
          <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg', ICON_COLORS[color])}>
            <Icon size={24} />
          </div>
        )}
      </div>

      {progress !== undefined ? (
        <div className="space-y-1.5">
           <Progress value={progress} className="h-1.5 bg-muted" indicatorClassName={ICON_COLORS[color]} />
           <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase">
              <span>Occupé</span>
              <span className={cn(progress > 80 ? 'text-primary' : 'text-muted-foreground')}>{Math.round(progress)}%</span>
           </div>
        </div>
      ) : (
        <p className={cn('text-xs font-bold flex items-center gap-1.5', trend < 0 ? 'text-red-500' : 'text-muted-foreground')}>
          {description || (trend !== undefined && (
            <>
              <span className={trend >= 0 ? 'text-green-500' : 'text-red-500'}>
                {trend >= 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(1)}%
              </span>
              <span>vs hier</span>
            </>
          ))}
        </p>
      )}
    </div>
  )
}
