import apiClient from './client'

export const settingsApi = {
  get:    ()    => apiClient.get('/settings'),
  update: (d)   => apiClient.put('/settings', d),
  config: ()    => apiClient.get('/settings/config'),
  updateConfig: (d) => apiClient.put('/settings/config', d),
}
