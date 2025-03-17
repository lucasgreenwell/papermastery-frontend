import { toast } from '@/components/ui/use-toast';

const API_BASE = '/api/v1/consulting';

/**
 * API Service for making authenticated requests to the backend
 */
export const apiService = {
  /**
   * Get the authentication token from local storage
   */
  getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    };
  },

  /**
   * Make a GET request to the API
   */
  async get<T>(endpoint: string): Promise<T> {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  },

  /**
   * Make a POST request to the API
   */
  async post<T>(endpoint: string, data: any): Promise<T> {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  },

  /**
   * Handle API response and extract data
   */
  async handleResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');
    const data = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      const error = isJson && data.detail 
        ? data.detail 
        : 'An error occurred while processing your request';
      
      toast({
        title: 'Error',
        description: error,
        variant: 'destructive',
      });
      
      throw new Error(error);
    }

    // Handle the standardized API response format
    if (isJson && 'success' in data) {
      if (!data.success) {
        toast({
          title: 'Error',
          description: data.message || 'Operation failed',
          variant: 'destructive',
        });
        throw new Error(data.message || 'Operation failed');
      }
      return data.data as T;
    }

    return data as T;
  },

  /**
   * Handle API errors
   */
  handleError(error: any) {
    console.error('API Error:', error);
    toast({
      title: 'Error',
      description: error.message || 'An unexpected error occurred',
      variant: 'destructive',
    });
  }
}; 