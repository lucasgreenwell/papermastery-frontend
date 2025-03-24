/**
 * Highlights API service for interacting with the highlights endpoints.
 */

import { api } from './apiClient';

// Highlight data types
export interface HighlightRequest {
  paper_id: string;
  text: string;
  page_number: number;
  position: string; // JSON string of position data
}

export interface HighlightResponse {
  id: string;
  text: string;
  position: string;
  page_number: number;
  summary?: string;
  explanation?: string;
}

/**
 * Highlights API service
 */
export const highlightsAPI = {
  /**
   * Gets all highlights for a paper
   * 
   * @param paperId - The ID of the paper
   * @returns A promise that resolves to an array of highlights
   */
  async getHighlights(paperId: string): Promise<HighlightResponse[]> {
    try {
      return await api.get<HighlightResponse[]>(`/highlights/${paperId}`);
    } catch (error) {
      console.error('Error fetching highlights:', error);
      return [];
    }
  },
  
  /**
   * Saves a highlight for a paper
   * 
   * @param data - The highlight data to save
   * @returns A promise that resolves to the saved highlight
   */
  async saveHighlight(data: HighlightRequest): Promise<HighlightResponse> {
    return api.post<HighlightResponse>('/highlights', data, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  },
  
  /**
   * Generates a summary for highlighted text
   * 
   * @param paperId - The ID of the paper
   * @param text - The text to summarize
   * @returns A promise that resolves to the generated summary
   */
  async summarizeHighlight(
    paperId: string, 
    text: string
  ): Promise<{ summary: string }> {
    return api.post<{ summary: string }>(`/highlights/${paperId}/summarize`, 
      { text },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  },
  
  /**
   * Generates an explanation for highlighted text
   * 
   * @param paperId - The ID of the paper
   * @param text - The text to explain
   * @returns A promise that resolves to the generated explanation
   */
  async explainHighlight(
    paperId: string, 
    text: string
  ): Promise<{ explanation: string }> {
    return api.post<{ explanation: string }>(`/highlights/${paperId}/explain`, 
      { text },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}; 