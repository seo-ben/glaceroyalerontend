## 19. PAGE LIVRAISONS

### `src/pages/deliveries/DeliveriesPage.jsx`

```jsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/api/client'
import PageHeader from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatAmount, formatDateTime } from '@/lib/formatters'
import { MapPin, Phone, User, Clock, Package, Truck } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'

const STATUS_CONFIG = {
  pending:    { label: 'En attente',     color: 'bg-slate-100 text-slate-700',   next: 'preparing' },
  preparing:  { label: 'En préparation', color: 'bg-orange-100 text-orange-700', next: 'ready' },
  ready:      { label: 'Prêt',           color: 'bg-blue-100 text-blue-700',     next: 'on_the_way' },
  on_the_way: { label: 'En route',       color: 'bg-purple-100 text-purple-700', next: 'delivered' },
  delivered:  { label: 'Livré',          color: 'bg-green-100 text-green-700',   next: null },
  failed:     { label: 'Échec',          color: 'bg-red-100 text-red-700',       next: null },
}

export default function DeliveriesPage() {
  const queryClient = useQueryClient()
  const { toast }   = useToast()
  const [filterStatus, setFilterStatus] = useState('all')
  const [selected, setSelected]         = useState(null)

  const { data: deliveries = [] } = useQuery({
    queryKey: ['deliveries', filterStatus],
    queryFn:  () => apiClient.get('/deliveries', {
      params: filterStatus !== 'all' ? { status: filterStatus } : {},
    }).then(r => r.data.data),
    refetchInterval: 15000,
  })

  const { data: drivers = [] } = useQuery({
    queryKey: ['drivers'],
    queryFn:  () => apiClient.get('/deliveries/drivers').then(r => r.data),
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => apiClient.put(`/deliveries/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] })
      toast({ title: 'Statut mis à jour' })
    },
  })

  const assignMutation = useMutation({
    mutationFn: ({ id, driver_id }) => apiClient.put(`/deliveries/${id}/assign`, { driver_id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] })
      toast({ title: 'Livreur assigné' })
    },
  })

  const selectedDelivery = deliveries.find(d => d.id === selected)

  return (
    <div className="flex h-full gap-4 animate-fade-in overflow-hidden">
      {/* Liste livraisons */}
      <div className="flex-1 flex flex-col min-w-0">
        <PageHeader title="Livraisons" subtitle="Suivi et gestion des livraisons" />

        {/* Filtres */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {['all', 'pending', 'preparing', 'ready', 'on_the_way', 'delivered'].map(s => (
            <Button
              key={s}
              size="sm"
              variant={filterStatus === s ? 'default' : 'outline'}
              className={filterStatus === s ? 'bg-primary text-white' : ''}
              onClick={() => setFilterStatus(s)}
            >
              {s === 'all' ? 'Toutes' : STATUS_CONFIG[s]?.label}
              {s !== 'all' && (
                <span className="ml-1.5 text-[10px]">
                  ({deliveries.filter(d => d.status === s).length})
                </span>
              )}
            </Button>
          ))}
        </div>

        {/* Cards livraisons */}
        <div className="flex-1 overflow-y-auto space-y-3">
          {deliveries.map(delivery => {
            const cfg = STATUS_CONFIG[delivery.status] ?? {}
            return (
              <Card
                key={delivery.id}
                onClick={() => setSelected(delivery.id)}
                className={cn(
                  'cursor-pointer transition-all hover:border-primary/50',
                  selected === delivery.id && 'border-primary ring-1 ring-primary'
                )}
              >
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm">
                          {delivery.order?.order_number}
                        </span>
                        <Badge className={cn('text-[10px]', cfg.color)}>
                          {cfg.label}
                        </Badge>
                      </div>
                      <p className="font-medium text-sm">{delivery.customer_name}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin size={11} /> {delivery.address}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Package size={11} />
                          {delivery.order?.items?.length ?? 0} article(s)
                        </span>
                        <span>{formatAmount(delivery.delivery_fee)} frais</span>
                        {delivery.driver && (
                          <span className="flex items-center gap-1 text-primary">
                            <Truck size={11} />
                            {delivery.driver.first_name}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {formatDateTime(delivery.created_at)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
          {deliveries.length === 0 && (
            <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
              Aucune livraison
            </div>
          )}
        </div>
      </div>

      {/* Détail livraison */}
      {selectedDelivery && (
        <div className="w-80 shrink-0">
          <Card className="h-full flex flex-col">
            <CardContent className="py-4 flex-1 flex flex-col gap-4">
              <div>
                <h3 className="font-semibold">{selectedDelivery.order?.order_number}</h3>
                <Badge className={cn('mt-1 text-xs', STATUS_CONFIG[selectedDelivery.status]?.color)}>
                  {STATUS_CONFIG[selectedDelivery.status]?.label}
                </Badge>
              </div>

              {/* Info client */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <User size={14} className="text-muted-foreground" />
                  <span>{selectedDelivery.customer_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={14} className="text-muted-foreground" />
                  <span>{selectedDelivery.customer_phone}</span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin size={14} className="text-muted-foreground shrink-0 mt-0.5" />
                  <span>{selectedDelivery.address}</span>
                </div>
              </div>

              {/* Assigner livreur */}
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Livreur assigné</p>
                <Select
                  value={selectedDelivery.driver_id ? String(selectedDelivery.driver_id) : ''}
                  onValueChange={(v) => assignMutation.mutate({ id: selectedDelivery.id, driver_id: Number(v) })}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Choisir un livreur" />
                  </SelectTrigger>
                  <SelectContent>
                    {drivers.map(d => (
                      <SelectItem key={d.id} value={String(d.id)}>
                        {d.first_name} {d.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Progression statut */}
              {STATUS_CONFIG[selectedDelivery.status]?.next && (
                <Button
                  className="w-full bg-primary text-white"
                  onClick={() => statusMutation.mutate({
                    id:     selectedDelivery.id,
                    status: STATUS_CONFIG[selectedDelivery.status].next,
                  })}
                  disabled={statusMutation.isPending}
                >
                  Passer à : {STATUS_CONFIG[STATUS_CONFIG[selectedDelivery.status].next]?.label}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
```

---

## 20. PAGE UTILISATEURS & RÔLES

### `src/pages/users/UsersPage.jsx`

```jsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/api/client'
import PageHeader from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useForm, Controller } from 'react-hook-form'
import { Search, Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'

const ROLE_COLORS = {
  admin:   'bg-purple-100 text-purple-800',
  manager: 'bg-blue-100 text-blue-800',
  cashier: 'bg-teal-100 text-teal-800',
  waiter:  'bg-green-100 text-green-800',
  cook:    'bg-orange-100 text-orange-800',
  driver:  'bg-gray-100 text-gray-800',
}

export default function UsersPage() {
  const queryClient = useQueryClient()
  const { toast }   = useToast()
  const [search, setSearch]     = useState('')
  const [editUser, setEditUser] = useState(null)
  const [showForm, setShowForm] = useState(false)

  const { data: users = [] } = useQuery({
    queryKey: ['users', search],
    queryFn:  () => apiClient.get('/users', { params: { search: search || undefined } }).then(r => r.data.data),
  })

  const toggleMutation = useMutation({
    mutationFn: (id) => apiClient.patch(`/users/${id}/toggle-active`),
    onSuccess:  () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => apiClient.delete(`/users/${id}`),
    onSuccess:  () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast({ title: 'Utilisateur supprimé' })
    },
  })

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Utilisateurs" subtitle="Gestion des accès et rôles">
        <Button size="sm" onClick={() => { setEditUser(null); setShowForm(true) }}>
          <Plus size={15} className="mr-1.5" /> Nouvel utilisateur
        </Button>
      </PageHeader>

      {/* Recherche */}
      <div className="relative max-w-xs">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher..."
          className="pl-9"
        />
      </div>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Utilisateur</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Rôle</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Statut</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Dernière connexion</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className="border-b hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                          {user.first_name[0]}{user.last_name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user.first_name} {user.last_name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={cn('text-xs', ROLE_COLORS[user.role?.name])}>
                      {user.role?.display_name}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Switch
                      checked={user.active}
                      onCheckedChange={() => toggleMutation.mutate(user.id)}
                    />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {user.last_login_at ? new Date(user.last_login_at).toLocaleString('fr-FR') : 'Jamais'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => { setEditUser(user); setShowForm(true) }}
                      >
                        <Edit size={13} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => deleteMutation.mutate(user.id)}
                      >
                        <Trash2 size={13} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Dialog Formulaire */}
      {showForm && (
        <UserFormDialog
          user={editUser}
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['users'] })
            setShowForm(false)
            toast({ title: editUser ? 'Utilisateur modifié' : 'Utilisateur créé' })
          }}
        />
      )}
    </div>
  )
}

function UserFormDialog({ user, onClose, onSuccess }) {
  const [showPass, setShowPass] = useState(false)
  const { register, handleSubmit, control, formState: { errors } } = useForm({
    defaultValues: user ?? { active: true },
  })

  const mutation = useMutation({
    mutationFn: (data) => user
      ? apiClient.put(`/users/${user.id}`, data)
      : apiClient.post('/users', data),
    onSuccess,
  })

  const { data: roles = [] } = useQuery({
    queryKey: ['roles-list'],
    queryFn:  () => apiClient.get('/roles').then(r => r.data),
  })

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{user ? 'Modifier utilisateur' : 'Nouvel utilisateur'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Prénom</Label>
              <Input {...register('first_name', { required: true })} className="mt-1" />
            </div>
            <div>
              <Label>Nom</Label>
              <Input {...register('last_name', { required: true })} className="mt-1" />
            </div>
          </div>
          <div>
            <Label>Email</Label>
            <Input {...register('email', { required: true })} type="email" className="mt-1" />
          </div>
          {!user && (
            <div>
              <Label>Mot de passe</Label>
              <div className="relative mt-1">
                <Input
                  {...register('password', { required: !user })}
                  type={showPass ? 'text' : 'password'}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
          )}
          <div>
            <Label>PIN (4-6 chiffres)</Label>
            <Input {...register('pin')} type="password" maxLength={6} placeholder="••••" className="mt-1" />
          </div>
          <div>
            <Label>Rôle</Label>
            <Controller
              name="role_id"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <Select value={String(field.value ?? '')} onValueChange={v => field.onChange(Number(v))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Choisir un rôle" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map(r => (
                      <SelectItem key={r.id} value={String(r.id)}>{r.display_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>Compte actif</Label>
            <Controller
              name="active"
              control={control}
              render={({ field }) => (
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              )}
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Annuler</Button>
            <Button type="submit" className="flex-1 bg-primary text-white" disabled={mutation.isPending}>
              {user ? 'Sauvegarder' : 'Créer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

---

## 21. PAGE ANNULATIONS

### `src/pages/cancellations/CancellationsPage.jsx`

```jsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/api/client'
import PageHeader from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { formatDateTime } from '@/lib/formatters'
import { useToast } from '@/components/ui/use-toast'
import { Check, X, Clock, ShieldAlert } from 'lucide-react'
import { cn } from '@/lib/utils'

const STATUS_CONFIG = {
  pending:  { label: 'En attente', color: 'bg-orange-100 text-orange-700' },
  approved: { label: 'Approuvée',  color: 'bg-green-100 text-green-700' },
  rejected: { label: 'Rejetée',   color: 'bg-red-100 text-red-700' },
}

export default function CancellationsPage() {
  const queryClient = useQueryClient()
  const { toast }   = useToast()
  const [approving, setApproving] = useState(null)
  const [managerPin, setManagerPin] = useState('')

  const { data: cancellations = [] } = useQuery({
    queryKey: ['cancellations'],
    queryFn:  () => apiClient.get('/cancellations').then(r => r.data.data),
    refetchInterval: 15000,
  })

  const approveMutation = useMutation({
    mutationFn: ({ id, pin }) => apiClient.post(`/cancellations/${id}/approve`, {
      manager_pin: pin,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cancellations'] })
      setApproving(null)
      setManagerPin('')
      toast({ title: 'Annulation approuvée' })
    },
    onError: (e) => toast({
      variant: 'destructive',
      description: e.response?.data?.message ?? 'PIN incorrect',
    }),
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }) => apiClient.post(`/cancellations/${id}/reject`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cancellations'] })
      toast({ title: 'Annulation rejetée' })
    },
  })

  const pending  = cancellations.filter(c => c.status === 'pending')
  const resolved = cancellations.filter(c => c.status !== 'pending')

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Annulations" subtitle="Demandes en attente de validation">
        {pending.length > 0 && (
          <Badge className="bg-orange-100 text-orange-700 gap-1">
            <Clock size={12} />
            {pending.length} en attente
          </Badge>
        )}
      </PageHeader>

      {/* En attente */}
      {pending.length > 0 && (
        <div>
          <h2 className="font-medium text-sm text-muted-foreground mb-3 flex items-center gap-2">
            <ShieldAlert size={14} />
            Demandes en attente
          </h2>
          <div className="space-y-3">
            {pending.map(c => (
              <Card key={c.id} className="border-orange-200">
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className="text-xs bg-orange-100 text-orange-700">En attente</Badge>
                        <span className="text-xs text-muted-foreground">{formatDateTime(c.requested_at)}</span>
                      </div>
                      <p className="font-medium text-sm">
                        Demandé par : {c.requester?.first_name} {c.requester?.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground mt-0.5">Raison : {c.reason}</p>
                      {c.notes && <p className="text-xs text-muted-foreground italic mt-0.5">{c.notes}</p>}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-300 hover:bg-red-50 gap-1"
                        onClick={() => rejectMutation.mutate({ id: c.id, reason: 'Rejetée par le manager' })}
                      >
                        <X size={14} /> Rejeter
                      </Button>
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white gap-1"
                        onClick={() => setApproving(c)}
                      >
                        <Check size={14} /> Approuver
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Historique */}
      <div>
        <h2 className="font-medium text-sm text-muted-foreground mb-3">Historique</h2>
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Demandeur</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Raison</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Validé par</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Statut</th>
                </tr>
              </thead>
              <tbody>
                {resolved.map(c => (
                  <tr key={c.id} className="border-b hover:bg-muted/20">
                    <td className="px-4 py-3 text-xs text-muted-foreground">{formatDateTime(c.requested_at)}</td>
                    <td className="px-4 py-3">{c.requester?.first_name} {c.requester?.last_name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.reason}</td>
                    <td className="px-4 py-3">{c.approver ? `${c.approver.first_name} ${c.approver.last_name}` : '—'}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge className={cn('text-xs', STATUS_CONFIG[c.status]?.color)}>
                        {STATUS_CONFIG[c.status]?.label}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {resolved.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Aucun historique</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Dialog PIN approbation */}
      {approving && (
        <Dialog open onOpenChange={() => { setApproving(null); setManagerPin('') }}>
          <DialogContent className="max-w-xs">
            <DialogHeader>
              <DialogTitle>Confirmer l'approbation</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <p className="text-sm text-muted-foreground">
                Entrez votre PIN manager pour approuver cette annulation.
              </p>
              <div>
                <Label>PIN Manager</Label>
                <Input
                  type="password"
                  value={managerPin}
                  onChange={e => setManagerPin(e.target.value)}
                  maxLength={6}
                  placeholder="••••"
                  className="mt-1 text-center text-lg tracking-widest"
                />
              </div>
              <Button
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                onClick={() => approveMutation.mutate({ id: approving.id, pin: managerPin })}
                disabled={managerPin.length < 4 || approveMutation.isPending}
              >
                Confirmer
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
```

---

## 22. PAGE AUDIT TRAIL

### `src/pages/audit/AuditPage.jsx`

```jsx
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import apiClient from '@/api/client'
import PageHeader from '@/components/shared/PageHeader'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatDateTime } from '@/lib/formatters'
import { Search, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

const MODULE_COLORS = {
  order:        'bg-blue-100 text-blue-700',
  payment:      'bg-green-100 text-green-700',
  stock:        'bg-purple-100 text-purple-700',
  user:         'bg-orange-100 text-orange-700',
  auth:         'bg-gray-100 text-gray-700',
  cancellation: 'bg-red-100 text-red-700',
  product:      'bg-teal-100 text-teal-700',
}

const ACTION_COLORS = {
  created:  'text-green-600',
  updated:  'text-blue-600',
  deleted:  'text-red-600',
  login:    'text-purple-600',
  logout:   'text-gray-600',
  cancelled:'text-red-600',
}

export default function AuditPage() {
  const [search, setSearch]   = useState('')
  const [module, setModule]   = useState('all')
  const [userId, setUserId]   = useState('all')

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['activity-logs', search, module, userId],
    queryFn:  () => apiClient.get('/activity-logs', {
      params: {
        search:  search || undefined,
        module:  module !== 'all' ? module : undefined,
        user_id: userId !== 'all' ? userId : undefined,
      },
    }).then(r => r.data.data),
  })

  const { data: users = [] } = useQuery({
    queryKey: ['users-list'],
    queryFn:  () => apiClient.get('/users').then(r => r.data.data),
  })

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Journal d'audit" subtitle="Traçabilité complète de toutes les actions">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <FileText size={12} />
          {logs.length} entrée(s)
        </div>
      </PageHeader>

      {/* Filtres */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher..."
            className="pl-9"
          />
        </div>
        <Select value={module} onValueChange={setModule}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Module" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les modules</SelectItem>
            {['order','payment','stock','user','auth','cancellation','product'].map(m => (
              <SelectItem key={m} value={m} className="capitalize">{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={userId} onValueChange={setUserId}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Utilisateur" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les utilisateurs</SelectItem>
            {users.map(u => (
              <SelectItem key={u.id} value={String(u.id)}>
                {u.first_name} {u.last_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table logs */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground w-40">Date / Heure</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Utilisateur</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Module</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Action</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Description</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground w-28">IP</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id} className="border-b hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 text-xs text-muted-foreground font-mono whitespace-nowrap">
                    {formatDateTime(log.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    {log.user
                      ? <span className="font-medium">{log.user.first_name} {log.user.last_name}</span>
                      : <span className="text-muted-foreground italic">Système</span>
                    }
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={cn('text-[10px]', MODULE_COLORS[log.module] ?? 'bg-gray-100 text-gray-700')}>
                      {log.module}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('font-medium text-xs', ACTION_COLORS[log.action] ?? 'text-foreground')}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">
                    {log.description}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground font-mono">
                    {log.ip_address ?? '—'}
                  </td>
                </tr>
              ))}
              {!isLoading && logs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                    Aucun log trouvé
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
```

---

## 23. GÉNÉRATION & APERÇU REÇU

### `src/components/receipts/ReceiptPreview.jsx`

```jsx
import { useRef } from 'react'
import { useMutation } from '@tanstack/react-query'
import { receiptsApi } from '@/api/receipts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { formatAmount } from '@/lib/formatters'
import { Printer, Mail, MessageSquare, X, Download } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { useState } from 'react'

export default function ReceiptPreview({ receipt, onClose }) {
  const printRef   = useRef()
  const { toast }  = useToast()
  const [smsPhone, setSmsPhone]   = useState('')
  const [email, setEmail]         = useState('')
  const [showSms, setShowSms]     = useState(false)
  const [showEmail, setShowEmail] = useState(false)

  const smsMutation = useMutation({
    mutationFn: () => receiptsApi.sendSms(receipt.order.id, { phone: smsPhone }),
    onSuccess:  () => { toast({ title: 'SMS envoyé !' }); setShowSms(false) },
  })

  const emailMutation = useMutation({
    mutationFn: () => receiptsApi.sendEmail(receipt.order.id, { email }),
    onSuccess:  () => { toast({ title: 'Email envoyé !' }); setShowEmail(false) },
  })

  const handlePrint = () => {
    const content = printRef.current.innerHTML
    const w = window.open('', '_blank', 'width=400,height=800')
    w.document.write(`
      <html><head><title>Reçu</title>
      <style>
        body { font-family: 'Courier New', monospace; font-size: 11px; margin: 0; padding: 8px; width: 80mm; }
        .center { text-align: center; } .right { text-align: right; }
        .bold { font-weight: bold; } .muted { color: #555; }
        .divider { border-top: 1px dashed #000; margin: 5px 0; }
        table { width: 100%; } td { padding: 1px 0; }
        .total-row td { font-weight: bold; border-top: 1px solid #000; }
      </style></head>
      <body>${content}</body></html>
    `)
    w.document.close()
    w.print()
    w.close()
  }

  const r = receipt

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-background rounded-2xl w-full max-w-sm mx-4 overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="font-semibold">Aperçu du reçu</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        {/* Reçu */}
        <div className="flex-1 overflow-y-auto p-5">
          <div
            ref={printRef}
            id="receipt-print"
            className="bg-white border rounded-lg p-4 font-mono text-xs text-black max-w-[320px] mx-auto"
          >
            {/* En-tête */}
            <div className="text-center mb-3">
              <p className="font-bold text-sm">{r.restaurant.name}</p>
              {r.restaurant.address && <p className="text-gray-500">{r.restaurant.address}</p>}
              {r.restaurant.phone && <p className="text-gray-500">Tél: {r.restaurant.phone}</p>}
              {r.restaurant.vat_number && <p className="text-gray-500">TVA: {r.restaurant.vat_number}</p>}
            </div>

            <div className="border-t border-dashed my-2" />

            {/* Infos commande */}
            <div className="mb-2">
              <div className="flex justify-between"><span className="font-bold">TICKET</span><span>{r.order.number}</span></div>
              <div className="flex justify-between text-gray-500"><span>Date</span><span>{r.order.date} {r.order.time}</span></div>
              {r.order.table_number && <div className="flex justify-between text-gray-500"><span>Table</span><span>{r.order.table_number}</span></div>}
              {r.order.covers > 0 && <div className="flex justify-between text-gray-500"><span>Couverts</span><span>{r.order.covers}</span></div>}
              {r.order.cashier && <div className="flex justify-between text-gray-500"><span>Caissier</span><span>{r.order.cashier}</span></div>}
            </div>

            <div className="border-t border-dashed my-2" />

            {/* Articles */}
            <div className="mb-2">
              {r.lines.map((line, i) => (
                <div key={i} className="mb-1">
                  <div className="flex justify-between">
                    <span className="font-medium flex-1 mr-2">{line.name}</span>
                    <span>x{line.quantity}</span>
                    <span className="ml-2">{line.total_fmt}</span>
                  </div>
                  {line.modifiers.map((m, j) => (
                    <div key={j} className="flex justify-between text-gray-500 pl-2">
                      <span>+ {m.name}</span>
                      <span>{m.extra_fmt}</span>
                    </div>
                  ))}
                  {line.notes && <p className="text-gray-400 italic pl-2">Note: {line.notes}</p>}
                </div>
              ))}
            </div>

            <div className="border-t border-dashed my-2" />

            {/* Totaux */}
            <div className="mb-2">
              <div className="flex justify-between text-gray-500"><span>Sous-total</span><span>{r.totals.subtotal_fmt}</span></div>
              {r.totals.discount > 0 && <div className="flex justify-between text-gray-500"><span>Remise</span><span>{r.totals.discount_fmt}</span></div>}
              <div className="flex justify-between text-gray-500"><span>TVA (18%)</span><span>{r.totals.vat_fmt}</span></div>
              <div className="flex justify-between font-bold text-sm border-t border-solid mt-1 pt-1">
                <span>TOTAL</span>
                <span>{r.totals.total_fmt}</span>
              </div>
            </div>

            <div className="border-t border-dashed my-2" />

            {/* Paiements */}
            <div className="mb-2">
              {r.payments.map((p, i) => (
                <div key={i}>
                  <div className="flex justify-between"><span>{p.method}</span><span>{p.amount_fmt}</span></div>
                  {p.change_given > 0 && <div className="flex justify-between text-gray-500"><span>Monnaie rendue</span><span>{p.change_fmt}</span></div>}
                </div>
              ))}
            </div>

            <div className="border-t border-dashed my-2" />

            {/* Pied de page */}
            <div className="text-center mt-2">
              <p className="font-bold">{r.footer.message}</p>
              {r.footer.website && <p className="text-gray-500">{r.footer.website}</p>}
              <p className="text-gray-400 text-[10px] mt-1">Généré par Omega POS</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="border-t p-4 space-y-2">
          <Button className="w-full gap-2 bg-primary text-white" onClick={handlePrint}>
            <Printer size={15} /> Imprimer
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" className="gap-2" onClick={() => setShowSms(!showSms)}>
              <MessageSquare size={15} /> SMS
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => setShowEmail(!showEmail)}>
              <Mail size={15} /> Email
            </Button>
          </div>

          {showSms && (
            <div className="flex gap-2">
              <Input
                value={smsPhone}
                onChange={e => setSmsPhone(e.target.value)}
                placeholder="+228 9X XX XX XX"
                className="flex-1"
              />
              <Button
                size="sm"
                onClick={() => smsMutation.mutate()}
                disabled={smsMutation.isPending}
                className="bg-primary text-white"
              >
                Envoyer
              </Button>
            </div>
          )}

          {showEmail && (
            <div className="flex gap-2">
              <Input
                value={email}
                onChange={e => setEmail(e.target.value)}
                type="email"
                placeholder="client@email.com"
                className="flex-1"
              />
              <Button
                size="sm"
                onClick={() => emailMutation.mutate()}
                disabled={emailMutation.isPending}
                className="bg-primary text-white"
              >
                Envoyer
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
```

---

## 24. COMPOSANTS RÉUTILISABLES

### `src/components/shared/StatCard.jsx`

```jsx
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown } from 'lucide-react'

const COLOR_MAP = {
  orange: { bg: 'bg-orange-50', icon: 'text-orange-600', border: 'border-orange-100' },
  blue:   { bg: 'bg-blue-50',   icon: 'text-blue-600',   border: 'border-blue-100' },
  green:  { bg: 'bg-green-50',  icon: 'text-green-600',  border: 'border-green-100' },
  purple: { bg: 'bg-purple-50', icon: 'text-purple-600', border: 'border-purple-100' },
  red:    { bg: 'bg-red-50',    icon: 'text-red-600',    border: 'border-red-100' },
}

export default function StatCard({ label, value, icon: Icon, trend, color = 'orange', subtitle }) {
  const c = COLOR_MAP[color] ?? COLOR_MAP.orange

  return (
    <div className={cn('bg-card border rounded-xl p-4', c.border)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', c.bg)}>
            <Icon size={18} className={c.icon} />
          </div>
        )}
      </div>
      {typeof trend === 'number' && (
        <div className={cn(
          'flex items-center gap-1 text-xs mt-2',
          trend >= 0 ? 'text-green-600' : 'text-red-600'
        )}>
          {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {Math.abs(trend).toFixed(1)}% vs hier
        </div>
      )}
    </div>
  )
}
```

### `src/components/shared/PageHeader.jsx`

```jsx
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default function PageHeader({ title, subtitle, children, onBack }) {
  const navigate = useNavigate()

  return (
    <div className="flex items-start justify-between gap-4 mb-2">
      <div className="flex items-center gap-3">
        {onBack && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={onBack ?? (() => navigate(-1))}
          >
            <ArrowLeft size={16} />
          </Button>
        )}
        <div>
          <h1 className="text-xl font-semibold">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {children && (
        <div className="flex items-center gap-2 shrink-0">
          {children}
        </div>
      )}
    </div>
  )
}
```

### `src/components/shared/StatusBadge.jsx`

```jsx
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const STATUS_MAP = {
  // Commandes
  open:             { label: 'Ouvert',           class: 'bg-blue-100 text-blue-700' },
  sent_to_kitchen:  { label: 'En cuisine',        class: 'bg-orange-100 text-orange-700' },
  partially_served: { label: 'Partiel',           class: 'bg-yellow-100 text-yellow-700' },
  served:           { label: 'Servi',             class: 'bg-teal-100 text-teal-700' },
  paid:             { label: 'Payé',              class: 'bg-green-100 text-green-700' },
  cancelled:        { label: 'Annulé',            class: 'bg-red-100 text-red-700' },
  // Items
  pending:          { label: 'En attente',        class: 'bg-slate-100 text-slate-700' },
  preparing:        { label: 'En cuisine',        class: 'bg-orange-100 text-orange-700' },
  done:             { label: 'Prêt',              class: 'bg-green-100 text-green-700' },
  // Tables
  free:             { label: 'Libre',             class: 'bg-green-100 text-green-700' },
  occupied:         { label: 'Occupée',           class: 'bg-red-100 text-red-700' },
  waiting:          { label: 'En attente',        class: 'bg-orange-100 text-orange-700' },
  reserved:         { label: 'Réservée',          class: 'bg-blue-100 text-blue-700' },
}

export default function StatusBadge({ status, className }) {
  const config = STATUS_MAP[status] ?? { label: status, class: 'bg-gray-100 text-gray-700' }
  return (
    <Badge className={cn('text-xs font-medium', config.class, className)}>
      {config.label}
    </Badge>
  )
}
```

### `src/components/shared/ConfirmDialog.jsx`

```jsx
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export default function ConfirmDialog({
  open, onClose, onConfirm, title, description,
  confirmLabel = 'Confirmer', variant = 'default'
}) {
  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && (
            <AlertDialogDescription>{description}</AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={variant === 'destructive' ? 'bg-red-600 hover:bg-red-700 text-white' : ''}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
```

---

## 25. MENU QR PUBLIC (Client)

### `src/pages/menu/PublicMenuPage.jsx`

```jsx
import { useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { productsApi } from '@/api/products'
import { ordersApi } from '@/api/orders'
import { cn } from '@/lib/utils'
import { formatAmount } from '@/lib/formatters'
import { ShoppingCart, Plus, Minus, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'

export default function PublicMenuPage() {
  const { slug }       = useParams()
  const [searchParams] = useSearchParams()
  const tableId        = searchParams.get('table')

  const [cart, setCart]         = useState([])
  const [cartOpen, setCartOpen] = useState(false)
  const [selectedCat, setSelectedCat] = useState(null)
  const [ordered, setOrdered]   = useState(false)

  const { data: menuData, isLoading } = useQuery({
    queryKey: ['public-menu', slug],
    queryFn:  () => productsApi.publicMenu(slug).then(r => r.data),
  })

  const orderMutation = useMutation({
    mutationFn: () => ordersApi.create({
      table_id: tableId ? Number(tableId) : null,
      type:     'dine_in',
      covers:   1,
      items:    cart.map(i => ({ product_id: i.id, quantity: i.qty })),
    }),
    onSuccess: () => { setOrdered(true); setCart([]) },
  })

  const addToCart = (product) => {
    setCart(prev => {
      const exists = prev.find(i => i.id === product.id)
      if (exists) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i)
      return [...prev, { ...product, qty: 1 }]
    })
  }

  const updateQty = (id, qty) => {
    if (qty <= 0) setCart(prev => prev.filter(i => i.id !== id))
    else setCart(prev => prev.map(i => i.id === id ? { ...i, qty } : i))
  }

  const total = cart.reduce((s, i) => s + i.price * i.qty, 0)
  const totalItems = cart.reduce((s, i) => s + i.qty, 0)

  const restaurant = menuData?.restaurant
  const categories = menuData?.categories ?? []
  const displayCats = selectedCat
    ? categories.filter(c => c.id === selectedCat)
    : categories

  if (isLoading) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (ordered) {
    return (
      <div className="min-h-screen bg-amber-50 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
          <Check size={36} className="text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Commande envoyée !</h1>
        <p className="text-gray-500">Votre serveur va bientôt prendre en charge votre commande.</p>
        {tableId && <p className="text-primary font-medium mt-2">Table {tableId}</p>}
        <Button
          className="mt-6 bg-primary text-white"
          onClick={() => setOrdered(false)}
        >
          Commander autre chose
        </Button>
      </div>
    )
  }
