import React, { useState, useRef, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link2, Loader2, Upload } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PaperUploadFormProps {
  onSubmit: (input: string | File, type: 'url' | 'file') => Promise<void>;
  sampleUrl?: string | null;
}

const PaperUploadForm = ({ onSubmit, sampleUrl }: PaperUploadFormProps) => {
  const [inputValue, setInputValue] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'url' | 'file'>('url');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Use the sampleUrl when it changes
  useEffect(() => {
    if (sampleUrl) {
      setInputValue(sampleUrl);
      setActiveTab('url'); // Switch to URL tab when a sample URL is provided
    }
  }, [sampleUrl]);

  const handleUrlSubmit = async (e: React.FormEvent) => {
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

  const handleFileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a PDF file to upload",
        variant: "destructive"
      });
      return;
    }
    
    // Check if file is a PDF
    if (selectedFile.type !== 'application/pdf' && !selectedFile.name.toLowerCase().endsWith('.pdf')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF file",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      await onSubmit(selectedFile, 'file');
      setSelectedFile(null);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  return (
    <div>
      <Tabs defaultValue="url" value={activeTab} onValueChange={(value) => setActiveTab(value as 'url' | 'file')}>
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="url">URL</TabsTrigger>
          <TabsTrigger value="file">File Upload</TabsTrigger>
        </TabsList>
        
        <TabsContent value="url">
          <form onSubmit={handleUrlSubmit} className="space-y-4">
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
        </TabsContent>
        
        <TabsContent value="file">
          <form onSubmit={handleFileSubmit} className="space-y-4">
            <div className="flex flex-col space-y-2">
              <div className="flex items-center space-x-2">
                <Upload size={20} className="text-gray-400" />
                <Input
                  type="file"
                  accept=".pdf,application/pdf"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  disabled={isLoading}
                  className="flex-1"
                />
              </div>
              {selectedFile && (
                <p className="text-sm text-green-600">
                  Selected: {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
                </p>
              )}
            </div>
            
            <div className="text-sm text-gray-500">
              Supported format:
              <ul className="list-disc list-inside ml-2">
                <li>PDF files only (.pdf)</li>
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
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PaperUploadForm;
