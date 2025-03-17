import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Brain, LogOut, Search, Upload, Network, ListFilter, Loader2, ArrowDown } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import PaperCard from '@/components/ui-components/PaperCard';
import PaperUploadForm from '@/components/ui-components/PaperUploadForm';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import PaperGraphView from '@/components/ui-components/PaperGraphView';
import { papersAPI } from '@/services/papersAPI';
import { PaperResponse } from '@/services/types';
import { isArxivUrl } from '@/utils/urlUtils';

// Sample arXiv URLs for quick testing
const SAMPLE_ARXIV_URLS = [
  "https://arxiv.org/abs/2303.08774", // GPT-4 Technical Report
  "https://arxiv.org/abs/2405.09033", // Claude 3.5 Sonnet Technical Report
  "https://arxiv.org/abs/2106.09685", // Codex Paper
  "https://arxiv.org/abs/1706.03762", // Attention Is All You Need
  "https://arxiv.org/abs/1810.04805", // BERT
];

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'graph'>('list');
  const [papers, setPapers] = useState<PaperResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sampleUrl, setSampleUrl] = useState<string | null>(null);

  // Fetch papers on component mount
  useEffect(() => {
    const fetchPapers = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const fetchedPapers = await papersAPI.listPapers();
        setPapers(fetchedPapers);
      } catch (err: any) {
        console.error('Error fetching papers:', err);
        setError(err.message || 'Failed to fetch papers');
        toast({
          title: "Error",
          description: err.message || 'Failed to fetch papers',
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPapers();
  }, [toast]);

  const handlePaperUpload = async (input: string | File, type: 'url' | 'file') => {
    setIsSubmitting(true);

    try {
      let response;
      let cachedContent = null;
      
      if (type === 'url') {
        // Store URL in local state for caching
        cachedContent = input;
        // Submit the paper URL to the API
        response = await papersAPI.submitPaper(input as string);
      } else if (type === 'file') {
        // Store file in local state for caching
        cachedContent = input;
        // Submit the paper file to the API
        response = await papersAPI.submitPaperFile(input as File);
      } else {
        throw new Error("Unsupported upload type");
      }

      // Cache the content and ID in local storage for recovery
      localStorage.setItem(`paper_${response.id}_content_type`, type);
      if (type === 'url') {
        localStorage.setItem(`paper_${response.id}_content`, cachedContent as string);
      }
      
      // Create a paper object with minimal information
      const newPaper = {
        id: response.id,
        title: "Processing...",
        authors: [],
        abstract: "",
        publication_date: new Date().toISOString(),
        source_url: type === 'url' ? input as string : "",
        source_type: type === 'url' ? (isArxivUrl(input as string) ? 'arxiv' : 'pdf') : 'file',
        tags: { status: "processing" }
      };

      // Add to paper list and navigate to details page
      setPapers(prevPapers => [newPaper, ...prevPapers]);

      toast({
        title: "Paper submitted successfully",
        description: "Your paper is now being processed.",
      });

      // Navigate to paper details page with cached content
      navigate(`/papers/${response.id}`, { 
        state: { 
          cachedContent, 
          contentType: type 
        } 
      });
    } catch (err: any) {
      console.error('Error uploading paper:', err);
      toast({
        title: "Error",
        description: err.message || 'Failed to upload paper',
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter papers based on search query
  const filteredPapers = papers.filter(paper => {
    const searchLower = searchQuery.toLowerCase();

    // Search in title
    if (paper.title.toLowerCase().includes(searchLower)) {
      return true;
    }

    // Search in authors
    if (paper.authors.some(author => {
      if (typeof author === 'string') {
        return author.toLowerCase().includes(searchLower);
      }
      return author.name.toLowerCase().includes(searchLower);
    })) {
      return true;
    }

    return false;
  });

  // Format papers for graph view
  const formattedPapers = filteredPapers.map(paper => ({
    id: paper.id,
    title: paper.title,
    authors: paper.authors,
    x: Math.random() * 100, // Placeholder for x coordinate
    y: Math.random() * 100, // Placeholder for y coordinate
    size: 10, // Placeholder for size
  }));

  // Function to set a random sample arXiv URL
  const setSampleArxivUrl = () => {
    const randomIndex = Math.floor(Math.random() * SAMPLE_ARXIV_URLS.length);
    const url = SAMPLE_ARXIV_URLS[randomIndex];
    setSampleUrl(url);
    toast({
      title: "Sample URL added",
      description: `Added ${url} to the form`,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="w-full px-2 sm:px-4 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2">
            <Brain className="text-blue-600" size={24} />
            <span className="font-bold text-xl">Paper Mastery</span>
          </Link>

          <div className="flex items-center space-x-4">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" onClick={signOut} className="flex items-center gap-2">
                    <LogOut className="h-5 w-5" />
                    <span className="hidden sm:inline">Sign Out</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Sign Out</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </header>

      <main className="w-full px-2 sm:px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-6">My Research Papers</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-md p-4 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Upload a Paper</h2>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={setSampleArxivUrl}
                          className="flex items-center"
                        >
                          <ArrowDown className="h-4 w-4 mr-1" />
                          Test URL
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Insert a sample arXiv URL for testing</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <PaperUploadForm onSubmit={handlePaperUpload} sampleUrl={sampleUrl} />
              </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
              {/* View Toggle */}
              <div className="bg-white rounded-xl shadow-md p-4 border border-gray-100 flex justify-between items-center">
                <div className="relative flex-1 mr-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <Input
                    placeholder="Search papers by title or author..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex items-center">
                  <ToggleGroup type="single" value={viewMode} onValueChange={(value) => value && setViewMode(value as 'list' | 'graph')}>
                    <ToggleGroupItem value="list" aria-label="List view">
                      <ListFilter size={18} className="mr-2" />
                      List
                    </ToggleGroupItem>
                    <ToggleGroupItem value="graph" aria-label="Graph view">
                      <Network size={18} className="mr-2" />
                      Graph
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>
              </div>

              {/* Papers: List or Graph View */}
              {isLoading ? (
                <div className="bg-white rounded-xl shadow-md p-8 text-center border border-gray-100">
                  <Loader2 size={48} className="mx-auto text-blue-500 mb-4 animate-spin" />
                  <h3 className="text-lg font-medium text-gray-700 mb-2">Loading papers...</h3>
                  <p className="text-gray-500">Please wait while we fetch your papers.</p>
                </div>
              ) : error ? (
                <div className="bg-white rounded-xl shadow-md p-8 text-center border border-gray-100">
                  <h3 className="text-lg font-medium text-red-600 mb-2">Error loading papers</h3>
                  <p className="text-gray-500 mb-4">{error}</p>
                  <Button onClick={() => window.location.reload()}>
                    Try Again
                  </Button>
                </div>
              ) : viewMode === 'list' ? (
                <div className="space-y-4">
                  {isSubmitting && (
                    <div className="bg-blue-50 rounded-xl p-4 mb-4 flex items-center justify-center space-x-2">
                      <Loader2 size={20} className="text-blue-500 animate-spin" />
                      <span className="text-blue-700">Uploading paper...</span>
                    </div>
                  )}
                  {filteredPapers.length > 0 ? (
                    filteredPapers.map(paper => (
                      <PaperCard
                        key={paper.id}
                        id={paper.id}
                        title={paper.title}
                        authors={paper.authors}
                        publication_date={paper.publication_date}
                        skillLevel={0} // Placeholder for skill level
                      />
                    ))
                  ) : (
                    <div className="bg-white rounded-xl shadow-md p-8 text-center border border-gray-100">
                      <Upload size={48} className="mx-auto text-gray-300 mb-4" />
                      <h3 className="text-lg font-medium text-gray-700 mb-2">No papers found</h3>
                      <p className="text-gray-500 mb-4">
                        {searchQuery ? 'No papers match your search query.' : 'Start by uploading your first research paper.'}
                      </p>
                      {searchQuery && (
                        <Button variant="outline" onClick={() => setSearchQuery('')}>
                          Clear search
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <PaperGraphView papers={formattedPapers} />
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
