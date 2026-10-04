import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register' && window.location.pathname !== '/') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const get = <T>(url: string, params?: any) => api.get<{ success: boolean; data: T }>(url, { params }).then(r => r.data.data);
export const post = <T>(url: string, data?: any) => api.post<{ success: boolean; data: T }>(url, data).then(r => r.data.data);
export const put = <T>(url: string, data?: any) => api.put<{ success: boolean; data: T }>(url, data).then(r => r.data.data);
export const del = <T>(url: string) => api.delete<{ success: boolean; data: T }>(url).then(r => r.data.data);

export default api;
