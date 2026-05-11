import API, { ENDPOINTS } from '../api/apiClient';

const getDivisions = async (page = 0, size = 10, search = "", signal) => {
  const res = await API.get(ENDPOINTS.divisions, { params: { page, size, ...(search ? { search } : {}) }, signal });
  // res.data is ApiResponse { httpStatus, message, data: Page { content: [...], totalPages, ... } }
  const pageData = res.data?.data;
  // Return the Page object with content array
  return pageData || { content: [], totalPages: 0, totalElements: 0 };
};

const createDivision = async (data) => {
  const res = await API.post(ENDPOINTS.divisions, data);
  return res.data?.data || res.data;
};

const updateDivision = async (id, data) => {
  const res = await API.put(`${ENDPOINTS.divisions}/${id}`, data);
  return res.data?.data || res.data;
};

const deleteDivision = async (id) => {
  await API.delete(`${ENDPOINTS.divisions}/${id}`);
};

export { getDivisions, createDivision, updateDivision, deleteDivision };
