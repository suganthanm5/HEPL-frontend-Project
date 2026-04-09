import API, { ENDPOINTS } from '../api/apiClient';

export const loginUser     = (data) => API.post(ENDPOINTS.login, data);
export const registerUser  = (data) => API.post(ENDPOINTS.register, data);
export const validateToken = ()     => API.get(ENDPOINTS.validate);
