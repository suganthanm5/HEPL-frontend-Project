import API, { ENDPOINTS } from '../api/apiClient';

export const getDivisions   = (page = 0, size = 10, search = "", signal) => API.get(ENDPOINTS.divisions, { params: { page, size, ...(search ? { search } : {}) }, signal });
export const createDivision = (data)     => API.post(ENDPOINTS.divisions, data);
export const updateDivision = (id, data) => API.put(`${ENDPOINTS.divisions}/${id}`, data);
export const deleteDivision = (id)       => API.delete(`${ENDPOINTS.divisions}/${id}`);
