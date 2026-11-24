import React, { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { reportsApi } from '@/api/reports'
import apiClient from '@/api/client'
import StatCard from '@/components/shared/StatCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatAmount } from '@/lib/formatters'
import { TrendingUp, Users, CreditCard, Activity, ChefHat, UtensilsCrossed, Cookie, LayoutDashboard, Eye, EyeOff, Lock } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { usePermissions } from '@/hooks/usePermissions'

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('all')
  const { toast } = useToast()
  const { isAdmin } = usePermissions()
  
  const [showFinancials, setShowFinancials] = useState(false)

  useEffect(() => {
    if (isAdmin) {
      setShowFinancials(true)
    }
  }, [isAdmin])
  const [isAdminPinModalOpen, setIsAdminPinModalOpen] = useState(false)
  const [adminPin, setAdminPin] = useState('')
  const [isValidatingPin, setIsValidatingPin] = useState(false)

  const handleValidateAdminPin = async () => {
    setIsValidatingPin(true)
    try {
      await apiClient.post('/auth/validate-admin-pin', { pin: adminPin })
      setShowFinancials(true)
      setIsAdminPinModalOpen(false)
      setAdminPin('')
      toast({ title: "Accès autorisé" })
    } catch (err) {
      toast({ title: "Échec", description: "PIN Admin incorrect", variant: "destructive" })
    } finally {
      setIsValidatingPin(false)
    }
  }

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn:  () => reportsApi.dashboard().then(r => r.data),
    refetchInterval: 30000,
  })

  const { data: topProducts } = useQuery({
    queryKey: ['top-products-today', activeTab],
    queryFn:  () => reportsApi.topProducts({
      from:  format(new Date(), 'yyyy-MM-dd'),
      to:    format(new Date(), 'yyyy-MM-dd'),
      limit: 10,
      destination: activeTab === 'all' ? null : activeTab
    }).then(r => r.data),
  })

  const { data: recentLogs } = useQuery({
    queryKey: ['recent-logs'],
    queryFn:  () => apiClient.get('/activity-logs').then(r => r.data?.data?.slice(0, 5) ?? []),
    refetchInterval: 60000,
  })

  if (isLoading) return <DashboardSkeleton />

  const totalTableCount = stats?.tables ? Object.values(stats.tables).reduce((acc, current) => acc + (current?.count || 0), 0) : 12
  const chartData = stats?.hourly_sales || []

  const TABS = [
    { id: 'all',     label: 'Tout',      icon: LayoutDashboard, color: 'text-white' },
    { id: 'pizza',   label: 'Pizza',     icon: Cookie,          color: 'text-pink-500' },
    { id: 'kitchen', label: 'Cuisine',   icon: ChefHat,         color: 'text-orange-500' },
    { id: 'bar',     label: 'Bar',       icon: UtensilsCrossed, color: 'text-blue-500' },
  ]

  // Calcul du revenu spécifique à l'onglet s'il n'est pas "all"
  const getRevenueValue = () => {
    if (activeTab === 'all') return stats?.revenue_today ?? 0
    return stats?.by_destination?.[activeTab] ?? 0
  }

  return (
    <div className="space-y-6 animate-fade-in lg:p-6 bg-background min-h-screen text-foreground transition-colors duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-border pb-4 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground overflow-hidden italic">Dashboard</h1>
          <div className="flex items-center gap-2 mt-1">
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse" />
             <span className="text-[10px] font-bold text-muted-foreground tracking-widest">{format(new Date(), "EEEE d MMMM yyyy", { locale: fr })}</span>
          </div>
        </div>

        {/* Tabs de sélection rapide */}
        <div className="flex items-center bg-muted p-1 rounded-2xl border border-border overflow-x-auto no-scrollbar max-w-full md:max-w-max">
           {/* {TABS.map((tab) => {
             const Icon = tab.icon
             const isActive = activeTab === tab.id
             return (
                <button
                   key={item.path}
                   onClick={() => navigate(item.path)}
                   className={cn(
                   "w-full flex items-center justify-between p-3 rounded-xl transition-all group",
                   isActive ? "bg-card text-foreground shadow-lg" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                   )}
                >
                 <Icon size={14} className={cn(isActive ? tab.color : "text-current")} />
                 <span className="text-[11px] font-black tracking-tighter italic capitalize">{tab.label.toLowerCase()}</span>
               </button>
             )
           })} */}
        </div>

        <div className="flex items-center gap-2">
            <div className="hidden lg:flex items-center gap-2 bg-muted px-4 py-2 rounded-xl border border-border">
                <Activity size={14} className="text-primary" />
                <span className="text-[11px] font-black text-muted-foreground tracking-tighter italic">Live monitor</span>
            </div>
            
            <Button 
                onClick={() => showFinancials ? setShowFinancials(false) : setIsAdminPinModalOpen(true)} 
                variant="ghost" 
                className={cn(
                    "h-10 px-4 text-[10px] font-black uppercase border border-border rounded-xl transition-all",
                    showFinancials ? "bg-emerald-500 text-white hover:bg-emerald-600" : "bg-orange-500 text-white hover:bg-orange-600"
                )}
            >
                {showFinancials ? <EyeOff size={14} className="mr-2" /> : <Eye size={14} className="mr-2" />}
                {showFinancials ? "Masquer FCFA" : "Afficher FCFA"}
            </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          label={activeTab === 'all' ? "Recettes" : `Recettes ${activeTab}`} 
          value={showFinancials ? formatAmount(getRevenueValue()) : '******'} 
          icon={CreditCard} 
          trend={activeTab === 'all' ? stats?.growth_percent : null} 
          color={activeTab === 'all' ? "orange" : TABS.find(t => t.id === activeTab)?.color?.split('-')[1]} 
          description={activeTab === 'all' ? "Ventes payées" : `Ventes payées ${activeTab}`} 
        />
        <StatCard label="Commandes" value={stats?.orders_today ?? 0} icon={Activity} color="blue" description="Total jour" />
        <StatCard label="Panier Moyen" value={showFinancials ? formatAmount(stats?.avg_ticket ?? 0) : '******'} icon={TrendingUp} color="green" description="Ticket moyen" />
        <StatCard label="Occupation" value={`${stats?.tables?.occupied?.count ?? 0} / ${totalTableCount}`} icon={Users} color="purple" progress={((stats?.tables?.occupied?.count ?? 0) / totalTableCount) * 100} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-border bg-card rounded-2xl overflow-hidden shadow-xl">
           <CardHeader className="p-6 pb-2 border-b border-border flex flex-row items-center justify-between">
             <CardTitle className="text-xs font-bold text-muted-foreground tracking-widest leading-none uppercase">Flux des ventes (24h)</CardTitle>
             <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-none font-black italic">Temps réel</Badge>
           </CardHeader>
           <CardContent className="p-6">
             <div className="h-[250px] flex items-end gap-1 px-1">
               {chartData.map((data) => {
                 const maxVal = Math.max(...(chartData.map(s => s.revenue) || [1]));
                 const height = data.revenue > 0 ? (data.revenue / maxVal) * 100 : 3;
                 return (
                    <div key={data.hour} className="group relative flex-1 flex flex-col items-center gap-2 h-full">
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-popover border border-border text-popover-foreground text-[10px] font-bold px-2 py-1 rounded shadow-2xl opacity-0 group-hover:opacity-100 transition-all z-10 whitespace-nowrap">
                          {showFinancials ? formatAmount(data.revenue) : '******'}
                      </div>
                      <div className="w-full bg-muted rounded-t-md transition-all group-hover:bg-primary/10 relative overflow-hidden h-full flex flex-col justify-end">
                        <div className="w-full bg-primary rounded-t-md transition-all shadow-[0_0_15px_rgba(var(--primary),0.2)]" style={{ height: `${height}%` }} />
                      </div>
                      <span className="text-[9px] font-bold text-muted-foreground italic tracking-tighter">{data.hour}h</span>
                    </div>
                 )
               })}
             </div>
           </CardContent>
        </Card>

        <Card className="border-border bg-card rounded-2xl overflow-hidden shadow-xl">
          <CardHeader className="p-6 pb-2 border-b border-border">
            <CardTitle className="text-xs font-bold text-muted-foreground tracking-widest leading-none uppercase">
              {activeTab === 'all' ? 'Meilleures ventes' : `Top ${activeTab}`}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {(topProducts ?? []).map((item, i) => (
                <div key={item.product_id} className="flex items-center gap-4 p-4 hover:bg-muted transition-colors animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="text-xs font-black text-muted-foreground/30 w-4 italic">{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground truncate italic tracking-tighter capitalize">{item.product?.name.toLowerCase()}</p>
                    <p className="text-[10px] text-muted-foreground font-bold mt-0.5 italic">{item.total_qty} unités</p>
                  </div>
                  <div className="text-right text-sm font-black text-foreground italic tracking-tighter">
                      {showFinancials ? formatAmount(item.revenue || 0) : '******'}
                  </div>
                </div>
              ))}
              {(topProducts ?? []).length === 0 && (
                <div className="p-12 text-center">
                  <p className="text-[10px] font-black text-muted-foreground tracking-widest italic uppercase">Aucune donnée</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border bg-card rounded-2xl overflow-hidden shadow-xl">
        <CardHeader className="p-6 pb-5 border-b border-border flex flex-row items-center justify-between">
           <CardTitle className="text-sm font-bold text-muted-foreground tracking-widest leading-none tracking-tight italic">Historique des opérations</CardTitle>
           <Button variant="ghost" className="h-8 text-[10px] font-black text-primary tracking-widest p-0 italic">Tout voir</Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
             {(recentLogs ?? []).map((log) => (
                <div key={log.id} className="flex items-center gap-4 p-4 hover:bg-muted transition-colors">
                   <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-muted border border-border shrink-0">
                     <Activity size={14} className="text-muted-foreground" />
                   </div>
                   <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-foreground leading-snug truncate italic">{log.description || log.message}</p>
                        <p className="text-[10px] font-bold text-muted-foreground/40 mt-1 italic tracking-widest uppercase">Il y a {log.created_at_human} — {log.user?.first_name}</p>
                   </div>
                </div>
             ))}
          </div>
        </CardContent>
      </Card>

      {/* PIN Modal for Admin Access */}
      <Dialog open={isAdminPinModalOpen} onOpenChange={setIsAdminPinModalOpen}>
          <DialogContent className="max-w-[20rem] bg-card border-border text-foreground rounded-[2.5rem] p-0 overflow-hidden shadow-2xl">
              <DialogHeader className="p-10 pb-4 bg-muted/40 border-b border-border space-y-4">
                  <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center mx-auto shadow-xl shadow-primary/20">
                      <Lock size={28} className="text-primary-foreground" />
                  </div>
                  <DialogTitle className="text-center text-xl font-black italic uppercase tracking-tighter leading-none text-foreground">Admin requis</DialogTitle>
                  <p className="text-center text-[10px] text-muted-foreground font-black uppercase tracking-widest leading-relaxed">Saisissez le PIN Admin pour afficher les chiffres</p>
              </DialogHeader>
              <div className="p-10 pt-4 space-y-8">
                  <Input
                      type="password"
                      value={adminPin}
                      onChange={e => setAdminPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="******"
                      className="text-center text-4xl h-20 bg-muted/50 border-border font-black text-foreground tracking-[0.5em] rounded-2xl outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-inner"
                      maxLength={6}
                      inputMode="numeric"
                  />
                  
                  <div className="grid grid-cols-2 gap-3">
                      <Button variant="ghost" className="h-14 font-black uppercase text-[10px] tracking-widest text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl" onClick={() => setIsAdminPinModalOpen(false)}>Annuler</Button>
                      <Button 
                          className="h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase text-[10px] tracking-widest rounded-xl shadow-lg shadow-primary/20" 
                          onClick={handleValidateAdminPin} 
                          disabled={adminPin.length < 4 || isValidatingPin}
                      >
                          {isValidatingPin ? <div className="animate-spin w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full" /> : "Valider"}
                      </Button>
                  </div>
              </div>
          </DialogContent>
      </Dialog>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8 p-8 bg-background min-h-screen text-foreground">
      <Skeleton className="h-12 w-64 bg-muted" />
      <div className="grid grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl bg-muted" />)}
      </div>
      <div className="grid grid-cols-3 gap-8">
        <Skeleton className="col-span-2 h-[400px] rounded-[2rem] bg-muted" />
        <Skeleton className="h-[400px] rounded-[2rem] bg-muted" />
      </div>
    </div>
  )
}
