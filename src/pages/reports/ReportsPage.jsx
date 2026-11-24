import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { reportsApi } from '@/api/reports'
import PageHeader from '@/components/shared/PageHeader'
import StatCard from '@/components/shared/StatCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { formatAmount, formatDate, paymentMethodLabel } from '@/lib/formatters'
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns'
import { Download, TrendingUp, ShoppingBag, Users, CreditCard } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

const PERIODS = [
  { label: "Aujourd'hui", from: format(new Date(), 'yyyy-MM-dd'), to: format(new Date(), 'yyyy-MM-dd') },
  { label: '7 jours',  from: format(subDays(new Date(), 6), 'yyyy-MM-dd'), to: format(new Date(), 'yyyy-MM-dd') },
  { label: '30 jours', from: format(subDays(new Date(), 29), 'yyyy-MM-dd'), to: format(new Date(), 'yyyy-MM-dd') },
  { label: 'Ce mois',  from: format(startOfMonth(new Date()), 'yyyy-MM-dd'), to: format(endOfMonth(new Date()), 'yyyy-MM-dd') },
]

export default function ReportsPage() {
  const [period, setPeriod] = useState(PERIODS[1])
  const [isExporting, setIsExporting] = useState(false)

  const { data: sales } = useQuery({
    queryKey: ['sales', period.from, period.to],
    queryFn:  () => reportsApi.sales({ from: period.from, to: period.to }).then(r => r.data),
  })

  const { data: topProducts = [] } = useQuery({
    queryKey: ['top-products', period.from, period.to],
    queryFn:  () => reportsApi.topProducts({ from: period.from, to: period.to, limit: 10 }).then(r => r.data),
  })

  const { data: byWaiter = [] } = useQuery({
    queryKey: ['by-waiter', period.from, period.to],
    queryFn:  () => reportsApi.byWaiter({ from: period.from, to: period.to }).then(r => r.data),
  })

  const { data: cashSummary } = useQuery({
    queryKey: ['cash-summary', period.from],
    queryFn:  () => reportsApi.cashSummary({ date: period.from }).then(r => r.data),
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

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Rapports & Statistiques" subtitle="Analyse des performances">
        <Button 
          variant="outline" 
          size="sm" 
          disabled={isExporting}
          onClick={handleExport}
        >
          <Download size={14} className="mr-1.5" /> 
          {isExporting ? 'Génération...' : 'Export PDF complet'}
        </Button>
      </PageHeader>

      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {PERIODS.map(p => (
          <Button
            key={p.label}
            variant={period.label === p.label ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPeriod(p)}
            className={cn(
               "rounded-xl px-4 text-[10px] font-black uppercase tracking-widest shrink-0 transition-all",
               period.label === p.label ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'bg-muted text-muted-foreground border-border hover:text-foreground hover:bg-accent'
            )}
          >{p.label}</Button>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <StatCard label="CA total" value={formatAmount(summary?.revenue ?? 0)} icon={CreditCard} color="orange" />
        <StatCard label="Commandes" value={summary?.orders_count ?? 0} icon={ShoppingBag} color="blue" />
        <StatCard label="Ticket moyen" value={formatAmount(summary?.avg_ticket ?? 0)} icon={TrendingUp} color="green" />
        <StatCard label="Couverts" value={summary?.total_covers ?? 0} icon={Users} color="purple" />
      </div>

      <Tabs defaultValue="products" className="mt-8">
        <TabsList className="bg-muted p-1 rounded-2xl border border-border h-12 w-full lg:w-auto overflow-x-auto justify-start no-scrollbar">
          <TabsTrigger value="products" className="rounded-xl px-6 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all h-full shrink-0">📈 Produits</TabsTrigger>
          <TabsTrigger value="team" className="rounded-xl px-6 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all h-full shrink-0">👥 Équipe</TabsTrigger>
          <TabsTrigger value="cash" className="rounded-xl px-6 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all h-full shrink-0">💰 Caisse</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="mt-6">
          <Card className="border-border bg-card rounded-2xl overflow-hidden shadow-md">
             <CardHeader className="p-6 border-b border-border bg-muted/20">
                <CardTitle className="text-sm font-black text-muted-foreground uppercase tracking-widest">Top 10 Produits</CardTitle>
             </CardHeader>
             <CardContent className="p-6">
               <div className="space-y-6">
                 {topProducts.slice(0, 10).map((p, i) => (
                   <div key={i} className="flex flex-col gap-2">
                     <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                           <span className="text-xs font-black text-muted-foreground/40 w-5">#{i + 1}</span>
                           <p className="text-sm font-black text-foreground italic tracking-tighter truncate max-w-[150px] lg:max-w-none">{p.product?.name}</p>
                        </div>
                        <div className="flex items-center gap-4">
                           <span className="text-[10px] font-black text-muted-foreground uppercase">×{p.total_qty}</span>
                           <span className="text-sm font-black text-primary">{formatAmount(p.total_revenue ?? 0)}</span>
                        </div>
                     </div>
                     <div className="w-full bg-muted rounded-full h-1 relative overflow-hidden">
                        <div className="bg-primary h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, (p.total_qty / (topProducts[0]?.total_qty || 1)) * 100)}%` }} />
                     </div>
                   </div>
                 ))}
               </div>
             </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="mt-6">
          <Card className="border-border bg-card rounded-2xl overflow-hidden shadow-md">
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/20">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Serveur</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Commandes</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">CA généré</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Ticket moyen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {byWaiter.map(row => (
                    <tr key={row.user_id} className="hover:bg-muted/50">
                      <td className="px-4 py-3 font-medium text-foreground">{row.waiter?.first_name} {row.waiter?.last_name}</td>
                      <td className="px-4 py-3 text-right text-foreground">{row.orders_count}</td>
                      <td className="px-4 py-3 text-right text-foreground">{formatAmount(row.revenue)}</td>
                      <td className="px-4 py-3 text-right text-foreground">{formatAmount(row.avg_ticket)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="md:hidden divide-y divide-border">
              {byWaiter.map(row => (
                <div key={row.user_id} className="p-5 space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-base font-black text-foreground italic tracking-tighter">{row.waiter?.first_name} {row.waiter?.last_name}</h3>
                    <Badge className="bg-primary/10 text-primary border-none px-2 py-0.5 text-[8px] font-black uppercase tracking-widest">{row.orders_count} CMD</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="bg-muted rounded-xl p-3 border border-border">
                        <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">CA Réalisé</p>
                        <p className="text-lg font-black text-foreground tracking-tighter mt-1">{formatAmount(row.revenue)}</p>
                     </div>
                     <div className="bg-muted rounded-xl p-3 border border-border">
                        <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Panier Moy.</p>
                        <p className="text-lg font-black text-foreground/80 tracking-tighter mt-1">{formatAmount(row.avg_ticket)}</p>
                     </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="cash" className="mt-6 space-y-4 pb-10">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
            {(cashSummary?.payments ?? []).map((p, i) => (
              <Card key={i} className="border-border bg-card rounded-2xl shadow-md overflow-hidden p-4">
                <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">{paymentMethodLabel(p.method)}</p>
                <p className="text-lg lg:text-2xl font-black text-foreground mt-1 tracking-tighter truncate">{formatAmount(p.total)}</p>
                <div className="flex items-center gap-1.5 mt-2">
                   <div className="w-1 h-1 rounded-full bg-emerald-500" />
                   <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter">{p.count} transactions</span>
                </div>
              </Card>
            ))}
          </div>
          <Card className="border-primary/20 bg-primary shadow-lg shadow-primary/10 rounded-[2rem] overflow-hidden p-8 mt-6">
            <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
              <div className="text-center lg:text-left">
                 <p className="text-[10px] font-black text-primary-foreground/70 uppercase tracking-[0.2em] mb-1">Résumé Global Encaissé</p>
                 <h2 className="text-3xl font-black text-primary-foreground tracking-tighter uppercase italic">Total Financier</h2>
              </div>
              <span className="text-4xl font-black text-primary-foreground tracking-tighter drop-shadow-xl">{formatAmount(cashSummary?.total ?? 0)}</span>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
