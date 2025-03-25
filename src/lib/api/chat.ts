import { ChatRequest, ChatResponse, ChatMessage, Conversation } from '@/types/chat';
import { chatAPI } from '@/services/chatAPI';
import { supabase } from '@/integrations/supabase/client';

// Interface for message subscriptions
interface MessageSubscriptionOptions {
  paperId: string;
  conversationId?: string;
  onMessage: (message: any) => void;
}

// Store active subscriptions
const activeSubscriptions: Record<string, any> = {};

/**
 * Send a chat message to the API
 */
export async function sendChatMessage(
  paperId: string,
  message: { query: string },
  conversationId?: string
) {
  // Include conversation_id in the message object if it exists
  const requestData: ChatRequest = {
    query: message.query,
    ...(conversationId ? { conversation_id: conversationId } : {})
  };
  
  return chatAPI.sendMessage(paperId, requestData);
}

/**
 * Get all messages for a conversation
 */
export async function getConversationMessages(paperId: string, conversationId: string) {
  return chatAPI.getConversationMessages(paperId, conversationId);
}

/**
 * Get all conversations for a paper
 */
export async function getPaperConversations(paperId: string) {
  return chatAPI.getPaperConversations(paperId);
}

/**
 * Subscribe to real-time message updates for a conversation
 */
export function subscribeToMessages({ paperId, conversationId, onMessage }: MessageSubscriptionOptions) {
  // Create a subscription key
  const subscriptionKey = conversationId 
    ? `message-${paperId}-${conversationId}` 
    : `message-${paperId}`;
  
  // Check if we already have an active subscription for this conversation
  if (activeSubscriptions[subscriptionKey]) {
    console.log(`Using existing subscription for ${subscriptionKey}`);
    return {
      unsubscribe: () => {
        if (activeSubscriptions[subscriptionKey]) {
          activeSubscriptions[subscriptionKey].unsubscribe();
          delete activeSubscriptions[subscriptionKey];
        }
      }
    };
  }
  
  // Create filter based on whether we have a conversation ID
  const filter = conversationId 
    ? `conversation_id=eq.${conversationId}` 
    : `paper_id=eq.${paperId}`;
  
  // Set up the subscription
  const channel = supabase
    .channel(subscriptionKey)
    .on('postgres_changes', {
      event: '*', // Listen for all events
      schema: 'public',
      table: 'messages',
      filter: filter,
    }, (payload) => {
      console.log(`Real-time update for ${subscriptionKey}:`, payload);
      onMessage(payload);
    })
    .subscribe();
  
  // Store the subscription
  activeSubscriptions[subscriptionKey] = channel;
  
  // Return an object with an unsubscribe method
  return {
    unsubscribe: () => {
      if (activeSubscriptions[subscriptionKey]) {
        activeSubscriptions[subscriptionKey].unsubscribe();
        delete activeSubscriptions[subscriptionKey];
      }
    }
  };
}

/**
 * Unsubscribe from all active message subscriptions
 */
export function unsubscribeAllMessages() {
  Object.keys(activeSubscriptions).forEach(key => {
    if (activeSubscriptions[key]) {
      activeSubscriptions[key].unsubscribe();
      delete activeSubscriptions[key];
    }
  });
} 