/**
 * Papers API service for interacting with the papers endpoints.
 */

import { api } from './apiClient';
import { PaperResponse } from './types';

/**
 * Validates and sanitizes an arXiv URL.
 * 
 * @param url - The URL to validate and sanitize
 * @returns The sanitized URL
 * @throws Error if the URL is invalid
 */
function validateAndSanitizeArxivUrl(url: string): string {
  // Remove any whitespace
  const trimmedUrl = url.trim();
  
  // Check if it's a valid arXiv URL
  if (!trimmedUrl.startsWith('https://arxiv.org/abs/')) {
    throw new Error('Invalid arXiv URL. URL must begin with https://arxiv.org/abs/');
  }
  
  // Remove any query parameters
  const urlWithoutParams = trimmedUrl.split('?')[0];
  
  return urlWithoutParams;
}

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
  
  /**
   * Retrieves a specific paper by ID.
   * 
   * @param paperId - The ID of the paper to retrieve
   * @returns A promise that resolves to the paper object
   */
  async getPaper(paperId: string): Promise<PaperResponse> {
    return api.get<PaperResponse>(`/papers/${paperId}`);
  },
  
  /**
   * Submits a paper for processing using an arXiv URL.
   * 
   * @param arxivLink - The URL to the arXiv paper
   * @returns A promise that resolves to the submitted paper object
   * @throws Error if the URL is invalid
   */
  async submitPaper(arxivLink: string): Promise<PaperResponse> {
    const sanitizedUrl = validateAndSanitizeArxivUrl(arxivLink);
    return api.post<PaperResponse>('/papers/submit', {
      arxiv_link: sanitizedUrl
    });
  }
}; 