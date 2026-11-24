import { useState, useMemo, useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { productsApi } from '@/api/products'
import { formatAmount } from '@/lib/formatters'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogClose
} from '@/components/ui/dialog'
import { Search, ShoppingBag, Plus, Minus, X, CheckCircle2, ChevronRight, UtensilsCrossed, Store, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import logo from '@/assets/logo.png'

export default function PublicMenuPage() {
  const { slug } = useParams()
  const [searchParams] = useSearchParams()
  const tableIdFromUrl = searchParams.get('table')

  // States
  const [searchOpen, setSearchOpen]   = useState(false)
  const [search, setSearch]           = useState('')
  const [cart, setCart]               = useState([])
  const [cartOpen, setCartOpen]       = useState(false)
  const [checkoutStep, setCheckoutStep] = useState(null) 
  const [orderType, setOrderType]     = useState(null) 
  const [selectedTable, setSelectedTable] = useState(tableIdFromUrl)
  const [lastOrder, setLastOrder]     = useState(null)

  // Robust Storage URL Builder
  const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    // Remove /api and any trailing slashes to be safe
    const baseUrl = import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '');
    return `${baseUrl}/storage/${url}`;
  };

  // Data sourcing
  const { data: menu, isLoading } = useQuery({
    queryKey: ['public-menu', slug],
    queryFn:  () => productsApi.publicMenu(slug).then(r => r.data),
  })

  const { data: availableTables = [], isLoading: isLoadingTables } = useQuery({
    queryKey: ['available-tables', slug],
    queryFn:  () => productsApi.availableTables(slug).then(r => r.data),
    enabled:  checkoutStep === 'table'
  })

  const orderMutation = useMutation({
    mutationFn: (data) => productsApi.publicSubmitOrder(slug || 'default', data),
    onSuccess: (res) => {
      setLastOrder(res.data)
      setCart([])
      setCheckoutStep('success')
    },
    onError: (err) => alert("Erreur: " + (err.response?.data?.message || err.message))
  })

  // Cart Logic
  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id)
      if (existing) return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)
      return [...prev, { ...product, quantity: 1 }]
    })
  }

  const removeFromCart = (productId) => {
    setCart(prev => prev.reduce((acc, item) => {
      if (item.id === productId) {
        if (item.quantity > 1) acc.push({ ...item, quantity: item.quantity - 1 })
      } else acc.push(item)
      return acc
    }, []))
  }

  const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + (item.price * item.quantity), 0), [cart])
  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart])

  const handleCheckout = () => {
    setCartOpen(false)
    if (tableIdFromUrl) {
        setOrderType('dine_in'); setSelectedTable(tableIdFromUrl)
        submitOrder('dine_in', tableIdFromUrl)
    } else {
        setCheckoutStep('type')
    }
  }

  const submitOrder = (type, tableId) => {
    orderMutation.mutate({
      type: type, table_id: tableId,
      items: cart.map(item => ({ product_id: item.id, quantity: item.quantity }))
    })
  }

  if (isLoading) return (
    <div className="min-h-screen bg-white p-6 space-y-4 flex flex-col items-center justify-center">
      <Skeleton className="h-10 w-3/4 rounded-full" />
      <div className="grid grid-cols-2 gap-4 w-full">
        {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-40 rounded-[10px]" />)}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-24">
      
      {/* HEADER: PREMIUM GRADIENT */}
      <header className="bg-gradient-to-br from-[#D71D1D] to-[#FF4500] px-5 pt-12 pb-6 sticky top-0 z-[50] shadow-lg rounded-b-[20px]">
        <div className="flex items-center justify-between relative max-w-2xl mx-auto">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-[12px] p-2 shadow-inner">
                    <img src={logo} alt="" className="w-full h-full object-contain" />
                </div>
                <div>
                   <h1 className="text-white font-black text-sm uppercase tracking-tight leading-none">{menu?.restaurant?.name ?? 'SMART FLOW'}</h1>
                   <p className="text-white/60 text-[8px] font-bold uppercase tracking-widest mt-1">Menu Digital</p>
                </div>
            </div>

            {/* TABLE ID CAPSULE */}
            {tableIdFromUrl && (
                <div className="absolute left-1/2 -translate-x-1/2 bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20 text-white shadow-sm">
                    <p className="text-[9px] font-black uppercase tracking-widest leading-none">Table {tableIdFromUrl}</p>
                </div>
            )}

            <button onClick={() => setSearchOpen(true)} className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-[12px] flex items-center justify-center transition-all text-white border border-white/10">
                <Search size={18} />
            </button>
        </div>
      </header>

      {/* SEARCH OVERLAY */}
      <AnimatePresence>
        {searchOpen && (
            <motion.div 
                initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                className="fixed inset-x-0 top-0 z-[60] bg-white p-6 shadow-2xl border-b flex items-center gap-4 rounded-b-[24px]"
            >
                <Search size={20} className="text-[#D71D1D]" />
                <Input 
                    autoFocus value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Que voulez-vous manger ?"
                    className="border-none focus-visible:ring-0 text-sm p-0 h-auto font-bold placeholder:text-zinc-300"
                />
                <button onClick={() => { setSearch(''); setSearchOpen(false); }} className="text-zinc-400 p-1"><X size={22} /></button>
            </motion.div>
        )}
      </AnimatePresence>

      {/* CATEGORIES & PRODUCTS GRID */}
      <main className="max-w-2xl mx-auto p-4 space-y-12">
        {(menu?.categories ?? []).map((cat, idx) => {
            const filteredProducts = cat.products?.filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()))
            if (filteredProducts.length === 0) return null

            return (
                <section key={cat.id} className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: `${idx * 100}ms` }}>
                    <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-3">
                            <div className="h-4 w-1 bg-[#D71D1D] rounded-full" />
                            <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-900">{cat.name}</h2>
                        </div>
                        <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest text-zinc-400 border-zinc-100">{filteredProducts.length} Plats</Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-3.5">
                        {filteredProducts.map(product => {
                            const cartItem = cart.find(i => i.id === product.id)
                            const productImg = getImageUrl(product.image_url)
                            return (
                                <div key={product.id} className="bg-white rounded-[10px] overflow-hidden border border-zinc-200/50 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col group active:scale-[0.97] transition-all">
                                    {/* IMAGE HEADER - FULL WIDTH */}
                                    <div className="aspect-[1.2/1] w-full bg-[#F2F2F2] relative">
                                        {productImg ? (
                                            <img src={productImg} alt={product.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-50 to-zinc-100">
                                                <span className="text-4xl filter drop-shadow-sm">{product.emoji || '🍽️'}</span>
                                            </div>
                                        )}
                                        
                                        {/* PRICE TAG OVER IMAGE */}
                                        <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-md">
                                            <span className="text-white font-black text-[9px] italic">{formatAmount(product.price)}</span>
                                        </div>

                                        {cartItem && (
                                            <div className="absolute top-2 right-2 bg-[#D71D1D] text-white text-[9px] font-black w-6 h-6 rounded-full flex items-center justify-center shadow-lg border-2 border-white ring-4 ring-[#D71D1D]/20">
                                                {cartItem.quantity}
                                            </div>
                                        )}
                                    </div>

                                    {/* CONTENT BELOW IMAGE */}
                                    <div className="p-3 flex-1 flex flex-col gap-3 bg-white">
                                        <p className="font-bold text-[9px] leading-tight line-clamp-2 text-zinc-900 uppercase tracking-tighter min-h-[1.8em]">
                                            {product.name}
                                        </p>
                                        <Button 
                                            size="sm"
                                            onClick={(e) => { e.stopPropagation(); addToCart(product); }}
                                            className="w-full h-8 bg-zinc-900 text-white hover:bg-[#D71D1D] transition-all text-[8px] font-black uppercase tracking-widest rounded-[8px] shadow-sm border-none"
                                        >
                                            <Plus size={12} className="mr-1.5" /> Ajouter
                                        </Button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </section>
            )
        })}
      </main>

      {/* FLOATING CART: REFINED CHATBOT STYLE */}
      {cart.length > 0 && (
          <div className="fixed bottom-8 right-6 z-[60]">
              <motion.button 
                layoutId="cart-btn" initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} whileTap={{ scale: 0.9 }}
                onClick={() => setCartOpen(true)}
                className="w-14 h-14 bg-zinc-900 text-white rounded-full flex items-center justify-center shadow-[0_15px_30px_rgba(0,0,0,0.3)] border-[3px] border-white relative"
              >
                  <ShoppingBag size={22} />
                  <div className="absolute -top-1 -left-1 bg-[#D71D1D] text-white w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black shadow-lg border-2 border-white">
                      {cartCount}
                  </div>
              </motion.button>
          </div>
      )}

      {/* CART MODAL (BOTTOM DRAWER STYLE) */}
      <Dialog open={cartOpen} onOpenChange={setCartOpen}>
        <DialogContent className="max-w-md bg-white border-none rounded-t-[24px] p-0 overflow-hidden outline-none bottom-0 top-auto translate-y-0 h-[85vh]">
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#D71D1D]/10 rounded-lg flex items-center justify-center text-[#D71D1D]"><ShoppingBag size={18} /></div>
                    <h3 className="font-black text-xs uppercase tracking-tight">Panier gourmand</h3>
                </div>
                <button onClick={() => setCartOpen(false)} className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400"><X size={16}/></button>
            </div>
            
            <div className="p-6 pb-48 space-y-4 overflow-y-auto h-full scrollbar-hide">
                {cart.map(item => (
                    <div key={item.id} className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-zinc-100 shadow-sm animate-in fade-in slide-in-from-right-4">
                        <div className="w-12 h-12 bg-zinc-50 rounded-lg overflow-hidden shrink-0 border">
                             {item.image_url ? <img src={getImageUrl(item.image_url)} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-xl">{item.emoji}</div>}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-[10px] text-zinc-900 truncate uppercase tracking-tighter">{item.name}</p>
                            <p className="text-[#D71D1D] font-black text-[11px] mt-0.5">{formatAmount(item.price * item.quantity)}</p>
                        </div>
                        <div className="flex items-center gap-2 bg-zinc-50 rounded-xl p-1 border">
                            <button onClick={() => removeFromCart(item.id)} className="w-7 h-7 flex items-center justify-center text-zinc-300 hover:text-zinc-500"><Minus size={12} /></button>
                            <span className="font-black text-[10px] w-4 text-center">{item.quantity}</span>
                            <button onClick={() => addToCart(item)} className="w-7 h-7 flex items-center justify-center text-[#D71D1D]"><Plus size={12} /></button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="p-6 absolute bottom-0 left-0 right-0 bg-white border-t border-zinc-100 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] space-y-4">
                <div className="flex justify-between items-center px-2">
                    <p className="text-[10px] font-black text-zinc-300 uppercase tracking-[0.2em]">Total TTC</p>
                    <p className="text-2xl font-black text-zinc-900 italic">{formatAmount(cartTotal)}</p>
                </div>
                <Button 
                    className="w-full h-15 rounded-[16px] bg-zinc-900 hover:bg-[#D71D1D] text-white font-black text-[11px] uppercase tracking-[0.2em] transition-all shadow-xl shadow-zinc-200"
                    onClick={handleCheckout}
                >
                    Validez ma commande
                </Button>
            </div>
        </DialogContent>
      </Dialog>

      {/* SUCCESS MODAL */}
      <Dialog open={checkoutStep === 'success'} onOpenChange={() => setCheckoutStep(null)}>
        <DialogContent className="max-w-[310px] rounded-[30px] bg-white border-none p-8 text-center outline-none shadow-2xl">
            <div className="space-y-6">
                <div className="space-y-4">
                    <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-200 ring-8 ring-emerald-50">
                        <CheckCircle2 size={32} className="text-white" strokeWidth={3} />
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-xl font-black uppercase italic tracking-tighter text-zinc-900">À Table !</h3>
                        <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">C'est en préparation</p>
                    </div>
                </div>
                <div className="bg-[#F8F9FA] p-6 rounded-[20px] border border-zinc-100 space-y-1">
                    <p className="text-[8px] font-black text-zinc-300 uppercase tracking-widest">Référence Commande</p>
                    <p className="text-2xl font-black text-[#D71D1D] tracking-tight">{lastOrder?.order_number}</p>
                </div>
                <Button onClick={() => setCheckoutStep(null)} className="w-full h-12 rounded-xl bg-zinc-900 text-white font-black uppercase tracking-widest text-[10px]">C'est noté</Button>
            </div>
        </DialogContent>
      </Dialog>

      {/* MODALS FLOW */}
      <Dialog open={checkoutStep === 'type'} onOpenChange={() => setCheckoutStep(null)}>
        <DialogContent className="max-w-[300px] rounded-[30px] bg-white border-none p-8 text-center space-y-6 outline-none shadow-2xl">
            <h3 className="font-black text-[10px] uppercase tracking-widest text-zinc-300">Mon service</h3>
            <div className="grid grid-cols-1 gap-3">
                <Button variant="outline" className="h-16 rounded-2xl flex items-center gap-4 px-5 border border-zinc-100 font-black uppercase text-[10px] tracking-widest justify-start" onClick={() => { setOrderType('dine_in'); setCheckoutStep('table'); }}>
                    <div className="w-10 h-10 bg-[#D71D1D]/5 rounded-xl flex items-center justify-center text-[#D71D1D]"><UtensilsCrossed size={18} /></div>
                    Sur Place
                </Button>
                <Button variant="outline" className="h-16 rounded-2xl flex items-center gap-4 px-5 border border-zinc-100 font-black uppercase text-[10px] tracking-widest justify-start" onClick={() => { setOrderType('takeaway'); submitOrder('takeaway', null); }}>
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500"><Store size={18} /></div>
                    À Emporter
                </Button>
            </div>
        </DialogContent>
      </Dialog>

      <Dialog open={checkoutStep === 'table'} onOpenChange={() => setCheckoutStep(null)}>
        <DialogContent className="max-w-[300px] rounded-[30px] bg-white border-none p-8 text-center space-y-6 outline-none shadow-2xl">
            <h3 className="font-black text-[10px] uppercase tracking-widest text-zinc-300">Ma Table</h3>
            
            {/* Loading state */}
            {isLoadingTables && (
              <div className="flex flex-col items-center gap-3 py-6">
                <Loader2 size={28} className="animate-spin text-[#D71D1D]" />
                <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Chargement des tables...</p>
              </div>
            )}

            {/* Tables disponibles */}
            {!isLoadingTables && availableTables.length > 0 && (
              <div className="grid grid-cols-3 gap-3 overflow-y-auto max-h-[250px] p-1">
                {availableTables.map(table => (
                    <Button key={table.id} variant="ghost" className="h-14 rounded-xl border border-zinc-50 hover:border-[#D71D1D] font-black text-[12px] bg-zinc-50/50"
                        onClick={() => { setSelectedTable(table.id); submitOrder('dine_in', table.id); }}>
                        {table.name ?? table.number}
                    </Button>
                ))}
              </div>
            )}

            {/* Aucune table disponible */}
            {!isLoadingTables && availableTables.length === 0 && (
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center">
                  <UtensilsCrossed size={24} className="text-amber-500" />
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] font-black text-zinc-700">Aucune table disponible</p>
                  <p className="text-[9px] text-zinc-400 leading-relaxed">Toutes les tables sont occupées pour le moment. Vous pouvez quand même passer commande, un serveur vous attribuera une table.</p>
                </div>
                <Button 
                  className="w-full h-12 rounded-xl bg-[#D71D1D] hover:bg-[#b51818] text-white font-black uppercase tracking-widest text-[9px] transition-all shadow-lg shadow-red-200"
                  onClick={() => submitOrder('dine_in', null)}
                >
                  Commander sans table
                </Button>
              </div>
            )}
        </DialogContent>
      </Dialog>

    </div>
  )
}
