import React, { useState, useRef, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link2, Loader2, Upload, ExternalLink } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { papersAPI } from "@/services/papersAPI";
import { PaperResponse, PaperSubmitResponse } from "@/services/types";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { cachePdf } from "@/utils/cacheUtils";

interface PaperUploadFormProps {
  onSubmit: (input: string | File, type: 'url' | 'file') => Promise<PaperSubmitResponse>;
  sampleUrl?: string | null;
}

const PaperUploadForm = ({ onSubmit, sampleUrl }: PaperUploadFormProps) => {
  const [inputValue, setInputValue] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'url' | 'file'>('url');
  const [userPapers, setUserPapers] = useState<PaperResponse[]>([]);
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);
  const [duplicatePaper, setDuplicatePaper] = useState<PaperResponse | null>(null);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Load user's papers when component mounts
  useEffect(() => {
    const loadUserPapers = async () => {
      try {
        const papers = await papersAPI.listPapers();
        setUserPapers(papers);
      } catch (error) {
        console.error('Error fetching user papers:', error);
      }
    };

    loadUserPapers();
  }, []);

  // Use the sampleUrl when it changes
  useEffect(() => {
    if (sampleUrl) {
      setInputValue(sampleUrl);
      setActiveTab('url'); // Switch to URL tab when a sample URL is provided
    }
  }, [sampleUrl]);

  // Check if a URL exists in the user's library
  const checkForExistingPaper = (url: string): PaperResponse | null => {
    // Normalize URL for comparison (remove trailing slashes, etc.)
    const normalizedUrl = url.trim().toLowerCase().replace(/\/$/, '');
    
    // Check if any paper in the user's library has a matching source_url
    const existingPaper = userPapers.find(paper => {
      if (!paper.source_url) return false;
      const paperUrl = paper.source_url.trim().toLowerCase().replace(/\/$/, '');
      return paperUrl === normalizedUrl;
    });
    
    return existingPaper || null;
  };

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim()) {
      toast({
        title: "Empty input",
        description: "Please enter a URL",
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
    
    // Check for duplicate papers
    setIsCheckingDuplicate(true);
    const existingPaper = checkForExistingPaper(inputValue);
    setIsCheckingDuplicate(false);

    if (existingPaper) {
      // Paper already exists in user's library
      setDuplicatePaper(existingPaper);
      setShowDuplicateDialog(true);
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await onSubmit(inputValue, 'url');
      
      // Safety check before caching
      if (response && response.id) {
        // Cache the URL for future use
        try {
          await cachePdf(response.id, 'url', inputValue);
          console.log('URL cached successfully for paper:', response.id);
        } catch (cacheError) {
          console.error('Failed to cache URL:', cacheError);
          // Continue even if caching fails, it's not critical
        }
      } else {
        console.error('Invalid response from submit:', response);
      }
      
      setInputValue('');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload paper. Please try again.';
      toast({
        title: "Error",
        description: errorMessage,
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
    
    // For file uploads, we can't check for duplicates before submission
    // But we can inform users that duplicate submissions will be handled properly
    toast({
      title: "Processing PDF",
      description: "If this paper is already in your library, you'll be directed to the existing paper.",
      duration: 5000
    });
    
    setIsLoading(true);
    
    try {
      // Keep a reference to the file for caching
      const fileToCache = selectedFile;
      
      const response = await onSubmit(fileToCache, 'file');
      
      // Safety check before caching
      if (response && response.id) {
        // Cache the file for future use
        try {
          await cachePdf(response.id, 'file', fileToCache);
          console.log('File cached successfully for paper:', response.id);
        } catch (cacheError) {
          console.error('Failed to cache file:', cacheError);
          // Continue even if caching fails, it's not critical
        }
      } else {
        console.error('Invalid response from submit:', response);
      }
      
      setSelectedFile(null);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload paper. Please try again.';
      toast({
        title: "Error",
        description: errorMessage,
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

  const handleViewExistingPaper = () => {
    if (duplicatePaper) {
      setShowDuplicateDialog(false);
      navigate(`/papers/${duplicatePaper.id}`);
    }
  };

  const handleContinueSubmit = async () => {
    setShowDuplicateDialog(false);
    setIsLoading(true);
    
    try {
      const response = await onSubmit(inputValue, 'url');
      
      // Even though it's a duplicate submission, we still cache the URL
      // in case the previous cache was cleared
      try {
        await cachePdf(response.id, 'url', inputValue);
        console.log('URL cached successfully for paper:', response.id);
      } catch (cacheError) {
        console.error('Failed to cache URL:', cacheError);
      }
      
      setInputValue('');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload paper. Please try again.';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
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
                placeholder="Paste paper URL here (research paper URL)"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={isLoading || isCheckingDuplicate}
                className="flex-1"
              />
            </div>
            
            <div className="text-sm text-gray-500">
              Supported formats:
              <ul className="list-disc list-inside ml-2">
                <li>arXiv links (e.g., https://arxiv.org/abs/2104.08672)</li>
                <li>Direct PDF URLs (must end with .pdf or have PDF content type)</li>
                <li>Other research paper links</li>
              </ul>
            </div>
            
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || isCheckingDuplicate}
            >
              {isLoading || isCheckingDuplicate ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isCheckingDuplicate ? "Checking for duplicates..." : "Processing..."}
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

      {/* Duplicate Paper Dialog */}
      <Dialog open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Paper Already Exists</DialogTitle>
            <DialogDescription>
              You already have this paper in your library.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <h3 className="font-medium mb-2">{duplicatePaper?.title || 'Research Paper'}</h3>
            {duplicatePaper?.authors && duplicatePaper.authors.length > 0 && (
              <p className="text-sm text-gray-500 mb-4">
                By {Array.isArray(duplicatePaper.authors) 
                  ? duplicatePaper.authors.map(a => typeof a === 'string' ? a : a?.name).join(', ')
                  : duplicatePaper.authors}
              </p>
            )}
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowDuplicateDialog(false)}
              className="sm:order-1 order-2"
            >
              Cancel
            </Button>
            <Button 
              variant="default" 
              onClick={handleViewExistingPaper}
              className="sm:order-2 order-1 flex items-center gap-1"
            >
              <ExternalLink size={16} />
              View Existing Paper
            </Button>
            <Button 
              variant="secondary" 
              onClick={handleContinueSubmit}
              className="sm:order-3 order-3"
            >
              Submit Anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PaperUploadForm;
