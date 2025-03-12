export interface ChatSource {
  chunk_id: string;
  text: string;
  metadata: Record<string, any>;
}

export interface ChatRequest {
  query: string;
  conversation_id?: string;
}

export interface ChatResponse {
  response: string;
  query: string;
  sources: ChatSource[];
  paper_id: string;
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  sources?: ChatSource[];
  conversation_id?: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  paper_id: string;
  created_at: string;
  updated_at?: string;
} 