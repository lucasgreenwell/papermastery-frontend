export interface ChatSource {
  chunk_id: string;
  text: string;
  metadata: Record<string, any>;
}

export interface ChatRequest {
  query: string;
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
} 