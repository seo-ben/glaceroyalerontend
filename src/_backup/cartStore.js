import { create } from 'zustand'

export const useCartStore = create((set, get) => ({
  items:    [],
  tableId:  null,
  orderId:  null,
  covers:   1,
  notes:    '',
  discount: { type: null, value: 0, reason: '' },
  vatRate:  0,
  orderType: 'dine_in',
  gozemRate: 0,

  setVatRate: (rate) => set({ vatRate: Number(rate) }),
  setOrderType: (type) => set({ orderType: type }),
  setGozemRate: (rate) => set({ gozemRate: Number(rate) }),
  setTable: (tableId, orderId = null) => set({ tableId, orderId }),
  setCovers: (covers) => set({ covers }),
  setNotes: (notes) => set({ notes }),

  addItem: (product, qty = 1, modifiers = [], note = '') => {
    const items = get().items
    const key   = product.id + '-' + modifiers.map(m => m.id).join(',')
    const exists = items.find(i => i.key === key)

    if (exists) {
      set({ items: items.map(i => i.key === key ? { ...i, qty: i.qty + qty } : i) })
    } else {
      set({
        items: [...items, {
          key,
          productId:   product.id,
          name:        product.name,
          price:       product.price,
          qty,
          modifiers,
          note,
          course:      1,
          status:      'pending',
        }]
      })
    }
  },

  updateQty: (key, qty) => {
    if (qty <= 0) {
      set({ items: get().items.filter(i => i.key !== key) })
    } else {
      set({ items: get().items.map(i => i.key === key ? { ...i, qty } : i) })
    }
  },

  removeItem: (key) => set({ items: get().items.filter(i => i.key !== key) }),

  setDiscount: (type, value, reason) => set({ discount: { type, value, reason } }),

  subtotal: () => get().items.reduce((sum, item) => {
    const modExtra = item.modifiers.reduce((s, m) => s + (m.extra_price || 0), 0)
    return sum + (item.price + modExtra) * item.qty
  }, 0),

  discountAmount: () => {
    const sub  = get().subtotal()
    
    // Si c'est du Gozem, on applique la remise auto
    if (get().orderType === 'gozem' && get().gozemRate > 0) {
        return Math.round(sub * get().gozemRate / 100)
    }

    const disc = get().discount
    if (!disc.type) return 0
    return disc.type === 'percent'
      ? Math.round(sub * disc.value / 100)
      : Math.min(disc.value, sub)
  },

  vatAmount: () => {
    const rate = Number(get().vatRate) || 0;
    if (rate === 0) return 0;
    // Mode TTC: extraction de la TVA du total (les prix incluent déjà la TVA)
    const totalTTC = get().subtotal() - get().discountAmount();
    return Math.round(totalTTC - (totalTTC / (1 + (rate / 100))));
  },

  total: () => {
    // Mode TTC: le total EST le sous-total moins la remise (pas d'ajout de TVA)
    const res = get().subtotal() - get().discountAmount();
    return isNaN(res) ? 0 : res;
  },

  clear: () => set({
    items: [], tableId: null, orderId: null,
    covers: 1, notes: '', discount: { type: null, value: 0, reason: '' },
  }),

  loadOrder: (order) => set({
    orderId:  order.id,
    tableId:  order.table_id,
    covers:   order.covers,
    notes:    order.notes || '',
    discount: { 
        type: order.discount_type, 
        value: Number(order.discount_value || 0), 
        reason: order.discount_reason || '' 
    },
    vatRate:  Number(order.vat_rate || 0),
    items: order.items.map(item => ({
        id:        item.id,
        key:       `${item.product_id}-${(item.modifiers || []).map(m => m.modifier_id).join(',')}`,
        productId: item.product_id,
        name:      item.product?.name || 'Produit',
        price:     Number(item.unit_price),
        qty:       item.quantity,
        modifiers: (item.modifiers || []).map(m => ({
            id:          m.modifier_id,
            name:        m.modifier?.name,
            extra_price: Number(m.extra_price || 0)
        })),
        note:      item.notes || '',
        status:    item.status,
        cancellations: item.cancellations || [],
    }))
  }),
}))

export default useCartStore
