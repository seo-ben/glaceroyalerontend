import apiClient from './client'

export const authApi = {
  login:          (data)  => apiClient.post('/auth/login', data),
  loginPin:       (data)  => apiClient.post('/auth/login-pin', data),
  logout:         ()      => apiClient.post('/auth/logout'),
  me:             ()      => apiClient.get('/auth/me'),
  changePassword: (data)  => apiClient.put('/auth/change-password', data),
}
