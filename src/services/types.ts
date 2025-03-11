/**
 * Type definitions for API services
 */

/**
 * Author information
 */
export interface Author {
  name: string;
  affiliations: string[];
}

/**
 * Related paper information
 */
export interface RelatedPaper {
  id: string;
  title: string;
  arxiv_id?: string;
}

/**
 * Paper response from the API
 */
export interface PaperResponse {
  id: string;
  arxiv_id: string;
  title: string;
  authors: Author[];
  abstract: string;
  publication_date: string;
  categories?: string[];
  status?: 'pending' | 'processing' | 'completed' | 'failed';
  created_at?: string;
  updated_at?: string;
  pdf_url?: string;
  related_papers?: RelatedPaper[];
  summaries?: any;
  tags?: string[];
}

/**
 * API error response
 */
export interface ApiError {
  message: string;
  originalError?: any;
} 