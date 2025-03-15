/**
 * Papers API service for interacting with the papers endpoints.
 */

import { api } from './apiClient';
import { PaperResponse } from './types';

/**
 * Validates and sanitizes a paper URL.
 * 
 * @param url - The URL to validate and sanitize
 * @returns The sanitized URL
 * @throws Error if the URL is invalid
 */
function validateAndSanitizeUrl(url: string): string {
  // Remove any whitespace
  const trimmedUrl = url.trim();
  
  // Basic URL validation
  if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
    throw new Error('Invalid URL. URL must begin with http:// or https://');
  }
  
  // Remove any query parameters for arXiv URLs (keep them for other URLs)
  if (trimmedUrl.startsWith('https://arxiv.org/abs/')) {
    return trimmedUrl.split('?')[0];
  }
  
  return trimmedUrl;
}

/**
 * Determines if a URL is an arXiv URL.
 * 
 * @param url - The URL to check
 * @returns True if the URL is an arXiv URL, false otherwise
 */
function isArxivUrl(url: string): boolean {
  return url.startsWith('https://arxiv.org/abs/') || url.startsWith('https://arxiv.org/pdf/');
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
   * Submits a paper for processing using a URL.
   * 
   * @param url - The URL to the paper (arXiv or PDF)
   * @returns A promise that resolves to the submitted paper object
   * @throws Error if the URL is invalid
   */
  async submitPaper(url: string): Promise<PaperResponse> {
    const sanitizedUrl = validateAndSanitizeUrl(url);
    
    // Determine source type (optional, will be auto-detected by backend)
    const sourceType = isArxivUrl(sanitizedUrl) ? 'arxiv' : 'pdf';
    
    return api.post<PaperResponse>('/papers/submit', {
      source_url: sanitizedUrl,
      source_type: sourceType
    });
  }
}; 