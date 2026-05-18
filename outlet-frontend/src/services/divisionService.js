import API, { ENDPOINTS } from '../api/apiClient';

/**
 * Maps backend DivisionResponse to frontend Division object
 * Backend Response: { id, name, products, createdAt, updatedAt, createdBy, updatedBy }
 */
const mapDivisionResponse = (division) => {
  if (!division) return null;
  return {
    id: division.id,
    name: division.name,
    products: Array.isArray(division.products) ? division.products : [],
    createdAt: division.createdAt,
    updatedAt: division.updatedAt,
    createdBy: division.createdBy,
    updatedBy: division.updatedBy,
  };
};

/**
 * Fetch divisions with pagination and search
 * Backend Response: ApiResponse { httpStatus, message, data: Page { content, totalPages, totalElements } }
 */
const getDivisions = async (page = 0, size = 10, keyword = "", signal) => {
  try {
    const res = await API.get(ENDPOINTS.divisions, { 
      params: { 
        page, 
        size, 
        ...(keyword ? { keyword } : {}) 
      }, 
      signal 
    });
    
    const pageData = res.data?.data;
    
    if (!pageData) {
      return { content: [], totalPages: 0, totalElements: 0 };
    }
    
    // Map all divisions in content array
    const mappedContent = (pageData.content || []).map(mapDivisionResponse);
    
    return {
      content: mappedContent,
      totalPages: pageData.totalPages || 0,
      totalElements: pageData.totalElements || 0,
      currentPage: pageData.currentPage || page,
      pageSize: pageData.pageSize || size,
    };
  } catch (error) {
    console.error('getDivisions error:', error);
    throw error;
  }
};

/**
 * Create a new division
 * Backend Response: ApiResponse { httpStatus, message, data: DivisionResponse }
 */
const createDivision = async (data) => {
  const res = await API.post(ENDPOINTS.divisions, data);
  const divisionData = res.data?.data || res.data;
  return mapDivisionResponse(divisionData);
};

/**
 * Update an existing division
 * Backend Response: ApiResponse { httpStatus, message, data: DivisionResponse }
 */
const updateDivision = async (id, data) => {
  const res = await API.put(`${ENDPOINTS.divisions}/${id}`, data);
  const divisionData = res.data?.data || res.data;
  return mapDivisionResponse(divisionData);
};

/**
 * Delete a division (soft delete)
 * Backend Response: ApiResponse { httpStatus, message }
 */
const deleteDivision = async (id) => {
  await API.delete(`${ENDPOINTS.divisions}/${id}`);
};

/**
 * Get division by ID with all products
 * Backend Response: ApiResponse { httpStatus, message, data: DivisionResponse }
 */
const getDivisionById = async (id, signal) => {
  try {
    const res = await API.get(`${ENDPOINTS.divisions}/${id}`, { signal });
    const divisionData = res.data?.data || res.data;
    return mapDivisionResponse(divisionData);
  } catch (error) {
    console.error('getDivisionById error:', error);
    throw error;
  }
};

const bulkCreateDivisions = async (names) => {
  const res = await API.post(`${ENDPOINTS.divisions}/bulk`, names.map((name) => ({ name })));
  const result = res.data?.data;
  return (result?.results || []).map((r) => ({
    name: r.name,
    success: r.success,
    error: r.error || "",
  }));
};

export { getDivisions, createDivision, updateDivision, deleteDivision, getDivisionById, mapDivisionResponse, bulkCreateDivisions };
