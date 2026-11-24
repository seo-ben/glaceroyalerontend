import apiClient from './client'

export const notificationsApi = {
  list: () => apiClient.get('/notifications'),
}
