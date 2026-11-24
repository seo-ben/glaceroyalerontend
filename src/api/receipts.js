import apiClient from './client'

export const receiptsApi = {
  show:      (id)  => apiClient.get(`/receipts/${id}`),
  pdf:       (id)  => apiClient.get(`/receipts/${id}/pdf`, { responseType: 'blob' }),
  html:        (id)  => apiClient.get(`/receipts/${id}/html`),
  invoiceHtml: (id)  => apiClient.get(`/receipts/${id}/a4`),
  sendSms:     (id, d) => apiClient.post(`/receipts/${id}/send-sms`, d),
  sendEmail: (id, d) => apiClient.post(`/receipts/${id}/send-email`, d),
  printNetwork: (id) => apiClient.post(`/receipts/${id}/print-network`),
  printCakeNetwork: (id) => apiClient.post(`/cake-orders/${id}/print-network`),
  printTabNetwork: (id) => apiClient.post(`/customer-tabs/${id}/print-network`),
  bulkPrintNetwork: (ids) => apiClient.post(`/receipts/bulk-network`, { order_ids: ids }),
}
