import { api } from '@/services/apiClient';

// Define response types
export interface SummarizeResponse {
  summary?: string;
  response?: string;
}

export interface ExplainResponse {
  explanation?: string;
  response?: string;
}

// Simple in-memory response cache to prevent duplicate API calls
// Keys are process tokens, values are response objects with expiration
interface CacheEntry {
  response: SummarizeResponse | ExplainResponse;
  expiry: number;
}

const responseCache: Record<string, CacheEntry> = {};

// Cache lifetime in milliseconds (5 seconds)
const CACHE_TTL = 5000;

// Cache cleanup function - run periodically
const cleanupCache = () => {
  const now = Date.now();
  Object.keys(responseCache).forEach(key => {
    if (responseCache[key].expiry < now) {
      delete responseCache[key];
    }
  });
};

// Schedule cache cleanup every 30 seconds
setInterval(cleanupCache, 30000);

// Paper highlight API service
export const paperHighlightAPI = {
  /**
   * Sends a request to summarize highlighted text from a paper.
   * 
   * @param paperId - The ID of the paper containing the highlighted text
   * @param text - The text to summarize
   * @returns A promise that resolves to the summary response
   */
  async summarizeText(paperId: string, text: string, processToken?: string): Promise<SummarizeResponse> {
    console.log(`Calling summarize API for paper ${paperId} with text:`, text.substring(0, 100) + (text.length > 100 ? '...' : ''));
    
    // Check if we have a cached response for this process token
    if (processToken && responseCache[processToken]) {
      console.log(`Using cached response for summarize with token ${processToken}`);
      return responseCache[processToken].response as SummarizeResponse;
    }
    
    try {
      const response = await api.post<SummarizeResponse>(
        `papers/${paperId}/summarize`, 
        { text }
      );
      
      console.log('Raw summarize response type:', typeof response);
      console.log('Raw summarize response structure:', {
        hasResponse: !!response.response,
        hasSummary: !!response.summary,
        responseLength: response.response ? response.response.length : 0,
        summaryLength: response.summary ? response.summary.length : 0,
        responsePreview: response.response ? response.response.substring(0, 100) + (response.response.length > 100 ? '...' : '') : null,
        summaryPreview: response.summary ? response.summary.substring(0, 100) + (response.summary.length > 100 ? '...' : '') : null
      });
      
      // Cache the response if we have a process token
      if (processToken) {
        responseCache[processToken] = {
          response,
          expiry: Date.now() + CACHE_TTL
        };
        console.log(`Cached summarize response for token ${processToken}`);
      }
      
      return response;
    } catch (error) {
      console.error('Error in summarizeText API call:', error);
      throw error;
    }
  },

  /**
   * Sends a request to explain highlighted text from a paper.
   * 
   * @param paperId - The ID of the paper containing the highlighted text
   * @param text - The text to explain
   * @returns A promise that resolves to the explanation response
   */
  async explainText(paperId: string, text: string, processToken?: string): Promise<ExplainResponse> {
    console.log(`Calling explain API for paper ${paperId} with text:`, text.substring(0, 100) + (text.length > 100 ? '...' : ''));
    
    // Check if we have a cached response for this process token
    if (processToken && responseCache[processToken]) {
      console.log(`Using cached response for explain with token ${processToken}`);
      return responseCache[processToken].response as ExplainResponse;
    }
    
    try {
      const response = await api.post<ExplainResponse>(
        `papers/${paperId}/explain`, 
        { text }
      );
      
      console.log('Raw explain response type:', typeof response);
      console.log('Raw explain response structure:', {
        hasResponse: !!response.response,
        hasExplanation: !!response.explanation,
        responseLength: response.response ? response.response.length : 0,
        explanationLength: response.explanation ? response.explanation.length : 0,
        responsePreview: response.response ? response.response.substring(0, 100) + (response.response.length > 100 ? '...' : '') : null,
        explanationPreview: response.explanation ? response.explanation.substring(0, 100) + (response.explanation.length > 100 ? '...' : '') : null
      });
      
      // Cache the response if we have a process token
      if (processToken) {
        responseCache[processToken] = {
          response,
          expiry: Date.now() + CACHE_TTL
        };
        console.log(`Cached explain response for token ${processToken}`);
      }
      
      return response;
    } catch (error) {
      console.error('Error in explainText API call:', error);
      throw error;
    }
  },
}; 