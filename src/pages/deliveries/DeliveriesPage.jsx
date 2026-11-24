import { useState, useEffect, useRef } from 'react'
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/api/client'
import { formatAmount, formatDateTime } from '@/lib/formatters'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Truck, Phone, MapPin, Clock, CheckCircle, 
  Package, RefreshCw, Search, Filter, 
  User, Calendar, ChevronDown, Loader2,
  ExternalLink, ArrowUpDown, History,
  MoreVertical, Mail, PhoneCall
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

const STATUSES = [
  { value: 'all',       label: 'Toutes',       color: 'bg-zinc-500' },
  { value: 'pending',   label: 'Attente',      color: 'bg-orange-500' },
  { value: 'preparing', label: 'Préparation',  color: 'bg-blue-500' },
  { value: 'on_the_way', label: 'En Route',     color: 'bg-purple-500' },
  { value: 'delivered', label: 'Livrées',      color: 'bg-emerald-500' },
]

export default function DeliveriesPage() {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [viewMode, setViewMode] = useState('split') // 'split' or 'table'
  
  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Infinite Query for Deliveries
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isRefetching
  } = useInfiniteQuery({
    queryKey: ['deliveries', statusFilter, debouncedSearch],
    queryFn: async ({ pageParam = 1 }) => {
      const params = {
        page: pageParam,
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(debouncedSearch && { search: debouncedSearch })
      };
      const response = await apiClient.get('/deliveries', { params });
      return response.data;
    },
    getNextPageParam: (lastPage) => lastPage.next_page_url ? lastPage.current_page + 1 : undefined,
    initialPageParam: 1,
    refetchInterval: 30000,
  })

  const { data: drivers = [] } = useQuery({
    queryKey: ['drivers'],
    queryFn: () => apiClient.get('/deliveries/drivers').then(r => r.data),
  })

  // Flattened deliveries
  const deliveries = data?.pages.flatMap(page => page.data) ?? []

  const assignMutation = useMutation({
    mutationFn: ({ id, driverId }) => apiClient.put(`/deliveries/${id}/assign`, { driver_id: driverId }),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['deliveries'] });
        queryClient.invalidateQueries({ queryKey: ['delivery'] });
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, status }) => apiClient.put(`/deliveries/${id}/status`, { status }),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['deliveries'] });
        queryClient.invalidateQueries({ queryKey: ['delivery'] });
    },
  })

  const selected = deliveries.find(d => d.id === selectedId);

  const getStatusConfig = (s) => {
    return STATUSES.find(st => st.value === s) ?? { label: s, color: 'bg-zinc-500' };
  }

  const safeFormatTime = (dateStr) => {
    if (!dateStr) return '--:--';
    try {
        const timePart = dateStr.includes('T') ? dateStr.split('T')[1]?.substring(0, 5) : dateStr.split(' ')[1]?.substring(0, 5);
        return timePart || '--:--';
    } catch { return '--:--'; }
  }

  return (
    <div className="h-full flex flex-col gap-2 lg:h-[calc(100vh-120px)] overflow-hidden bg-[#f4f7fa]">
      {/* Ultra Compact Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-zinc-200">
        <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-zinc-800 tracking-tight">Management Livraisons</h1>
            <Badge variant="outline" className="text-[10px] font-bold bg-zinc-100 uppercase tracking-widest text-zinc-500 border-none px-2 h-5">
                {deliveries.length} Flux en cours
            </Badge>
        </div>

        <div className="flex items-center gap-2">
            <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" size={13} />
                <input 
                    placeholder="Chercher..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 pr-3 h-8 text-xs bg-zinc-100 border-none rounded-md focus:ring-1 focus:ring-blue-500 transition-all font-medium w-48 lg:w-64"
                />
            </div>
            <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ['deliveries'] })} className="h-8 w-8 p-0">
              <RefreshCw size={14} className={isRefetching ? "animate-spin" : ""} />
            </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Table/List Section */}
        <div className={cn(
            "flex-1 flex flex-col transition-all duration-300",
            selectedId && "hidden lg:flex"
        )}>
           {/* Compact Table Filters */}
           <div className="p-2 flex items-center gap-1 overflow-x-auto no-scrollbar bg-white border-b border-zinc-200">
            {STATUSES.map(s => (
                <button
                    key={s.value}
                    onClick={() => setStatusFilter(s.value)}
                    className={cn(
                        "px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all",
                        statusFilter === s.value 
                            ? "bg-zinc-800 text-white shadow-sm" 
                            : "text-zinc-500 hover:bg-zinc-100"
                    )}
                >
                    {s.label}
                </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto bg-white" onScroll={(e) => {
            const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
            if (scrollHeight - scrollTop <= clientHeight + 1 && hasNextPage && !isFetchingNextPage) fetchNextPage();
          }}>
            <table className="w-full text-left border-collapse table-fixed">
                <thead className="sticky top-0 bg-zinc-50 border-b border-zinc-200 z-10 shadow-sm">
                    <tr>
                        <th className="px-4 py-2.5 text-[10px] font-black text-zinc-500 text-center w-16">#</th>
                        <th className="px-4 py-2.5 text-[10px] font-black text-zinc-500">CLIENT</th>
                        <th className="px-4 py-2.5 text-[10px] font-black text-zinc-500">ADRESSE</th>
                        <th className="px-4 py-2.5 text-[10px] font-black text-zinc-500 w-24">HEURE</th>
                        <th className="px-4 py-2.5 text-[10px] font-black text-zinc-500 w-32">MONTANT</th>
                        <th className="px-4 py-2.5 text-[10px] font-black text-zinc-500 w-32">STATUT</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                    {deliveries.map((d) => (
                        <tr 
                            key={d.id} 
                            onClick={() => setSelectedId(d.id)}
                            className={cn(
                                "cursor-pointer group hover:bg-zinc-50/80 transition-all",
                                selectedId === d.id ? "bg-blue-50/50" : ""
                            )}
                        >
                            <td className="px-4 py-2.5 text-[10px] font-bold text-zinc-400 text-center">
                                {d.order?.order_number.split('-').pop()}
                            </td>
                            <td className="px-4 py-2.5">
                                <p className="text-xs font-bold text-zinc-900 truncate uppercase tracking-tight">{d.customer_name}</p>
                                <p className="text-[9px] text-zinc-400 font-medium truncate">{d.customer_phone}</p>
                            </td>
                            <td className="px-4 py-2.5">
                                <div className="flex items-center gap-1.5 overflow-hidden">
                                    <MapPin size={10} className="text-zinc-400 shrink-0" />
                                    <p className="text-xs font-medium text-zinc-600 truncate">{d.address}</p>
                                </div>
                            </td>
                            <td className="px-4 py-2.5 text-[10px] font-bold text-zinc-500">
                                {safeFormatTime(d.created_at)}
                            </td>
                            <td className="px-4 py-2.5 text-xs font-bold text-zinc-900 font-mono tracking-tighter">
                                {formatAmount(d.order?.total ?? 0)}
                            </td>
                            <td className="px-4 py-2.5">
                                <div className="flex items-center gap-2">
                                    <div className={cn("w-1.5 h-1.5 rounded-full", getStatusConfig(d.status).color)} />
                                    <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">{getStatusConfig(d.status).label}</span>
                                </div>
                            </td>
                        </tr>
                    ))}
                    {isLoading && (
                        <tr><td colSpan="6" className="py-20 text-center"><Loader2 className="animate-spin inline-block mr-2" /> Chargement...</td></tr>
                    )}
                    {!isLoading && deliveries.length === 0 && (
                        <tr><td colSpan="6" className="py-20 text-center text-zinc-400 italic text-xs">Aucun résultat</td></tr>
                    )}
                </tbody>
            </table>
            {isFetchingNextPage && <div className="p-4 text-center"><Loader2 className="animate-spin inline-block" /></div>}
          </div>
        </div>

        {/* Dense Detail Panel */}
        <div className={cn(
            "w-full lg:w-[450px] border-l border-zinc-200 bg-white shadow-xl lg:shadow-none flex flex-col overflow-hidden",
            !selectedId && "hidden"
        )}>
          {selected ? (
            <div className="flex flex-col h-full bg-white z-20">
              {/* Header Details */}
              <div className="p-5 border-b border-zinc-100 flex items-start justify-between bg-zinc-50/50">
                  <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => setSelectedId(null)} className="h-7 w-7 bg-zinc-200 text-zinc-600 rounded-lg lg:hidden">
                            <History size={14} className="rotate-180" />
                        </Button>
                        <h2 className="text-lg font-black text-zinc-900 tracking-tighter">MISSION #{selected.order?.order_number.split('-').pop()}</h2>
                      </div>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">{formatDateTime(selected.created_at)}</p>
                  </div>
                  <div className="flex gap-1.5">
                      <a href={`tel:${selected.customer_phone}`}>
                        <Button variant="outline" size="sm" className="h-8 px-3 border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-bold gap-2">
                            <PhoneCall size={12} className="text-emerald-500" /> Appeler
                        </Button>
                      </a>
                  </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">
                  {/* Customer Block */}
                  <div className="space-y-3">
                      <div className="flex items-center gap-2 px-1 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] border-l-2 border-blue-500">CLIENT & DESTINATION</div>
                      <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-100 space-y-2.5">
                          <div className="flex items-start gap-3">
                              <div className="w-8 h-8 rounded-lg bg-white border border-zinc-200 flex items-center justify-center text-zinc-400 font-bold shrink-0">{selected.customer_name[0]}</div>
                              <div className="overflow-hidden">
                                  <p className="text-xs font-bold text-zinc-900 uppercase truncate leading-none mb-1">{selected.customer_name}</p>
                                  <p className="text-[10px] font-medium text-zinc-500">{selected.customer_phone}</p>
                              </div>
                          </div>
                          <div className="pt-2.5 border-t border-zinc-200">
                             <div className="flex items-start gap-2">
                                <MapPin size={12} className="text-blue-500 shrink-0 mt-0.5" />
                                <p className="text-[11px] font-semibold text-zinc-700 leading-normal italic">{selected.address}</p>
                             </div>
                          </div>
                      </div>
                  </div>

                  {/* Order Items List */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 px-1 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] border-l-2 border-orange-500">DÉTAILS COMMANDE</div>
                    <div className="border border-zinc-100 rounded-xl overflow-hidden divide-y divide-zinc-50">
                        {(selected.order?.items ?? []).map(i => (
                            <div key={i.id} className="p-3 flex justify-between items-center group bg-white hover:bg-zinc-50/50">
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded min-w-[20px] text-center">x{i.quantity}</span>
                                    <span className="text-xs font-bold text-zinc-800 uppercase tracking-tighter truncate max-w-[180px]">{i.product?.name}</span>
                                </div>
                                <span className="text-[11px] font-bold font-mono text-zinc-500">{formatAmount(i.subtotal)}</span>
                            </div>
                        ))}
                    </div>
                    <div className="p-3 bg-zinc-900 rounded-xl text-white flex justify-between items-center shadow-lg">
                        <span className="text-[10px] font-black tracking-widest opacity-60 uppercase">Total à Encaisser</span>
                        <span className="text-lg font-black font-mono">{formatAmount(selected.order?.total ?? 0)}</span>
                    </div>
                  </div>

                  {/* Driver Assignent */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 px-1 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] border-l-2 border-purple-500">ASSIGNATION LIVREUR</div>
                    <div className="p-4 rounded-xl border border-zinc-200 bg-white">
                        <select 
                            className="w-full h-9 bg-zinc-50 border border-zinc-100 rounded-lg px-3 text-[11px] font-bold text-zinc-900 outline-none focus:border-blue-500 transition-all appearance-none cursor-pointer"
                            value={selected.driver_id || ''}
                            onChange={(e) => assignMutation.mutate({ id: selected.id, driverId: e.target.value })}
                        >
                            <option value="" disabled>Choisir un coursier...</option>
                            {drivers.map(dr => (
                                <option key={dr.id} value={dr.id}>{dr.first_name} {dr.last_name}</option>
                            ))}
                        </select>
                    </div>
                  </div>

                  {/* Activity Pipeline */}
                  <div className="space-y-3 pb-24">
                    <div className="flex items-center gap-2 px-1 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] border-l-2 border-zinc-800">DÉPLOIEMENT & ÉTATS</div>
                    <div className="grid grid-cols-2 gap-2">
                        <Button 
                            variant="outline" 
                            className={cn(
                                "h-11 rounded-lg text-[9px] font-black tracking-widest border transition-all",
                                selected.status === 'preparing' ? "bg-blue-600 text-white border-blue-600 shadow-md" : "bg-white text-zinc-500 hover:bg-zinc-50"
                            )}
                            onClick={() => updateMutation.mutate({ id: selected.id, status: 'preparing' })}
                            disabled={updateMutation.isPending}
                        >PRÉPARÉ</Button>
                        <Button 
                            variant="outline" 
                            className={cn(
                                "h-11 rounded-lg text-[9px] font-black tracking-widest border transition-all",
                                selected.status === 'on_the_way' ? "bg-purple-600 text-white border-purple-600 shadow-md" : "bg-white text-zinc-500 hover:bg-zinc-50"
                            )}
                            onClick={() => updateMutation.mutate({ id: selected.id, status: 'on_the_way' })}
                            disabled={updateMutation.isPending}
                        >EN ROUTE</Button>
                    </div>
                    <Button 
                        className="w-full h-14 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-[0.2em] rounded-xl shadow-lg shadow-emerald-600/20 active:translate-y-0.5 transition-all"
                        onClick={() => updateMutation.mutate({ id: selected.id, status: 'delivered' })}
                        disabled={updateMutation.isPending}
                    >TERMINER LA MISSION</Button>
                  </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center opacity-40 bg-zinc-50/30">
                <div className="p-8 rounded-full bg-zinc-100 border border-zinc-200 mb-6">
                    <Truck size={48} className="text-zinc-300" />
                </div>
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-zinc-500">Aucune mission</h3>
                <p className="text-[10px] mt-3 font-bold text-zinc-400 uppercase max-w-[200px] leading-loose">Sélectionnez une ligne dans le tableau pour afficher les détails logistiques</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
