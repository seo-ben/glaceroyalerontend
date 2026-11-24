export const ROLES = {
  ADMIN:   'admin',
  MANAGER: 'manager',
  CASHIER: 'cashier',
  WAITER:  'waiter',
  COOK:    'cook',
  DRIVER:  'driver',
}

export const ORDER_TYPES = {
  DINE_IN:  'dine_in',
  TAKEAWAY: 'takeaway',
  DELIVERY: 'delivery',
}

export const PAYMENT_METHODS = [
  { value: 'cash',         label: 'Espèces',        icon: '💵' },
  { value: 'card',         label: 'Carte bancaire',  icon: '💳' },
  { value: 'wave',         label: 'Wave',            icon: '📱' },
  { value: 'moov',         label: 'Moov',            icon: '📲' },
  { value: 'mixx',         label: 'Mixx',            icon: '📲' },
  { value: 'orange_money', label: 'Orange',          icon: '📲' },
  { value: 'momo',         label: 'MoMo',            icon: '📲' },
]

export const KITCHEN_ALERT_MINUTES = 15
export const STOCK_ALERT_THRESHOLD = 1.0
