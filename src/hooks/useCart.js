import { useCartStore } from '@/stores/cartStore'

export function useCart() {
  const store = useCartStore()

  return {
    items:    store.items,
    tableId:  store.tableId,
    orderId:  store.orderId,
    covers:   store.covers,
    notes:    store.notes,
    discount: store.discount,
    orderType: store.orderType,
    gozemRate: store.gozemRate,
    promoActive: store.promoActive,
    promoRate: store.promoRate,

    addItem:      store.addItem,
    updateQty:    store.updateQty,
    removeItem:   store.removeItem,
    setTable:     store.setTable,
    setCovers:    store.setCovers,
    setNotes:     store.setNotes,
    setDiscount:  store.setDiscount,
    toggleTakeaway: store.toggleTakeaway,
    clear:        store.clear,

    subtotal:       store.subtotal(),
    discountAmount: store.discountAmount(),
    vatAmount:      store.vatAmount(),
    vatRate:        store.vatRate,
    total:          store.total(),

    itemCount: store.items.reduce((s, i) => s + i.qty, 0),
    isEmpty:   store.items.length === 0,
  }
}

export default useCart
