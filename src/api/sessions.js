import apiClient from './client'

export const sessionsApi = {
  current: (params)         => apiClient.get('/cash-sessions/current', { params }),
  open:    (amount, userId) => apiClient.post('/cash-sessions/open', {
    opening_amount: amount,
    ...(userId && userId !== 'all' ? { user_id: Number(userId) } : {}),
  }),
  close:   (id, d)          => apiClient.post(`/cash-sessions/${id}/close`, d),
  list:    (params)         => apiClient.get('/cash-sessions', { params }),
}
