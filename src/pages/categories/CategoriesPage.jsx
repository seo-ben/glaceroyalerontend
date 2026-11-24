import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { categoriesApi } from '@/api/categories'
import PageHeader from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Plus, Edit, Trash2, GripVertical, ChefHat, Beer, Pizza } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Controller } from 'react-hook-form'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'

export default function CategoriesPage() {
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing]   = useState(null)

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories-admin'],
    queryFn:  () => categoriesApi.list().then(r => r.data),
  })

  const saveMutation = useMutation({
    mutationFn: (data) => editing ? categoriesApi.update(editing.id, data) : categoriesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories-admin'] })
      setModalOpen(false)
      setEditing(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => categoriesApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories-admin'] }),
  })

  const handleEdit = (cat) => {
    setEditing(cat)
    setModalOpen(true)
  }

  const handleDelete = (id) => {
    if (confirm('Supprimer cette catégorie ? Les produits resteront mais n\'auront plus de catégorie.')) {
      deleteMutation.mutate(id)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Catégories" subtitle="Gérer l'organisation du menu">
        <Button size="sm" onClick={() => { setEditing(null); setModalOpen(true); }}>
          <Plus size={15} className="mr-1.5" /> Nouvelle catégorie
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => (
          <Card key={cat.id} className="group hover:border-primary/50 transition-colors">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <span className="font-bold">{cat.name?.[0]}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{cat.name}</h3>
                    {cat.destination === 'bar' && <Beer size={12} className="text-blue-500" />}
                    {cat.destination === 'pizza' && <Pizza size={12} className="text-red-500" />}
                    {cat.destination === 'kitchen' && <ChefHat size={12} className="text-orange-500" />}
                  </div>
                  <p className="text-xs text-muted-foreground">{cat.products_count || 0} produit(s) • <span className="uppercase font-bold text-[9px]">{cat.destination || 'kitchen'}</span></p>
                  {cat.is_promo_exempt && (
                    <Badge variant="outline" className="mt-1 text-[8px] h-4 bg-orange-500/10 text-orange-600 border-orange-500/20 font-black uppercase">Exclu de promo</Badge>
                  )}
                </div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500" onClick={() => handleEdit(cat)}>
                  <Edit size={14} />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => handleDelete(cat.id)}>
                  <Trash2 size={14} />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {isLoading && [1, 2, 3].map(i => <div key={i} className="h-20 bg-muted animate-pulse rounded-xl" />)}
        {!isLoading && categories.length === 0 && (
          <p className="col-span-full border-2 border-dashed rounded-xl py-12 text-center text-muted-foreground">
            Aucune catégorie créée pour le moment.
          </p>
        )}
      </div>

      {modalOpen && (
        <CategoryModal
          category={editing}
          onClose={() => setModalOpen(false)}
          onSubmit={(d) => saveMutation.mutate(d)}
          isLoading={saveMutation.isPending}
        />
      )}
    </div>
  )
}

function CategoryModal({ category, onClose, onSubmit, isLoading }) {
  const { register, handleSubmit, control } = useForm({
    defaultValues: category 
      ? { 
          name: category.name, 
          order: category.order, 
          destination: category.destination || 'kitchen',
          is_promo_exempt: !!category.is_promo_exempt
        } 
      : { name: '', order: 0, destination: 'kitchen', is_promo_exempt: false }
  })

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm bg-card border-border text-foreground rounded-[2rem] shadow-2xl p-0 overflow-hidden">
        <DialogHeader className="p-8 bg-muted/40 border-b border-border">
          <DialogTitle className="text-foreground font-black uppercase italic tracking-tight">{category ? 'Modifier la catégorie' : 'Nouvelle catégorie'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-4">
          <div>
            <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Nom de la catégorie</Label>
            <Input {...register('name', { required: true })} placeholder="Entrées, Plats, Boissons..." className="mt-1 h-11 bg-muted border-border text-foreground rounded-xl font-bold focus:ring-primary" />
          </div>
          <div>
            <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Ordre d'affichage</Label>
            <Input {...register('order')} type="number" className="mt-1 h-11 bg-muted border-border text-foreground rounded-xl font-bold focus:ring-primary" />
          </div>
          <div>
            <Label className="text-xs font-bold uppercase text-muted-foreground mb-1.5 block">Destination Impression</Label>
            <Controller
              name="destination"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger className="w-full h-11 bg-muted border-border rounded-2xl transition-all hover:border-primary/50">
                    <SelectValue placeholder="Choisir la zone..." />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border rounded-2xl text-foreground">
                    <SelectItem value="kitchen" className="focus:bg-primary/10 focus:text-primary cursor-pointer py-3">
                      <div className="flex items-center gap-2">
                        <ChefHat size={14} className="text-primary" />
                        <span className="font-medium">Cuisine 🍳</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="bar" className="focus:bg-blue-500/10 focus:text-blue-500 cursor-pointer py-3">
                      <div className="flex items-center gap-2">
                        <Beer size={14} className="text-blue-500" />
                        <span className="font-medium">Bar 🍺</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="pizza" className="focus:bg-red-500/10 focus:text-red-500 cursor-pointer py-3">
                      <div className="flex items-center gap-2">
                        <Pizza size={14} className="text-red-500" />
                        <span className="font-medium">Pizza 🍕</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            <p className="text-[10px] text-muted-foreground mt-1.5 ml-1">Détermine quelle imprimante recevra les tickets.</p>
          </div>

          <div className="flex items-center justify-between p-4 bg-orange-500/5 border border-orange-500/10 rounded-2xl">
            <div className="space-y-0.5">
              <Label className="text-xs font-bold text-orange-600 uppercase">Exclure de la promotion</Label>
              <p className="text-[9px] text-orange-600/70 font-medium leading-tight">Ignorer cette catégorie lors des promotions globales (ex: Alcool, Entrées...)</p>
            </div>
            <Controller
              name="is_promo_exempt"
              control={control}
              render={({ field }) => (
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="ghost" className="flex-1 h-12 text-muted-foreground hover:text-foreground font-black uppercase text-[10px] tracking-widest" onClick={onClose}>Annuler</Button>
            <Button type="submit" className="flex-1 h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase text-[10px] tracking-widest rounded-xl shadow-lg shadow-primary/20" disabled={isLoading}>
              {category ? 'Mettre à jour' : 'Créer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
