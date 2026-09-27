/**
 * Axios API Client
 *
 * Central HTTP client for all backend communication.
 * - Base URL from environment variable
 * - Attaches JWT auth token to every request
 * - Handles 401 → redirect to login
 */

import axios, { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ── Request Interceptor ────────────────────────────────────────
// Attach the Bearer token from localStorage on every outgoing request
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("access_token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// ── Response Interceptor ───────────────────────────────────────
// Global error handling; 401 → clear token and redirect to login
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || '';
      // Skip the global 401 redirect if the request is to an authentication endpoint.
      // We want the auth pages (Login, Register) to catch these errors and display them inline.
      const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/2fa');

      if (!isAuthEndpoint) {
        localStorage.removeItem("access_token");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
