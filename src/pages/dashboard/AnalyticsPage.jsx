import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { reportsApi } from '@/api/reports'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatAmount } from '@/lib/formatters'
import { UtensilsCrossed, ChefHat, Cookie, Calendar, ArrowLeft, Download, Filter, Timer, Hash } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'

export default function AnalyticsPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('all')
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = async () => {
    try {
        setIsDownloading(true)
        const res = await reportsApi.dailyAnalysisPdf({ date: selectedDate })
        const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', `Rapport_Administratif_${selectedDate}.pdf`)
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(url)
    } catch (error) {
        console.error("Erreur téléchargement PDF:", error)
    } finally {
        setIsDownloading(false)
    }
  }

  const { data, isLoading } = useQuery({
    queryKey: ['department-sales', activeTab, selectedDate],
    queryFn: () => reportsApi.departmentSales({
      destination: activeTab,
      date: selectedDate
    }).then(r => r.data),
    refetchInterval: 15000 // Rafraîchissement plus rapide pour le "Live"
  })

  const TABS = [
    { id: 'all',     label: 'Toute production', icon: Hash,           color: 'text-foreground', accent: 'bg-foreground' },
    { id: 'bar',     label: 'Moniteur bar',     icon: UtensilsCrossed, color: 'text-blue-500', accent: 'bg-blue-500' },
    { id: 'kitchen', label: 'Moniteur cuisine', icon: ChefHat,         color: 'text-orange-500', accent: 'bg-orange-500' },
    { id: 'pizza',   label: 'Moniteur pizza',   icon: Cookie,          color: 'text-pink-500', accent: 'bg-pink-500' },
  ]

  if (isLoading) return <AnalyticsSkeleton />

  return (
    <div className="space-y-6 animate-fade-in lg:p-6 bg-background min-h-screen transition-colors duration-300">
      {/* Header Premium */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border pb-6">
        <div className="flex items-center gap-5">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} className="rounded-2xl bg-muted border border-border hover:bg-accent w-12 h-12 shadow-sm text-foreground hover:text-foreground">
            <ArrowLeft size={20} className="text-foreground" />
          </Button>
          <div>
            <h1 className="text-lg md:text-xl font-bold tracking-tight text-foreground italic">Suivi de production</h1>
            <div className="flex items-center gap-2 mt-0.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                <p className="text-[10px] font-black text-muted-foreground tracking-[0.2em]">Flux de vente en temps réel</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
            <div className="relative group">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-hover:text-primary transition-colors" size={16} />
                <input 
                    type="date" 
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="bg-muted border border-border rounded-xl px-10 py-1.5 text-[10px] font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all cursor-pointer hover:bg-accent"
                />
            </div>
            <Button 
                variant="outline" 
                size="sm" 
                className="rounded-xl border-border bg-muted text-muted-foreground hover:text-foreground hover:bg-accent gap-2 h-9 px-4 text-[10px] font-bold italic shadow-sm"
                onClick={handleDownload}
                disabled={isDownloading}
            >
                <Download size={14} className={cn("text-primary", isDownloading && "animate-bounce")} />
                <span>{isDownloading ? 'Génération...' : 'Export PDF Complet'}</span>
            </Button>
        </div>
      </div>

      {/* Onglets de Navigation (Tabs) */}
      <div className="flex flex-wrap gap-2 md:gap-4">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-1 min-w-[120px] relative overflow-hidden rounded-xl p-3 border transition-all duration-300 group",
                isActive 
                  ? "bg-card border-border shadow-lg" 
                  : "bg-muted/40 border-border hover:bg-muted"
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300",
                    isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:text-foreground"
                )}>
                  <Icon size={16} className={cn(isActive && tab.color === 'text-foreground' ? 'text-primary-foreground' : (isActive && tab.color))} />
                </div>
                {isActive && (
                    <div className="flex items-center gap-1 bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                        <Timer size={10} className="animate-spin-slow" />
                        <span className="text-[8px] font-black uppercase tracking-tighter italic text-emerald-600">Live</span>
                    </div>
                )}
              </div>
              <div className="text-left">
                <p className={cn("text-[9px] font-bold tracking-widest mb-1 italic transition-colors capitalize", isActive ? "text-foreground" : "text-muted-foreground")}>
                    {tab.label}
                </p>
                <div className="flex items-baseline gap-2">
                    <h3 className={cn("text-lg font-bold italic tracking-tight transition-colors", isActive ? "text-foreground" : "text-muted-foreground")}>
                        {formatAmount(
                            tab.id === 'all' 
                                ? data?.total_all ?? 0 
                                : data?.summary_by_destination?.[tab.id]?.revenue ?? 0
                        )}
                    </h3>
                </div>
              </div>
              {isActive && (
                <div className={cn("absolute bottom-0 left-0 h-1 w-full", tab.accent)} />
              )}
            </button>
          )
        })}
      </div>

      {/* Journal des Ventes Détaillé */}
      <Card className="border-border bg-card backdrop-blur-xl rounded-xl overflow-hidden shadow-2xl transition-colors">
        <CardHeader className="p-6 border-b border-border bg-muted/20">
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
               <div className="flex items-center gap-4">
                   <div className={cn(
                       "w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg",
                       TABS.find(t => t.id === activeTab)?.accent,
                       "text-primary-foreground"
                   )}>
                       <Filter size={20} />
                   </div>
                   <div>
                       <CardTitle className="text-lg font-bold text-foreground italic tracking-tighter capitalize">Journal des commandes - {activeTab}</CardTitle>
                       <p className="text-[10px] font-bold text-muted-foreground/60 tracking-[0.2em] mt-1 italic">Toutes les ventes envoyées au département</p>
                   </div>
               </div>
                <div className="flex items-center gap-6">
                    <div className="text-right">
                        <p className="text-[7px] font-bold text-muted-foreground mb-1 italic uppercase tracking-widest">Articles</p>
                        <p className="text-base font-bold text-foreground italic tracking-tight tabular-nums">{data?.summary?.items_count ?? 0}</p>
                    </div>
                    <div className="text-right border-l border-border pl-6">
                        <p className="text-[7px] font-bold text-muted-foreground mb-1 italic uppercase tracking-widest">Tickets</p>
                        <p className="text-base font-bold text-foreground italic tracking-tight tabular-nums">{data?.summary?.orders_count ?? 0}</p>
                    </div>
               </div>
           </div>
        </CardHeader>
        <CardContent className="p-0">
           <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-muted/40 border-b border-border">
                            <th className="px-5 py-3 text-[8px] font-bold text-muted-foreground tracking-widest italic text-left">Heure</th>
                            <th className="px-5 py-3 text-[8px] font-bold text-muted-foreground tracking-widest italic text-left">Désignation</th>
                            <th className="px-5 py-3 text-[8px] font-bold text-muted-foreground tracking-widest italic text-left">Table</th>
                            <th className="px-5 py-3 text-[8px] font-bold text-muted-foreground tracking-widest italic text-center">Qté</th>
                            <th className="px-5 py-3 text-[8px] font-bold text-muted-foreground tracking-widest italic text-right">Valeur</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {(data?.items ?? []).map((item, idx) => (
                            <tr key={item.id} className="hover:bg-muted/50 transition-all group animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: `${idx * 30}ms` }}>
                                <td className="px-5 py-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-1 h-1 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-all" />
                                        <span className="text-[11px] font-bold text-foreground/80 italic tabular-nums">
                                            {item.created_at ? format(new Date(item.created_at), 'HH:mm') : '--:--'}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-5 py-2">
                                    <div className="flex flex-col">
                                        <span className="text-[12px] font-bold text-foreground italic tracking-tight group-hover:text-primary transition-colors capitalize">
                                            {item.product?.name.toLowerCase()}
                                        </span>
                                        <span className="text-[8px] font-medium text-muted-foreground tracking-widest">#{item.id}</span>
                                    </div>
                                </td>
                                <td className="px-5 py-2">
                                    <Badge className="bg-muted text-muted-foreground border-border text-[8px] font-bold italic px-2 py-0.5 rounded-lg">
                                        Table {item.order?.table_id || 'Ext'}
                                    </Badge>
                                </td>
                                <td className="px-5 py-2 text-center">
                                    <div className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-muted border border-border group-hover:border-primary/30 group-hover:bg-primary/10 transition-all">
                                        <span className="text-[11px] font-bold text-foreground italic tabular-nums">
                                            {item.quantity}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-5 py-2 text-right">
                                    <div className="flex flex-col items-end">
                                        <span className="text-[12px] font-bold text-foreground italic tracking-tight tabular-nums">
                                            {formatAmount(item.subtotal)}
                                        </span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {(data?.items ?? []).length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-8 py-32 text-center">
                                    <div className="flex flex-col items-center gap-6 animate-in zoom-in duration-500">
                                        <div className={cn(
                                            "w-16 h-16 rounded-2xl bg-muted border border-border flex items-center justify-center shadow-inner",
                                            TABS.find(t => t.id === activeTab)?.color
                                        )}>
                                            <Hash size={24} className="opacity-40" />
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-sm font-bold text-foreground italic tracking-wider">Aucun mouvement détecté</p>
                                            <p className="text-[10px] font-medium text-muted-foreground/80 max-w-[300px] leading-relaxed mx-auto italic">
                                                Les transmissions vers le service {activeTab} apparaîtront ici dès qu'elles seront enregistrées.
                                            </p>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
           </div>
        </CardContent>
      </Card>
    </div>
  )
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-8 lg:p-8 bg-background min-h-screen">
      <div className="flex items-center justify-between pb-6 border-b border-border">
        <Skeleton className="h-12 w-64 bg-muted rounded-2xl" />
        <Skeleton className="h-12 w-48 bg-muted rounded-2xl" />
      </div>
      <div className="grid grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-44 bg-muted rounded-3xl" />)}
      </div>
      <Skeleton className="h-[500px] bg-muted rounded-[2rem]" />
    </div>
  )
}
