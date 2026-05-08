import apiClient from '../api/apiClient';

export const userService = {
  getAllUsers: async (page = 0, size = 10) => {
    const response = await apiClient.get(`/api/users?page=${page}&size=${size}`);
    return response.data;
  },

  createUser: async (userData) => {
    const response = await apiClient.post('/api/users', userData);
    return response.data;
  },

  updateUserRole: async (id, role) => {
    const response = await apiClient.patch(`/api/users/${id}/role?role=${role}`);
    return response.data;
  },

  deleteUser: async (id) => {
    await apiClient.delete(`/api/users/${id}`);
  }
};
