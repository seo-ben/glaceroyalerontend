import { format, formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

// Formatage montant
export const formatAmount = (amount, currency = 'FCFA', position = 'after') => {
  const formatted = new Intl.NumberFormat('fr-FR').format(Math.round(amount))
  return position === 'before' ? `${currency} ${formatted}` : `${formatted} ${currency}`
}

// Formatage date (Lecture LITTÉRALE de la DB pour éviter tout décalage)
export const formatDate = (date) => {
  if (!date) return '-'
  const dStr = String(date)
  if (dStr.includes('-')) {
    const datePart = dStr.split(/[T ]/)[0]
    const parts = datePart.split('-')
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`
  }
  return dStr
}

export const formatDateTime = (date) => {
  if (!date) return '-'
  const dStr = String(date)
  if (dStr.includes('-') && (dStr.includes('T') || dStr.includes(' '))) {
    const datePart = dStr.split(/[T ]/)[0]
    const timePart = dStr.split(/[T ]/)[1].split('.')[0]
    const d = datePart.split('-')
    const t = timePart.split(':')
    return `${d[2]}/${d[1]}/${d[0]} ${t[0]}:${t[1]}`
  }
  return dStr
}

export const formatTime = (date) => {
  if (!date) return '-'
  const dStr = String(date)
  if (dStr.includes('T') || dStr.includes(' ')) {
    const timePart = dStr.split(/[T ]/)[1].split('.')[0]
    const t = timePart.split(':')
    return `${t[0]}:${t[1]}`
  }
  return dStr
}

export const timeAgo = (date) =>
  formatDistanceToNow(new Date(date), { addSuffix: true, locale: fr })

// Labels
export const paymentMethodLabel = (method) => ({
  cash:         'Espèces',
  card:         'Carte bancaire',
  wave:         'Wave',
  moov:         'Moov Money',
  mixx:         'Mixx',
  orange_money: 'Orange Money',
  momo:         'Mobile Money',
  other:        'Autre',
}[method] ?? method)

export const orderStatusLabel = (status) => ({
  open:               'Ouvert',
  sent_to_kitchen:    'En cuisine',
  partially_served:   'Partiellement servi',
  served:             'Servi',
  paid:               'Payé',
  cancelled:          'Annulé',
  cancelling:         'Annulation en cours',
  collected:          'Récupéré',
}[status] ?? status)

export const orderTypeLabel = (type) => ({
  dine_in:  'Sur place',
  takeaway: 'À emporter',
  delivery: 'Livraison',
  gozem:    'Gozem',
  cakes:    'Gâteaux',
  cake:     'Gâteau',
}[type] ?? type)

export const orderStatusColor = (status) => ({
  open:               'bg-white text-black border-2 border-black',
  sent_to_kitchen:    'bg-white text-black border border-black border-dashed',
  partially_served:   'bg-white text-black border-2 border-black italic',
  served:             'bg-black text-white border-2 border-black',
  paid:               'bg-black text-white border-2 border-black font-black',
  cancelled:          'bg-white text-black border-2 border-black line-through opacity-50',
  cancelling:         'bg-white text-black border-4 border-black animate-pulse',
  collected:          'bg-black text-white border-2 border-black',
}[status] ?? 'bg-white text-black border border-black')

export const tableStatusColor = (status) => ({
  free:     'border-green-500 bg-green-500/10 dark:bg-green-500/20',
  occupied: 'border-red-500 bg-red-500/10 dark:bg-red-500/20',
  waiting:  'border-orange-500 bg-orange-500/10 dark:bg-orange-500/20',
  reserved: 'border-blue-500 bg-blue-500/10 dark:bg-blue-500/20',
}[status] ?? '')

export const itemStatusColor = (status) => ({
  pending:    'bg-white text-black border border-black',
  preparing:  'bg-white text-black border-2 border-black italic',
  done:       'bg-black text-white',
  served:     'bg-black text-white font-bold',
  cancelled:  'bg-white text-black border border-black line-through opacity-40',
  cancelling: 'bg-white text-black border-2 border-black animate-pulse',
}[status] ?? 'bg-white text-black')
