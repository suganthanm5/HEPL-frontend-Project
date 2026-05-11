import apiClient from '../api/apiClient';

export const orderService = {
  /** Get all orders */
  getAll: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await apiClient.get(`/api/orders${query ? '?' + query : ''}`);
    return res.data?.data || [];
  },

  /** Get single order */
  getById: async (id) => {
    const res = await apiClient.get(`/api/orders/${id}`);
    return res.data?.data || res.data;
  },

  /** Create order */
  create: async (data) => {
    const formatted = {
      outletId: data.outletId,
      items: data.items.map(it => ({
        productId: it.productId,
        batchId: it.batchId,
        quantity: it.quantity
      }))
    };
    const res = await apiClient.post('/api/orders', formatted);
    return res.data?.data || res.data;
  },

  /** Update order status */
  updateStatus: async (id, status) => {
    const res = await apiClient.patch(`/api/orders/${id}/status?status=${status}`);
    return res.data?.data || res.data;
  },

  /** Delete order */
  delete: async (id) => {
    await apiClient.delete(`/api/orders/${id}`);
  },
};
