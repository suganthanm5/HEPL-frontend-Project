import axios from 'axios';

export const ENDPOINTS = {
  login:     '/api/v1/auth/login',
  register:  '/api/v1/auth/register',
  validate:  '/api/v1/auth/validate',
  divisions: '/api/divisions',
  locations: '/api/locations',
  outlets:   '/api/outlets',
  products:  '/api/products',
};

const API = axios.create({
  baseURL: '',
  headers: {
    'Content-Type': 'application/json',
  },
});

const getCookie = (name) => {
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
};

const deleteCookie = (name) => {
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
};

API.interceptors.request.use((config) => {
  const token = getCookie('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      deleteCookie('token');
      deleteCookie('username');
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

export default API;
