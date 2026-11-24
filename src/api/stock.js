import apiClient from './client'

export const stockApi = {
  ingredients:  (p)    => apiClient.get('/ingredients', { params: p }),
  alerts:       ()     => apiClient.get('/stock/alerts'),
  value:        ()     => apiClient.get('/stock/value'),
  movement:     (d)    => apiClient.post('/stock/movements', d),
  movements:    (id,p) => apiClient.get(`/ingredients/${id}/movements`, { params: p }),
  recipe:       (pid)  => apiClient.get(`/recipes/${pid}`),
  saveRecipe:   (d)    => apiClient.post('/recipes', d),
  create:       (d)    => apiClient.post('/ingredients', d),
  update:       (id,d) => apiClient.put(`/ingredients/${id}`, d),
  downloadPdf:  ()     => apiClient.get('/stock/pdf', { responseType: 'blob' }),
}
