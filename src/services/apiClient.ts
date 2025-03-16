/**
 * Base API client for making HTTP requests to the backend.
 * Handles authentication, error handling, and request/response processing.
 */

import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { env, getApiUrl } from '@/config/env';
import { supabase } from '@/integrations/supabase/client';
import { ResearcherCollectionRequest, ResearcherCollectionResponse } from './types';

// Create axios instance with default config
const apiClient: AxiosInstance = axios.create({
  baseURL: env.API_URL,
  timeout: env.API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token
apiClient.interceptors.request.use(
  async (config) => {
    // Get the current session
    const { data } = await supabase.auth.getSession();
    const session = data.session;

    // If we have a session, add the auth token to the request
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError) => {
    // Handle different types of errors
    if (!error.response) {
      // Network error
      console.error('Network error:', error.message);
      return Promise.reject({
        message: 'Network error. Please check your connection.',
        originalError: error,
      });
    }

    const { status, data } = error.response;

    // Handle different status codes
    switch (status) {
      case 401:
        // Unauthorized - handle auth errors
        console.error('Authentication error:', data);
        return Promise.reject({
          message: 'Authentication error. Please sign in again.',
          originalError: error,
        });
      case 403:
        // Forbidden - handle permission errors
        console.error('Permission error:', data);
        return Promise.reject({
          message: 'You do not have permission to perform this action.',
          originalError: error,
        });
      case 404:
        // Not found
        console.error('Resource not found:', data);
        return Promise.reject({
          message: 'The requested resource was not found.',
          originalError: error,
        });
      case 400:
        // Bad request - validation errors
        console.error('Validation error:', data);
        return Promise.reject({
          message: 'Invalid request. Please check your input.',
          originalError: error,
        });
      case 500:
      case 502:
      case 503:
      case 504:
        // Server errors
        console.error('Server error:', data);
        return Promise.reject({
          message: 'Server error. Please try again later.',
          originalError: error,
        });
      default:
        // Other errors
        console.error(`Error (${status}):`, data);
        return Promise.reject({
          message: 'An unexpected error occurred.',
          originalError: error,
        });
    }
  }
);

/**
 * Helper function to make API requests with the correct URL
 */
export const api = {
  async get<T = any>(path: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await apiClient.get<T>(getApiUrl(path), config);
    return response.data;
  },

  async post<T = any>(path: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await apiClient.post<T>(getApiUrl(path), data, config);
    return response.data;
  },

  async put<T = any>(path: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await apiClient.put<T>(getApiUrl(path), data, config);
    return response.data;
  },

  async delete<T = any>(path: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await apiClient.delete<T>(getApiUrl(path), config);
    return response.data;
  },
};

// Researcher data collection API
export const collectResearcherData = async (data: ResearcherCollectionRequest): Promise<ResearcherCollectionResponse> => {
  try {
    // API endpoint is always background processing now
    const response = await apiClient.post('/api/v1/consulting/researchers/collect', data, {
      timeout: 30000 // We only need a 30-second timeout now since the API returns immediately
    });
    
    console.log('Researcher data collection initiated:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error initiating researcher data collection:', error);
    throw error;
  }
};

export default apiClient; 