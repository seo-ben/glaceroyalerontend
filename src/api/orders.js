import apiClient from './client'

export const ordersApi = {
  list:             (params) => apiClient.get('/orders', { params }),
  activeCounts:     ()       => apiClient.get('/orders/active-counts'),
  activePending:    ()       => apiClient.get('/orders/active-pending'),
  show:             (id)     => apiClient.get(`/orders/${id}`),
  create:           (data)   => apiClient.post('/orders', data),
  currentByTable:   (tid)    => apiClient.get(`/orders/table/${tid}/current`),
  updateItems:      (id, d)  => apiClient.put(`/orders/${id}/items`, d),
  addItems:         (id, d)  => apiClient.post(`/orders/${id}/add-items`, d),
  sendToKitchen:    (id, d)  => apiClient.post(`/orders/${id}/send-to-kitchen`, d),
  applyDiscount:    (id, d)  => apiClient.put(`/orders/${id}/discount`, d),
  updateStatus:     (id, d)  => apiClient.put(`/orders/${id}/status`, d),
  reopen:           (id)     => apiClient.post(`/orders/${id}/reopen`),
}
