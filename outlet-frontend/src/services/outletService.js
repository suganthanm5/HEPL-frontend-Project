import API, { ENDPOINTS } from '../api/apiClient';

const getOutlets = async (page = 0, size = 1000, search = "", signal) => {
  const res = await API.get(ENDPOINTS.outlets, { params: { page, size, ...(search ? { keyword: search } : {}) }, signal });
  const pageData = res.data?.data;
  return pageData || { content: [], totalPages: 0, totalElements: 0 };
};

const createOutlet = async (data) => {
  const res = await API.post(ENDPOINTS.outlets, data);
  return res.data?.data || res.data;
};

const updateOutlet = async (id, data) => {
  const res = await API.put(`${ENDPOINTS.outlets}/${id}`, data);
  return res.data?.data || res.data;
};

const deleteOutlet = async (id) => {
  await API.delete(`${ENDPOINTS.outlets}/${id}`);
};

export const outletService = {
    getAll: getOutlets,
    getOutlets,
    createOutlet,
    updateOutlet,
    deleteOutlet
};

export { getOutlets, createOutlet, updateOutlet, deleteOutlet };
