/**
 * Papers API service for interacting with the papers endpoints.
 */

import { api } from './apiClient';
import { PaperResponse, PaperSubmitResponse } from './types';
import { isArxivUrl, validateAndSanitizeUrl } from '@/utils/urlUtils';

/**
 * Papers API service
 */
export const papersAPI = {
  /**
   * Lists all papers for the current user.
   * 
   * @returns A promise that resolves to an array of paper objects
   */
  async listPapers(): Promise<PaperResponse[]> {
    return api.get<PaperResponse[]>('/papers/');
  },
  
  /**
   * Retrieves a paper by its ID.
   * 
   * @param id - The ID of the paper
   * @returns A promise that resolves to a paper object
   */
  async getPaper(id: string): Promise<PaperResponse> {
    return api.get<PaperResponse>(`/papers/${id}`);
  },
  
  /**
   * Submits a paper for processing using a URL.
   * 
   * @param url - The URL to the paper (arXiv or PDF)
   * @returns A promise that resolves to the submitted paper's UUID
   * @throws Error if the URL is invalid
   */
  async submitPaper(url: string): Promise<PaperSubmitResponse> {
    const sanitizedUrl = validateAndSanitizeUrl(url);
    
    // Determine source type (optional, will be auto-detected by backend)
    const sourceType = isArxivUrl(sanitizedUrl) ? 'arxiv' : 'pdf';
    
    return api.post<PaperSubmitResponse>('/papers/submit', {
      source_url: sanitizedUrl,
      source_type: sourceType
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  },

  /**
   * Submits a paper for processing using a file upload.
   * 
   * @param file - The PDF file to upload
   * @returns A promise that resolves to the submitted paper's UUID
   * @throws Error if the file is invalid
   */
  async submitPaperFile(file: File): Promise<PaperSubmitResponse> {
    // Validate file type
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      throw new Error('Invalid file type. Only PDF files are supported.');
    }
    
    // Create form data for file upload
    const formData = new FormData();
    formData.append('file', file);
    formData.append('source_type', 'file');
    
    // Use axios directly for multipart/form-data
    return api.post<PaperSubmitResponse>('/papers/submit', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }
}; 