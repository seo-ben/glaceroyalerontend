import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import apiClient from '@/api/client'
import PageHeader from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Controller } from 'react-hook-form'
import { Plus, Search, UserCog, Mail, Shield, Trash2, Key, UserCheck, UserX } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function UsersPage() {
  const queryClient = useQueryClient()
  const [search, setSearch]     = useState('')
  const [editUser, setEditUser] = useState(null)

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn:  () => apiClient.get('/users').then(r => r.data?.data ?? r.data),
  })

  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn:  () => apiClient.get('/roles').then(r => r.data),
  })

  const saveMutation = useMutation({
    mutationFn: (data) => data.id ? apiClient.put(`/users/${data.id}`, data) : apiClient.post('/users', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['users'] }); setEditUser(null) },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => apiClient.delete(`/users/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  })

  const filtered = users.filter(u =>
    !search || `${u.first_name} ${u.last_name} ${u.email}`.toLowerCase().includes(search.toLowerCase())
  )

  const getRoleStyle = (r) => ({
    admin:   'bg-red-500/10 text-red-500 border-red-500/20',
    manager: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    cashier: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    waiter:  'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    cook:    'bg-orange-500/10 text-orange-500 border-orange-500/20',
  }[r] ?? 'bg-muted text-muted-foreground border-border')

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
              <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                      <UserCog size={20} className="text-primary-foreground" />
                  </div>
                  <h1 className="text-3xl font-black text-foreground tracking-tighter uppercase italic">Équipe</h1>
              </div>
              <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] mt-2 ml-1">
                  Gestion des accès et rôles membres
              </p>
          </div>

          <div className="flex items-center gap-4">
              <div className="relative w-64 group">
                  <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
                  <Input 
                    value={search} 
                    onChange={e => setSearch(e.target.value)} 
                    placeholder="Chercher un membre..." 
                    className="h-11 pl-11 bg-muted border-border rounded-2xl text-xs font-bold text-foreground placeholder:text-muted-foreground focus:ring-primary transition-all" 
                  />
              </div>
              <Button 
                onClick={() => setEditUser({})}
                className="h-11 bg-primary text-primary-foreground hover:bg-primary/90 rounded-2xl px-6 font-black uppercase text-[10px] tracking-widest shadow-xl transition-all active:scale-95"
              >
                  <Plus size={16} className="mr-2" /> Nouveau
              </Button>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {isLoading ? (
            [...Array(8)].map((_, i) => <div key={i} className="h-48 bg-muted rounded-[2rem] animate-pulse" />)
        ) : filtered.map(user => (
          <Card key={user.id} className="bg-card border-border hover:border-primary/20 transition-all group rounded-[2rem] overflow-hidden relative shadow-md">
            <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none">
                 <Shield size={64} className="text-primary" />
            </div>
            
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-[1.2rem] bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-sm shrink-0 uppercase italic">
                  {user.first_name?.[0]}{user.last_name?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-black text-sm text-foreground truncate uppercase tracking-tight italic">
                        {user.first_name} {user.last_name}
                    </p>
                    {user.active ? <UserCheck size={12} className="text-emerald-500" /> : <UserX size={12} className="text-red-500" />}
                  </div>
                  <p className="text-[10px] font-bold text-muted-foreground flex items-center gap-1 mt-0.5 truncate uppercase tracking-widest">
                    <Mail size={10} className="shrink-0" />
                    {user.email}
                  </p>
                  
                  <div className="flex items-center gap-2 mt-4">
                    <Badge variant="outline" className={cn("text-[9px] font-black uppercase px-2 py-0.5 rounded-lg tracking-widest", getRoleStyle(user.role?.name))}>
                      {user.role?.name || 'Aucun rôle'}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-6 pt-4 border-t border-border">
                <Button 
                   variant="ghost" 
                   size="sm" 
                   className="flex-1 h-9 bg-muted hover:bg-accent text-foreground font-black uppercase text-[9px] tracking-widest rounded-xl transition-all border border-border" 
                   onClick={() => setEditUser(user)}
                >
                  <UserCog size={12} className="mr-1.5" /> Modifier
                </Button>
                <Button 
                   variant="ghost" 
                   size="icon" 
                   className="h-9 w-9 bg-red-500/5 hover:bg-red-500 hover:text-white text-red-500 border border-red-500/10 rounded-xl transition-all" 
                   onClick={() => {
                      if (confirm('Supprimer ce membre définitivement ?')) deleteMutation.mutate(user.id)
                   }}
                >
                  <Trash2 size={12} />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {editUser !== null && (
        <UserDialog
          user={editUser}
          roles={roles}
          onClose={() => setEditUser(null)}
          onSubmit={d => saveMutation.mutate(d)}
          isLoading={saveMutation.isPending}
        />
      )}
    </div>
  )
}

function UserDialog({ user, roles, onClose, onSubmit, isLoading }) {
  const { register, handleSubmit, control } = useForm({
    defaultValues: {
      id:         user.id ?? null,
      first_name: user.first_name ?? '',
      last_name:  user.last_name ?? '',
      email:      user.email ?? '',
      password:   '',
      role_id:    user.role_id ? String(user.role_id) : '',
      pin_code:   user.pin_code ?? '',
      is_active:  user.active ?? true,
    },
  })

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-card border-border text-foreground rounded-[2.5rem] shadow-2xl p-0 overflow-hidden">
        <DialogHeader className="p-10 pb-4 bg-muted/40 border-b border-border">
          <DialogTitle className="text-xl font-black uppercase italic tracking-tighter">
              {user.id ? 'Éditer Membre' : 'Nouveau Membre'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="p-10 pt-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Prénom</Label>
                <Input {...register('first_name', { required: true })} className="h-11 bg-muted border-border rounded-2xl text-xs font-bold focus:ring-primary text-foreground" />
            </div>
            <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Nom</Label>
                <Input {...register('last_name', { required: true })} className="h-11 bg-muted border-border rounded-2xl text-xs font-bold focus:ring-primary text-foreground" />
            </div>
          </div>
          
          <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Email professionnel</Label>
              <div className="relative">
                  <Mail size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
                  <Input {...register('email', { required: true })} type="email" className="h-11 pl-11 bg-muted border-border rounded-2xl text-xs font-bold focus:ring-primary text-foreground" />
              </div>
          </div>

          <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Rôle & Accès</Label>
              <Controller name="role_id" control={control} render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="h-11 bg-muted border-border rounded-2xl text-xs font-bold text-foreground">
                      <SelectValue placeholder="Choisir un rôle" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border text-foreground">
                    {roles.map(r => <SelectItem key={r.id} value={String(r.id)} className="text-xs font-bold uppercase tracking-tight">{r.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              )} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Mot de passe</Label>
                <div className="relative">
                    <Key size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
                    <Input {...register('password', { required: !user.id })} type="password" placeholder="••••••••" className="h-11 pl-11 bg-muted border-border rounded-2xl text-xs font-bold focus:ring-primary text-foreground placeholder:opacity-50" />
                </div>
            </div>
            <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">CODE PIN (Caisse)</Label>
                <Input {...register('pin_code')} maxLength={4} placeholder="1234" className="h-11 bg-muted border-border rounded-2xl text-xs font-black text-center tracking-[0.5em] focus:ring-primary text-foreground placeholder:opacity-50" />
            </div>
          </div>

          <div className="flex gap-3 pt-6">
            <Button type="button" variant="ghost" className="flex-1 h-12 text-muted-foreground hover:text-foreground hover:bg-muted font-black uppercase text-[10px] tracking-widest rounded-2xl border border-border" onClick={onClose}>
                Fermer
            </Button>
            <Button type="submit" className="flex-1 h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-xl shadow-primary/20" disabled={isLoading}>
                {user.id ? 'Mettre à jour' : 'Créer l\'accès'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
