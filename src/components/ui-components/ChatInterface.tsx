import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Send, Bot, User, Loader2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChatMessage } from '@/types/chat';
import { sendChatMessage } from '@/lib/api/chat';

interface ChatInterfaceProps {
  title?: string;
  className?: string;
  paperTitle?: string;
  paperId: string;
}

const ChatInterface = ({ title, className, paperTitle, paperId }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      text: `Hello! I'm your AI research assistant. Ask me any questions about "${paperTitle || 'this research paper'}" and I'll do my best to help you understand it.`,
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSources, setExpandedSources] = useState<Record<string, string | null>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
      timestamp: new Date()
    };
    
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await sendChatMessage(paperId, { query: userMessage.text });
      
      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: response.response,
        sender: 'bot',
        timestamp: new Date(),
        sources: response.sources
      };
      
      setMessages(prevMessages => [...prevMessages, botMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while sending your message');
      console.error('Chat error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
      
      {/* Scrollable messages container with fixed positioning */}
      <div 
        className="absolute left-0 right-0 overflow-y-auto" 
        style={{
          top: headerHeight,
          bottom: formHeight,
        }}
      >
        <div className="p-4 space-y-4">
          {messages.map((message) => (
            <div 
              key={message.id} 
              className={cn(
                "flex",
                message.sender === 'user' ? "justify-end" : "justify-start"
              )}
            >
              <div 
                className={cn(
                  "flex items-start gap-2 max-w-[80%]",
                  message.sender === 'user' ? "flex-row-reverse" : "flex-row"
                )}
              >
                <div 
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                    message.sender === 'user' ? "bg-blue-100" : "bg-gray-100"
                  )}
                >
                  {message.sender === 'user' ? (
                    <User size={16} className="text-blue-600" />
                  ) : (
                    <Bot size={16} className="text-gray-600" />
                  )}
                </div>
                
                <div className="flex flex-col gap-2">
                  <div 
                    className={cn(
                      "py-2 px-3 rounded-lg",
                      message.sender === 'user' 
                        ? "bg-blue-600 text-white" 
                        : "bg-gray-100 text-gray-800"
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
                    <span 
                      className={cn(
                        "text-xs block mt-1",
                        message.sender === 'user' ? "text-blue-100" : "text-gray-500"
                      )}
                    >
                      {formatTime(message.timestamp)}
                    </span>
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
            disabled={isLoading}
          />
          <Button 
            type="submit" 
            disabled={!inputValue.trim() || isLoading}
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
