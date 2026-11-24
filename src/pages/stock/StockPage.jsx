import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import { stockApi } from '@/api/stock'
import { productsApi } from '@/api/products'
import { downloadStockPDFClient } from '@/lib/stockPdf'
import { formatAmount } from '@/lib/formatters'
import PageHeader from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select'
import { Plus, Search, AlertTriangle, ArrowUp, ArrowDown, Package, FileDown } from 'lucide-react'

export default function StockPage() {
  const queryClient = useQueryClient()
  const { toast }   = useToast()
  const [search, setSearch]       = useState('')
  const [alertOnly, setAlertOnly] = useState(false)
  const [movementFor, setMovementFor] = useState(null)
  const [createOpen, setCreateOpen]   = useState(false)
  const [downloadingPdf, setDownloadingPdf] = useState(false)

  const { data: allIngredients = [], isLoading } = useQuery({
    queryKey: ['ingredients'],
    queryFn:  () => stockApi.ingredients().then(r => r.data?.data ?? r.data),
  })

  const { data: allProducts = [] } = useQuery({
    queryKey: ['products'],
    queryFn:  () => productsApi.list().then(r => r.data?.data ?? r.data ?? []),
  })

  const { data: alerts } = useQuery({
    queryKey: ['stock-alerts'],
    queryFn:  () => stockApi.alerts().then(r => r.data),
  })

  const { data: totalValue } = useQuery({
    queryKey: ['stock-value'],
    queryFn:  () => stockApi.value().then(r => r.data),
  })

  const getCombinedItems = () => {
    const ingList = (Array.isArray(allIngredients) 
      ? allIngredients 
      : (Array.isArray(allIngredients?.data) ? allIngredients.data : []))
      .map(i => ({ ...i, is_product: false }));

    const prodRaw = Array.isArray(allProducts) 
      ? allProducts 
      : (Array.isArray(allProducts?.data) ? allProducts.data : []);

    const prodTracked = prodRaw
      .filter(p => p.track_stock === true || p.track_stock == 1 || p.track_stock === '1' || p.track_stock === 'true')
      .map(p => ({
        id: `p_${p.id}`,
        name: `${p.name} [Produit]`,
        category: p.category?.name || 'Produits Vente',
        unit: p.unit || 'pièce',
        quantity: Number(p.quantity || 0),
        min_quantity: Number(p.min_quantity || 0),
        cost_per_unit: Number(p.cost_price || p.price || 0),
        is_product: true
      }));

    return [...ingList, ...prodTracked];
  }

  const combinedItems = getCombinedItems();

  const handleDownloadStockPdf = async () => {
    try {
      setDownloadingPdf(true)
      toast({ description: "Récupération du stock et des produits en cours..." })
      
      const [ingRes, prodRes] = await Promise.all([
        stockApi.ingredients().catch(() => ({ data: [] })),
        productsApi.list().catch(() => ({ data: [] }))
      ]);

      const ingData = ingRes.data?.data ?? ingRes.data ?? [];
      const prodData = prodRes.data?.data ?? prodRes.data ?? [];

      const ingList = (Array.isArray(ingData) ? ingData : []).map(i => ({ ...i, is_product: false }));
      const prodList = Array.isArray(prodData) ? prodData : [];

      const trackedProds = prodList
        .filter(p => p.track_stock === true || p.track_stock == 1 || p.track_stock === '1' || p.track_stock === 'true')
        .map(p => ({
          id: `p_${p.id}`,
          name: `${p.name} [Produit]`,
          category: p.category?.name || 'Produits Vente',
          unit: p.unit || 'pièce',
          quantity: Number(p.quantity || 0),
          min_quantity: Number(p.min_quantity || 0),
          cost_per_unit: Number(p.cost_price || p.price || 0),
          is_product: true
        }));

      const fullStockList = [...ingList, ...trackedProds];
      const alertList = fullStockList.filter(i => Number(i?.quantity || 0) <= Number(i?.min_quantity || 0));
      const totalVal = fullStockList.reduce((s, i) => s + (Number(i?.quantity || 0) * Number(i?.cost_per_unit || 0)), 0);

      downloadStockPDFClient(fullStockList, alertList, totalVal);
      toast({ description: `Rapport Stock PDF téléchargé avec succès (${fullStockList.length} articles) !` });
    } catch (err) {
      console.error("Erreur génération PDF:", err);
      toast({ description: `Erreur lors de la génération du PDF: ${err.message || 'Format invalide'}`, variant: "destructive" });
    } finally {
      setDownloadingPdf(false);
    }
  }

  const ingredients = combinedItems.filter(i => {
    if (search && !i.name.toLowerCase().includes(search.toLowerCase())) return false
    if (alertOnly && Number(i.quantity) > Number(i.min_quantity)) return false
    return true
  })

  const createMutation = useMutation({
    mutationFn: (data) => stockApi.create({
      ...data,
      quantity: data.quantity ? parseFloat(data.quantity) : 0,
      min_quantity: data.min_quantity ? parseFloat(data.min_quantity) : 0,
      cost_per_unit: data.cost_per_unit ? parseFloat(data.cost_per_unit) : 0,
    }),
    onSuccess:  () => {
      toast({ description: "Ingrédient créé avec succès !" })
      queryClient.invalidateQueries({ queryKey: ['ingredients'] })
      setCreateOpen(false)
    },
    onError: (err) => {
      const msg = err.response?.data?.message || "Erreur lors de la création de l'ingrédient"
      toast({ description: msg, variant: "destructive" })
    }
  })

  const movementMutation = useMutation({
    mutationFn: (data) => {
      const ingId = data.ingredient_id || movementFor?.id
      return stockApi.movement({
        ...data,
        ingredient_id: Number(ingId),
        quantity: parseFloat(data.quantity),
        unit_cost: data.unit_cost ? parseFloat(data.unit_cost) : undefined,
      })
    },
    onSuccess:  () => {
      toast({ description: "Mouvement de stock enregistré avec succès !" })
      queryClient.invalidateQueries({ queryKey: ['ingredients'] })
      queryClient.invalidateQueries({ queryKey: ['stock-alerts'] })
      queryClient.invalidateQueries({ queryKey: ['stock-value'] })
      setMovementFor(null)
    },
    onError: (err) => {
      const msg = err.response?.data?.message || "Erreur lors de l'enregistrement du mouvement"
      toast({ description: msg, variant: "destructive" })
    }
  })

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Gestion du stock" subtitle="Inventaire et mouvements">
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleDownloadStockPdf} 
            disabled={downloadingPdf}
            className="bg-red-500/10 text-red-600 border-red-500/30 hover:bg-red-500/20 font-bold"
          >
            <FileDown size={15} className="mr-1.5" /> 
            {downloadingPdf ? 'Génération PDF...' : 'Rapport PDF Stock'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCreateOpen(true)}>
            <Plus size={15} className="mr-1.5" /> Nouvel Ingrédient
          </Button>
          <Button size="sm" onClick={() => setMovementFor({ id: null })}>
            <Package size={15} className="mr-1.5" /> Mouvement Global
          </Button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-3 gap-2 lg:gap-4">
        <Card className="border-border bg-card rounded-xl lg:rounded-2xl shadow-md overflow-hidden">
          <CardContent className="p-2 lg:p-4 flex flex-col lg:flex-row items-center lg:items-center gap-1 lg:gap-3 text-center lg:text-left">
            <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
              <Package size={14} className="text-blue-500 lg:w-5 lg:h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[7px] lg:text-xs font-black text-muted-foreground uppercase tracking-widest leading-none truncate">Total</p>
              <p className="text-sm lg:text-2xl font-black text-foreground mt-0.5 tracking-tighter">{combinedItems.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card 
          className={cn(
            "border-border bg-card rounded-xl lg:rounded-2xl shadow-md overflow-hidden cursor-pointer transition-all hover:border-red-500/50",
            alertOnly && "ring-2 ring-red-500 border-red-500 bg-red-500/5"
          )}
          onClick={() => setAlertOnly(!alertOnly)}
        >
          <CardContent className="p-2 lg:p-4 flex flex-col lg:flex-row items-center lg:items-center gap-1 lg:gap-3 text-center lg:text-left">
            <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
              <AlertTriangle size={14} className="text-red-500 lg:w-5 lg:h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[7px] lg:text-xs font-black text-muted-foreground uppercase tracking-widest leading-none truncate">Alertes</p>
              <p className="text-sm lg:text-2xl font-black text-red-500 mt-0.5 tracking-tighter">{combinedItems.filter(i => Number(i.quantity) <= Number(i.min_quantity)).length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card rounded-xl lg:rounded-2xl shadow-md overflow-hidden">
          <CardContent className="p-2 lg:p-4 flex flex-col lg:flex-row items-center lg:items-center gap-1 lg:gap-3 text-center lg:text-left">
            <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
              <span className="text-emerald-500 font-black text-[8px] lg:text-sm">FCFA</span>
            </div>
            <div className="min-w-0">
              <p className="text-[7px] lg:text-xs font-black text-muted-foreground uppercase tracking-widest leading-none truncate">Valeur</p>
              <p className="text-xs lg:text-2xl font-black text-foreground mt-0.5 tracking-tighter truncate">{formatAmount(combinedItems.reduce((s, i) => s + (Number(i.quantity) * Number(i.cost_per_unit || 0)), 0)).replace(/\s?FCFA|\s?CFA/, '')}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {alerts?.length > 0 && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-500 text-white flex items-center justify-center font-black shrink-0 animate-pulse">
              <AlertTriangle size={18} />
            </div>
            <div>
              <p className="text-xs font-black text-red-500 uppercase tracking-wider">
                {alerts.length} ingrédient(s) en rupture ou sous le seuil d'alerte !
              </p>
              <p className="text-[10px] text-muted-foreground font-bold">
                Cliquez sur la carte "Alertes" pour n'afficher que les éléments à recommander.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="border-red-500/40 text-red-500 hover:bg-red-500/10 text-[10px] font-black uppercase tracking-wider h-8 shrink-0"
            onClick={() => setAlertOnly(!alertOnly)}
          >
            {alertOnly ? 'Voir tout le stock' : 'Filtrer les alertes'}
          </Button>
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un ingrédient..." className="pl-9" />
        </div>
        <Button
          variant={alertOnly ? 'default' : 'outline'}
          size="sm"
          onClick={() => setAlertOnly(!alertOnly)}
          className={alertOnly ? 'bg-red-500 hover:bg-red-600 text-white' : ''}
        >
          <AlertTriangle size={14} className="mr-1.5" /> Alertes seulement
        </Button>
      </div>

      <Card className="border-border bg-card backdrop-blur-sm rounded-2xl overflow-hidden shadow-md">
        {/* Version Table - Cachée sur mobile */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-4 py-2 font-black text-muted-foreground uppercase tracking-widest text-[9px]">Produit</th>
                <th className="text-right px-4 py-2 font-black text-muted-foreground uppercase tracking-widest text-[9px]">Stock actuel</th>
                <th className="text-right px-4 py-2 font-black text-muted-foreground uppercase tracking-widest text-[9px]">Minimum</th>
                <th className="text-center px-4 py-2 font-black text-muted-foreground uppercase tracking-widest text-[9px]">Statut</th>
                <th className="text-right px-4 py-2 font-black text-muted-foreground uppercase tracking-widest text-[9px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {ingredients.map(ingredient => {
                const level = ingredient.quantity <= 0 ? 'rupture' : ingredient.quantity <= ingredient.min_quantity ? 'faible' : 'ok'
                return (
                  <tr key={ingredient.id} className="hover:bg-muted/50 transition-colors group">
                    <td className="px-4 py-2 font-black text-foreground italic tracking-tighter text-sm">
                      {ingredient.name}
                      {ingredient.is_product && <Badge className="ml-2 bg-primary/10 text-primary border-none text-[8px]">Produit</Badge>}
                    </td>
                    <td className="px-4 py-2 text-right font-black text-foreground/80">{ingredient.quantity} <span className="text-[10px] text-muted-foreground uppercase ml-1">{ingredient.unit}</span></td>
                    <td className="px-4 py-2 text-right text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{ingredient.min_quantity} {ingredient.unit}</td>
                    <td className="px-4 py-2 text-center">
                      <Badge className={cn(
                        "border-none px-2 py-0.5 text-[9px] font-black uppercase tracking-widest",
                        level === 'rupture' ? 'bg-red-500/10 text-red-500' :
                        level === 'faible' ? 'bg-orange-500/10 text-orange-500' : 'bg-emerald-500/10 text-emerald-500'
                      )}>{level === 'rupture' ? 'Rupture' : level === 'faible' ? 'Faible' : 'OK'}</Badge>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <div className="flex justify-end gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="sm" className="h-7 px-3 rounded-lg bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 hover:bg-emerald-600 hover:text-white text-[10px] font-bold" onClick={() => setMovementFor({ ...ingredient, defaultType: 'in' })}>
                          <ArrowUp size={12} className="mr-1" /> Entrée
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 px-3 rounded-lg bg-red-500/10 text-red-600 border border-red-500/20 hover:bg-red-600 hover:text-white text-[10px] font-bold" onClick={() => setMovementFor({ ...ingredient, defaultType: 'out' })}>
                          <ArrowDown size={12} className="mr-1" /> Sortie
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Version Mobile - Liste de Cartes */}
        <div className="md:hidden divide-y divide-border">
          {ingredients.map(ingredient => {
            const level = ingredient.quantity <= 0 ? 'rupture' : ingredient.quantity <= ingredient.min_quantity ? 'faible' : 'ok'
            return (
              <div key={ingredient.id} className="p-4 space-y-4 bg-card cursor-pointer">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-black text-foreground italic tracking-tighter leading-none">{ingredient.name}</h3>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1.5">Unité: {ingredient.unit} • Min: {ingredient.min_quantity}</p>
                  </div>
                  <Badge className={cn(
                    "border-none px-2 py-0.5 text-[9px] font-black uppercase tracking-widest",
                    level === 'rupture' ? 'bg-red-500/10 text-red-500' :
                    level === 'faible' ? 'bg-orange-500/10 text-orange-500' : 'bg-emerald-500/10 text-emerald-500'
                  )}>{level === 'rupture' ? 'Rupture' : level === 'faible' ? 'Faible' : 'OK'}</Badge>
                </div>
                
                <div className="flex items-center justify-between gap-4">
                   <div className="bg-muted rounded-xl px-4 py-2 border border-border flex-1">
                      <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">En Stock</p>
                      <p className="text-xl font-black text-foreground tracking-tighter mt-1">{ingredient.quantity} <span className="text-[10px] text-muted-foreground/50">{ingredient.unit}</span></p>
                   </div>
                   <div className="flex flex-col gap-2 shrink-0">
                      <Button variant="ghost" size="sm" className="h-9 px-3 rounded-lg bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" onClick={() => setMovementFor({ ...ingredient, defaultType: 'in' })}>
                        <ArrowUp size={14} />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-9 px-3 rounded-lg bg-red-500/10 text-red-600 border border-red-500/20" onClick={() => setMovementFor({ ...ingredient, defaultType: 'out' })}>
                        <ArrowDown size={14} />
                      </Button>
                   </div>
                </div>
              </div>
            )
          })}
        </div>

        {!isLoading && ingredients.length === 0 && (
          <div className="px-4 py-20 text-center space-y-4">
             <Package size={48} className="mx-auto text-muted-foreground/20 shrink-0" />
             <p className="text-xs font-black text-muted-foreground/60 uppercase tracking-[0.2em] italic">Aucun produit trouvé en stock</p>
          </div>
        )}
      </Card>

      {createOpen && (
        <CreateIngredientDialog
          existingCategories={Array.from(new Set(allIngredients.map(i => i.category).filter(Boolean)))}
          onClose={() => setCreateOpen(false)}
          onSubmit={(data) => createMutation.mutate(data)}
          isLoading={createMutation.isPending}
        />
      )}

      {movementFor && (
        <MovementDialog
          ingredient={movementFor}
          ingredients={allIngredients}
          onClose={() => setMovementFor(null)}
          onSubmit={(data) => movementMutation.mutate(data)}
          isLoading={movementMutation.isPending}
        />
      )}
    </div>
  )
}

function CreateIngredientDialog({ onClose, onSubmit, isLoading, existingCategories = [] }) {
  const defaultCats = [
    "Frais & Légumes",
    "Produits Secs",
    "Boucherie & Poissonnerie",
    "Crémerie & Produits Laitiers",
    "Boissons & Cave",
    "Épices & Condiments",
    "Emballages & Consommables",
    "Autres"
  ]
  const categoriesList = Array.from(new Set([...defaultCats, ...existingCategories]))
  const [isCustom, setIsCustom] = useState(false)

  const unitsList = ["g", "kg", "ml", "cl", "L", "pièce", "portion", "sachet", "boîte"]
  const { register, handleSubmit, setValue, watch } = useForm({
    defaultValues: { name: '', unit: 'g', min_quantity: 0, cost_per_unit: 0, category: categoriesList[0] }
  })
  const currentUnit = watch('unit')

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Nouveau produit en stock</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div><Label>Nom du produit / ingrédient</Label><Input {...register('name', { required: true })} placeholder="Ex: Farine, Sucre, Chocolat..." className="mt-1" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Unité de mesure</Label>
              <select 
                {...register('unit', { required: true })} 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background outline-none focus:ring-2 focus:ring-primary mt-1 font-bold"
              >
                {unitsList.map(u => (
                  <option key={u} value={u}>{u === 'g' ? 'g (Gramme)' : u === 'kg' ? 'kg (Kilogramme)' : u === 'ml' ? 'ml (Millilitre)' : u === 'L' ? 'L (Litre)' : u}</option>
                ))}
              </select>
            </div>
            <div><Label>Min. Stock (Alerte)</Label><Input {...register('min_quantity')} type="number" step="0.01" placeholder="0" className="mt-1" /></div>
          </div>
          <div><Label>Coût unitaire moy. (CFA par {currentUnit || 'g'})</Label><Input {...register('cost_per_unit')} type="number" step="0.01" placeholder="0" className="mt-1" /></div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>Catégorie</Label>
              <button 
                type="button" 
                onClick={() => { setIsCustom(!isCustom); setValue('category', ''); }}
                className="text-[9px] font-black uppercase text-primary hover:underline"
              >
                {isCustom ? "Choisir dans la liste" : "+ Autre catégorie"}
              </button>
            </div>
            {isCustom ? (
              <Input {...register('category', { required: true })} placeholder="Ex: Boulangerie, Glacier..." className="mt-1" />
            ) : (
              <select {...register('category', { required: true })} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background outline-none focus:ring-2 focus:ring-primary mt-1 font-bold">
                {categoriesList.map((cat, idx) => (
                  <option key={idx} value={cat}>{cat}</option>
                ))}
              </select>
            )}
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Annuler</Button>
            <Button type="submit" className="flex-1 bg-primary text-white font-bold" disabled={isLoading}>Créer (en {currentUnit || 'g'})</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function MovementDialog({ ingredient, onClose, onSubmit, isLoading, ingredients = [] }) {
  const { register, handleSubmit, control, watch } = useForm({
    defaultValues: {
      ingredient_id: ingredient.id ?? '',
      type:          ingredient.defaultType ?? 'in',
      quantity:      '',
      reason:        '',
      reference:     '',
    },
  })
  const type = watch('type')
  const selectedId = watch('ingredient_id')
  const selectedIng = ingredients.find(i => i.id == selectedId)

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{selectedIng ? `Mouvement — ${selectedIng.name}` : 'Entrée de stock'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          {!ingredient.id && (
            <div>
              <Label>Choisir un produit/ingrédient</Label>
              <Controller name="ingredient_id" control={control} rules={{ required: true }} render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                  <SelectContent>
                    {ingredients.map(i => (
                      <SelectItem key={i.id} value={i.id.toString()}>{i.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )} />
            </div>
          )}
          <div>
            <Label>Type de mouvement</Label>
            <Controller name="type" control={control} render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="in">Entrée (livraison)</SelectItem>
                  <SelectItem value="out">Sortie manuelle</SelectItem>
                  <SelectItem value="adjustment">Ajustement inventaire</SelectItem>
                  <SelectItem value="waste">Perte / Déchet</SelectItem>
                </SelectContent>
              </Select>
            )} />
          </div>
          <div>
            <Label>Quantité {selectedIng ? `(${selectedIng.unit})` : ''}</Label>
            <Input {...register('quantity', { required: true })} type="number" step="0.001" placeholder="0" className="mt-1" />
          </div>
          <div>
            <Label>Raison / Note</Label>
            <Input {...register('reason')} placeholder="Livraison hebdomadaire..." className="mt-1" />
          </div>
          {type === 'in' && (
            <div>
              <Label>Référence bon de livraison</Label>
              <Input {...register('reference')} placeholder="BL-2024-001" className="mt-1" />
            </div>
          )}
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Annuler</Button>
            <Button type="submit" className="flex-1 bg-primary text-white" disabled={isLoading}>Enregistrer</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
