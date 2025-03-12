import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Send, Bot, User, Loader2, AlertCircle } from 'lucide-react';
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

  return (
    <div className={cn("flex flex-col h-full rounded-lg border border-gray-200 bg-white", className)}>
      {title && (
        <div className="py-3 px-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Bot size={18} className="text-blue-600" />
            {title}
          </h3>
        </div>
      )}
      
      <div className="flex-1 overflow-y-auto p-4 pb-0">
        {messages.map((message) => (
          <div 
            key={message.id} 
            className={cn(
              "mb-4 flex",
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
              
              <div 
                className={cn(
                  "py-2 px-3 rounded-lg",
                  message.sender === 'user' 
                    ? "bg-blue-600 text-white" 
                    : "bg-gray-100 text-gray-800"
                )}
              >
                <p className="text-sm">{message.text}</p>
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
                <div className="mt-2 text-xs text-gray-500">
                  <p className="font-medium">Sources:</p>
                  {message.sources.map((source, index) => (
                    <p key={source.chunk_id} className="mt-1">
                      {source.text.substring(0, 150)}...
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex items-center gap-2 text-gray-500 mb-4">
            <Loader2 size={16} className="animate-spin" />
            <span className="text-sm">AI is thinking...</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-red-500 mb-4">
            <AlertCircle size={16} />
            <span className="text-sm">{error}</span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      <form 
        onSubmit={handleSendMessage}
        className="px-4 py-3 border-t border-gray-200 mt-auto flex-shrink-0"
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
