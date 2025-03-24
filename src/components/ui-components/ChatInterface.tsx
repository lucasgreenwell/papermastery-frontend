import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Send, Bot, User, Loader2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChatMessage, Conversation } from '@/types/chat';
import { sendChatMessage, getConversationMessages, getPaperConversations, subscribeToMessages } from '@/lib/api/chat';
import { paperHighlightAPI } from '@/lib/api/paperHighlight';
import ConversationSidebar from './ConversationSidebar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ChatInterfaceProps {
  title?: string;
  className?: string;
  paperTitle?: string;
  paperId: string;
}

const ChatInterface = ({ title, className, paperTitle, paperId }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSources, setExpandedSources] = useState<Record<string, string | null>>({});
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Add a state to track real-time subscriptions
  const [realtimeSubscription, setRealtimeSubscription] = useState<any>(null);

  // Load conversations when component mounts
  useEffect(() => {
    const loadConversations = async () => {
      setIsLoadingConversations(true);
      try {
        const conversationsData = await getPaperConversations(paperId);
        setConversations(conversationsData);
        
        // Set the current conversation to the most recent one
        if (conversationsData.length > 0) {
          setCurrentConversationId(conversationsData[0].id);
        }
      } catch (err) {
        console.error('Error loading conversations:', err);
      } finally {
        setIsLoadingConversations(false);
      }
    };

    loadConversations();
  }, [paperId]);

  // Safely convert a timestamp string to a Date
  const safelyParseDate = (dateString?: string): Date => {
    if (!dateString) {
      console.warn('No date string provided to safelyParseDate');
      return new Date();
    }

    try {
      // Try to parse the date
      const parsedDate = new Date(dateString);
      
      // Check if it's a valid date
      if (isNaN(parsedDate.getTime())) {
        console.warn(`Invalid date format: "${dateString}", using current date as fallback`);
        return new Date();
      }
      
      return parsedDate;
    } catch (error) {
      console.error(`Error parsing date string: "${dateString}"`, error);
      return new Date();
    }
  };

  // Load conversation history when component mounts or conversation changes
  useEffect(() => {
    const loadConversationHistory = async () => {
      if (!currentConversationId) return;
      
      console.log(`Loading conversation history for paper ${paperId} and conversation ${currentConversationId}`);
      setIsLoadingHistory(true);
      
      try {
        const conversationMessages = await getConversationMessages(paperId, currentConversationId);
        
        // Process message timestamps to avoid "Invalid Date" errors
        const processedMessages = conversationMessages.map(msg => ({
          ...msg,
          // Ensure timestamp is a proper Date object
          timestamp: typeof msg.timestamp === 'string' ? safelyParseDate(msg.timestamp) : 
                     msg.timestamp instanceof Date ? msg.timestamp : new Date()
        }));
        
        console.log(`Loaded ${processedMessages.length} messages for conversation ${currentConversationId}`);
        console.log('Message types breakdown:', 
          processedMessages.reduce((acc, msg) => {
            const type = msg.highlight_type || 'standard';
            acc[type] = (acc[type] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
        );
        
        // Log details about specific message types we're debugging
        const explainMessages = processedMessages.filter(msg => 
          msg.highlight_type === 'explain' || msg.highlight_type === 'explanation'
        );
        const summarizeMessages = processedMessages.filter(msg => 
          msg.highlight_type === 'summarize' || msg.highlight_type === 'summary'
        );
        
        console.log(`Found ${explainMessages.length} explain/explanation messages`);
        explainMessages.forEach((msg, i) => {
          console.log(`Explain message ${i + 1}:`, {
            id: msg.id,
            sender: msg.sender,
            highlight_type: msg.highlight_type,
            has_highlighted_text: !!msg.highlighted_text,
            text_preview: msg.text ? msg.text.substring(0, 50) + (msg.text.length > 50 ? '...' : '') : 'NO TEXT',
            text_length: msg.text ? msg.text.length : 0,
            timestamp: msg.timestamp,
          });
        });
        
        console.log(`Found ${summarizeMessages.length} summarize/summary messages`);
        summarizeMessages.forEach((msg, i) => {
          console.log(`Summary message ${i + 1}:`, {
            id: msg.id,
            sender: msg.sender,
            highlight_type: msg.highlight_type,
            has_highlighted_text: !!msg.highlighted_text,
            text_preview: msg.text ? msg.text.substring(0, 50) + (msg.text.length > 50 ? '...' : '') : 'NO TEXT',
            text_length: msg.text ? msg.text.length : 0,
            timestamp: msg.timestamp,
          });
        });
        
        // Create welcome message
        const welcomeMessage = {
          id: 'welcome',
          text: `Hello! I'm your AI research assistant. Ask me any questions about "${paperTitle || 'this research paper'}" and I'll do my best to help you understand it.`,
          sender: 'bot' as const,
          timestamp: new Date()
        };
        
        if (processedMessages.length > 0) {
          // Always prepend the welcome message to the conversation history
          const finalMessages = [welcomeMessage, ...processedMessages];
          console.log(`Setting ${finalMessages.length} messages in the UI (including welcome message)`);
          setMessages(finalMessages);
        } else {
          // If no messages, just show the welcome message
          console.log('No conversation messages found, showing only welcome message');
          setMessages([welcomeMessage]);
        }
      } catch (err) {
        console.error('Error loading conversation history:', err);
        // If there's an error, still show the welcome message
        setMessages([{
          id: 'welcome',
          text: `Hello! I'm your AI research assistant. Ask me any questions about "${paperTitle || 'this research paper'}" and I'll do my best to help you understand it.`,
          sender: 'bot',
          timestamp: new Date()
        }]);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    loadConversationHistory();
  }, [paperId, paperTitle, currentConversationId]);

  // Check for highlight action in session storage
  useEffect(() => {
    const checkForHighlightAction = async () => {
      const highlightActionStr = sessionStorage.getItem('highlight_action');
      console.log('Session storage highlight_action check:', highlightActionStr);
      
      if (!highlightActionStr) return;
      
      try {
        const highlightAction = JSON.parse(highlightActionStr);
        console.log('Parsed highlight action:', highlightAction);
        
        // Check if the action is recent (within last 5 seconds) and for this paper
        const isRecent = Date.now() - highlightAction.timestamp < 5000;
        const isForThisPaper = highlightAction.paperId === paperId;
        
        console.log('Highlight action validation:', { 
          isRecent, 
          isForThisPaper, 
          actionTime: new Date(highlightAction.timestamp).toISOString(),
          currentTime: new Date().toISOString(),
          paperId,
          actionPaperId: highlightAction.paperId,
          type: highlightAction.type,
          processToken: highlightAction.process_token,
          hasHighlightedText: !!highlightAction.highlighted_text,
          highlightType: highlightAction.highlight_type || highlightAction.type
        });
        
        if (isRecent && isForThisPaper) {
          // Remove the item to prevent duplicate processing
          sessionStorage.removeItem('highlight_action');
          
          // Process the highlight action
          if (highlightAction.type === 'explain' || highlightAction.type === 'summarize') {
            setIsLoading(true);
            
            // Determine the highlight type properly
            const highlightType = highlightAction.highlight_type || highlightAction.type;
            const highlightedText = highlightAction.highlighted_text || highlightAction.text;
            
            // Add user message with appropriate prefix immediately
            const actionVerb = highlightType === 'explain' ? 'Explain' : 'Summarize';
            const userMessage: ChatMessage = {
              id: Date.now().toString(),
              text: `${actionVerb} this text: "${highlightedText}"`,
              sender: 'user',
              timestamp: new Date(),
              conversation_id: currentConversationId || undefined,
              highlight_type: highlightType,
              highlighted_text: highlightedText
            };
            
            console.log('Adding user message for highlight action:', {
              type: highlightType,
              text_preview: highlightedText.substring(0, 50) + (highlightedText.length > 50 ? '...' : ''),
              timestamp: userMessage.timestamp
            });
            
            setMessages(prevMessages => [...prevMessages, userMessage]);
            
            // Add a loading message that will be replaced when the API call completes
            const loadingMessageId = `loading-${Date.now()}`;
            const loadingMessage: ChatMessage = {
              id: loadingMessageId,
              text: `I'm ${highlightType === 'explain' ? 'explaining' : 'summarizing'} this text for you...`,
              sender: 'bot',
              timestamp: new Date(),
              conversation_id: currentConversationId || undefined,
              highlight_type: 'loading',
              highlighted_text: highlightedText
            };
            
            console.log('Adding loading message for highlight action:', {
              id: loadingMessageId,
              type: 'loading',
              for_action: highlightType,
              timestamp: loadingMessage.timestamp
            });
            
            setMessages(prevMessages => [...prevMessages, loadingMessage]);
            
            // API call handling - we might not need to call the API again if it was already called
            // by EnhancedPdfHighlighter, but we still need to handle the response
            try {
              let response;
              
              // If there's a process token, it means EnhancedPdfHighlighter is already making/made the API call
              const hasDirectApiCall = !!highlightAction.process_token;
              const processToken = highlightAction.process_token;
              
              if (highlightType === 'explain' || highlightType === 'explanation') {
                if (!hasDirectApiCall) {
                  console.log(`ChatInterface making API call to explain text for paper ${paperId}`);
                  response = await paperHighlightAPI.explainText(paperId, highlightedText);
                } else {
                  console.log(`Using response from direct API call (${processToken}) for explain`);
                  // Pass the process token to use the cache
                  response = await paperHighlightAPI.explainText(paperId, highlightedText, processToken);
                }
                
                console.log('Explanation API response in ChatInterface:', response);
                
                // Handle different response formats
                const explanationText = response.explanation || 
                  (response.response ? response.response : 
                  (typeof response === 'string' ? response : 'No explanation available'));
                
                console.log('Final explanation text:', {
                  length: explanationText.length,
                  preview: explanationText.substring(0, 100) + (explanationText.length > 100 ? '...' : '')
                });
                
                // Replace loading message with the actual bot message
                const botMessage: ChatMessage = {
                  id: `response-${Date.now()}`,
                  text: explanationText,
                  sender: 'bot',
                  timestamp: new Date(),
                  conversation_id: currentConversationId || undefined,
                  highlight_type: 'explanation',
                  highlighted_text: highlightedText
                };
                
                console.log('Adding bot message with explanation:', {
                  id: botMessage.id,
                  text_length: botMessage.text.length,
                  timestamp: botMessage.timestamp,
                  highlight_type: botMessage.highlight_type
                });
                
                // Replace the loading message with the real response
                setMessages(prevMessages => 
                  prevMessages.map(msg => 
                    msg.id === loadingMessageId ? botMessage : msg
                  )
                );
              } else {
                if (!hasDirectApiCall) {
                  console.log(`ChatInterface making API call to summarize text for paper ${paperId}`);
                  response = await paperHighlightAPI.summarizeText(paperId, highlightedText);
                } else {
                  console.log(`Using response from direct API call (${processToken}) for summarize`);
                  // Pass the process token to use the cache
                  response = await paperHighlightAPI.summarizeText(paperId, highlightedText, processToken);
                }
                
                console.log('Summary API response in ChatInterface:', response);
                
                // Handle different response formats
                const summaryText = response.summary || 
                  (response.response ? response.response : 
                  (typeof response === 'string' ? response : 'No summary available'));
                
                console.log('Final summary text:', {
                  length: summaryText.length,
                  preview: summaryText.substring(0, 100) + (summaryText.length > 100 ? '...' : '')
                });
                
                // Replace loading message with the actual bot message
                const botMessage: ChatMessage = {
                  id: `response-${Date.now()}`,
                  text: summaryText,
                  sender: 'bot',
                  timestamp: new Date(),
                  conversation_id: currentConversationId || undefined,
                  highlight_type: 'summary',
                  highlighted_text: highlightedText
                };
                
                console.log('Adding bot message with summary:', {
                  id: botMessage.id,
                  text_length: botMessage.text.length,
                  timestamp: botMessage.timestamp,
                  highlight_type: botMessage.highlight_type
                });
                
                // Replace the loading message with the real response
                setMessages(prevMessages => 
                  prevMessages.map(msg => 
                    msg.id === loadingMessageId ? botMessage : msg
                  )
                );
              }
              
              // Refresh conversations list after processing the highlight
              try {
                const conversationsData = await getPaperConversations(paperId);
                setConversations(conversationsData);
                
                // Update current conversation ID if it's not set
                if (!currentConversationId && conversationsData.length > 0) {
                  setCurrentConversationId(conversationsData[0].id);
                }
              } catch (err) {
                console.error('Error refreshing conversations:', err);
              }
            } catch (err) {
              // If the API call fails, update the loading message with an error
              console.error(`${highlightType} API call failed:`, err);
              
              setMessages(prevMessages => 
                prevMessages.map(msg => 
                  msg.id === loadingMessageId ? {
                    ...msg,
                    text: `Sorry, I couldn't ${highlightType} the text. Please try again.`,
                    highlight_type: 'error'
                  } : msg
                )
              );
              
              setError(err instanceof Error ? err.message : `An error occurred during ${highlightType}`);
            } finally {
              setIsLoading(false);
            }
          }
        } else if (!isRecent) {
          // Clean up old highlight action
          console.log('Removing stale highlight action from session storage');
          sessionStorage.removeItem('highlight_action');
        }
      } catch (error) {
        console.error('Error parsing highlight action:', error);
        // Clear invalid data
        sessionStorage.removeItem('highlight_action');
      }
    };
    
    // Run the check when the component mounts and whenever paperId changes
    checkForHighlightAction();
  }, [paperId, currentConversationId]);

  // Replace the existing real-time subscription with the more robust version
  useEffect(() => {
    if (!paperId || !currentConversationId) return;

    console.log(`Setting up real-time subscription for paper ${paperId} and conversation ${currentConversationId}`);
    
    // Use our new subscription function
    const subscription = subscribeToMessages({
      paperId,
      conversationId: currentConversationId,
      onMessage: (payload) => {
        console.log('Real-time message received:', payload);
        
        // Process the message based on the event type
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          // Extract the new message from the payload
          const newMessage = payload.new as any;
          
          if (newMessage) {
            // Check if this message is already in our state
            const isDuplicate = messages.some(msg => msg.id === newMessage.id);
            
            if (!isDuplicate) {
              // Convert the new message to our ChatMessage format
              const chatMessage: ChatMessage = {
                id: newMessage.id,
                text: newMessage.text || newMessage.content || '',
                sender: newMessage.sender,
                timestamp: new Date(newMessage.created_at || newMessage.timestamp),
                conversation_id: newMessage.conversation_id,
                highlight_type: newMessage.highlight_type,
                highlighted_text: newMessage.highlighted_text,
                sources: newMessage.sources
              };
              
              console.log('Adding new message from real-time update:', {
                id: chatMessage.id,
                sender: chatMessage.sender,
                text_preview: chatMessage.text.substring(0, 50) + (chatMessage.text.length > 50 ? '...' : '')
              });
              
              // Add the new message to our state
              setMessages(prevMessages => {
                // Replace any loading message with the actual message
                if (chatMessage.sender === 'bot') {
                  const loadingMessageIndex = prevMessages.findIndex(
                    msg => msg.highlight_type === 'loading' &&
                          msg.highlighted_text === chatMessage.highlighted_text
                  );
                  
                  if (loadingMessageIndex >= 0) {
                    // Replace the loading message
                    const updatedMessages = [...prevMessages];
                    updatedMessages[loadingMessageIndex] = chatMessage;
                    return updatedMessages;
                  }
                }
                
                // If no loading message to replace, append the new message
                return [...prevMessages, chatMessage];
              });
              
              // Notify the user of new bot messages if they're not from the current user
              if (chatMessage.sender === 'bot' && chatMessage.highlight_type !== 'loading') {
                toast.success('New response received', {
                  description: 'The AI has provided a new response to your query.'
                });
              }
            } else {
              // Even if it's a duplicate, update it in case the content changed
              setMessages(prevMessages => 
                prevMessages.map(msg => 
                  msg.id === newMessage.id 
                    ? {
                        ...msg, 
                        text: newMessage.text || newMessage.content || msg.text,
                        highlight_type: newMessage.highlight_type || msg.highlight_type,
                        sources: newMessage.sources || msg.sources
                      } 
                    : msg
                )
              );
            }
          }
        } else if (payload.eventType === 'DELETE') {
          // Handle deleted messages
          const deletedMessageId = payload.old?.id;
          if (deletedMessageId) {
            setMessages(prevMessages => 
              prevMessages.filter(msg => msg.id !== deletedMessageId)
            );
          }
        }
      }
    });
    
    // Clean up function to unsubscribe when component unmounts or paperId/conversationId changes
    return () => {
      console.log('Cleaning up real-time message subscription');
      subscription.unsubscribe();
    };
  }, [paperId, currentConversationId]);

  // Also set up a subscription to the highlights table if relevant
  useEffect(() => {
    if (!paperId) return;
    
    console.log(`Setting up real-time subscription for paper highlights ${paperId}`);
    
    // Set up subscription to the highlights table
    const highlightSubscription = supabase
      .channel(`highlights-${paperId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'highlights', // Adjust this to match your actual table name
        filter: `paper_id=eq.${paperId}`, // Filter to only this paper
      }, (payload) => {
        console.log('Real-time highlight received:', payload);
        
        // We can use this to update the UI or trigger a refresh of data
        // For now just logging, but could trigger a refresh of conversations
        try {
          getPaperConversations(paperId).then(updatedConversations => {
            setConversations(updatedConversations);
          });
        } catch (err) {
          console.error('Error refreshing conversations after new highlight:', err);
        }
      })
      .subscribe();
    
    // Cleanup function to unsubscribe when component unmounts or paperId changes
    return () => {
      console.log('Cleaning up highlight subscription');
      highlightSubscription.unsubscribe();
    };
  }, [paperId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setError(null); // Clear any errors when user starts typing
  };

  const toggleSource = (messageId: string, sourceId: string) => {
    setExpandedSources(prev => {
      const key = `${messageId}-${sourceId}`;
      const newState = { ...prev };
      
      // If this source is already expanded, collapse it
      if (newState[key]) {
        delete newState[key];
      } else {
        // Collapse any other expanded sources for this message
        Object.keys(newState).forEach(k => {
          if (k.startsWith(`${messageId}-`)) {
            delete newState[k];
          }
        });
        // Expand this source
        newState[key] = sourceId;
      }
      
      return newState;
    });
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!inputValue.trim()) return;
    
    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date(),
      conversation_id: currentConversationId || undefined
    };
    
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await sendChatMessage(paperId, { query: userMessage.text }, currentConversationId || undefined);
      
      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: response.response,
        sender: 'bot',
        timestamp: new Date(),
        sources: response.sources,
        conversation_id: currentConversationId || undefined
      };
      
      setMessages(prevMessages => [...prevMessages, botMessage]);
      
      // Refresh conversations list after sending a message
      // This ensures we have the latest conversations
      try {
        const conversationsData = await getPaperConversations(paperId);
        setConversations(conversationsData);
        
        // Update current conversation ID if it's not set
        if (!currentConversationId && conversationsData.length > 0) {
          setCurrentConversationId(conversationsData[0].id);
        }
      } catch (err) {
        console.error('Error refreshing conversations:', err);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while sending your message');
      console.error('Chat error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectConversation = (conversationId: string) => {
    setCurrentConversationId(conversationId);
    // The conversation history will be loaded by the useEffect
  };

  const formatTime = (date?: Date) => {
    if (!date || isNaN(date.getTime())) {
      console.warn('Invalid date provided to formatTime:', date);
      return 'Unknown time';
    }
    
    try {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      console.error('Error formatting time:', error);
      return 'Unknown time';
    }
  };

  // Calculate heights based on whether we have a title
  const headerHeight = title ? '3.5rem' : '0';
  const formHeight = '4.5rem';

  return (
    <div className={cn(
      "relative h-full w-full rounded-lg border border-gray-200 bg-white overflow-hidden",
      className
    )}>
      {/* Fixed header */}
      {title && (
        <div className="absolute top-0 left-0 right-0 z-10 py-3 px-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Bot size={18} className="text-blue-600" />
            {title}
          </h3>
        </div>
      )}
      
      {/* Conversation Sidebar */}
      <ConversationSidebar
        conversations={conversations}
        isLoading={isLoadingConversations}
        currentConversationId={currentConversationId}
        onSelectConversation={handleSelectConversation}
      />
      
      {/* Scrollable messages container with fixed positioning */}
      <div 
        className="absolute left-0 right-0 overflow-y-auto" 
        style={{
          top: headerHeight,
          bottom: formHeight,
        }}
      >
        <div className="p-4 space-y-4">
          {isLoadingHistory ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={24} className="animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Loading conversation history...</span>
            </div>
          ) : (
            <>
              {messages.map((message, index) => (
                <div key={message.id} className="w-full">
                  <div 
                    className={cn(
                      "flex gap-3 items-start",
                      index === 0 && "mt-6",
                      message.sender === 'user' ? "justify-end" : "justify-start"
                    )}
                  >
                    {message.sender === 'user' ? (
                      <div className="flex flex-col gap-2 max-w-[75%]">
                        <div 
                          className={cn(
                            "py-2 px-3 rounded-lg",
                            "bg-blue-600 text-white"
                          )}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {message.text || "(No message content)"}
                          </p>
                          <span 
                            className={cn(
                              "text-xs block mt-1",
                              "text-blue-100"
                            )}
                          >
                            {formatTime(message.timestamp)}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-3 items-start max-w-[75%]">
                        <div 
                          className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                            "bg-gray-100"
                          )}
                        >
                          <Bot size={16} className="text-gray-600" />
                        </div>
                        
                        <div className="flex flex-col gap-2">
                          <div 
                            className={cn(
                              "py-2 px-3 rounded-lg",
                              "bg-gray-100 text-gray-800"
                            )}
                          >
                            <p className="text-sm whitespace-pre-wrap break-words">
                              {message.text || "(No content available)"}
                            </p>
                            <span 
                              className={cn(
                                "text-xs block mt-1",
                                "text-gray-500"
                              )}
                            >
                              {formatTime(message.timestamp)}
                            </span>
                            
                            {/* Debug info - only visible in development mode */}
                            {process.env.NODE_ENV === 'development' && (
                              <div className="mt-1 text-xs border-t border-gray-200 pt-1">
                                {message.highlight_type && (
                                  <div>
                                    <span className="text-gray-500">Type: </span>
                                    <span className={cn(
                                      "font-mono",
                                      message.highlight_type === 'error' ? "text-red-500" : 
                                      message.highlight_type === 'loading' ? "text-orange-500" : 
                                      "text-green-500"
                                    )}>
                                      {message.highlight_type}
                                    </span>
                                  </div>
                                )}
                                {message.highlighted_text && (
                                  <span className="block text-gray-500 mt-1 truncate" title={message.highlighted_text}>
                                    <span>Excerpt: </span>
                                    <span className="italic">
                                      {message.highlighted_text.length > 30
                                        ? message.highlighted_text.substring(0, 30) + '...'
                                        : message.highlighted_text}
                                    </span>
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          {message.sources && message.sources.length > 0 && (
                            <div className="text-xs text-gray-500">
                              <div className="flex flex-wrap gap-1 items-center">
                                <span className="font-medium">Sources:</span>
                                {message.sources.map((source, index) => (
                                  <button
                                    key={source.chunk_id}
                                    onClick={() => toggleSource(message.id, source.chunk_id)}
                                    className={cn(
                                      "inline-flex items-center justify-center px-2 py-1 rounded-md transition-colors",
                                      expandedSources[`${message.id}-${source.chunk_id}`]
                                        ? "bg-blue-100 text-blue-700"
                                        : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                                    )}
                                  >
                                    [{index + 1}]
                                  </button>
                                ))}
                              </div>
                              {message.sources.map((source) => (
                                expandedSources[`${message.id}-${source.chunk_id}`] && (
                                  <div 
                                    key={source.chunk_id}
                                    className="mt-2 p-2 bg-gray-50 rounded-md border border-gray-200"
                                  >
                                    <p className="break-words leading-relaxed">
                                      {source.text}
                                    </p>
                                  </div>
                                )
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex items-center gap-2 text-gray-500">
                  <Loader2 size={16} className="animate-spin" />
                  <span className="text-sm">AI is thinking...</span>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 text-red-500">
                  <AlertCircle size={16} />
                  <span className="text-sm">{error}</span>
                </div>
              )}
            </>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      {/* Fixed form at bottom */}
      <form 
        onSubmit={handleSendMessage}
        className="absolute bottom-0 left-0 right-0 z-10 p-4 border-t border-gray-200 bg-white"
      >
        <div className="flex items-center gap-2">
          <Input
            value={inputValue}
            onChange={handleInputChange}
            placeholder="Ask a question about the paper..."
            className="flex-1"
            disabled={isLoading || isLoadingHistory}
          />
          <Button 
            type="submit" 
            disabled={!inputValue.trim() || isLoading || isLoadingHistory}
            size="icon"
          >
            <Send size={18} />
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ChatInterface;
