import { useState, useMemo, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { productsApi } from '@/api/products'
import { categoriesApi } from '@/api/categories'
import { ordersApi } from '@/api/orders'
import { settingsApi } from '@/api/settings'
import { paymentsApi } from '@/api/payments'
import useCart from '@/hooks/useCart'
import useCartStore from '@/stores/cartStore'
import CategoryTabs from '@/components/pos/CategoryTabs'
import ProductGrid from '@/components/pos/ProductGrid'
import CartPanel from '@/components/pos/CartPanel'
import PaymentModal from '@/components/pos/PaymentModal'
import ActiveOrdersModal from '@/components/pos/ActiveOrdersModal'
import PendingOrdersModal from '@/components/pos/PendingOrdersModal'
import ModifierModal from '@/components/pos/ModifierModal'
import { Input } from '@/components/ui/input'
import { Search, Utensils, ShoppingBag, Truck, LayoutGrid, CreditCard, Banknote, Smartphone, Receipt, ShoppingCart, X, Cookie, PlusCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'
import { usePrint } from '@/hooks/usePrint'
import apiClient from '@/api/client'
import { printHtml } from '@/lib/print'
import { printToLocalDevice } from '@/lib/localPrinting'
import { usePermissions } from '@/hooks/usePermissions'
import AdminPinModal from '@/components/pos/AdminPinModal'

export default function POSPage() {
  const navigate      = useNavigate()
  const queryClient   = useQueryClient()
  const { toast }     = useToast()
  const { printNetworkReceipt } = usePrint()
  const [searchParams] = useSearchParams()
  
  const urlTable = searchParams.get('table')
  const urlOrder = searchParams.get('order')
  const urlType  = searchParams.get('type') || 'dine_in'
  const autoPay  = searchParams.get('pay') === '1'
  const urlServer = searchParams.get('server')

  const { items, addItem, updateQty, removeItem, clear } = useCart()
  const store = useCartStore()

  const [orderType, setOrderType] = useState(urlType)
  const [search, setSearch]       = useState('')
  const [catId, setCatId]         = useState(null)
  const [payOpen, setPayOpen]     = useState(autoPay)
  const [activeOrdersOpen, setActiveOrdersOpen] = useState(false)
  const [pendingOrdersOpen, setPendingOrdersOpen] = useState(false)
  const [showMobileCart, setShowMobileCart] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [modifierProduct, setModifierProduct] = useState(null)
  const [isModifierOpen, setIsModifierOpen] = useState(false)
  const { isAdmin, isManager } = usePermissions()
  const [adminPinModal, setAdminPinModal] = useState({
    open: false,
    key: null,
    itemId: null,
    itemName: '',
    targetQty: 0,
    currentQty: 0,
    isDelete: false,
    isLoading: false
  })

  const { data: orderResponse } = useQuery({
    queryKey: ['order-data', urlOrder, urlTable],
    queryFn:  () => urlOrder 
        ? apiClient.get(`/orders/${urlOrder}`).then(r => r.data)
        : ordersApi.currentByTable(urlTable).then(r => r.data),
    enabled:  !!urlOrder || !!urlTable,
  });

  const activeOrder = orderResponse?.order || orderResponse?.data || orderResponse;

  useEffect(() => {
    if (activeOrder?.id && !urlOrder) {
      const activeType = activeOrder.type || orderType || 'dine_in';
      navigate(`/pos?table=${urlTable}&order=${activeOrder.id}&type=${activeType}`, { replace: true });
    }
  }, [activeOrder, urlTable, urlOrder, navigate]);

  useEffect(() => {
    // Si on a une commande active (venant de l'API), on la charge
    if (activeOrder?.id) {
        store.loadOrder(activeOrder);
        
        // Synchroniser le type de commande dans l'URL si nécessaire
        if (activeOrder.type && orderType !== activeOrder.type) {
            const params = new URLSearchParams(window.location.search);
            params.set('type', activeOrder.type);
            navigate(`${window.location.pathname}?${params.toString()}`, { replace: true });
        }
    } 
    // Sinon, si on change de table ou qu'on arrive sur une table sans commande
    else {
        const currentStoreTable = store.tableId ? String(store.tableId) : null;
        if (urlTable !== currentStoreTable) {
            // On ne vide que si on n'est pas déjà sur cette table
            // Cela évite de perdre le panier lors d'un simple rafraîchissement
            if (!urlOrder) {
                clear();
                if (urlTable) store.setTable(urlTable);
            }
        }
    }

    // Cleanup : vider le panier quand on quitte la page POS 
    // si aucune commande n'est enregistrée sur le serveur (brouillon)
    return () => {
        if (!window.location.search.includes('order=')) {
            // On utilise window.location car urlOrder peut être périmé dans la closure
            clear();
        }
    };
  }, [activeOrder?.id, urlOrder, urlTable]);

  const { data: configData } = useQuery({
    queryKey: ['settings-config'],
    queryFn:  () => settingsApi.config().then(r => r.data),
  })

  useEffect(() => {
    if (!configData) return;

    // TVA : uniquement si différente et pas de commande en cours
    const newVat = Number(configData.default_vat_rate)
    if (configData.default_vat_rate !== undefined && !urlOrder && store.vatRate !== newVat) {
        store.setVatRate(newVat)
    }

    // Taux Gozem : uniquement si différent
    const newGozem = Number(configData.gozem_discount_rate)
    if (configData.gozem_discount_rate !== undefined && store.gozemRate !== newGozem) {
        store.setGozemRate(newGozem)
    }

    // Promotion globale : uniquement si changement de config
    const newPromoActive = !!configData.global_promotion_active
    const newPromoRate = Number(configData.global_promotion_percentage || 0)
    
    let newPromoCats = configData.global_promotion_categories || ['kitchen', 'pizza']
    if (typeof newPromoCats === 'string') {
        try {
            const parsed = JSON.parse(newPromoCats)
            if (Array.isArray(parsed)) newPromoCats = parsed
        } catch (e) {
            newPromoCats = ['kitchen', 'pizza']
        }
    }
    // Normalisation 'cuisine' -> 'kitchen'
    newPromoCats = Array.isArray(newPromoCats) 
        ? newPromoCats.map(c => c === 'cuisine' ? 'kitchen' : c)
        : ['kitchen', 'pizza'];

    const currentPromoCats = store.promoCategories || []
    const hasPromoChanged = 
        store.promoActive !== newPromoActive || 
        store.promoRate !== newPromoRate ||
        JSON.stringify(currentPromoCats) !== JSON.stringify(newPromoCats);

    if (configData.global_promotion_active !== undefined && hasPromoChanged) {
        store.setPromoConfig(newPromoActive, newPromoRate, newPromoCats)
    }
  }, [configData, urlOrder])

  // Synchroniser l'état local orderType quand l'URL change (ex: navigation depuis loadOrder)
  useEffect(() => {
    if (urlType && urlType !== orderType) {
      setOrderType(urlType)
    }
  }, [urlType])

  useEffect(() => {
    store.setOrderType(orderType)
  }, [orderType])

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn:  () => categoriesApi.list().then(r => r.data),
  })

  const { data: productsData = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn:  () => productsApi.list().then(r => r.data?.data ?? r.data),
  })
  
  const products = Array.isArray(productsData) ? productsData : (productsData?.data || []);

  const createMutation = useMutation({
    mutationFn: (data) => apiClient.post('/orders', data),
    onSuccess: (res) => {
        const order = res.data;
        queryClient.invalidateQueries({ queryKey: ['order-data'] });
        if (order.table_id) {
            navigate(`/pos?table=${order.table_id}&order=${order.id}&type=${orderType}`, { replace: true });
        }
    }
  });

  const sendToKitchenMutation = useMutation({
    mutationFn: (id) => apiClient.post(`/orders/${id}/send-to-kitchen`),
    onSuccess: (res) => {
        const { message, tickets } = res.data;
        toast({ title: "Succès", description: message || "Commande envoyée." });
        
        if (tickets && Array.isArray(tickets)) {
            tickets.forEach(ticket => {
                printToLocalDevice(ticket.html, ticket.destination, configData || {});
            });
        }

        // Vider le panier et rediriger pour éviter les doublons
        clear();
        if (urlTable) {
            navigate('/tables', { replace: true });
        } else {
            navigate('/pos', { replace: true });
        }

        queryClient.invalidateQueries({ queryKey: ['order-data'] });
    },
    onError: (err) => {
        toast({ 
            title: "Erreur d'envoi", 
            description: err.response?.data?.message || "Impossible d'envoyer la commande en cuisine.", 
            variant: "destructive" 
        });
    }
  });

  const payMutation = useMutation({
    mutationFn: (data) => paymentsApi.pay(data),
    onSuccess: (res) => {
        toast({ title: "Paiement réussi", description: "La commande a été clôturée" });
        const orderId = res.data.order?.id || urlOrder;
        
        if (orderId) {
            // On lance l'impression via le hook (bridge local RawBT/QZ)
            printNetworkReceipt(orderId).catch(err => {
                console.warn("L'impression via bridge a échoué", err);
                toast({ 
                    title: "Erreur d'impression", 
                    description: "Impossible de joindre l'imprimante caisse via le bridge local.",
                    variant: "destructive" 
                });
            });
        }

        clear();
        setPayOpen(false);
        navigate(urlTable ? '/tables' : '/pos', { replace: true });
        queryClient.invalidateQueries({ queryKey: ['order-data'] });
        queryClient.invalidateQueries({ queryKey: ['products'] });
        queryClient.invalidateQueries({ queryKey: ['products-admin'] });
        queryClient.invalidateQueries({ queryKey: ['ingredients'] });
        queryClient.invalidateQueries({ queryKey: ['stock-alerts'] });
        queryClient.invalidateQueries({ queryKey: ['stock-value'] });
    },
    onError: (err) => {
        toast({ 
            title: "Erreur", 
            description: err.response?.data?.message || "Échec du paiement", 
            variant: "destructive" 
        });
    }
  });

  const executeItemUpdate = (itemId, key, qty, adminPin = null) => {
    setIsSyncing(true)
    const payload = {
      items: [{ id: itemId, quantity: qty }]
    }
    if (adminPin) {
      payload.admin_pin = adminPin
    }

    return apiClient.put(`/orders/${urlOrder}/items`, payload)
      .then(() => {
        if (qty === 0) {
          removeItem(key)
          toast({ title: "Article supprimé" })
        } else {
          updateQty(key, qty)
          toast({ title: "Quantité mise à jour" })
        }
        queryClient.invalidateQueries({ queryKey: ['order-data'] })
        setAdminPinModal(prev => ({ ...prev, open: false, isLoading: false }))
      })
      .catch(err => {
        const msg = err.response?.data?.message || err.message || "Action refusée"
        toast({ 
          title: "Action refusée", 
          description: msg, 
          variant: "destructive" 
        })
        setAdminPinModal(prev => ({ ...prev, isLoading: false }))
        throw err
      })
      .finally(() => setIsSyncing(false))
  }

  const handleUpdateQty = (key, qty) => {
    const item = items.find(i => i.key === key)
    if (!item) return

    if (urlOrder && item.id) {
      // 1. Augmentation (+) sur article déjà en cuisine : prépare le delta pour réenvoi en cuisine
      if (item.status !== 'pending' && qty > item.qty) {
        const delta = qty - item.qty
        store.addItem(
          { id: item.productId, name: item.name, price: item.price, category: { destination: item.categoryDestination, is_promo_exempt: item.isPromoExempt } },
          delta,
          item.modifiers,
          item.note
        )
        toast({
          title: "Ajout préparé",
          description: `+${delta} ${item.name} ajouté (cliquez sur "Envoyer en cuisine").`
        })
        return
      }

      // 2. Diminution (-) sur article déjà en cuisine : blocage pour caissier -> Demande de PIN Admin
      if (item.status !== 'pending' && qty < item.qty) {
        if (!isAdmin && !isManager) {
          setAdminPinModal({
            open: true,
            key,
            itemId: item.id,
            itemName: item.name,
            targetQty: qty,
            currentQty: item.qty,
            isDelete: qty === 0,
            isLoading: false
          })
          return
        }
      }

      // 3. Exécution directe si Admin/Manager ou si article non encore en cuisine (pending)
      executeItemUpdate(item.id, key, qty)
    } else {
      updateQty(key, qty)
    }
  }

  const handleRemoveItem = (key) => {
    const item = items.find(i => i.key === key)
    if (!item) return

    if (urlOrder && item.id) {
      // Suppression sur article déjà en cuisine : blocage pour caissier -> Demande de PIN Admin
      if (item.status !== 'pending' && !isAdmin && !isManager) {
        setAdminPinModal({
          open: true,
          key,
          itemId: item.id,
          itemName: item.name,
          targetQty: 0,
          currentQty: item.qty,
          isDelete: true,
          isLoading: false
        })
        return
      }

      executeItemUpdate(item.id, key, 0)
    } else {
      removeItem(key)
    }
  }

  const handleConfirmAdminPin = async (pin) => {
    if (!adminPinModal.itemId) return
    setAdminPinModal(prev => ({ ...prev, isLoading: true }))
    try {
      await executeItemUpdate(adminPinModal.itemId, adminPinModal.key, adminPinModal.targetQty, pin)
    } catch (e) {
      // L'erreur est gérée et toastée dans executeItemUpdate
    }
  }

  const handleToggleTakeaway = (key) => {
    const item = items.find(i => i.key === key);
    if (!item) return;
    const newStatus = !item.isTakeaway;

    if (urlOrder && item.id) {
        setIsSyncing(true);
        apiClient.put(`/orders/${urlOrder}/items`, {
            items: [{ id: item.id, quantity: item.qty, is_takeaway: newStatus }]
        }).then(() => {
            store.toggleTakeaway(key);
            queryClient.invalidateQueries({ queryKey: ['order-data'] });
        }).catch(err => {
            toast({ 
                title: "Action refusée", 
                description: "Impossible de modifier le statut de l'article.", 
                variant: "destructive" 
            });
        }).finally(() => setIsSyncing(false));
    } else {
        store.toggleTakeaway(key);
    }
  };

    const handleSend = async () => {
        const formatItems = (list) => list.map(i => ({
            product_id: String(i.productId).startsWith('custom') ? null : i.productId,
            custom_name: String(i.productId).startsWith('custom') ? i.name : null,
            unit_price: String(i.productId).startsWith('custom') ? i.price : null,
            quantity: i.qty,
            notes: i.note || i.notes,
            modifier_ids: (i.modifiers || []).map(m => m.id),
            is_takeaway: i.isTakeaway || false
        }));

        if (urlOrder) {
            const newItems = items.filter(i => !i.id);
            if (newItems.length > 0 || store.notes) {
                try {
                    setIsSyncing(true);
                    await apiClient.post(`/orders/${urlOrder}/add-items`, {
                        items: formatItems(newItems),
                        notes: store.notes
                    });
                    store.setNotes('');
                    sendToKitchenMutation.mutate(urlOrder);
                } catch (err) {
                    toast({ 
                        title: "Erreur d'envoi", 
                        description: err.response?.data?.message || "Impossible d'ajouter les articles.", 
                        variant: "destructive" 
                    });
                } finally {
                    setIsSyncing(false);
                }
            } else {
                sendToKitchenMutation.mutate(urlOrder);
            }
        } else {
            createMutation.mutate({
                table_id: urlTable,
                type: orderType,
                server_name: urlServer,
                items: formatItems(items),
                notes: store.notes
            }, {
                onSuccess: (res) => {
                    const newId = res.data.id || res.data.data?.id;
                    sendToKitchenMutation.mutate(newId);
                }
            });
        }
    };

  const handlePaymentSubmit = async (paymentData) => {
    const formatItems = (list) => list.map(i => ({
        product_id: String(i.productId).startsWith('custom') ? null : i.productId,
        custom_name: String(i.productId).startsWith('custom') ? i.name : null,
        unit_price: String(i.productId).startsWith('custom') ? i.price : null,
        quantity: i.qty,
        notes: i.note || i.notes,
        modifier_ids: (i.modifiers || []).map(m => m.id),
        is_takeaway: i.isTakeaway || false
    }));

    if (paymentData.method === 'customer_tab') {
        const tabId = paymentData.reference;
        const attachToTab = (orderId) => {
            apiClient.post(`/customer-tabs/${tabId}/attach`, { order_id: orderId })
                .then(() => {
                    toast({ title: "Mis sur ardoise" });
                    clear(); setPayOpen(false);
                    navigate(urlTable ? '/tables' : '/pos', { replace: true });
                });
        };
        if (urlOrder) {
            const newItems = items.filter(i => !i.id);
            if (newItems.length > 0) {
                try {
                    await apiClient.post(`/orders/${urlOrder}/add-items`, { items: formatItems(newItems) });
                } catch (e) {
                    console.error("Erreur add-items avant ardoise", e);
                }
            }
            attachToTab(urlOrder);
        } else {
            createMutation.mutate({
                table_id: urlTable, type: orderType, server_name: urlServer,
                items: formatItems(items), notes: store.notes
            }, { onSuccess: (res) => attachToTab(res.data.id || res.data.data?.id) });
        }
        return;
    }

    if (urlOrder) {
        const newItems = items.filter(i => !i.id);
        if (newItems.length > 0) {
            try {
                await apiClient.post(`/orders/${urlOrder}/add-items`, { items: formatItems(newItems) });
            } catch (e) {
                console.error("Erreur add-items avant paiement", e);
            }
        }
        payMutation.mutate({ order_id: urlOrder, ...paymentData });
    } else {
        createMutation.mutate({
            table_id: urlTable, type: orderType, server_name: urlServer,
            items: formatItems(items), notes: store.notes
        }, { onSuccess: (res) => payMutation.mutate({ order_id: res.data.id || res.data.data?.id, ...paymentData }) });
    }
  };

  const handleAddProduct = (product) => {
    const groups = product.modifier_groups || product.modifierGroups || [];
    if (groups.length > 0) {
      setModifierProduct(product);
      setIsModifierOpen(true);
    } else {
      addItem(product);
    }
  }

  const handleConfirmModifiers = (product, modifiers) => {
    addItem(product, 1, modifiers);
  }

  const filtered = useMemo(() => {
    let list = Array.isArray(products) ? products : []
    if (catId)   list = list.filter(p => p.category_id === catId)
    if (search)  list = list.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    return list
  }, [products, catId, search])

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col lg:flex-row gap-4 animate-in fade-in duration-500 overflow-hidden relative text-foreground">
      <div className="flex-1 flex flex-col gap-4 min-w-0 overflow-hidden">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1">
            <div className="flex bg-muted p-1 rounded-[10px] border border-border shadow-md">
                {[
                    { id: 'dine_in', label: 'Sur place', icon: Utensils, color: 'text-primary' },
                    { id: 'takeaway', label: 'Emporter', icon: ShoppingBag, color: 'text-blue-500' },
                    { id: 'gozem', label: 'Gozem', icon: Truck, color: 'text-emerald-500' }
                ].map(t => (
                    <Button 
                        key={t.id}
                        variant="ghost" size="sm"
                        onClick={() => {
                            const params = new URLSearchParams(window.location.search);
                            
                            // Si on change de type manuellement sur une commande existante
                                if (urlOrder && orderType !== t.id) {
                                    setIsSyncing(true)
                                    apiClient.put(`/orders/${urlOrder}`, { type: t.id })
                                        .then(() => {
                                            setOrderType(t.id) // Synchroniser l'état local immédiatement
                                            queryClient.invalidateQueries({ queryKey: ['order-data'] })
                                            toast({ title: "Type mis à jour", description: `Commande passée en mode ${t.label}` })
                                            
                                            // Navigation APRES succès pour éviter le reset par le useEffect de chargement
                                            params.set('type', t.id);
                                            navigate(`${window.location.pathname}?${params.toString()}`, { replace: true });
                                        })
                                        .catch(() => {
                                            toast({ title: "Erreur", description: "Impossible de changer le type", variant: "destructive" })
                                        })
                                        .finally(() => setIsSyncing(false))
                                } else {
                                    // Pour une nouvelle commande (pas d'urlOrder), on change juste localement
                                    params.set('type', t.id);
                                    if (t.id === 'dine_in' && !urlOrder) {
                                        navigate('/tables')
                                    } else {
                                        if (!urlOrder) clear();
                                        navigate(`${window.location.pathname}?${params.toString()}`);
                                    }
                            }
                        }}
                        className={cn(
                            "px-4 h-10 rounded-[10px] font-black uppercase text-[10px] tracking-widest transition-all gap-2",
                            orderType === t.id ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <t.icon size={14} className={orderType === t.id ? "text-primary-foreground" : t.color} />
                        <span className="hidden sm:inline">{t.label}</span>
                    </Button>
                ))}
            </div>

            <div className="flex items-center gap-2">
                {urlOrder && (
                    <Button 
                        variant="outline" size="sm"
                        className="h-10 px-4 bg-emerald-500/10 border-emerald-500/20 rounded-[10px] font-black uppercase text-[10px] tracking-widest gap-2 shadow-sm hover:bg-emerald-500/20 transition-all active:scale-95 text-emerald-600"
                        onClick={() => {
                            const name = window.prompt("NOM DE L'ARTICLE (ex: Supplément Riz) :", "Supplément");
                            if (!name) return;
                            const price = window.prompt("PRIX (FCFA) :", "1500");
                            if (!price || isNaN(price)) return;
                            addItem({ id: `custom-${Date.now()}`, name, price: Number(price) });
                        }}
                    >
                        <PlusCircle size={14} />
                        <span className="hidden sm:inline">Article Libre</span>
                    </Button>
                )}

                <Button 
                    variant="outline" size="sm"
                    className="h-10 px-4 bg-background border-border rounded-[10px] font-black uppercase text-[10px] tracking-widest gap-2 shadow-sm hover:border-primary/50 transition-all active:scale-95"
                    onClick={() => setActiveOrdersOpen(true)}
                >
                    <LayoutGrid size={14} className="text-primary" />
                    <span className="hidden sm:inline text-foreground">Tables occupées</span>
                </Button>

                <Button 
                    variant="outline" size="sm"
                    className="h-10 px-4 bg-purple-500/10 border-purple-500/20 rounded-[10px] font-black uppercase text-[10px] tracking-widest gap-2 shadow-sm hover:bg-purple-500/20 transition-all active:scale-95 text-purple-600"
                    onClick={() => setPendingOrdersOpen(true)}
                >
                    <ShoppingBag size={14} className="text-purple-600" />
                    <span className="hidden sm:inline">G&Em encours</span>
                </Button>

                <Button 
                    variant="ghost" size="sm"
                    className="lg:hidden h-10 px-4 bg-primary text-primary-foreground rounded-[10px] font-black uppercase text-[10px] tracking-widest gap-2 shadow-md"
                    onClick={() => setShowMobileCart(true)}
                >
                    <ShoppingCart size={14} />
                    <span>({items.reduce((s,i) => s+i.qty, 0)})</span>
                </Button>

                <div className="flex items-center gap-3 ml-2">
                    {urlTable && (
                    <div className="h-10 px-4 bg-primary/10 border border-primary/20 rounded-[10px] flex items-center gap-2">
                        <Utensils size={14} className="text-primary" />
                        <span className="text-foreground font-black uppercase text-[10px] italic tracking-tighter">Table {urlTable}</span>
                    </div>
                    )}
                    <div className="relative w-64 group">
                        <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/30 group-focus-within:text-primary transition-colors" />
                        <Input 
                            value={search} 
                            onChange={e => setSearch(e.target.value)} 
                            placeholder="Rechercher..." 
                            className="h-10 pl-11 bg-muted/40 border-border rounded-[10px] text-xs font-bold focus:ring-primary" 
                        />
                    </div>
                </div>
            </div>
        </header>

        <div className="flex-1 flex flex-col gap-4 overflow-hidden px-1">
          {catId === null && !search ? (
            <div className="flex-1 overflow-y-auto pb-20 lg:pb-12 custom-scrollbar">
               <CategoryTabs categories={categories} active={catId} onChange={setCatId} />
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden gap-3">
               <div className="shrink-0 flex items-center justify-between bg-card p-2 rounded-[10px] border border-border shadow-sm">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => { setCatId(null); setSearch(''); }} 
                    className="h-9 px-4 rounded-[8px] font-black uppercase text-[10px] gap-2 border-primary/20 text-primary hover:bg-primary/5"
                  >
                     ← Retour aux catégories
                  </Button>
                  {catId && (
                     <span className="text-[11px] font-black uppercase tracking-widest text-foreground px-2">
                        {categories.find(c => c.id === catId)?.name}
                     </span>
                  )}
               </div>
               <div className="flex-1 overflow-y-auto pr-1 pb-20 lg:pb-12 custom-scrollbar">
                  <ProductGrid products={filtered} onAdd={handleAddProduct} isLoading={isLoading} />
               </div>
            </div>
          )}
        </div>

        <ModifierModal 
          open={isModifierOpen}
          product={modifierProduct}
          onClose={() => setIsModifierOpen(false)}
          onConfirm={handleConfirmModifiers}
        />
      </div>

      <div className={cn(
          "fixed lg:static inset-0 z-[100] lg:z-0 lg:w-[330px] shrink-0 h-full transition-transform duration-300 transform",
          showMobileCart ? "translate-x-0" : "translate-x-full lg:translate-x-0",
          "bg-card lg:bg-transparent"
      )}>
          <CartPanel 
            activeOrder={activeOrder} tableId={urlTable} orderId={urlOrder} type={orderType} 
            onClose={() => setShowMobileCart(false)}
            onSend={() => { handleSend(); setShowMobileCart(false); }}
            onPay={() => { setPayOpen(true); setShowMobileCart(false); }}
            onPrintReceipt={() => printNetworkReceipt(urlOrder)}
            onUpdateQty={handleUpdateQty}
            onRemove={handleRemoveItem}
            onToggleTakeaway={handleToggleTakeaway}
            onOrderTypeChange={setOrderType}
            isSyncing={isSyncing}
          />
      </div>

      {!showMobileCart && items.length > 0 && (
          <button 
            onClick={() => setShowMobileCart(true)}
            className="lg:hidden fixed bottom-6 right-6 z-40 w-14 h-14 bg-primary text-primary-foreground rounded-[10px] shadow-2xl flex items-center justify-center animate-in zoom-in duration-300"
          >
              <div className="relative">
                <ShoppingCart size={24} />
                <span className="absolute -top-2 -right-2 bg-card text-primary text-[10px] font-black h-5 min-w-[20px] px-1.2 rounded-full flex items-center justify-center border-2 border-primary">
                    {items.reduce((s,i) => s+i.qty, 0)}
                </span>
              </div>
          </button>
      )}

      <PaymentModal 
        open={payOpen} onClose={() => setPayOpen(false)} onSubmit={handlePaymentSubmit}
        isLoading={payMutation.isPending || createMutation.isPending}
      />
      <ActiveOrdersModal 
        open={activeOrdersOpen} 
        onOpenChange={setActiveOrdersOpen} 
      />
      <PendingOrdersModal open={pendingOrdersOpen} onOpenChange={setPendingOrdersOpen} />

      {/* Modale d'autorisation Admin pour décrémenter/supprimer un article en cuisine */}
      <AdminPinModal
        open={adminPinModal.open}
        onClose={() => setAdminPinModal(prev => ({ ...prev, open: false, isLoading: false }))}
        onConfirm={handleConfirmAdminPin}
        itemName={adminPinModal.itemName}
        targetQty={adminPinModal.targetQty}
        currentQty={adminPinModal.currentQty}
        isDelete={adminPinModal.isDelete}
        isLoading={adminPinModal.isLoading}
      />
    </div>
  )
}
