import API, { ENDPOINTS } from '../api/apiClient';

export const getProducts           = (page = 0, size = 10, signal) => API.get(ENDPOINTS.products, { params: { page, size }, signal });
export const getProductsByDivision = (divisionId, signal) => API.get(`${ENDPOINTS.divisions}/${divisionId}`, { signal }).then(res => ({ data: res.data.data?.products || res.data?.products || [] }));
export const createProduct         = (divisionId, data) => API.post(ENDPOINTS.products, { ...data, divisionId, division: { id: divisionId } });
export const addProduct            = (data) => API.post(ENDPOINTS.products, data);
export const updateProduct         = (id, data) => API.put(`${ENDPOINTS.products}/${id}`, data);
export const deleteProduct         = (id)       => API.delete(`${ENDPOINTS.products}/${id}`);

export const productService = {
    getAll: getProducts,
    getProducts,
    getProductsByDivision,
    createProduct,
    addProduct,
    updateProduct,
    deleteProduct
};
