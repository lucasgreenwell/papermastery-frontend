/**
 * Chat API service for interacting with the paper chat endpoints.
 */

import { api } from './apiClient';
import { ChatRequest, ChatResponse, ChatMessage } from '@/types/chat';

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
  },

  /**
   * Fetches all messages for a paper's conversation.
   * 
   * @param paperId - The ID of the paper to fetch messages for
   * @returns A promise that resolves to an array of chat messages
   */
  async getConversationMessages(paperId: string): Promise<ChatMessage[]> {
    const response = await api.get<any[]>(`/papers/${paperId}/messages`);
    
    // Convert the backend message format to the frontend ChatMessage format
    return response.map(message => ({
      id: message.id,
      text: message.text,
      sender: message.sender as 'user' | 'bot',
      timestamp: new Date(message.created_at),
      // Sources will only be available for bot messages that have them
      ...(message.sender === 'bot' && message.sources ? { sources: message.sources } : {})
    }));
  }
}; 