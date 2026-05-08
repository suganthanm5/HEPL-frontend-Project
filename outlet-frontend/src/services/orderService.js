import apiClient from '../api/apiClient';

export const orderService = {
  /** Get all orders */
  getAll: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await apiClient.get(`/api/orders${query ? '?' + query : ''}`);
    return res.data;
  },

  /** Get single order */
  getById: async (id) => {
    const res = await apiClient.get(`/api/orders/${id}`);
    return res.data;
  },

  /** Create order */
  create: async (data) => {
    // Format to match backend entities
    const formatted = {
      outlet: { id: data.outletId },
      items: data.items.map(it => ({
        product: { id: it.productId },
        batch: { id: it.batchId },
        quantity: it.quantity,
        price: it.price
      }))
    };
    const res = await apiClient.post('/api/orders', formatted);
    return res.data;
  },

  /** Update order status */
  updateStatus: async (id, status) => {
    const res = await apiClient.patch(`/api/orders/${id}/status?status=${status}`);
    return res.data;
  },

  /** Delete order */
  delete: async (id) => {
    await apiClient.delete(`/api/orders/${id}`);
  },
};
