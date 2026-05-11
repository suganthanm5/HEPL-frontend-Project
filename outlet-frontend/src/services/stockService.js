import apiClient from '../api/apiClient';

export const stockService = {
  /** Get stock for a specific outlet */
  getByOutlet: async (outletId) => {
    const res = await apiClient.get(`/api/stock/outlet/${outletId}`);
    return res.data?.data || res.data || [];
  },

  /** Get all stock entries */
  getAll: async () => {
    const res = await apiClient.get('/api/stock');
    return res.data?.data || res.data || [];
  },

  /** Transfer stock to outlet */
  transfer: async (data) => {
    // data: { outletId, productId, batchId, quantity }
    const res = await apiClient.post('/api/stock/transfer', data);
    return res.data?.data || res.data;
  },

  /** Get transaction history */
  getTransactions: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await apiClient.get(`/api/stock/transactions${query ? '?' + query : ''}`);
    return res.data?.data || res.data || [];
  },
};
