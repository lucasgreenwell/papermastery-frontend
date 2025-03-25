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

// Base interface for common properties
interface BaseChatMessage {
  id: string;
  timestamp: Date;
  sources?: ChatSource[];
  conversation_id?: string;
  highlight_type?: 'explain' | 'summarize' | 'explanation' | 'summary' | 'loading' | 'error';
  highlighted_text?: string;
  highlight_source?: string;
  clientGeneratedId?: boolean;
}

// Interface for live messages
interface LiveChatMessage extends BaseChatMessage {
  text: string;
  sender: 'user' | 'bot';
}

// Interface for database messages
interface DatabaseChatMessage extends BaseChatMessage {
  query: string;
  response: string;
  user_id: string;
  paper_id: string;
}

// Union type for all possible message formats
export type ChatMessage = LiveChatMessage | DatabaseChatMessage;

export interface Conversation {
  id: string;
  user_id: string;
  paper_id: string;
  created_at: string;
  updated_at?: string;
} 