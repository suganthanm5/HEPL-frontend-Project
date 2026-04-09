import API, { ENDPOINTS } from '../api/apiClient';

export const getProductsByDivision = (divisionId) => API.get(`${ENDPOINTS.divisions}/${divisionId}`).then(res => ({ data: res.data.data?.products || res.data?.products || [] }));
export const createProduct         = (divisionId, data) => API.post(ENDPOINTS.products, { ...data, divisionId, division: { id: divisionId } });
export const addProduct            = (data) => API.post(ENDPOINTS.products, data);
export const updateProduct         = (id, data) => API.put(`${ENDPOINTS.products}/${id}`, data);
export const deleteProduct         = (id)       => API.delete(`${ENDPOINTS.products}/${id}`);
