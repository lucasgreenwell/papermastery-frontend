import { ChatRequest, ChatResponse, ChatMessage, Conversation } from '@/types/chat';
import { chatAPI } from '@/services/chatAPI';

export async function sendChatMessage(paperId: string, request: ChatRequest, conversationId?: string): Promise<ChatResponse> {
  // If conversationId is provided, include it in the request
  if (conversationId) {
    request.conversation_id = conversationId;
  }
  return chatAPI.sendMessage(paperId, request);
}

export async function getConversationMessages(paperId: string, conversationId?: string): Promise<ChatMessage[]> {
  return chatAPI.getConversationMessages(paperId, conversationId);
}

export async function getPaperConversations(paperId: string): Promise<Conversation[]> {
  return chatAPI.getPaperConversations(paperId);
} 