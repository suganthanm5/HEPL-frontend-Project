import apiClient from '../api/apiClient';

export const batchService = {
  /** Get all batches with optional filtering */
  getAll: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await apiClient.get(`/api/batches${query ? '?' + query : ''}`);
    // Backend returns: { httpStatus, message, data: [...] }
    return res.data?.data || res.data || [];
  },

  /** Get single batch */
  getById: async (id) => {
    const res = await apiClient.get(`/api/batches/${id}`);
    return res.data;
  },

  /** Create a new batch */
  create: async (data) => {
    // Backend expects ProductBatchRequest { productId, batchNo, ... }
    const res = await apiClient.post('/api/batches', data);
    return res.data;
  },

  /** Update batch */
  update: async (id, data) => {
    // Ensure productId is present if it's nested in a product object
    const formattedData = {
      ...data,
      productId: data.productId || data.product?.id
    };
    const res = await apiClient.put(`/api/batches/${id}`, formattedData);
    return res.data;
  },

  /** Delete batch */
  delete: async (id) => {
    await apiClient.delete(`/api/batches/${id}`);
  },
};
