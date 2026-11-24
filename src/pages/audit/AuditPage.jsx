import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import apiClient from '@/api/client'
import PageHeader from '@/components/shared/PageHeader'
import { formatDateTime } from '@/lib/formatters'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Search, ShieldCheck } from 'lucide-react'

export default function AuditPage() {
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', search],
    queryFn:  () => apiClient.get('/activity-logs', { params: search ? { search } : {} }).then(r => r.data),
  })

  const logs = data?.data ?? []

  const actionColor = (a) => ({
    created: 'bg-green-500/10 text-green-500 border-green-500/20',
    updated: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    deleted: 'bg-red-500/10 text-red-500 border-red-500/20',
    login:   'bg-purple-500/10 text-purple-500 border-purple-500/20',
  }[a] ?? 'bg-slate-500/10 text-slate-400 border-slate-500/20')

  return (
    <div className="space-y-6 animate-fade-in p-2 lg:p-4">
      <PageHeader title="Journal des Activités" subtitle="Traçabilité complète des actions du personnel" />

      <div className="relative max-w-sm">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={16} className="text-muted-foreground/30" />
        </div>
        <Input 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
          placeholder="Rechercher par description ou utilisateur..." 
          className="pl-10 bg-muted/40 border-border text-foreground placeholder:text-muted-foreground h-11 shadow-sm" 
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin w-10 h-10 border-4 border-orange-500/30 border-t-orange-500 rounded-full" />
        </div>
      ) : (
        <Card className="border-border bg-card/80 backdrop-blur-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-[10px] uppercase font-black tracking-widest text-muted-foreground">
                  <th className="text-left px-4 py-2.5">Date</th>
                  <th className="text-left px-4 py-2.5">Utilisateur</th>
                  <th className="text-left px-4 py-2.5">Action</th>
                  <th className="text-left px-4 py-2.5">Module</th>
                  <th className="text-left px-4 py-2.5">Détails</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-background/50">
                {logs.map((log, i) => (
                  <tr key={log.id} className="hover:bg-muted/30 transition-colors group text-sm">
                    <td className="px-4 py-1.5 whitespace-nowrap">
                      <p className="text-foreground font-bold tracking-tight">{log.created_at_human}</p>
                      <p className="text-[10px] text-muted-foreground uppercase mt-0.5 font-medium tracking-wide">
                        {format(new Date(log.created_at), 'HH:mm:ss')}
                      </p>
                    </td>
                    <td className="px-4 py-1.5 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-muted/80 flex items-center justify-center text-[10px] font-black text-muted-foreground border border-border">
                            {log.user?.first_name?.charAt(0) || '?'}
                        </div>
                        <span className="text-foreground/80 font-medium text-xs">
                            {log.user?.first_name} {log.user?.last_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-1.5 whitespace-nowrap">
                       <Badge variant="outline" className={cn("px-2 py-0 border font-bold uppercase text-[9px] tracking-wider", actionColor(log.action))}>
                         {log.action}
                       </Badge>
                    </td>
                    <td className="px-4 py-1.5 whitespace-nowrap">
                      <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/60 truncate block max-w-[100px]">
                        {log.module}
                      </span>
                    </td>
                    <td className="px-4 py-1.5">
                      <p className="text-muted-foreground text-xs leading-relaxed max-w-xl truncate group-hover:whitespace-normal group-hover:text-foreground transition-colors">
                        {log.description || log.message}
                      </p>
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr><td colSpan={5} className="px-6 py-20 text-center text-muted-foreground font-medium">Aucune activité enregistrée</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
