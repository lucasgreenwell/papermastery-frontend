import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

interface MarkdownRendererProps {
  content: string;
  className?: string;
  maxHeight?: string | number;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ 
  content, 
  className,
  maxHeight 
}) => {
  return (
    <div className="relative">
      <div 
        className={cn(
          'prose prose-sm max-w-none', 
          maxHeight && 'overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 pr-2',
          className
        )}
        style={maxHeight ? { maxHeight, minHeight: maxHeight } : undefined}
      >
        <div className={maxHeight ? 'pb-12' : ''}>
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
          >
            {content}
          </ReactMarkdown>
        </div>
      </div>
      {maxHeight && (
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
      )}
    </div>
  );
};

export default MarkdownRenderer; 