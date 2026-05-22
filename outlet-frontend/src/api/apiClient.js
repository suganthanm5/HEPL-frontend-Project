import axios from 'axios';
import { getCookie, deleteCookie } from '../utils/cookieUtils';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || window.location.origin,
  timeout: 10000,
});

API.interceptors.request.use((config) => {
  const token = getCookie('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && window.location.pathname !== '/') {
      deleteCookie('token');
      deleteCookie('user');
      deleteCookie('username');
      deleteCookie('email');
      deleteCookie('role');
      deleteCookie('outletId');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export const ENDPOINTS = {
  login: '/api/v1/auth/login',
  register: '/api/v1/auth/register',
  validate: '/api/v1/auth/validate',
  profile: '/api/users/profile',
  changePassword: '/api/users/change-password',
  uploadPicture: '/api/users/upload-picture',
  products: '/api/products',
  divisions: '/api/divisions',
  outlets: '/api/outlets',
  locations: '/api/locations',
};

export default API;