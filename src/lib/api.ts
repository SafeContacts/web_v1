import axios from 'axios';

// 1) Create an Axios instance
const api = axios.create({
  baseURL: '/',             // your Next.js root
  headers: { 'Content-Type': 'application/json' }
});

// 2) Add a request interceptor to attach the token
api.interceptors.request.use(config => {
  // Read the token from localStorage (or wherever you stored it)
  const token = typeof window !== 'undefined'
    ? localStorage.getItem('accessToken')
    : null;

  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log(token)
  }
  return config;
});

export default api;

