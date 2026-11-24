import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { productsApi } from '@/api/products'
import { categoriesApi } from '@/api/categories'
import { stockApi } from '@/api/stock'
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
import { Search, Plus, Edit, Trash2, Eye, EyeOff, ChefHat, AlertTriangle } from 'lucide-react'
import { useForm } from 'react-hook-form'

export default function ProductsPage() {
  const queryClient = useQueryClient()
  const { toast }   = useToast()
  const [search, setSearch]       = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing]     = useState(null)
  const [stockEdit, setStockEdit] = useState(null)
  const [recipeEdit, setRecipeEdit] = useState(null)

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products-admin'],
    queryFn:  () => productsApi.list().then(r => r.data?.data ?? r.data),
  })

  const { data: categories = [] } = useQuery({
    queryKey: ['categories-flat'],
    queryFn:  () => productsApi.categoriesFlat().then(r => r.data),
  })

  const saveMut = useMutation({
    mutationFn: (formData) => editing ? productsApi.update(editing.id, formData) : productsApi.create(formData),
    onSuccess: () => {
      toast({ description: editing ? "Produit mis à jour avec succès !" : "Produit créé avec succès !" })
      queryClient.invalidateQueries({ queryKey: ['products-admin'] })
      setModalOpen(false)
      setEditing(null)
    },
    onError: (err) => {
      const msg = err.response?.data?.message || "Erreur lors de l'enregistrement"
      toast({ description: msg, variant: "destructive" })
    }
  })

  const toggleMut = useMutation({
    mutationFn: (id) => productsApi.toggleAvailable(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products-admin'] }),
  })

  const deleteMut = useMutation({
    mutationFn: (id) => productsApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products-admin'] }),
  })

  const updateStockMut = useMutation({
    mutationFn: ({ id, data }) => productsApi.update(id, data),
    onSuccess: () => {
      toast({ description: "Stock mis à jour avec succès !" })
      queryClient.invalidateQueries({ queryKey: ['products-admin'] })
      setStockEdit(null)
    },
    onError: (err) => {
      const msg = err.response?.data?.message || "Erreur de mise à jour du stock"
      toast({ description: msg, variant: "destructive" })
    }
  })

  const [alertOnly, setAlertOnly] = useState(false)

  const alertCount = products.filter(p => p.track_stock && parseFloat(p.quantity || 0) <= parseFloat(p.min_quantity || 0)).length

  const filtered = products.filter(p => {
    const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase())
    const isAlert = p.track_stock && parseFloat(p.quantity || 0) <= parseFloat(p.min_quantity || 0)
    if (alertOnly) return matchesSearch && isAlert
    return matchesSearch
  })

  const handleEdit = (p) => {
    setEditing(p)
    setModalOpen(true)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Gestion des produits" subtitle="Catalogue du restaurant">
        <Button size="sm" onClick={() => { setEditing(null); setModalOpen(true); }}>
          <Plus size={15} className="mr-1.5" /> Nouveau produit
        </Button>
      </PageHeader>

      {alertCount > 0 && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-500 text-white flex items-center justify-center font-black shrink-0 animate-pulse">
              <AlertTriangle size={18} />
            </div>
            <div>
              <p className="text-xs font-black text-red-500 uppercase tracking-wider">
                {alertCount} produit(s) en alerte ou rupture de stock !
              </p>
              <p className="text-[10px] text-muted-foreground font-bold">
                Cliquez sur le filtre pour afficher uniquement les articles à réapprovisionner.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="border-red-500/40 text-red-500 hover:bg-red-500/10 text-[10px] font-black uppercase tracking-wider h-8 shrink-0"
            onClick={() => setAlertOnly(!alertOnly)}
          >
            {alertOnly ? 'Voir tous les produits' : 'Filtrer les alertes'}
          </Button>
        </div>
      )}

      <Card className="border-border bg-card shadow-lg rounded-3xl overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher un produit..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 bg-muted/50 border-border h-9 text-xs rounded-xl"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={alertOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setAlertOnly(!alertOnly)}
              className={alertOnly ? "bg-red-500 hover:bg-red-600 text-white font-black text-xs h-9" : "font-bold text-xs h-9"}
            >
              <AlertTriangle size={14} className="mr-1.5" />
              Alertes ({alertCount})
            </Button>
            <p className="text-xs text-muted-foreground font-bold">{filtered.length} produit(s)</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/40 text-muted-foreground font-black uppercase text-[9px] tracking-widest border-b border-border">
              <tr>
                <th className="px-4 py-3">Produit</th>
                <th className="px-4 py-3">Prix</th>
                <th className="px-4 py-3 text-center">Stock</th>
                <th className="px-4 py-3 text-center">Disponible</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(product => (
                <tr key={product.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-bold text-foreground">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{product.emoji || '🍽️'}</span>
                      <div>
                        <p className="leading-tight">{product.name}</p>
                        <p className="text-[10px] text-muted-foreground font-normal">{product.category?.name || '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-black text-primary">{formatAmount(product.price)}</td>
                  <td className="px-4 py-3 text-center font-black">
                    {product.track_stock ? (
                      <button
                        onClick={() => setStockEdit(product)}
                        className="px-2.5 py-1 rounded-lg bg-muted border border-border hover:border-primary/50 text-foreground transition-colors"
                      >
                        {parseFloat(product.quantity || 0)}
                      </button>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => toggleMut.mutate(product.id)} className="inline-flex items-center gap-1.5 mx-auto">
                      {product.available ? (
                        <Badge className="bg-emerald-500/10 text-emerald-600 border-none"><Eye size={11} className="mr-1" />Oui</Badge>
                      ) : (
                        <Badge className="bg-red-500/10 text-red-600 border-none"><EyeOff size={11} className="mr-1" />Non</Badge>
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1.5">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 text-primary hover:bg-primary/10 border border-primary/20 px-2" 
                        title="Fiche technique / Recette (Ingrédients)"
                        onClick={() => setRecipeEdit(product)}
                      >
                        <ChefHat size={13} className="mr-1" />
                        <span className="text-[10px] font-black uppercase tracking-wider">Recette</span>
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7" onClick={() => handleEdit(product)}><Edit size={13} /></Button>
                      <Button variant="ghost" size="sm" className="h-7 text-red-500" onClick={() => {
                        if (confirm('Supprimer ce produit ?')) deleteMut.mutate(product.id)
                      }}><Trash2 size={13} /></Button>
                    </div>
                  </td>
                </tr>
              ))}
              {isLoading && <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground animate-pulse">Chargement des produits...</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>

      {modalOpen && (
        <ProductModal
          product={editing}
          categories={categories}
          onClose={() => setModalOpen(false)}
          onSubmit={(d) => saveMut.mutate(d)}
          isLoading={saveMut.isPending}
        />
      )}

      {stockEdit && (
        <StockEditDialog 
          product={stockEdit} 
          onClose={() => setStockEdit(null)} 
          onSubmit={(id, data) => updateStockMut.mutate({ id, data })}
          isLoading={updateStockMut.isPending}
        />
      )}

      {recipeEdit && (
        <RecipeDialog 
          product={recipeEdit} 
          onClose={() => setRecipeEdit(null)} 
        />
      )}
    </div>
  )
}

function ProductModal({ product, categories, onClose, onSubmit, isLoading }) {
  const [image, setImage] = useState(null);
  const [modifierGroups, setModifierGroups] = useState(product?.modifier_groups || product?.modifierGroups || []);

  const { register, handleSubmit } = useForm({
    defaultValues: product ? {
      name: product.name,
      category_id: product.category_id,
      price: product.price,
      track_stock: product.track_stock,
      description: product.description,
      emoji: product.emoji
    } : {
      name: '',
      category_id: '',
      price: 0,
      track_stock: false,
      description: '',
      emoji: '🍽️'
    }
  })

  const onFormSubmit = (data) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
        if (data[key] !== null && data[key] !== undefined) {
            if (typeof data[key] === 'boolean') {
                formData.append(key, data[key] ? '1' : '0');
            } else {
                formData.append(key, data[key]);
            }
        }
    });

    // Ajout des groupes de modificateurs
    if (modifierGroups.length === 0) {
        formData.append('clear_modifiers', '1');
    } else {
        modifierGroups.forEach((group, gIdx) => {
            if (!group.name) return; // Ignorer les groupes sans nom
            formData.append(`modifier_groups[${gIdx}][name]`, group.name);
            formData.append(`modifier_groups[${gIdx}][required]`, group.required ? '1' : '0');
            formData.append(`modifier_groups[${gIdx}][multiple]`, group.multiple ? '1' : '0');
            
            group.modifiers.forEach((mod, mIdx) => {
                if (!mod.name) return; // Ignorer les options sans nom
                formData.append(`modifier_groups[${gIdx}][modifiers][${mIdx}][name]`, mod.name);
                formData.append(`modifier_groups[${gIdx}][modifiers][${mIdx}][extra_price]`, mod.extra_price || 0);
            });
        });
    }

    if (image) {
        formData.append('image', image);
    }
    onSubmit(formData);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-card border-border text-foreground rounded-[2.5rem] shadow-2xl p-0 max-h-[95vh] overflow-y-auto custom-scrollbar">
        <DialogHeader className="p-10 pb-4 bg-muted/40 border-b border-border">
          <DialogTitle className="text-xl font-black uppercase italic tracking-tighter">{product ? 'Modifier produit' : 'Nouveau produit'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onFormSubmit)} className="p-10 pt-4 space-y-4">
          <div className="grid grid-cols-4 gap-4">
              <div className="col-span-3 space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Nom du produit</Label>
                  <Input {...register('name', { required: true })} className="h-11 bg-muted border-border text-foreground rounded-xl font-bold focus:ring-primary" />
              </div>
              <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Emoji</Label>
                  <Input {...register('emoji')} className="h-11 bg-muted border-border text-foreground rounded-xl text-center text-xl focus:ring-primary" />
              </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Catégorie</Label>
              <select {...register('category_id', { required: true })} className="flex h-11 w-full rounded-xl border border-border bg-muted px-3 py-2 text-sm font-bold focus:ring-primary outline-none text-foreground">
                <option value="" className="bg-card">Choisir...</option>
                {categories.map(c => <option key={c.id} value={c.id} className="bg-card">{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Prix (CFA)</Label>
                <Input type="number" {...register('price', { required: true })} className="h-11 bg-muted border-border text-foreground rounded-xl font-black text-center focus:ring-primary" />
            </div>
          </div>

          <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Image du produit</Label>
              <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-xl border border-dashed border-border hover:border-primary/50 transition-colors group relative cursor-pointer">
                  <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => setImage(e.target.files[0])}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center border border-border shrink-0 overflow-hidden">
                      {image ? (
                          <img src={URL.createObjectURL(image)} className="w-full h-full object-cover" />
                      ) : product?.image_url ? (
                        <img src={product.image_url} className="w-full h-full object-cover" />
                      ) : (
                          <Plus size={20} className="text-muted-foreground/30 group-hover:text-primary transition-colors" />
                      )}
                  </div>
                  <div className="flex flex-col">
                      <span className="text-[10px] font-black text-foreground uppercase tracking-widest">{image ? image.name : 'Cliquer pour charger'}</span>
                      <span className="text-[8px] font-bold text-muted-foreground/60 uppercase tracking-tighter">PNG, JPG ou WEBP (Max 2Mo)</span>
                  </div>
              </div>
          </div>

          <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-xl border border-border">
            <input type="checkbox" {...register('track_stock')} id="track_stock" className="w-4 h-4 rounded border-border bg-muted text-primary focus:ring-primary" />
            <Label htmlFor="track_stock" className="text-[10px] font-black uppercase text-muted-foreground cursor-pointer tracking-widest">Activer la gestion du stock</Label>
          </div>

          <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Description</Label>
              <Input {...register('description')} className="h-11 bg-muted border-border text-foreground rounded-xl text-xs focus:ring-primary" />
          </div>

          {/* SECTION MODIFICATEURS (ACCOMPAGNEMENTS) */}
          <div className="space-y-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                  <Label className="text-[10px] font-black uppercase text-primary tracking-widest">Options & Accompagnements</Label>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    className="h-7 text-[9px] font-black uppercase border-primary/30 text-primary hover:bg-primary/10"
                    onClick={() => {
                        const groups = [...(modifierGroups || [])];
                        groups.push({ name: '', required: false, multiple: false, modifiers: [{ name: '', extra_price: 0 }] });
                        setModifierGroups(groups);
                    }}
                  >
                    <Plus size={12} className="mr-1" /> Ajouter un groupe
                  </Button>
              </div>

              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {modifierGroups.map((group, gIdx) => (
                      <div key={gIdx} className="p-4 bg-muted/20 border border-border rounded-2xl space-y-3 relative group">
                          <button 
                            type="button"
                            onClick={() => {
                                const newGroups = modifierGroups.filter((_, i) => i !== gIdx);
                                setModifierGroups(newGroups);
                            }}
                            className="absolute top-2 right-2 p-1 text-muted-foreground/30 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={12} />
                          </button>

                          <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                  <Label className="text-[9px] font-black uppercase text-muted-foreground">Nom du groupe (ex: Accompagnement)</Label>
                                  <Input 
                                    value={group.name} 
                                    onChange={(e) => {
                                        const newGroups = [...modifierGroups];
                                        newGroups[gIdx].name = e.target.value;
                                        setModifierGroups(newGroups);
                                    }}
                                    placeholder="Nom du groupe" 
                                    className="h-9 bg-card border-border text-[11px] font-bold uppercase" 
                                  />
                              </div>
                              <div className="flex items-center gap-4 pt-5">
                                  <label className="flex items-center gap-1.5 cursor-pointer">
                                      <input 
                                        type="checkbox" 
                                        checked={group.required} 
                                        onChange={(e) => {
                                            const newGroups = [...modifierGroups];
                                            newGroups[gIdx].required = e.target.checked;
                                            setModifierGroups(newGroups);
                                        }}
                                        className="w-3.5 h-3.5 rounded border-border text-primary" 
                                      />
                                      <span className="text-[9px] font-black uppercase text-muted-foreground">Obligatoire</span>
                                  </label>
                                  <label className="flex items-center gap-1.5 cursor-pointer">
                                      <input 
                                        type="checkbox" 
                                        checked={group.multiple} 
                                        onChange={(e) => {
                                            const newGroups = [...modifierGroups];
                                            newGroups[gIdx].multiple = e.target.checked;
                                            setModifierGroups(newGroups);
                                        }}
                                        className="w-3.5 h-3.5 rounded border-border text-primary" 
                                      />
                                      <span className="text-[9px] font-black uppercase text-muted-foreground">Multi-choix</span>
                                  </label>
                              </div>
                          </div>

                          <div className="space-y-2 pl-4 border-l-2 border-primary/10">
                              {group.modifiers.map((mod, mIdx) => (
                                  <div key={mIdx} className="flex items-center gap-2">
                                      <Input 
                                        value={mod.name} 
                                        onChange={(e) => {
                                            const newGroups = [...modifierGroups];
                                            newGroups[gIdx].modifiers[mIdx].name = e.target.value;
                                            setModifierGroups(newGroups);
                                        }}
                                        placeholder="Nom de l'option (ex: Riz Blanc)" 
                                        className="h-8 bg-card border-border text-[10px] font-bold uppercase flex-1" 
                                      />
                                      <Input 
                                        type="number" 
                                        value={mod.extra_price} 
                                        onChange={(e) => {
                                            const newGroups = [...modifierGroups];
                                            newGroups[gIdx].modifiers[mIdx].extra_price = e.target.value;
                                            setModifierGroups(newGroups);
                                        }}
                                        placeholder="Prix supp." 
                                        className="h-8 w-24 bg-card border-border text-[10px] font-black text-center" 
                                      />
                                      <button 
                                        type="button"
                                        onClick={() => {
                                            const newGroups = [...modifierGroups];
                                            newGroups[gIdx].modifiers = group.modifiers.filter((_, i) => i !== mIdx);
                                            setModifierGroups(newGroups);
                                        }}
                                        className="text-muted-foreground/30 hover:text-red-500"
                                      >
                                        <Trash2 size={10} />
                                      </button>
                                  </div>
                              ))}
                              <Button 
                                type="button" 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 text-[8px] font-black uppercase text-primary p-0 hover:bg-transparent"
                                onClick={() => {
                                    const newGroups = [...modifierGroups];
                                    newGroups[gIdx].modifiers.push({ name: '', extra_price: 0 });
                                    setModifierGroups(newGroups);
                                }}
                              >
                                <Plus size={10} className="mr-1" /> Ajouter une option
                              </Button>
                          </div>
                      </div>
                  ))}
              </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="ghost" className="flex-1 h-12 text-muted-foreground hover:text-foreground hover:bg-muted font-black uppercase text-[10px] tracking-widest border border-border rounded-xl" onClick={onClose}>Annuler</Button>
            <Button type="submit" className="flex-1 h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase text-[10px] tracking-widest rounded-xl shadow-lg shadow-primary/20" disabled={isLoading}>
                {isLoading ? 'TRAITEMENT...' : (product ? 'Mettre à jour' : 'Créer Produit')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function StockEditDialog({ product, onClose, onSubmit, isLoading }) {
  const [qty, setQty] = useState(parseFloat(product.quantity || 0))
  const [min, setMin] = useState(parseFloat(product.min_quantity || 0))

  return (
    <div className="fixed inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in transition-all">
      <Card className="w-full max-w-sm bg-card border-border shadow-2xl rounded-[2.5rem] max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="p-8 bg-muted/40 border-b border-border">
          <h3 className="text-sm font-black uppercase italic tracking-tighter">Modifier le stock : {product.name}</h3>
        </div>
        <CardContent className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">En stock</Label>
              <Input type="number" value={qty} onChange={e => setQty(e.target.value)} className="h-11 bg-muted border-border text-foreground rounded-xl font-black text-center focus:ring-primary" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Seuil Alerte</Label>
              <Input type="number" value={min} onChange={e => setMin(e.target.value)} className="h-11 bg-muted border-border text-foreground rounded-xl font-black text-center focus:ring-primary" />
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <Button variant="ghost" className="flex-1 h-12 text-muted-foreground hover:text-foreground font-black uppercase text-[10px] tracking-widest" onClick={onClose}>Annuler</Button>
            <Button className="flex-1 h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase text-[10px] tracking-widest rounded-xl shadow-lg shadow-primary/20" disabled={isLoading} onClick={() => onSubmit(product.id, { quantity: qty, min_quantity: min })}>Enregistrer</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function RecipeDialog({ product, onClose }) {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: allIngredients = [], isLoading: loadingIngs } = useQuery({
    queryKey: ['ingredients-all'],
    queryFn:  () => stockApi.ingredients().then(r => r.data?.data ?? r.data)
  })

  const { data: currentRecipe = [], isLoading: loadingRecipe } = useQuery({
    queryKey: ['recipe', product.id],
    queryFn:  () => stockApi.recipe(product.id).then(r => r.data)
  })

  const [items, setItems] = useState([])
  const recipeKey = JSON.stringify(currentRecipe)

  useEffect(() => {
    if (currentRecipe && currentRecipe.length > 0) {
      setItems(currentRecipe.map(r => ({
        ingredient_id: r.ingredient_id.toString(),
        quantity: r.quantity
      })))
    } else {
      setItems([{ ingredient_id: '', quantity: '' }])
    }
  }, [recipeKey])

  const saveMut = useMutation({
    mutationFn: () => {
      const validItems = items.filter(i => i.ingredient_id && parseFloat(i.quantity) > 0)
      if (validItems.length === 0) {
        throw new Error("Veuillez sélectionner au moins un ingrédient valide avec une quantité.")
      }
      return stockApi.saveRecipe({
        product_id: product.id,
        ingredients: validItems.map(i => ({
          ingredient_id: Number(i.ingredient_id),
          quantity: parseFloat(i.quantity)
        }))
      })
    },
    onSuccess: () => {
      toast({ description: "Fiche technique (Recette) enregistrée avec succès !" })
      queryClient.invalidateQueries({ queryKey: ['recipe', product.id] })
      onClose()
    },
    onError: (err) => {
      const msg = err.message || err.response?.data?.message || "Erreur lors de l'enregistrement de la fiche technique"
      toast({ description: msg, variant: "destructive" })
    }
  })

  const handleAddItem = () => {
    setItems([...items, { ingredient_id: '', quantity: '' }])
  }

  const handleRemoveItem = (idx) => {
    setItems(items.filter((_, i) => i !== idx))
  }

  const handleChange = (idx, field, val) => {
    const updated = [...items]
    updated[idx][field] = val
    setItems(updated)
  }

  const totalCost = items.reduce((sum, item) => {
    const ing = allIngredients.find(i => i.id == item.ingredient_id)
    if (!ing || !item.quantity) return sum
    return sum + (parseFloat(item.quantity) * parseFloat(ing.cost_per_unit || 0))
  }, 0)

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-card border-border text-foreground rounded-2xl shadow-2xl p-0 max-h-[90vh] overflow-y-auto custom-scrollbar">
        <DialogHeader className="p-5 pb-3 bg-muted/40 border-b border-border">
          <DialogTitle className="text-sm font-black uppercase italic tracking-tighter flex items-center gap-2">
            <ChefHat className="text-primary" size={18} />
            Fiche Technique : {product.name}
          </DialogTitle>
          <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">
            Quantité d'ingrédients pour 1 portion
          </p>
        </DialogHeader>

        <div className="p-5 space-y-3">
          {(loadingIngs || loadingRecipe) ? (
            <div className="py-8 text-center text-xs font-bold text-muted-foreground animate-pulse">
              Chargement des ingrédients et recettes...
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {items.map((item, idx) => {
                  const selectedIng = allIngredients.find(i => i.id == item.ingredient_id)
                  const lineCost = selectedIng && item.quantity ? parseFloat(item.quantity) * parseFloat(selectedIng.cost_per_unit || 0) : 0

                  return (
                    <div key={idx} className="flex items-center gap-2 p-2.5 bg-muted/30 border border-border rounded-xl">
                      <div className="flex-1 space-y-0.5">
                        <Label className="text-[8px] font-black uppercase text-muted-foreground">Ingrédient</Label>
                        <select
                          value={item.ingredient_id}
                          onChange={(e) => handleChange(idx, 'ingredient_id', e.target.value)}
                          className="flex h-8 w-full rounded-lg border border-border bg-card px-2 text-[11px] font-bold focus:ring-primary outline-none text-foreground"
                        >
                          <option value="">Choisir un ingrédient...</option>
                          {allIngredients.map(ing => (
                            <option key={ing.id} value={ing.id}>
                              {ing.name} ({ing.unit || 'g'}) — {formatAmount(ing.cost_per_unit || 0)}/{ing.unit || 'g'}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="w-24 space-y-0.5">
                        <Label className="text-[8px] font-black uppercase text-muted-foreground">Qté {selectedIng ? `(${selectedIng.unit || 'g'})` : '(g)'}</Label>
                        <Input
                          type="number"
                          step="0.001"
                          placeholder="0.00"
                          value={item.quantity}
                          onChange={(e) => handleChange(idx, 'quantity', e.target.value)}
                          className="h-8 bg-card border-border text-[11px] font-black text-center px-1"
                        />
                      </div>

                      <div className="w-20 text-right space-y-0.5">
                        <Label className="text-[8px] font-black uppercase text-muted-foreground">Coût</Label>
                        <p className="text-[11px] font-black text-primary leading-7 truncate">{formatAmount(lineCost)}</p>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground/40 hover:text-red-500 mt-3.5"
                        onClick={() => handleRemoveItem(idx)}
                      >
                        <Trash2 size={12} />
                      </Button>
                    </div>
                  )
                })}
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full h-8 border-dashed border-primary/40 text-primary font-black uppercase text-[9px] tracking-widest hover:bg-primary/10"
                onClick={handleAddItem}
              >
                <Plus size={12} className="mr-1" /> Ajouter un ingrédient
              </Button>

              <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-[8px] font-black uppercase text-primary tracking-widest">Coût de revient estimé</p>
                  <p className="text-[8px] text-muted-foreground">Coût d'achat unitaire cumulé</p>
                </div>
                <p className="text-sm font-black text-primary tracking-tighter">{formatAmount(totalCost)}</p>
              </div>

              <div className="flex gap-2 pt-1">
                <Button variant="ghost" className="flex-1 h-9 text-muted-foreground font-black uppercase text-[9px] tracking-widest" onClick={onClose}>
                  Annuler
                </Button>
                <Button 
                  className="flex-1 h-9 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase text-[9px] tracking-widest rounded-lg shadow-md shadow-primary/20"
                  disabled={saveMut.isPending}
                  onClick={() => saveMut.mutate()}
                >
                  {saveMut.isPending ? 'ENREGISTREMENT...' : 'Enregistrer la recette'}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
