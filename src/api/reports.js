import apiClient from './client'

export const reportsApi = {
  dashboard:   ()      => apiClient.get('/reports/dashboard'),
  sales:       (p)     => apiClient.get('/reports/sales', { params: p }),
  topProducts: (p)     => apiClient.get('/reports/top-products', { params: p }),
  byWaiter:    (p)     => apiClient.get('/reports/by-waiter', { params: p }),
  byCategory:      (p)     => apiClient.get('/reports/by-category', { params: p }),
  cashSummary:     (p)     => apiClient.get('/reports/cash-summary', { params: p }),
  departmentSales:    (p) => apiClient.get('/reports/department-sales', { params: p }),
  departmentSalesPdf: (p) => apiClient.get('/reports/department-sales/pdf', { params: p, responseType: 'blob' }),
  dailyAnalysisPdf:      (p) => apiClient.get('/reports/daily-analysis/pdf', { params: p, responseType: 'blob' }),
}
