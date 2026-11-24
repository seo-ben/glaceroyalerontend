import apiClient from './client'

export const categoriesApi = {
  list:     ()     => apiClient.get('/categories'),
  flat:     ()     => apiClient.get('/categories-flat'),
  create:   (d)    => apiClient.post('/categories', d),
  update:   (id,d) => apiClient.put(`/categories/${id}`, d),
  delete:   (id)   => apiClient.delete(`/categories/${id}`),
  reorder:  (d)    => apiClient.post('/categories/reorder', d),
}
