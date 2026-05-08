import apiClient from '../api/apiClient';

export const batchService = {
  /** Get all batches with optional filtering */
  getAll: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await apiClient.get(`/api/batches${query ? '?' + query : ''}`);
    return res.data;
  },

  /** Get single batch */
  getById: async (id) => {
    const res = await apiClient.get(`/api/batches/${id}`);
    return res.data;
  },

  /** Create a new batch */
  create: async (data) => {
    // Format data to match backend entity structure
    const formattedData = {
      ...data,
      product: { id: data.productId }
    };
    const res = await apiClient.post('/api/batches', formattedData);
    return res.data;
  },

  /** Update batch */
  update: async (id, data) => {
    const res = await apiClient.put(`/api/batches/${id}`, data);
    return res.data;
  },

  /** Delete batch */
  delete: async (id) => {
    await apiClient.delete(`/api/batches/${id}`);
  },
};
