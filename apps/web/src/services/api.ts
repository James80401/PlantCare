import axios from 'axios';
import type { TaskSkipFeedback } from '../utils/taskFeedback';

const apiBaseURL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') || '/api/v1';

const api = axios.create({
  baseURL: apiBaseURL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      const refresh = localStorage.getItem('refreshToken');
      if (refresh && !error.config._retry) {
        error.config._retry = true;
        try {
          const { data } = await axios.post(`${apiBaseURL}/auth/refresh`, { refreshToken: refresh });
          localStorage.setItem('accessToken', data.accessToken);
          localStorage.setItem('refreshToken', data.refreshToken);
          error.config.headers.Authorization = `Bearer ${data.accessToken}`;
          return api.request(error.config);
        } catch {
          localStorage.clear();
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  },
);

export const authApi = {
  register: (email: string, password: string, name?: string) =>
    api.post('/auth/register', { email, password, name }),
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  verifyEmail: (token: string) => api.post(`/auth/verify-email/${token}`),
  resendVerification: (email: string) => api.post('/auth/resend-verification', { email }),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) =>
    api.post('/auth/reset-password', { token, password }),
};

export const plantsApi = {
  list: () => api.get('/plants'),
  get: (id: string) => api.get(`/plants/${id}`),
  update: (id: string, data: { location?: string; notes?: string }) =>
    api.patch(`/plants/${id}`, data),
  create: (data: Record<string, unknown>) => api.post('/plants', data),
  delete: (id: string) => api.delete(`/plants/${id}`),
  identify: (file: File) => {
    const form = new FormData();
    form.append('image', file);
    return api.post('/plants/identify', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  upload: (file: File) => {
    const form = new FormData();
    form.append('image', file);
    return api.post('/plants/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export const speciesApi = {
  search: (q: string, filters?: Record<string, boolean>) =>
    api.get('/species/search', { params: { q, ...filters } }),
};

export const tasksApi = {
  list: (from?: string, to?: string) => api.get('/tasks', { params: { from, to } }),
  complete: (id: string) => api.patch(`/tasks/${id}/complete`),
  skip: (id: string, feedback?: TaskSkipFeedback) => api.patch(`/tasks/${id}/skip`, feedback ?? {}),
  instructions: (id: string) => api.get(`/tasks/${id}/instructions`),
};

export const journalApi = {
  list: (plantId: string) => api.get(`/plants/${plantId}/journal`),
  create: (plantId: string, notes: string, photo?: File) => {
    const form = new FormData();
    if (notes) form.append('notes', notes);
    if (photo) form.append('photo', photo);
    return api.post(`/plants/${plantId}/journal`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export const diagnosisApi = {
  submit: (plantId: string, symptomsText: string, image?: File) => {
    const form = new FormData();
    if (symptomsText) form.append('symptomsText', symptomsText);
    if (image) form.append('image', image);
    return api.post(`/plants/${plantId}/diagnose`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  updateStatus: (plantId: string, diagnosisId: string, resolved: boolean) =>
    api.patch(`/plants/${plantId}/diagnose/${diagnosisId}`, { resolved }),
};

export const diagnosisChatApi = {
  list: (plantId: string) =>
    api.get(`/plants/${plantId}/diagnose/conversations`),
  get: (plantId: string, conversationId: string) =>
    api.get(`/plants/${plantId}/diagnose/conversations/${conversationId}`),
  create: (plantId: string, message?: string, image?: File) => {
    const form = new FormData();
    if (message) form.append('message', message);
    if (image) form.append('image', image);
    return api.post(`/plants/${plantId}/diagnose/conversations`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  sendMessage: (plantId: string, conversationId: string, message?: string, image?: File) => {
    const form = new FormData();
    if (message) form.append('message', message);
    if (image) form.append('image', image);
    return api.post(
      `/plants/${plantId}/diagnose/conversations/${conversationId}/messages`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
  },
};

export const usersApi = {
  me: () => api.get('/users/me'),
  updateSettings: (data: Record<string, unknown>) =>
    api.put('/users/me/notification-settings', data),
  deleteAccount: () => api.delete('/users/me'),
  weather: () => api.get('/users/me/weather'),
};

export const billingApi = {
  checkout: () => api.post('/billing/checkout'),
};

export const devicesApi = {
  register: (token: string, platform: string) =>
    api.post('/devices', { token, platform }),
};

export default api;
