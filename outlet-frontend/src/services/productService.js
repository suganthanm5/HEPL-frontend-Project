import API, { ENDPOINTS } from '../api/apiClient';

const getProducts = async (page = 0, size = 10, signal) => {
  const res = await API.get(ENDPOINTS.products, { params: { page, size }, signal });
  // res.data is ApiResponse { httpStatus, message, data: Page { content: [...], totalPages, ... } }
  const pageData = res.data?.data;
  // Extract content array from Page object
  return Array.isArray(pageData?.content) ? pageData.content : [];
};

const getProductsByDivision = (divisionId, signal) => 
  API.get(`${ENDPOINTS.divisions}/${divisionId}`, { signal })
    .then(res => {
      const divData = res.data?.data;
      return { data: divData?.products || [] };
    });

const createProduct = (divisionId, data) => 
  API.post(ENDPOINTS.products, { ...data, divisionId, division: { id: divisionId } });

const addProduct = (data) => API.post(ENDPOINTS.products, data);

const updateProduct = (id, data) => API.put(`${ENDPOINTS.products}/${id}`, data);

const deleteProduct = (id) => API.delete(`${ENDPOINTS.products}/${id}`);

export const productService = {
    getAll: getProducts,
    getProducts,
    getProductsByDivision,
    createProduct,
    addProduct,
    updateProduct,
    deleteProduct
};

export {
  getProducts,
  getProductsByDivision,
  createProduct,
  addProduct,
  updateProduct,
  deleteProduct
};
