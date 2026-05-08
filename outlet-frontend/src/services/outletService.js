import API, { ENDPOINTS } from '../api/apiClient';

export const getOutlets   = (page = 0, size = 1000, search = "", signal) => API.get(ENDPOINTS.outlets, { params: { page, size, ...(search ? { keyword: search } : {}) }, signal });
export const createOutlet = (data)     => API.post(ENDPOINTS.outlets, data);
export const updateOutlet = (id, data) => API.put(`${ENDPOINTS.outlets}/${id}`, data);
export const deleteOutlet = (id)       => API.delete(`${ENDPOINTS.outlets}/${id}`);

export const outletService = {
    getAll: getOutlets,
    getOutlets,
    createOutlet,
    updateOutlet,
    deleteOutlet
};
