import React, { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link2, Loader2 } from 'lucide-react';

interface PaperUploadFormProps {
  onSubmit: (input: string, type: 'url' | 'file') => Promise<void>;
}

const PaperUploadForm = ({ onSubmit }: PaperUploadFormProps) => {
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim()) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid URL",
        variant: "destructive"
      });
      return;
    }
    
    // Basic URL validation
    if (!inputValue.trim().startsWith('http://') && !inputValue.trim().startsWith('https://')) {
      toast({
        title: "Invalid URL",
        description: "URL must begin with http:// or https://",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      await onSubmit(inputValue, 'url');
      setInputValue('');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upload paper. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
      <h2 className="text-xl font-semibold mb-4">Upload a Paper</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center space-x-2">
          <Link2 size={20} className="text-gray-400" />
          <Input
            placeholder="Paste paper URL here (arXiv or PDF URL)"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isLoading}
            className="flex-1"
          />
        </div>
        
        <div className="text-sm text-gray-500">
          Supported formats:
          <ul className="list-disc list-inside ml-2">
            <li>arXiv links (e.g., https://arxiv.org/abs/2104.08672)</li>
            <li>Direct PDF URLs (must end with .pdf or have PDF content type)</li>
          </ul>
        </div>
        
        <Button
          type="submit"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            "Upload Paper"
          )}
        </Button>
      </form>
    </div>
  );
};

export default PaperUploadForm;
