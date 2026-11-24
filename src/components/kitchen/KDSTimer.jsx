import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { KITCHEN_ALERT_MINUTES } from '@/lib/constants'

export default function KDSTimer({ createdAt, alertMinutes = KITCHEN_ALERT_MINUTES }) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const start = new Date(createdAt).getTime()
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [createdAt])

  const mins = Math.floor(elapsed / 60)
  const secs = elapsed % 60
  const isLate = mins >= alertMinutes

  return (
    <span className={cn(
      'font-mono text-sm font-bold tabular-nums',
      isLate ? 'text-red-500 animate-pulse-soft' : mins >= alertMinutes * 0.7 ? 'text-orange-400' : 'text-green-400'
    )}>
      {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
    </span>
  )
}
