import apiClient from './client'

export const productsApi = {
  list:            (p)    => apiClient.get('/products', { params: p }),
  categories:      ()     => apiClient.get('/categories'),
  categoriesFlat:  ()     => apiClient.get('/categories-flat'),
  publicMenu:      (slug) => slug ? apiClient.get(`/menu/${slug}`) : apiClient.get('/menu-default'),
  create:          (d)    => apiClient.post('/products', d),
  update:          (id,d) => {
    if (d instanceof FormData) {
        d.append('_method', 'PUT');
        return apiClient.post(`/products/${id}`, d);
    }
    return apiClient.put(`/products/${id}`, d);
  },
  delete:          (id)   => apiClient.delete(`/products/${id}`),
  toggleAvailable: (id)   => apiClient.patch(`/products/${id}/toggle-available`),
  reorder:         (d)    => apiClient.post('/products/reorder', d),
  qrUrl:           (tid)  => apiClient.get(`/qr/${tid}/url`),
  qrImage:         (tid)  => apiClient.get(`/qr/${tid}`, { responseType: 'blob' }),
  // Public ordering
  publicSubmitOrder: (slug, data) => apiClient.post(`/menu/${slug}/orders`, data),
  availableTables:   (slug)       => apiClient.get(`/menu/${slug}/tables`),
}
