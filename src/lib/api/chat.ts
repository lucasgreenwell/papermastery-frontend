import { ChatRequest, ChatResponse } from '@/types/chat';
import { chatAPI } from '@/services/chatAPI';

export async function sendChatMessage(paperId: string, request: ChatRequest): Promise<ChatResponse> {
  return chatAPI.sendMessage(paperId, request);
} 