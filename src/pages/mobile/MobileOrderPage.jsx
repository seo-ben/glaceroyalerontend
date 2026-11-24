import { useState, useMemo } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { productsApi } from '@/api/products'
import { ordersApi } from '@/api/orders'
import { formatAmount } from '@/lib/formatters'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Search, ArrowLeft, Minus, Plus, ShoppingCart, Send } from 'lucide-react'

export default function MobileOrderPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const tableId = searchParams.get('table')

  const [search, setSearch] = useState('')
  const [catId, setCatId]   = useState(null)
  const [cart, setCart]     = useState([])

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn:  () => productsApi.categories().then(r => r.data),
  })

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn:  () => productsApi.list().then(r => r.data?.data ?? r.data),
  })

  const filtered = useMemo(() => {
    let list = products.filter(p => p.is_available)
    if (catId) list = list.filter(p => p.category_id === catId)
    if (search) list = list.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    return list
  }, [products, catId, search])

  const addToCart = (product) => {
    setCart(prev => {
      const exists = prev.find(i => i.id === product.id)
      if (exists) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i)
      return [...prev, { id: product.id, name: product.name, price: product.price, qty: 1 }]
    })
  }

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(i => i.id === id ? { ...i, qty: Math.max(0, i.qty + delta) } : i).filter(i => i.qty > 0))
  }

  const total = cart.reduce((s, i) => s + i.price * i.qty, 0)
  const count = cart.reduce((s, i) => s + i.qty, 0)

  const createMutation = useMutation({
    mutationFn: (data) => ordersApi.create(data),
    onSuccess: () => { setCart([]); navigate('/mobile') },
  })

  const handleSend = () => {
    createMutation.mutate({
      table_id: tableId ? Number(tableId) : null,
      order_type: tableId ? 'dine_in' : 'takeaway',
      covers: 1,
      items: cart.map(i => ({ product_id: i.id, quantity: i.qty })),
    })
  }

  return (
    <div className="min-h-screen bg-pos-bg text-white flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-pos-border flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/mobile')} className="text-white/60">
          <ArrowLeft size={18} />
        </Button>
        <h1 className="font-bold text-sm">Prise de commande</h1>
        {tableId && <Badge className="bg-primary/20 text-primary">Table {tableId}</Badge>}
      </div>

      {/* Search + Categories */}
      <div className="p-3 space-y-3">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-pos-muted" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." className="pl-9 bg-pos-surface border-pos-border text-white" />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button onClick={() => setCatId(null)} className={cn('px-3 py-1.5 rounded-full text-xs whitespace-nowrap', !catId ? 'bg-primary text-white' : 'bg-pos-card text-white/60')}>Tout</button>
          {categories.map(cat => (
            <button key={cat.id} onClick={() => setCatId(cat.id)} className={cn('px-3 py-1.5 rounded-full text-xs whitespace-nowrap', catId === cat.id ? 'bg-primary text-white' : 'bg-pos-card text-white/60')}>
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Products */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filtered.map(product => {
          const inCart = cart.find(i => i.id === product.id)
          return (
            <div key={product.id} onClick={() => addToCart(product)} className="flex items-center gap-3 p-3 bg-pos-card rounded-xl border border-pos-border active:scale-[0.98] transition-all">
              <div className="w-12 h-12 rounded-lg bg-pos-surface flex items-center justify-center text-xl shrink-0">
                {product.emoji || '🍽️'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{product.name}</p>
                <p className="text-primary text-sm font-bold">{formatAmount(product.price)}</p>
              </div>
              {inCart && (
                <Badge className="bg-primary text-white">{inCart.qty}</Badge>
              )}
            </div>
          )
        })}
      </div>

      {/* Cart bottom bar */}
      {count > 0 && (
        <div className="p-3 border-t border-pos-border space-y-2">
          <div className="max-h-32 overflow-y-auto space-y-1">
            {cart.map(item => (
              <div key={item.id} className="flex items-center gap-2 text-sm">
                <span className="flex-1 truncate">{item.name}</span>
                <div className="flex items-center gap-1">
                  <button onClick={(e) => { e.stopPropagation(); updateQty(item.id, -1) }} className="w-6 h-6 rounded bg-pos-card flex items-center justify-center"><Minus size={10} /></button>
                  <span className="w-5 text-center text-xs font-bold">{item.qty}</span>
                  <button onClick={(e) => { e.stopPropagation(); updateQty(item.id, 1) }} className="w-6 h-6 rounded bg-pos-card flex items-center justify-center"><Plus size={10} /></button>
                </div>
                <span className="text-primary text-xs font-bold w-16 text-right">{formatAmount(item.price * item.qty)}</span>
              </div>
            ))}
          </div>
          <Button onClick={handleSend} disabled={createMutation.isPending} className="w-full bg-primary text-white font-medium gap-2">
            <Send size={15} /> Envoyer ({count} articles · {formatAmount(total)})
          </Button>
        </div>
      )}
    </div>
  )
}
