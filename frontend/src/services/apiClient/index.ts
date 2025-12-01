import axios from 'axios';

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const apiClient = {
  get: (url: string, params?: any) => instance.get(url, { params }),
  post: (url: string, data?: any) => instance.post(url, data),
  put: (url: string, data?: any) => instance.put(url, data),
  delete: (url: string) => instance.delete(url),
  uploadFile: (url: string, file: File, metadata?: any) => {
    const formData = new FormData();
    formData.append('file', file);
    if (metadata) {
      formData.append('metadata', JSON.stringify(metadata));
    }
    return instance.post(url, formData);
  },
  login: (credentials: any) => instance.post('/auth/login', credentials),
  register: (data: any) => instance.post('/auth/register', data),
  getCurrentUser: () => instance.get('/auth/me'),
  logout: () => instance.post('/auth/logout'),
};
