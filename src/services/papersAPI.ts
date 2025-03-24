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
  },

  /**
   * Gets a Supabase PDF URL for an arXiv paper URL.
   * This is used to avoid CORS issues when loading PDFs directly from arXiv.
   * 
   * @param arxivUrl - The arXiv URL to get the PDF for
   * @returns A promise that resolves to an object with either pdf_url or url property
   * @throws Error if the URL is invalid or the paper is not found
   */
  async getPdfUrl(arxivUrl: string): Promise<{ pdf_url?: string, url?: string }> {
    const sanitizedUrl = validateAndSanitizeUrl(arxivUrl);
    
    console.log("Getting PDF URL for:", sanitizedUrl);
    
    if (!isArxivUrl(sanitizedUrl)) {
      throw new Error('URL must be an arXiv URL');
    }
    
    // Extract the arXiv ID from the URL
    let arxivId = '';
    
    // Various patterns for arXiv URLs
    if (sanitizedUrl.includes('arxiv.org/abs/')) {
      // Handle abstract URLs: https://arxiv.org/abs/1234.56789
      arxivId = sanitizedUrl.split('arxiv.org/abs/')[1].split(/[?#]/)[0];
    } else if (sanitizedUrl.includes('arxiv.org/pdf/')) {
      // Handle PDF URLs: https://arxiv.org/pdf/1234.56789.pdf
      arxivId = sanitizedUrl.split('arxiv.org/pdf/')[1].replace('.pdf', '').split(/[?#]/)[0];
    } else if (sanitizedUrl.includes('arxiv.org/')) {
      // Handle other arXiv URLs
      const matches = sanitizedUrl.match(/arxiv\.org\/.*?(\d+\.\d+)/);
      if (matches && matches[1]) {
        arxivId = matches[1];
      }
    }
    
    if (!arxivId) {
      throw new Error('Could not extract arXiv ID from URL');
    }
    
    console.log("Extracted arXiv ID:", arxivId);
    
    // Updated to handle both response formats
    const response = await api.get('/papers/pdf-url', {
      params: {
        arxiv_id: arxivId
      }
    });
    
    // Log the full response for debugging
    console.log("Full API response:", response);
    
    // Return the response as is to handle both pdf_url and url formats
    return response;
  }
}; 