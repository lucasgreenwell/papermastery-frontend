
import React, { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link2, Upload, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PaperUploadFormProps {
  onSubmit: (input: string, type: 'url' | 'file') => Promise<void>;
}

const PaperUploadForm = ({ onSubmit }: PaperUploadFormProps) => {
  const [inputValue, setInputValue] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim()) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid arXiv URL",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      await onSubmit(inputValue, 'url');
      setInputValue('');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload paper. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a PDF file to upload",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // In a real implementation, you'd have a way to convert File to string URL
      // For now, we'll just use the filename
      await onSubmit(file.name, 'file');
      setFile(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload paper. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
      <h2 className="text-xl font-semibold mb-4">Upload a Paper</h2>
      
      <Tabs defaultValue="url" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="url">arXiv URL</TabsTrigger>
          <TabsTrigger value="file">PDF Upload</TabsTrigger>
        </TabsList>
        
        <TabsContent value="url">
          <form onSubmit={handleUrlSubmit} className="space-y-4">
            <div className="flex items-center space-x-2">
              <Link2 size={20} className="text-gray-400" />
              <Input
                placeholder="Paste arXiv URL here (e.g., https://arxiv.org/abs/2104.08672)"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={isLoading}
                className="flex-1"
              />
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
        </TabsContent>
        
        <TabsContent value="file">
          <form onSubmit={handleFileSubmit} className="space-y-4">
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
              <Upload size={36} className="mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-500 mb-4">
                Drag and drop your PDF here, or click to browse
              </p>
              
              <Input
                type="file"
                accept=".pdf"
                id="file-upload"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setFile(e.target.files[0]);
                  }
                }}
                disabled={isLoading}
              />
              
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('file-upload')?.click()}
                disabled={isLoading}
              >
                Browse Files
              </Button>
              
              {file && (
                <div className="mt-4 text-sm text-gray-700">
                  Selected: {file.name}
                </div>
              )}
            </div>
            
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !file}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Upload PDF"
              )}
            </Button>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PaperUploadForm;
