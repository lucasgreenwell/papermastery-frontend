/**
 * Chat API service for interacting with the paper chat endpoints.
 */

import { api } from './apiClient';
import { ChatRequest, ChatResponse } from '@/types/chat';

/**
 * Chat API service
 */
export const chatAPI = {
  /**
   * Sends a chat message for a specific paper.
   * 
   * @param paperId - The ID of the paper to chat about
   * @param request - The chat message request containing the user's message
   * @returns A promise that resolves to the chat response
   */
  async sendMessage(paperId: string, request: ChatRequest): Promise<ChatResponse> {
    return api.post<ChatResponse>(`/papers/${paperId}/chat`, request);
  }
}; 