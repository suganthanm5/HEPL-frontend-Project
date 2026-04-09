import API, { ENDPOINTS } from '../api/apiClient';

export const getOutlets   = (page = 0, size = 10, search = "") => API.get(ENDPOINTS.outlets, { params: { page, size, ...(search ? { search } : {}) } });
export const createOutlet = (data)     => API.post(ENDPOINTS.outlets, data);
export const updateOutlet = (id, data) => API.put(`${ENDPOINTS.outlets}/${id}`, data);
export const deleteOutlet = (id)       => API.delete(`${ENDPOINTS.outlets}/${id}`);
