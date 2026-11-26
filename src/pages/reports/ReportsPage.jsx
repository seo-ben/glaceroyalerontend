import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { reportsApi } from '@/api/reports'
import PageHeader from '@/components/shared/PageHeader'
import StatCard from '@/components/shared/StatCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { formatAmount, paymentMethodLabel } from '@/lib/formatters'
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns'
import {
  Download, TrendingUp, ShoppingBag, Users, CreditCard,
  Monitor, Layers, BarChart3, Wallet, PackageOpen
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

const PERIODS = [
  { label: "Aujourd'hui", from: format(new Date(), 'yyyy-MM-dd'), to: format(new Date(), 'yyyy-MM-dd') },
  { label: '7 jours',  from: format(subDays(new Date(), 6), 'yyyy-MM-dd'), to: format(new Date(), 'yyyy-MM-dd') },
  { label: '30 jours', from: format(subDays(new Date(), 29), 'yyyy-MM-dd'), to: format(new Date(), 'yyyy-MM-dd') },
  { label: 'Ce mois',  from: format(startOfMonth(new Date()), 'yyyy-MM-dd'), to: format(endOfMonth(new Date()), 'yyyy-MM-dd') },
]

const REGISTER_FILTERS = [
  { id: 'all', label: 'Général (2 caisses)', icon: Layers },
  { id: '1',   label: 'Caisse 1',            icon: Monitor },
  { id: '2',   label: 'Caisse 2',            icon: Monitor },
]

export default function ReportsPage() {
  const [period, setPeriod] = useState(PERIODS[0])
  const [registerFilter, setRegisterFilter] = useState('all')
  const [isExporting, setIsExporting] = useState(false)

  const registerParam = registerFilter === 'all' ? undefined : registerFilter

  const { data: sales } = useQuery({
    queryKey: ['sales', period.from, period.to, registerFilter],
    queryFn:  () => reportsApi.sales({ from: period.from, to: period.to, register: registerParam }).then(r => r.data),
  })

  const { data: topProducts = [] } = useQuery({
    queryKey: ['top-products', period.from, period.to, registerFilter],
    queryFn:  () => reportsApi.topProducts({ from: period.from, to: period.to, limit: 10, register: registerParam }).then(r => r.data),
  })

  const { data: byWaiter = [] } = useQuery({
    queryKey: ['by-waiter', period.from, period.to, registerFilter],
    queryFn:  () => reportsApi.byWaiter({ from: period.from, to: period.to, register: registerParam }).then(r => r.data),
  })

  const { data: cashSummary } = useQuery({
    queryKey: ['cash-summary', period.from, period.to, registerFilter],
    queryFn:  () => reportsApi.cashSummary({ from: period.from, to: period.to, register: registerParam }).then(r => r.data),
  })

  const handleExport = async () => {
    try {
      setIsExporting(true)
      const res = await reportsApi.dailyAnalysisPdf({ from: period.from, to: period.to })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      const filename = period.from === period.to
        ? `Rapport_Administratif_${period.from}.pdf`
        : `Rapport_Administratif_${period.from}_au_${period.to}.pdf`
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      console.error('Export failed', error)
    } finally {
      setIsExporting(false)
    }
  }

  const summary = sales?.summary
  const reg1 = sales?.by_register?.['1'] || { register: 1, label: 'Caisse 1', revenue: 0, orders_count: 0, avg_ticket: 0, share: 0 }
  const reg2 = sales?.by_register?.['2'] || { register: 2, label: 'Caisse 2', revenue: 0, orders_count: 0, avg_ticket: 0, share: 0 }

  const activeScopeLabel = registerFilter === 'all' ? 'Général (2 caisses)' : `Caisse ${registerFilter}`

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <PageHeader title="Rapports & Statistiques" subtitle={`Performance financière • ${activeScopeLabel}`}>
        <Button
          variant="outline"
          size="sm"
          disabled={isExporting}
          onClick={handleExport}
          className="rounded-xl gap-1.5 font-bold"
        >
          <Download size={14} />
          {isExporting ? 'Génération...' : 'Export PDF complet'}
        </Button>
      </PageHeader>

      {/* Barre de filtres : Période + Caisse */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-card p-3 rounded-2xl border border-border shadow-sm">
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {PERIODS.map(p => (
            <Button
              key={p.label}
              variant={period.label === p.label ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setPeriod(p)}
              className={cn(
                "rounded-xl px-4 h-9 text-[11px] font-bold uppercase tracking-wider shrink-0 transition-all",
                period.label === p.label
                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              {p.label}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 bg-muted/70 p-1 rounded-xl border border-border self-start lg:self-auto">
          {REGISTER_FILTERS.map(({ id, label, icon: Icon }) => {
            const active = registerFilter === id
            return (
              <button
                key={id}
                onClick={() => setRegisterFilter(id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap",
                  active
                    ? id === '2'
                      ? "bg-sky-500 text-white shadow-sm"
                      : "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon size={13} />
                <span>{label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Comparatif Chiffre d'affaires par Caisse (Caisse 1 vs Caisse 2) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { data: reg1, id: '1', accent: 'orange', bar: 'bg-primary', badge: 'bg-primary/10 text-primary', ring: 'ring-primary border-primary/50' },
          { data: reg2, id: '2', accent: 'sky',    bar: 'bg-sky-500', badge: 'bg-sky-500/10 text-sky-600', ring: 'ring-sky-500 border-sky-500/50' },
        ].map(({ data: r, id, bar, badge, ring }) => {
          const isSelected = registerFilter === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => setRegisterFilter(isSelected ? 'all' : id)}
              className={cn(
                "text-left bg-card rounded-2xl p-5 border transition-all duration-200 hover:shadow-md relative overflow-hidden",
                isSelected ? `ring-2 ${ring} shadow-md` : "border-border hover:border-primary/30"
              )}
            >
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", badge)}>
                    <Monitor size={17} />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-foreground">{r.label}</p>
                    <p className="text-[11px] text-muted-foreground font-medium">
                      {isSelected ? 'Filtre actif • cliquer pour voir le général' : 'Cliquer pour filtrer cette caisse'}
                    </p>
                  </div>
                </div>
                <Badge className={cn("border-none font-black text-xs px-2.5 py-1 rounded-lg", badge)}>
                  {r.share ?? 0}% du CA
                </Badge>
              </div>

              <div className="flex items-end justify-between gap-4 mt-2">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Chiffre d'affaires</p>
                  <p className="text-2xl lg:text-3xl font-black text-foreground tracking-tight tabular-nums mt-0.5">
                    {formatAmount(r.revenue ?? 0)}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-right">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Commandes</p>
                    <p className="text-sm font-black text-foreground tabular-nums">{r.orders_count ?? 0}</p>
                  </div>
                  <div className="border-l border-border pl-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Ticket moy.</p>
                    <p className="text-sm font-black text-foreground tabular-nums">{formatAmount(r.avg_ticket ?? 0)}</p>
                  </div>
                </div>
              </div>

              <div className="w-full bg-muted rounded-full h-1.5 mt-4 overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all duration-700", bar)}
                  style={{ width: `${Math.min(100, r.share ?? 0)}%` }}
                />
              </div>
            </button>
          )
        })}
      </div>

      {/* KPIs principaux (selon le filtre actif : Général, Caisse 1 ou Caisse 2) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <StatCard label={`CA ${registerFilter === 'all' ? 'Général' : `Caisse ${registerFilter}`}`} value={formatAmount(summary?.revenue ?? 0)} icon={CreditCard} color="orange" />
        <StatCard label="Commandes" value={summary?.orders_count ?? 0} icon={ShoppingBag} color="blue" />
        <StatCard label="Ticket moyen" value={formatAmount(summary?.avg_ticket ?? 0)} icon={TrendingUp} color="green" />
        <StatCard label="Couverts" value={summary?.total_covers ?? 0} icon={Users} color="purple" />
      </div>

      {/* Onglets détaillés */}
      <Tabs defaultValue="products" className="mt-4">
        <TabsList className="bg-card p-1.5 rounded-2xl border border-border h-12 w-full lg:w-auto overflow-x-auto justify-start no-scrollbar shadow-sm">
          <TabsTrigger value="products" className="rounded-xl px-5 text-[11px] font-bold uppercase tracking-wider gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all h-full shrink-0">
            <BarChart3 size={14} /> Produits
          </TabsTrigger>
          <TabsTrigger value="team" className="rounded-xl px-5 text-[11px] font-bold uppercase tracking-wider gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all h-full shrink-0">
            <Users size={14} /> Équipe
          </TabsTrigger>
          <TabsTrigger value="cash" className="rounded-xl px-5 text-[11px] font-bold uppercase tracking-wider gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all h-full shrink-0">
            <Wallet size={14} /> Caisse & Paiements
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="mt-5">
          <Card className="border-border bg-card rounded-2xl overflow-hidden shadow-sm">
            <CardHeader className="px-6 py-4 border-b border-border bg-muted/20 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-black text-foreground uppercase tracking-widest">
                Top 10 Produits — {activeScopeLabel}
              </CardTitle>
              <Badge variant="outline" className="text-[10px] font-bold">{topProducts.length} article(s)</Badge>
            </CardHeader>
            <CardContent className="p-6">
              {topProducts.length === 0 ? (
                <div className="py-12 text-center flex flex-col items-center gap-3 text-muted-foreground">
                  <PackageOpen size={32} className="opacity-30" />
                  <p className="text-sm font-semibold">Aucune vente enregistrée sur cette période</p>
                  <p className="text-xs opacity-70">Les produits les plus vendus apparaîtront ici dès les premiers encaissements.</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {topProducts.slice(0, 10).map((p, i) => (
                    <div key={i} className="flex flex-col gap-2">
                      <div className="flex justify-between items-center gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className={cn(
                            "w-6 h-6 rounded-lg text-[11px] font-black flex items-center justify-center shrink-0",
                            i === 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                          )}>
                            {i + 1}
                          </span>
                          <p className="text-sm font-bold text-foreground truncate">{p.product?.name}</p>
                        </div>
                        <div className="flex items-center gap-4 shrink-0">
                          <span className="text-xs font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-md">×{p.total_qty}</span>
                          <span className="text-sm font-black text-primary tabular-nums">{formatAmount(p.total_revenue ?? 0)}</span>
                        </div>
                      </div>
                      <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-primary h-full rounded-full transition-all duration-700"
                          style={{ width: `${Math.min(100, ((p.total_revenue ?? 0) / (topProducts[0]?.total_revenue || 1)) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="mt-5">
          <Card className="border-border bg-card rounded-2xl overflow-hidden shadow-sm">
            <CardHeader className="px-6 py-4 border-b border-border bg-muted/20">
              <CardTitle className="text-xs font-black text-foreground uppercase tracking-widest">
                Performance de l'équipe — {activeScopeLabel}
              </CardTitle>
            </CardHeader>
            {byWaiter.length === 0 ? (
              <div className="py-12 text-center flex flex-col items-center gap-3 text-muted-foreground">
                <Users size={32} className="opacity-30" />
                <p className="text-sm font-semibold">Aucune commande par membre sur cette période</p>
              </div>
            ) : (
              <>
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="text-left px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Serveur / Caissier</th>
                        <th className="text-right px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Commandes</th>
                        <th className="text-right px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">CA généré</th>
                        <th className="text-right px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Ticket moyen</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {byWaiter.map(row => (
                        <tr key={row.user_id} className="hover:bg-muted/40 transition-colors">
                          <td className="px-6 py-3.5 font-bold text-foreground">{row.waiter?.first_name} {row.waiter?.last_name}</td>
                          <td className="px-6 py-3.5 text-right font-semibold text-foreground tabular-nums">{row.orders_count}</td>
                          <td className="px-6 py-3.5 text-right font-black text-primary tabular-nums">{formatAmount(row.revenue)}</td>
                          <td className="px-6 py-3.5 text-right font-semibold text-muted-foreground tabular-nums">{formatAmount(row.avg_ticket)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="md:hidden divide-y divide-border">
                  {byWaiter.map(row => (
                    <div key={row.user_id} className="p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-bold text-foreground">{row.waiter?.first_name} {row.waiter?.last_name}</h3>
                        <Badge className="bg-primary/10 text-primary border-none text-[10px] font-bold">{row.orders_count} cmd</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-muted/60 rounded-xl p-3">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase">CA Réalisé</p>
                          <p className="text-base font-black text-foreground tabular-nums mt-0.5">{formatAmount(row.revenue)}</p>
                        </div>
                        <div className="bg-muted/60 rounded-xl p-3">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase">Ticket moy.</p>
                          <p className="text-base font-bold text-foreground/80 tabular-nums mt-0.5">{formatAmount(row.avg_ticket)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="cash" className="mt-5 space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
            {(cashSummary?.payments ?? []).length === 0 ? (
              <Card className="col-span-full border-border bg-card rounded-2xl p-10 text-center text-muted-foreground">
                <Wallet size={28} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm font-semibold">Aucun encaissement sur cette période ({activeScopeLabel})</p>
              </Card>
            ) : (
              (cashSummary?.payments ?? []).map((p, i) => (
                <Card key={i} className="border-border bg-card rounded-2xl shadow-sm p-5">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{paymentMethodLabel(p.method)}</p>
                  <p className="text-xl lg:text-2xl font-black text-foreground mt-1 tabular-nums">{formatAmount(p.total)}</p>
                  <div className="flex items-center gap-1.5 mt-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-[11px] font-semibold text-muted-foreground">{p.count} transaction(s)</span>
                  </div>
                </Card>
              ))
            )}
          </div>

          <Card className="border-primary/20 bg-gradient-to-r from-primary to-orange-500 shadow-lg shadow-primary/15 rounded-2xl overflow-hidden p-6 lg:p-8">
            <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
              <div className="text-center lg:text-left">
                <p className="text-[10px] font-black text-primary-foreground/80 uppercase tracking-[0.2em] mb-1">
                  Total Encaissé • {activeScopeLabel}
                </p>
                <h2 className="text-2xl lg:text-3xl font-black text-primary-foreground tracking-tight">Bilan Financier</h2>
              </div>
              <span className="text-3xl lg:text-4xl font-black text-primary-foreground tracking-tight tabular-nums">
                {formatAmount(cashSummary?.total ?? 0)}
              </span>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
