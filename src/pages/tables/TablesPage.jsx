import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { tablesApi } from '@/api/tables'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import TableActionPanel from '@/components/tables/TableActionPanel'
import { Clock, RefreshCw, Grid, Map, Users, CheckCircle2, AlertCircle } from 'lucide-react'

import { ordersApi } from '@/api/orders'

const STATUS_LABELS = {
  free:     { label: 'Libre',      icon: CheckCircle2, dot: 'bg-emerald-500', color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  occupied: { label: 'Occupée',    icon: Users,        dot: 'bg-primary',      color: 'text-primary',      bg: 'bg-primary/10 border-primary/40 shadow-lg shadow-primary/10' },
  waiting:  { label: 'En attente', icon: Clock,        dot: 'bg-orange-500',   color: 'text-orange-500',   bg: 'bg-orange-500/10 border-orange-500/20' },
  reserved: { label: 'Réservée',   icon: AlertCircle,  dot: 'bg-blue-500',    color: 'text-blue-500',    bg: 'bg-blue-500/10 border-blue-500/20' },
}

export default function TablesPage() {
  const queryClient = useQueryClient()
  const [activeFloor, setActiveFloor]   = useState(null)
  const [selectedTable, setSelectedTable] = useState(null)
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'map'

  const { data: floors = [] } = useQuery({
    queryKey: ['floors'],
    queryFn:  () => tablesApi.floors().then(r => r.data),
  })

  const { data: activeCounts = { gozem: 0, takeaway: 0 } } = useQuery({
    queryKey: ['active-counts'],
    queryFn:  () => ordersApi.activeCounts().then(r => r.data),
    refetchInterval: 10000,
  })

  useEffect(() => {
    if (!activeFloor && floors.length > 0) {
       setActiveFloor(floors[0].id)
    }
  }, [floors, activeFloor])

  const { data: tables = [], isLoading } = useQuery({
    queryKey: ['floor-tables', activeFloor],
    queryFn:  () => tablesApi.floorTables(activeFloor).then(r => r.data),
    enabled:  !!activeFloor,
    refetchInterval: 10000,
  })

  const stats = tables.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1
    return acc
  }, {})

  return (
    <div className="flex flex-col lg:flex-row h-full lg:h-[calc(100vh-100px)] gap-4 animate-in fade-in duration-500 overflow-hidden transition-colors duration-300">
      <div className="flex-1 flex flex-col min-w-0 bg-card rounded-2xl lg:rounded-3xl p-4 lg:p-6 border border-border backdrop-blur-sm overflow-hidden shadow-xl">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
           <div>
              <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                      <Grid size={18} className="text-primary-foreground" />
                  </div>
                  <h1 className="text-2xl font-black text-foreground tracking-tighter uppercase italic">Plan de Salle</h1>
              </div>
              <p className="text-muted-foreground text-[9px] font-black uppercase tracking-[0.2em] mt-1.5 ml-1">
                  {floors.find(f => f.id === activeFloor)?.name || 'Chargement...'} • {tables.length} Tables
              </p>
           </div>
           
           <div className="flex items-center gap-1.5 bg-muted p-1.5 rounded-2xl border border-border">
              <Button 
                variant="ghost" 
                size="sm" 
                className={cn("rounded-xl h-8 px-4 text-[9px] font-black uppercase tracking-widest transition-all", viewMode === 'grid' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
                onClick={() => setViewMode('grid')}
              >
                  <Grid size={12} className="mr-2" /> Grille
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className={cn("rounded-xl h-8 px-4 text-[9px] font-black uppercase tracking-widest transition-all", viewMode === 'map' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
                onClick={() => setViewMode('map')}
              >
                  <Map size={12} className="mr-2" /> Carte
              </Button>
              <div className="w-px h-4 bg-border mx-1" />
              <Button 
                variant="ghost" 
                size="sm" 
                className="rounded-xl h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-background"
                onClick={() => {
                  queryClient.invalidateQueries({ queryKey: ['floor-tables'] })
                  queryClient.invalidateQueries({ queryKey: ['active-counts'] })
                }}
              >
                  <RefreshCw size={12} className={isLoading ? "animate-spin" : ""} />
              </Button>
           </div>
        </header>

        {/* Categories / Stats de statut */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 no-scrollbar">
          {Object.entries(STATUS_LABELS).map(([key, { label, dot, bg }]) => (
            <div key={key} className={cn("flex items-center gap-2 px-4 py-2 rounded-2xl border font-bold text-[9px] uppercase tracking-wider shrink-0 transition-all", bg, "border-transparent")}>
              <div className={cn("w-2 h-2 rounded-full shadow-sm", dot)} />
              <span className="text-foreground/80">{label}</span>
              <span className="bg-foreground/5 px-2 py-0.5 rounded text-foreground ml-1">{stats[key] || 0}</span>
            </div>
          ))}
          <div className="w-px h-6 bg-border mx-2 shrink-0" />
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl border font-bold text-[9px] uppercase tracking-wider shrink-0 transition-all bg-purple-500/10 border-purple-500/20 text-purple-600">
              <span className="text-purple-600/80">Emporté (En cours)</span>
              <span className="bg-purple-600/10 px-2 py-0.5 rounded text-purple-700 ml-1">{activeCounts.takeaway || 0}</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl border font-bold text-[9px] uppercase tracking-wider shrink-0 transition-all bg-emerald-500/10 border-emerald-500/20 text-emerald-600">
              <span className="text-emerald-600/80">Gozem (En cours)</span>
              <span className="bg-emerald-600/10 px-2 py-0.5 rounded text-emerald-700 ml-1">{activeCounts.gozem || 0}</span>
          </div>
        </div>

        {/* Étages */}
        {floors.length > 0 && (
          <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar pb-1">
              {floors.map(f => (
                <button
                   key={f.id}
                   onClick={() => { setActiveFloor(f.id); setSelectedTable(null) }}
                   className={cn(
                       "px-5 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-[0.1em] transition-all border whitespace-nowrap",
                       activeFloor === f.id 
                        ? "bg-primary border-primary/20 text-primary-foreground shadow-xl shadow-primary/20 scale-105 z-10" 
                        : "bg-muted border-border text-muted-foreground hover:bg-accent/40 hover:text-foreground"
                   )}
                >
                    {f.name}
                </button>
              ))}
          </div>
        )}

        {/* Zone des Tables */}
        <div className="flex-1 overflow-auto custom-scrollbar pr-2 -mr-2">
            {isLoading ? (
               <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-9 xl:grid-cols-11 gap-2 lg:gap-3">
                   {[...Array(24)].map((_, i) => <div key={i} className="aspect-square bg-muted rounded-xl lg:rounded-2xl animate-pulse" />)}
               </div>
            ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-9 xl:grid-cols-11 gap-2 lg:gap-3 pb-20 lg:pb-0">
                    {tables.map(table => (
                        <TableGridCard 
                            key={table.id} 
                            table={table} 
                            isSelected={selectedTable?.id === table.id}
                            onClick={() => setSelectedTable(selectedTable?.id === table.id ? null : table)}
                        />
                    ))}
                </div>
            ) : (
                <div className="relative min-w-[1400px] min-h-[1200px] bg-muted/30 rounded-[3rem] border border-border overflow-hidden">
                    <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#4b5563 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
                    {tables.map(table => (
                        <TableMapCard 
                            key={table.id} 
                            table={table} 
                            isSelected={selectedTable?.id === table.id}
                            onClick={() => setSelectedTable(selectedTable?.id === table.id ? null : table)}
                        />
                    ))}
                </div>
            )}

            {tables.length === 0 && !isLoading && (
                <div className="flex flex-col items-center justify-center h-64 text-muted-foreground/30 uppercase tracking-[0.3em] font-black">
                    <Grid size={64} className="mb-4 opacity-50" />
                    Aucune table trouvée
                </div>
            )}
        </div>
      </div>

      {/* Side Panel for Table Actions */}
      {selectedTable && (
        <div className="fixed inset-0 lg:relative lg:inset-auto z-50 lg:z-0 lg:w-[380px] shrink-0 animate-in slide-in-from-bottom lg:slide-in-from-right duration-300 p-4 lg:p-0 bg-background/80 lg:bg-transparent backdrop-blur-sm lg:backdrop-blur-none flex flex-col justify-end lg:justify-start">
          <div className="h-[85vh] lg:h-full">
            <TableActionPanel
              table={selectedTable}
              onClose={() => setSelectedTable(null)}
              onAction={() => {
                queryClient.invalidateQueries({ queryKey: ['floor-tables'] })
                setSelectedTable(null)
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function TableGridCard({ table, isSelected, onClick }) {
  const s = STATUS_LABELS[table.status]
  const Icon = s.icon

  return (
    <button
      onClick={onClick}
      className={cn(
        "aspect-square rounded-xl lg:rounded-2xl border transition-all duration-300 flex flex-col items-center justify-center gap-0.5 group relative overflow-hidden",
        isSelected 
            ? "bg-primary border-primary scale-105 shadow-xl z-20" 
            : `${s.bg} border-transparent hover:scale-105 hover:bg-accent/10`
      )}
    >
        <div className={cn("p-1 lg:p-1.5 rounded-lg transition-colors", isSelected ? "bg-primary-foreground/20 text-primary-foreground" : "bg-foreground/5 text-muted-foreground/30 group-hover:text-foreground")}>
            <Icon size={12} className="lg:w-3.5 lg:h-3.5" />
        </div>
        <div className="flex flex-col items-center">
            <span className={cn("text-base lg:text-lg font-black italic tracking-tighter transition-all leading-none", isSelected ? "text-primary-foreground" : "text-foreground")}>
               {table.number}
            </span>
            <span className={cn("text-[7px] lg:text-[8px] font-bold uppercase tracking-widest mt-0.5", isSelected ? "text-primary-foreground/60" : "text-muted-foreground/40")}>
               {table.capacity}p
            </span>
        </div>
        {table.status === 'occupied' && (
             <div className="absolute top-1.5 right-1.5 flex items-center gap-1">
                 <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
             </div>
        )}
    </button>
  )
}

function TableMapCard({ table, isSelected, onClick }) {
  const s = STATUS_LABELS[table.status]

  return (
    <div
      onClick={onClick}
      style={{
        left: `${table.position_x}px`,
        top: `${table.position_y}px`,
        width: `${table.width}px`,
        height: `${table.height}px`,
        borderRadius: table.shape === 'round' ? '50%' : '1rem',
      }}
      className={cn(
        'absolute cursor-pointer border flex flex-col items-center justify-center transition-all duration-300 shadow-md overflow-hidden',
        s.bg,
        isSelected ? 'border-primary ring-2 ring-primary/20 scale-105 z-20 bg-primary text-primary-foreground' : 'border-border hover:border-primary/20 hover:scale-105 bg-card',
      )}
    >
      <span className="font-black text-xl italic tracking-tighter">{table.number}</span>
      <span className="text-[8px] font-bold opacity-30 uppercase">{table.capacity}P</span>
    </div>
  )
}
