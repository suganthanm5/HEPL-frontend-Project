import axios from 'axios';

export const ENDPOINTS = {
  login: '/api/v1/auth/login',
  register: '/api/v1/auth/register',
  validate: '/api/v1/auth/validate',
  divisions: '/api/divisions',
  locations: '/api/locations',
  outlets: '/api/outlets',
  products: '/api/products',
  profile: '/api/users/profile',
  changePassword: '/api/users/change-password',
  uploadPicture: '/api/users/upload-picture'
};

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 60000,
  withCredentials: false,
  validateStatus: function (status) {
    return status < 500;
  }
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  const url = config.url || '';
  if (token && !url.includes('/login') && !url.includes('/register')) {
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
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('username');
      localStorage.removeItem('email');
      localStorage.removeItem('role');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default API;