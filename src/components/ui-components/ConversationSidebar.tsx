import React from 'react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, Clock } from 'lucide-react';
import { Conversation } from '@/types/chat';
import { cn } from '@/lib/utils';

interface ConversationSidebarProps {
  conversations: Conversation[];
  isLoading: boolean;
  currentConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
}

const ConversationSidebar = ({
  conversations,
  isLoading,
  currentConversationId,
  onSelectConversation
}: ConversationSidebarProps) => {
  const [open, setOpen] = React.useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute right-4 top-3 z-20"
          aria-label="Toggle conversation history"
        >
          <MessageSquare size={20} />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-80 sm:w-96 p-0">
        <div className="flex flex-col h-full">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Conversation History</h2>
            <p className="text-sm text-gray-500">Previous chats about this paper</p>
          </div>
          
          <ScrollArea className="flex-1 p-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-20">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                <span className="ml-2 text-sm text-gray-600">Loading conversations...</span>
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="mx-auto h-8 w-8 opacity-50 mb-2" />
                <p>No previous conversations found</p>
              </div>
            ) : (
              <div className="space-y-2">
                {conversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    onClick={() => {
                      onSelectConversation(conversation.id);
                      setOpen(false);
                    }}
                    className={cn(
                      "w-full text-left p-3 rounded-md border transition-colors",
                      currentConversationId === conversation.id
                        ? "bg-blue-50 border-blue-200"
                        : "hover:bg-gray-50 border-gray-200"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center">
                        <MessageSquare size={16} className="mr-2 text-blue-600" />
                        <span className="font-medium">Conversation</span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {conversation.id === currentConversationId && "Current"}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center text-xs text-gray-500">
                      <Clock size={12} className="mr-1" />
                      <span>{formatDate(conversation.created_at)}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ConversationSidebar; 