/**
 * Papers API service for interacting with the papers endpoints.
 */

import { api } from './apiClient';
import { PaperResponse, PaperSubmitResponse } from './types';
import { isArxivUrl, validateAndSanitizeUrl } from '@/utils/urlUtils';
import { getCachedPdf } from '@/utils/cacheUtils';
import { env } from '@/config/env';

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
    
    try {
      // Use papersAPI directly to avoid 'this' context issues
      const existingPapers = await papersAPI.listPapers();
      
      // Check if any paper has this exact source_url
      const matchingPaper = existingPapers.find(paper => 
        paper.source_url === sanitizedUrl || 
        paper.pdf_url === sanitizedUrl
      );
      
      if (matchingPaper) {
        console.log(`Found existing paper with the same URL: ${matchingPaper.id}`);
        return { id: matchingPaper.id };
      }
      
      // If no exact match, proceed with submission - use original endpoint
      console.log('Submitting paper with URL:', sanitizedUrl);
      const response = await api.post<{ id: string }>('/papers/submit', {
        source_url: sanitizedUrl,
        source_type: isArxivUrl(sanitizedUrl) ? 'arxiv' : 'pdf'
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (typeof response === 'object' && response !== null && 'id' in response) {
        return { id: response.id };
      } else {
        console.error('Unexpected response format:', response);
        throw new Error('Unexpected response format from server');
      }
    } catch (error) {
      console.error('Error submitting paper:', error);
      throw error;
    }
  },

  /**
   * Submits a paper for processing using a file upload.
   * 
   * @param file - The PDF file to upload
   * @returns A promise that resolves to the submitted paper's UUID
   * @throws Error if the file is invalid
   */
  async submitPaperFile(file: File): Promise<PaperSubmitResponse> {
    try {
      // Validate file type
      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        throw new Error('Invalid file type. Only PDF files are supported.');
      }
      
      // Create form data for file upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('source_type', 'file');
      
      // Use axios for multipart/form-data with original endpoint
      const response = await api.post<{ id: string }>('/papers/submit', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });
      
      if (typeof response === 'object' && response !== null && 'id' in response) {
        return { id: response.id };
      } else {
        console.error('Unexpected response format:', response);
        throw new Error('Unexpected response format from server');
      }
    } catch (error) {
      console.error('Error submitting paper file:', error);
      throw error;
    }
  },

  /**
   * Gets a proxy URL for a PDF from the server to avoid CORS issues
   * @param url The PDF URL to proxy
   * @param paperId Optional paper ID to associate with this request
   * @returns Promise with the proxied URL response
   */
  async getServerProxyPdfUrl(url: string, paperId?: string): Promise<{ url: string }> {
    // Flag to indicate if the server endpoint is implemented
    const isServerEndpointImplemented = true; // Set to true now that the server endpoint is ready
    
    try {
      // First, generate a unique request ID for tracing this specific request
      const requestId = Math.random().toString(36).substring(2, 8);
      
      // CRITICAL: Always make sure input URL is a PDF URL for ArXiv before any processing
      let processedUrl = url;
      if (url.includes('arxiv.org/abs/')) {
        const arxivId = url.split('arxiv.org/abs/')[1].split(/[?#]/)[0];
        processedUrl = `https://arxiv.org/pdf/${arxivId}.pdf`;
        console.log(`[${requestId}] Normalized abstract URL to PDF URL:`, processedUrl);
      }
      
      // Log the request for debugging
      console.log(`[${requestId}] Requesting server proxy for PDF:`, {
        originalUrl: url,
        processedUrl: processedUrl,
        paperId: paperId || 'none'
      });
      
      if (isServerEndpointImplemented) {
        try {
          // Log the request details
          const apiEndpoint = '/papers/proxy-pdf';
          console.log(`[${requestId}] Making API POST request to ${apiEndpoint}`);
          console.log(`[${requestId}] Request payload:`, { url: processedUrl, paper_id: paperId });
          
          // Make the request to the server-side proxy endpoint
          const startTime = Date.now();
          const response = await api.post(apiEndpoint, { 
            url: processedUrl,
            paper_id: paperId
          });
          const endTime = Date.now();
          
          // Log the response timing and details
          console.log(`[${requestId}] Server proxy response time: ${endTime - startTime}ms`);
          
          if (!response) {
            console.error(`[${requestId}] Null or undefined response from server proxy`);
            throw new Error('Server proxy returned null response');
          }
          
          // Check if the response contains a valid URL
          if (response.url) {
            // If the URL is relative (starts with /), add origin
            let proxyUrl = response.url;
            if (proxyUrl.startsWith('/')) {
              console.log(`[${requestId}] Server returned a relative URL, adding backend origin`);
              // Handle relative URLs by prepending the backend URL (not frontend origin)
              // Use the configured API_URL from environment
              proxyUrl = `${env.API_URL}${proxyUrl}`;
              // Log the full URL to help with debugging
              console.log(`[${requestId}] Full proxied URL with backend origin: ${proxyUrl}`);
            }
            
            console.log(`[${requestId}] Server proxy succeeded with URL:`, proxyUrl.substring(0, 50) + '...');
            return { url: proxyUrl };
          } else {
            console.error(`[${requestId}] Invalid response format:`, response);
            throw new Error('Server proxy response missing URL');
          }
        } catch (err: any) {
          // Capture and log detailed error information
          console.error(`[${requestId}] API request error:`, err.message || err);
          
          if (err.response) {
            console.error(`[${requestId}] Error response details:`, {
              status: err.response.status,
              statusText: err.response.statusText,
              data: err.response.data
            });
          }
          
          // Rethrow to be handled by the outer catch
          throw err;
        }
      } else {
        // This block won't execute with isServerEndpointImplemented set to true
        throw new Error('Server endpoint not implemented');
      }
    } catch (error: any) {
      // Log the error for debugging
      console.error('Server proxy error:', error.message || error);
      
      // Add detailed error logging for network errors
      if (error.name === 'NetworkError' || error.message === 'Failed to fetch' || error.message?.includes('Network')) {
        console.error('Network error details:', {
          type: error.name,
          message: error.message,
          url: url,
        });
      }
      
      // Fall back to a CORS proxy as a last resort
      console.log('Falling back to CORS proxy for:', url);
      
      // Make sure we're using the PDF URL in the fallback
      let fallbackUrl = url;
      if (url.includes('arxiv.org/abs/')) {
        const arxivId = url.split('arxiv.org/abs/')[1].split(/[?#]/)[0];
        fallbackUrl = `https://arxiv.org/pdf/${arxivId}.pdf`;
        console.log('Normalized URL for CORS proxy fallback:', fallbackUrl);
      }
      
      const corsProxyUrl = `https://corsproxy.io/?${encodeURIComponent(fallbackUrl)}`;
      return { url: corsProxyUrl };
    }
  },

  /**
   * Gets a Supabase PDF URL for an arXiv paper URL.
   * This is used to avoid CORS issues when loading PDFs directly from arXiv.
   * 
   * @param url - The arXiv or PDF URL to process
   * @returns A promise that resolves to an object with either pdf_url or url property
   * @throws Error if the URL is invalid or the paper is not found
   */
  async getPdfUrl(url: string): Promise<{ pdf_url?: string, url?: string }> {
    try {
      const sanitizedUrl = validateAndSanitizeUrl(url);
      
      console.log("Getting PDF URL for:", sanitizedUrl);
      
      // Step 1: Always convert abstract URL to PDF URL if it's an arXiv URL
      let processedUrl = sanitizedUrl;
      let arxivId = '';
      
      // Extract arXiv ID from various URL formats
      if (sanitizedUrl.includes('arxiv.org/abs/')) {
        // Format: https://arxiv.org/abs/2301.00000
        arxivId = sanitizedUrl.split('arxiv.org/abs/')[1].split(/[?#]/)[0];
        processedUrl = `https://arxiv.org/pdf/${arxivId}.pdf`;
        console.log("Converted abstract URL to PDF URL:", processedUrl);
      } else if (sanitizedUrl.includes('arxiv.org/pdf/')) {
        // Format: https://arxiv.org/pdf/2301.00000.pdf
        arxivId = sanitizedUrl.split('arxiv.org/pdf/')[1].replace('.pdf', '').split(/[?#]/)[0];
      } else if (isArxivUrl(sanitizedUrl)) {
        // Try to extract ID using regex from other arXiv URL formats
        const matches = sanitizedUrl.match(/arxiv\.org\/.*?([0-9]+\.[0-9]+v?[0-9]*)/i);
        if (matches && matches[1]) {
          arxivId = matches[1];
          processedUrl = `https://arxiv.org/pdf/${arxivId}.pdf`;
          console.log("Extracted arXiv ID and created PDF URL:", processedUrl);
        }
      }
      
      // For non-arXiv URLs, try using the server-side proxy first
      if (!isArxivUrl(sanitizedUrl)) {
        try {
          console.log('Non-arXiv URL, trying server proxy first:', sanitizedUrl);
          const proxyResponse = await papersAPI.getServerProxyPdfUrl(sanitizedUrl);
          if (proxyResponse && proxyResponse.url) {
            return { pdf_url: proxyResponse.url };
          }
        } catch (proxyError) {
          console.warn('Server proxy failed for non-arXiv URL, falling back to direct URL:', proxyError);
          return { pdf_url: sanitizedUrl };
        }
      }
      
      if (!arxivId) {
        console.warn('Could not extract arXiv ID from URL, trying server proxy as fallback');
        try {
          const proxyResponse = await papersAPI.getServerProxyPdfUrl(sanitizedUrl);
          if (proxyResponse && proxyResponse.url) {
            return { pdf_url: proxyResponse.url };
          }
        } catch (proxyError) {
          console.error('Server proxy failed for unrecognized arXiv URL:', proxyError);
          // Last resort - use a CORS proxy
          return { pdf_url: `https://corsproxy.io/?${encodeURIComponent(sanitizedUrl)}` };
        }
      }
      
      console.log("Working with arXiv ID:", arxivId);
      
      // For arXiv PDFs, first try the server-side proxy (most reliable)
      try {
        console.log("Approach 1: Using server-side proxy for arXiv PDF");
        const proxyResponse = await papersAPI.getServerProxyPdfUrl(processedUrl);
        if (proxyResponse && proxyResponse.url) {
          return { pdf_url: proxyResponse.url };
        }
      } catch (proxyError) {
        console.warn("Server proxy failed, falling back to other methods:", proxyError);
        // Continue to the next approach
      }
      
      // Approach 2: Try the backend API with arxiv_id parameter
      try {
        console.log("Approach 2: Requesting PDF URL from backend API with arXiv ID:", arxivId);
        const response = await api.get('/papers/pdf-url', {
          params: { arxiv_id: arxivId }
        });
        
        if (response && (response.pdf_url || response.url)) {
          console.log("Backend API provided a valid URL:", response.pdf_url || response.url);
          return response;
        } else {
          console.warn("Backend API response didn't contain usable URL, trying CORS proxy");
        }
      } catch (apiError) {
        console.error("Backend API request failed, trying CORS proxy:", apiError);
      }
      
      // Approach 3: Use client-side CORS proxies as last resort
      console.log("Approach 3: Using CORS proxies for arXiv PDF as last resort");
      
      // Multiple proxy options to try in sequence
      const proxyOptions = [
        `https://corsproxy.io/?${encodeURIComponent(processedUrl)}`,
        `https://cors-anywhere.herokuapp.com/${processedUrl}`,
        `https://api.allorigins.win/raw?url=${encodeURIComponent(processedUrl)}`,
        `https://proxy.cors.sh/${processedUrl}`
      ];
      
      // Use the first proxy option by default
      const proxyUrl = proxyOptions[0];
      console.log("Using primary CORS proxy as last resort:", proxyUrl);
      
      return { pdf_url: proxyUrl };
    } catch (error) {
      console.error("Error in getPdfUrl:", error);
      
      // Return a default proxy URL as final fallback
      const fallbackProxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
      console.log("Using final fallback proxy due to error:", fallbackProxyUrl);
      return { pdf_url: fallbackProxyUrl };
    }
  }
}; 