import API, { ENDPOINTS } from '../api/apiClient';

export const loginUser = async (data) => {
  try {
    // Try direct fetch with different CORS modes
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(data),
      mode: 'cors',
      credentials: 'omit'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const responseData = await response.json();
    
    return {
      data: responseData,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    console.error('Direct fetch failed, trying axios:', error.message);
    // Fallback to axios
    return API.post(ENDPOINTS.login, data);
  }
};
export const registerUser  = (data) => API.post(ENDPOINTS.register, data);
export const validateToken = ()     => API.get(ENDPOINTS.validate);
