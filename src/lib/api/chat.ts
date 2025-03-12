import { ChatRequest, ChatResponse, ChatMessage } from '@/types/chat';
import { chatAPI } from '@/services/chatAPI';

export async function sendChatMessage(paperId: string, request: ChatRequest): Promise<ChatResponse> {
  return chatAPI.sendMessage(paperId, request);
}

export async function getConversationMessages(paperId: string): Promise<ChatMessage[]> {
  return chatAPI.getConversationMessages(paperId);
} 