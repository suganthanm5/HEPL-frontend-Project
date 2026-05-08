import axios from 'axios';

export const ENDPOINTS = {
  login:     '/api/v1/auth/login',
  register:  '/api/v1/auth/register',
  validate:  '/api/v1/auth/validate',
  divisions: '/api/divisions',
  locations: '/api/locations',
  outlets:   '/api/outlets',
  products:  '/api/products'
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

const getCookie = (name) => {
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
};

const deleteCookie = (name) => {
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
};

API.interceptors.request.use((config) => {
  const token = getCookie('token') || localStorage.getItem('token');
  const url = config.url || '';
  if (token && !url.includes('/login') && !url.includes('/register')) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

API.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401 && window.location.pathname !== '/') {
      deleteCookie('token');
      deleteCookie('username');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default API;