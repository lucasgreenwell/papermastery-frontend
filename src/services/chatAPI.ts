/**
 * Chat API service for interacting with the paper chat endpoints.
 */

import { api } from './apiClient';
import { ChatRequest, ChatResponse, ChatMessage, Conversation } from '@/types/chat';

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
   * @param conversationId - Optional ID of the specific conversation to fetch messages for
   * @returns A promise that resolves to an array of chat messages
   */
  async getConversationMessages(paperId: string, conversationId?: string): Promise<ChatMessage[]> {
    const url = conversationId 
      ? `/papers/${paperId}/messages?conversation_id=${conversationId}`
      : `/papers/${paperId}/messages`;
    
    console.log(`Fetching messages for paper ${paperId}${conversationId ? ` and conversation ${conversationId}` : ''}`);
    
    try {
      const response = await api.get<any[]>(url);
      
      console.log(`Retrieved ${response.length} messages from API:`, JSON.stringify(response, null, 2));
      
      // Convert the backend message format to the frontend ChatMessage format
      const convertedMessages = response.map(message => {
        console.log(`Processing message:`, message);
        
        // Get message text from response field or query field as fallback
        const messageText = message.response || message.query || "";
        
        // Check for highlight data
        if (message.highlight_type || message.highlighted_text) {
          console.log(`Message has highlight data:`, {
            highlight_type: message.highlight_type,
            highlighted_text: message.highlighted_text ? message.highlighted_text.substring(0, 50) + '...' : 'none'
          });
        }
        
        // Handle timestamp conversion safely
        let timestamp: Date;
        try {
          // Try to create a date from the created_at value
          const parsedDate = new Date(message.created_at || message.timestamp);
          
          // Check if the date is valid (invalid dates return NaN for getTime())
          if (isNaN(parsedDate.getTime())) {
            console.warn(`Invalid date format received from API: ${message.created_at || message.timestamp}`);
            timestamp = new Date(); // Fallback to current date
          } else {
            timestamp = parsedDate;
          }
        } catch (error) {
          console.error(`Error parsing date: ${message.created_at || message.timestamp}`, error);
          timestamp = new Date(); // Fallback to current date
        }
        
        const convertedMessage = {
          id: message.id || `generated-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          text: messageText,
          sender: message.sender as 'user' | 'bot',
          timestamp: timestamp,
          conversation_id: message.conversation_id,
          // Preserve highlight data if available
          ...(message.highlight_type ? { highlight_type: message.highlight_type } : {}),
          ...(message.highlighted_text ? { highlighted_text: message.highlighted_text } : {}),
          // Sources will only be available for bot messages that have them
          ...(message.sender === 'bot' && message.sources ? { sources: message.sources } : {})
        };
        
        // Safely create text preview for logging
        const textPreview = convertedMessage.text 
          ? convertedMessage.text.substring(0, 50) + (convertedMessage.text.length > 50 ? '...' : '')
          : 'NO TEXT';
        
        console.log(`Converted message:`, {
          id: convertedMessage.id,
          text: textPreview,
          sender: convertedMessage.sender,
          timestamp: convertedMessage.timestamp,
          highlight_type: convertedMessage.highlight_type,
          has_highlighted_text: !!convertedMessage.highlighted_text
        });
        
        return convertedMessage;
      });
      
      console.log(`Returning ${convertedMessages.length} converted messages`);
      return convertedMessages;
    } catch (error) {
      console.error(`Error fetching messages for paper ${paperId}:`, error);
      throw error;
    }
  },

  /**
   * Fetches all conversations for a specific paper.
   * 
   * @param paperId - The ID of the paper to fetch conversations for
   * @returns A promise that resolves to an array of conversation objects
   */
  async getPaperConversations(paperId: string): Promise<Conversation[]> {
    return api.get<Conversation[]>(`/papers/${paperId}/conversations`);
  }
}; 