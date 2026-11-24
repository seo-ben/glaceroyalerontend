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
  promoActive: false,
  promoRate: 0,
  promoCategories: ['kitchen', 'pizza'],
  
  setVatRate: (rate) => set({ vatRate: Number(rate) }),
  setOrderType: (type) => set({ orderType: type }),
  setGozemRate: (rate) => set({ gozemRate: Number(rate) }),
  setPromoConfig: (active, rate, categories = null) => set({ 
    promoActive: !!active, 
    promoRate: Number(rate || 0),
    promoCategories: categories || ['kitchen', 'pizza']
  }),
  setTable: (tableId, orderId = null) => set({ tableId, orderId }),
  setCovers: (covers) => set({ covers }),
  setNotes: (notes) => set({ notes }),

  addItem: (product, qty = 1, modifiers = [], note = '') => {
    const items = get().items
    const orderId = get().orderId
    const modIds = (modifiers || []).map(m => m.id || m.modifier_id).sort().join(',')

    // Si on est sur une commande existante, on ne fusionne qu'avec un item brouillon non encore envoyé en cuisine
    const exists = items.find(i => {
      const iModIds = (i.modifiers || []).map(m => m.id || m.modifier_id).sort().join(',')
      const isPendingDraft = !i.id || i.status === 'pending'
      return (
        i.productId === product.id &&
        iModIds === modIds &&
        (i.note || '') === (note || '') &&
        (!orderId || isPendingDraft)
      )
    })

    if (exists) {
      set({ items: items.map(i => i.key === exists.key ? { ...i, qty: Number(i.qty) + Number(qty) } : i) })
    } else {
      const uniqueKey = `new-${product.id}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
      set({
        items: [...items, {
          key: uniqueKey,
          id: null,
          productId:   product.id,
          name:        product.name,
          price:       Number(product.price || 0),
          qty:         Number(qty),
          modifiers:   (modifiers || []).map(m => ({
            ...m,
            id:          m.id || m.modifier_id,
            extra_price: Number(m.extra_price || 0)
          })),
          note,
          course:      1,
          status:      'pending',
          isTakeaway:  false,
          categoryDestination: product.category?.destination || 'kitchen',
          isPromoExempt: !!product.category?.is_promo_exempt,
        }]
      })
    }
  },

  updateQty: (key, qty) => {
    const nQty = Number(qty);
    if (nQty <= 0) {
      set({ items: get().items.filter(i => i.key !== key) })
    } else {
      set({ items: get().items.map(i => i.key === key ? { ...i, qty: nQty } : i) })
    }
  },

  removeItem: (key) => set({ items: get().items.filter(i => i.key !== key) }),
  
  toggleTakeaway: (key) => {
    set({ items: get().items.map(i => i.key === key ? { ...i, isTakeaway: !i.isTakeaway } : i) })
  },

  setDiscount: (type, value, reason) => set({ discount: { type, value: Number(value || 0), reason } }),

  subtotal: () => get().items.reduce((sum, item) => {
    const price = Number(item.price || 0);
    const qty   = Number(item.qty || 0);
    const modExtra = (item.modifiers || []).reduce((s, m) => s + Number(m.extra_price || 0), 0);
    return sum + (price + modExtra) * qty;
  }, 0),

  promoAmount: () => {
    if (!get().promoActive || get().promoRate <= 0 || get().orderType === 'gozem') return 0;
    const eligibleSub = get().items.reduce((sum, item) => {
        const categories = get().promoCategories || [];
        if (!categories.includes(item.categoryDestination)) return sum;
        if (item.isPromoExempt) return sum;
        const price = Number(item.price || 0);
        const qty   = Number(item.qty || 0);
        const modExtra = (item.modifiers || []).reduce((s, m) => s + Number(m.extra_price || 0), 0);
        return sum + (price + modExtra) * qty;
    }, 0);
    return Math.round(eligibleSub * get().promoRate / 100);
  },

  manualDiscountAmount: () => {
    const sub = get().subtotal()
    if (get().orderType === 'gozem' && get().gozemRate > 0) {
        return Math.round(sub * get().gozemRate / 100)
    }
    const disc = get().discount
    if (disc.type) {
        return disc.type === 'percent'
            ? Math.round(sub * disc.value / 100)
            : Number(disc.value)
    }
    return 0
  },

  discountAmount: () => {
    const sub = get().subtotal()
    // On retourne la promo globale + la remise Gozem (si applicable)
    const totalDisc = get().promoAmount() + get().manualDiscountAmount()
    return Math.min(totalDisc, sub)
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
    notes:    '', // On ne recharge pas les anciens commentaires pour éviter de les renvoyer en cuisine
    discount: { 
        type: order.discount_type, 
        value: Number(order.discount_value || 0), 
        reason: order.discount_reason || '' 
    },
    vatRate:  Number(order.vat_rate || 0),
    orderType: order.type,
    items: (order.items || []).map(item => ({
        id:        item.id,
        key:       item.id ? `item-${item.id}` : `temp-${item.product_id}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        productId: item.product_id,
        name:      item.product?.name || item.notes || 'Article',
        price:     Number(item.unit_price),
        qty:       Number(item.quantity),
        modifiers: (item.modifiers || []).map(m => ({
            id:          m.modifier_id || m.id,
            name:        m.modifier?.name || m.name,
            extra_price: Number(m.extra_price || 0)
        })),
        note:      item.notes || '',
        status:    item.status,
        isTakeaway:!!item.is_takeaway,
        categoryDestination: item.product?.category?.destination || 'kitchen',
        isPromoExempt: !!item.product?.category?.is_promo_exempt,
        cancellations: item.cancellations || [],
    }))
  }),
}))

export default useCartStore
