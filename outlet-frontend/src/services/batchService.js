import apiClient from '../api/apiClient';

export const batchService = {

  getAll: async (params = {}, signal) => {
    const res = await apiClient.get('/api/batches', { params, signal });
    return res.data?.data || res.data || [];
  },

  getById: async (id) => {
    const res = await apiClient.get(`/api/batches/${id}`);
    return res.data;
  },

  create: async (data) => {
    // Backend expects ProductBatchRequest { productId, batchNo, ... }
    const res = await apiClient.post('/api/batches', data);
    return res.data;
  },

  
  update: async (id, data) => {
    // Ensure productId is present if it's nested in a product object
    const formattedData = {
      ...data,
      productId: data.productId || data.product?.id
    };
    const res = await apiClient.put(`/api/batches/${id}`, formattedData);
    return res.data;
  },

  
  delete: async (id) => {
    await apiClient.delete(`/api/batches/${id}`);
  },
};
