import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { tablesApi } from '@/api/tables'
import { useAuthStore } from '@/stores/authStore'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import { tableStatusColor } from '@/lib/formatters'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LogOut, Plus, Clock } from 'lucide-react'

export default function WaiterHomePage() {
  const navigate = useNavigate()
  const { user }  = useAuthStore()
  const { logout } = useAuth()

  const { data: floors = [] } = useQuery({
    queryKey: ['floors'],
    queryFn:  () => tablesApi.floors().then(r => r.data),
  })

  const { data: tables = [] } = useQuery({
    queryKey: ['waiter-tables'],
    queryFn:  () => tablesApi.floorTables(floors[0]?.id).then(r => r.data),
    enabled:  floors.length > 0,
    refetchInterval: 10000,
  })

  const myTables = tables.filter(t => t.assigned_user_id === user?.id)

  return (
    <div className="min-h-screen bg-pos-bg text-white p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">Bonjour, {user?.first_name} 👋</h1>
          <p className="text-xs text-pos-muted">App serveur</p>
        </div>
        <Button variant="ghost" size="icon" className="text-white/60 hover:text-red-400" onClick={() => logout.mutate()}>
          <LogOut size={18} />
        </Button>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button onClick={() => navigate('/pos')} className="h-16 bg-primary hover:bg-primary-600 text-white font-medium gap-2">
          <Plus size={18} /> Nouvelle commande
        </Button>
        <Button onClick={() => navigate('/mobile/order')} variant="outline" className="h-16 border-pos-border text-white gap-2">
          📋 Prise rapide
        </Button>
      </div>

      {/* Mes tables */}
      <div>
        <h2 className="text-sm font-medium text-pos-muted mb-3">Mes tables ({myTables.length})</h2>
        <div className="grid grid-cols-2 gap-3">
          {myTables.map(table => (
            <button
              key={table.id}
              onClick={() => navigate(`/pos?table=${table.id}`)}
              className={cn(
                'border-2 rounded-xl p-4 text-center transition-all active:scale-95',
                tableStatusColor(table.status)
              )}
            >
              <span className="font-bold text-lg">T{table.number}</span>
              <span className="block text-xs opacity-70">{table.capacity} pers.</span>
              {table.status === 'occupied' && table.occupation_minutes && (
                <span className="text-xs opacity-60 flex items-center justify-center gap-1 mt-1">
                  <Clock size={10} />{table.occupation_minutes}min
                </span>
              )}
            </button>
          ))}
          {myTables.length === 0 && (
            <p className="text-sm text-pos-muted col-span-2 text-center py-6">Aucune table assignée</p>
          )}
        </div>
      </div>

      {/* Toutes les tables */}
      <div>
        <h2 className="text-sm font-medium text-pos-muted mb-3">Toutes les tables</h2>
        <div className="grid grid-cols-3 gap-2">
          {tables.map(table => (
            <button
              key={table.id}
              onClick={() => navigate(`/pos?table=${table.id}`)}
              className={cn(
                'border rounded-lg p-2 text-center text-sm transition-all active:scale-95',
                tableStatusColor(table.status)
              )}
            >
              T{table.number}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
