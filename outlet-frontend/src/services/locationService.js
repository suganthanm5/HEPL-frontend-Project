import API, { ENDPOINTS } from '../api/apiClient';

export const getLocations   = (page = 0, size = 10, search = "", signal) => API.get(ENDPOINTS.locations, { params: { page, size, ...(search ? { search } : {}) }, signal });
export const createLocation = (data)     => API.post(ENDPOINTS.locations, data);
export const updateLocation = (id, data) => API.put(`${ENDPOINTS.locations}/${id}`, data);
export const deleteLocation = (id)       => API.delete(`${ENDPOINTS.locations}/${id}`);
