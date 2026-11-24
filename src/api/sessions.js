import apiClient from './client'

export const sessionsApi = {
  current: ()        => apiClient.get('/cash-sessions/current'),
  open:    (amount)  => apiClient.post('/cash-sessions/open', { opening_amount: amount }),
  close:   (id, d)   => apiClient.post(`/cash-sessions/${id}/close`, d),
  list:    (params)  => apiClient.get('/cash-sessions', { params }),
}
