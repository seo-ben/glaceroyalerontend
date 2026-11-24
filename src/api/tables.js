import apiClient from './client'

export const tablesApi = {
  floors:       ()       => apiClient.get('/floors'),
  floorTables:  (fid)   => apiClient.get(`/floors/${fid}/tables`),
  updateStatus: (id, d) => apiClient.put(`/tables/${id}/status`, d),
  transfer:     (id, d) => apiClient.post(`/tables/${id}/transfer`, d),
  merge:        (d)     => apiClient.post('/tables/merge', d),
  assign:       (id, d) => apiClient.put(`/tables/${id}/assign`, d),
  reserve:      (id, d) => apiClient.post(`/tables/${id}/reserve`, d),
  updateLayout: (id, d) => apiClient.put(`/tables/${id}/layout`, d),
  allTables:    ()     => apiClient.get('/tables'),
}
