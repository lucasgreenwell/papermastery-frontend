/**
 * Papers API service for interacting with the papers endpoints.
 */

import { api } from './apiClient';
import { PaperResponse } from './types';

/**
 * Papers API service
 */
export const papersAPI = {
  /**
   * Retrieves a list of all papers for the authenticated user.
   * 
   * @returns A promise that resolves to an array of paper objects
   */
  async listPapers(): Promise<PaperResponse[]> {
    return api.get<PaperResponse[]>('/papers');
  },
}; 