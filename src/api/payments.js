import apiClient from './client'

export const paymentsApi = {
  pay:          (data) => apiClient.post('/payments', data),
  split:        (data) => apiClient.post('/payments/split', data),
  currentSession: ()   => apiClient.get('/cash-sessions/current'),
  openSession:  (data) => apiClient.post('/cash-sessions/open', data),
  closeSession: (id, d) => apiClient.post(`/cash-sessions/${id}/close`, d),
  sessions:     (params) => apiClient.get('/cash-sessions', { params }),
}
