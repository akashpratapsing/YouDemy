import axios, { AxiosError, type AxiosResponse } from 'axios';
import type { ApiEnvelope, ApiErrorPayload } from '@/types/api';

export const TOKEN_KEY = 'youdemy.token';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorPayload>) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
      window.dispatchEvent(new Event('youdemy:unauthorized'));
    }
    return Promise.reject(error);
  },
);

export function unwrap<T>(response: AxiosResponse<ApiEnvelope<T>>): T {
  return response.data.data;
}

export function getErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (axios.isAxiosError<ApiErrorPayload>(error)) {
    const payload = error.response?.data;
    if (payload?.message) return payload.message;
    if (error.code === 'ECONNABORTED') return 'The request timed out. Please try again.';
    if (!error.response) return 'Unable to reach the server. Check your connection.';
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export function getFieldErrors(error: unknown): Record<string, string> {
  if (axios.isAxiosError<ApiErrorPayload>(error)) {
    return error.response?.data?.fieldErrors ?? {};
  }
  return {};
}
