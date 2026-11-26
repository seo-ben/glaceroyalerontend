import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { reportsApi } from '@/api/reports'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatAmount } from '@/lib/formatters'
import {
  ChefHat, Snowflake, Calendar, ArrowLeft, Download,
  Filter, Timer, Hash, Monitor, Layers
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'

export default function AnalyticsPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('all')
  const [activeRegister, setActiveRegister] = useState('all')
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
    queryKey: ['department-sales', activeTab, activeRegister, selectedDate],
    queryFn: () => reportsApi.departmentSales({
      destination: activeTab,
      register: activeRegister === 'all' ? undefined : activeRegister,
      date: selectedDate
    }).then(r => r.data),
    refetchInterval: 15000
  })

  const TABS = [
    { id: 'all',     label: 'Toute production', icon: Hash,      color: 'text-primary',    accent: 'bg-primary' },
    { id: 'kitchen', label: 'Moniteur Cuisine', icon: ChefHat,   color: 'text-orange-500', accent: 'bg-orange-500' },
    { id: 'bar',     label: 'Moniteur Glaces',  icon: Snowflake, color: 'text-sky-500',    accent: 'bg-sky-500' },
  ]

  const reg1 = data?.summary_by_register?.['1'] || { revenue: 0, orders_count: 0, items_count: 0 }
  const reg2 = data?.summary_by_register?.['2'] || { revenue: 0, orders_count: 0, items_count: 0 }
  const totalGeneral = data?.total_general ?? data?.total_all ?? 0

  const REGISTER_CARDS = [
    { id: 'all', label: 'Général (2 caisses)', revenue: totalGeneral, orders: (reg1.orders_count || 0) + (reg2.orders_count || 0), icon: Layers,  accent: 'bg-foreground', badge: 'bg-muted text-foreground' },
    { id: '1',   label: 'Caisse 1',            revenue: reg1.revenue ?? 0, orders: reg1.orders_count ?? 0, icon: Monitor, accent: 'bg-primary',    badge: 'bg-primary/10 text-primary' },
    { id: '2',   label: 'Caisse 2',            revenue: reg2.revenue ?? 0, orders: reg2.orders_count ?? 0, icon: Monitor, accent: 'bg-sky-500',    badge: 'bg-sky-500/10 text-sky-600' },
  ]

  const currentTabObj = TABS.find(t => t.id === activeTab) || TABS[0]
  const currentRegisterLabel = activeRegister === 'all' ? 'Général (2 caisses)' : `Caisse ${activeRegister}`

  if (isLoading) return <AnalyticsSkeleton />

  return (
    <div className="space-y-6 animate-fade-in lg:p-4 bg-background min-h-screen transition-colors duration-300 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/dashboard')}
            className="rounded-xl bg-card border border-border hover:bg-muted w-10 h-10 shadow-sm text-foreground"
          >
            <ArrowLeft size={18} />
          </Button>
          <div>
            <h1 className="text-xl font-black tracking-tight text-foreground">Analyses & Suivi de production</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[11px] font-semibold text-muted-foreground">
                Flux en temps réel • {currentRegisterLabel}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="relative group">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-hover:text-primary transition-colors pointer-events-none" size={15} />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-card border border-border rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all cursor-pointer shadow-sm"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl border-border bg-card text-foreground hover:bg-muted gap-2 h-9 px-4 text-xs font-bold shadow-sm"
            onClick={handleDownload}
            disabled={isDownloading}
          >
            <Download size={14} className={cn("text-primary", isDownloading && "animate-bounce")} />
            <span>{isDownloading ? 'Génération...' : 'Export PDF Complet'}</span>
          </Button>
        </div>
      </div>

      {/* Vue par Caisse : Général / Caisse 1 / Caisse 2 */}
      <div className="space-y-2">
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">
          Filtrer par caisse
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {REGISTER_CARDS.map((card) => {
            const Icon = card.icon
            const isSelected = activeRegister === card.id
            return (
              <button
                key={card.id}
                onClick={() => setActiveRegister(card.id)}
                className={cn(
                  "relative overflow-hidden rounded-2xl p-4 border text-left transition-all duration-200",
                  isSelected
                    ? "bg-card border-primary/50 ring-2 ring-primary/20 shadow-md"
                    : "bg-card/60 border-border hover:bg-card hover:shadow-sm"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", card.badge)}>
                      <Icon size={15} />
                    </div>
                    <span className="text-xs font-black uppercase tracking-wider text-foreground">{card.label}</span>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-bold">
                    {card.orders} ticket(s)
                  </Badge>
                </div>
                <p className="text-xl font-black text-foreground tracking-tight tabular-nums mt-1">
                  {formatAmount(card.revenue)}
                </p>
                {isSelected && (
                  <div className={cn("absolute bottom-0 left-0 h-1 w-full", card.accent)} />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Onglets de production : Toute production / Cuisine / Glaces */}
      <div className="space-y-2">
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">
          Moniteurs de production ({currentRegisterLabel})
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {TABS.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            const tabRevenue = tab.id === 'all'
              ? data?.total_all ?? 0
              : data?.summary_by_destination?.[tab.id]?.revenue ?? 0
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "relative overflow-hidden rounded-2xl p-4 border text-left transition-all duration-200 group",
                  isActive
                    ? "bg-card border-border shadow-md"
                    : "bg-muted/30 border-border hover:bg-card"
                )}
              >
                <div className="flex items-center justify-between mb-2.5">
                  <div className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center transition-all",
                    isActive ? `${tab.accent} text-white shadow-sm` : "bg-muted text-muted-foreground group-hover:text-foreground"
                  )}>
                    <Icon size={17} />
                  </div>
                  {isActive && (
                    <div className="flex items-center gap-1 bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                      <Timer size={10} />
                      <span className="text-[9px] font-black uppercase">Live</span>
                    </div>
                  )}
                </div>
                <p className={cn("text-[11px] font-bold mb-0.5", isActive ? "text-foreground" : "text-muted-foreground")}>
                  {tab.label}
                </p>
                <h3 className={cn("text-xl font-black tracking-tight tabular-nums", isActive ? "text-foreground" : "text-muted-foreground")}>
                  {formatAmount(tabRevenue)}
                </h3>
                {isActive && (
                  <div className={cn("absolute bottom-0 left-0 h-1 w-full", tab.accent)} />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Journal des Ventes Détaillé */}
      <Card className="border-border bg-card rounded-2xl overflow-hidden shadow-sm">
        <CardHeader className="px-6 py-4 border-b border-border bg-muted/20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shadow-sm text-white",
                currentTabObj.accent
              )}>
                <Filter size={18} />
              </div>
              <div>
                <CardTitle className="text-base font-black text-foreground tracking-tight">
                  Journal des commandes — {currentTabObj.label}
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Périmètre affiché : <strong className="text-foreground">{currentRegisterLabel}</strong>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-5">
              <div className="text-right">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Articles</p>
                <p className="text-lg font-black text-foreground tabular-nums">{data?.summary?.items_count ?? 0}</p>
              </div>
              <div className="text-right border-l border-border pl-5">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Tickets</p>
                <p className="text-lg font-black text-foreground tabular-nums">{data?.summary?.orders_count ?? 0}</p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-muted/30 border-b border-border">
                  <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-left">Heure</th>
                  <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-left">Désignation</th>
                  <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-left">Caisse</th>
                  <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-left">Table</th>
                  <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-center">Qté</th>
                  <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-right">Valeur</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(data?.items ?? []).map((item) => {
                  const regNum = Number(item.order?.register_number || 1)
                  return (
                    <tr key={item.id} className="hover:bg-muted/40 transition-colors">
                      <td className="px-5 py-3 text-xs font-bold text-muted-foreground tabular-nums">
                        {item.created_at ? format(new Date(item.created_at), 'HH:mm') : '--:--'}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-foreground capitalize">
                            {item.product?.name?.toLowerCase()}
                          </span>
                          <span className="text-[10px] text-muted-foreground">#{item.id}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <Badge className={cn(
                          "border-none text-[10px] font-bold px-2 py-0.5 rounded-md",
                          regNum === 2 ? "bg-sky-500/10 text-sky-600" : "bg-primary/10 text-primary"
                        )}>
                          Caisse {regNum}
                        </Badge>
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant="outline" className="text-[10px] font-bold rounded-md">
                          Table {item.order?.table_id || 'Ext'}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className="inline-flex items-center justify-center min-w-7 h-7 px-2 rounded-lg bg-muted border border-border text-xs font-bold text-foreground tabular-nums">
                          {item.quantity}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right text-sm font-black text-foreground tabular-nums">
                        {formatAmount(item.subtotal)}
                      </td>
                    </tr>
                  )
                })}
                {(data?.items ?? []).length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className={cn("w-14 h-14 rounded-2xl bg-muted border border-border flex items-center justify-center", currentTabObj.color)}>
                          <Hash size={22} className="opacity-50" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-foreground">Aucun mouvement détecté</p>
                          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                            Les ventes de <span className="font-semibold">{currentRegisterLabel}</span> ({currentTabObj.label}) apparaîtront ici en temps réel.
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
    <div className="space-y-6 p-6 bg-background min-h-screen">
      <div className="flex justify-between items-center pb-6 border-b border-border">
        <Skeleton className="h-10 w-64 bg-muted rounded-xl" />
        <Skeleton className="h-10 w-48 bg-muted rounded-xl" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 bg-muted rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 bg-muted rounded-2xl" />)}
      </div>
      <Skeleton className="h-80 w-full bg-muted rounded-2xl" />
    </div>
  )
}
