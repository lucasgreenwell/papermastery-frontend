import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSubscription } from '@/context/SubscriptionContext';
import { Button } from '@/components/ui/button';
import { Brain, LogOut, Search, Upload, Network, ListFilter, Loader2, ArrowDown, CreditCard } from 'lucide-react';
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
import { usePaperSearch } from '@/hooks/usePaperSearch';
import { cachePdf } from '@/utils/cacheUtils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// Subscription Actions Component
const SubscriptionActions: React.FC = () => {
  const { hasActiveSubscription, redirectToCheckout, cancelSubscription, isCancelling } = useSubscription();
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isManageSubscriptionOpen, setIsManageSubscriptionOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isFinalConfirmOpen, setIsFinalConfirmOpen] = useState(false);
  const [cancellationResult, setCancellationResult] = useState<{ success: boolean; message: string } | null>(null);
  const { toast } = useToast();
  const accountMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setIsAccountMenuOpen(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleCancelSubscription = async () => {
    try {
      const result = await cancelSubscription();
      setCancellationResult(result);
      
      if (result.success) {
        toast({
          title: "Subscription Canceled",
          description: "Your subscription has been canceled successfully. You'll have access until the end of your billing period.",
        });
        setIsFinalConfirmOpen(false);
        setIsCancelDialogOpen(false);
        setIsManageSubscriptionOpen(false);
      }
    } catch (error) {
      console.error('Error canceling subscription:', error);
      setCancellationResult({
        success: false,
        message: error instanceof Error ? error.message : 'An unexpected error occurred'
      });
    }
  };

  return (
    <>
      {/* Account Dropdown Trigger */}
      <div className="relative" ref={accountMenuRef}>
        <Button 
          variant="ghost"
          size="sm" 
          onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
          className="flex items-center gap-1"
        >
          <span>Account</span>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" 
            className={`transition-transform ${isAccountMenuOpen ? 'rotate-180' : ''}`}>
            <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Button>
        
        {/* Account Dropdown Menu */}
        {isAccountMenuOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200">
            <button 
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => {
                setIsManageSubscriptionOpen(true);
                setIsAccountMenuOpen(false);
              }}
            >
              Manage Account
            </button>
            
            {/* Add other account options here */}
          </div>
        )}
      </div>
      
      {/* Account Management Dialog */}
      <Dialog open={isManageSubscriptionOpen} onOpenChange={setIsManageSubscriptionOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Account Management</DialogTitle>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="border rounded-md p-4">
              <h3 className="font-medium mb-2">Subscription Status</h3>
              {hasActiveSubscription ? (
                <>
                  <p className="text-sm text-green-600 mb-4">
                    You have an active Premium subscription.
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-gray-600"
                    onClick={() => {
                      setIsCancelDialogOpen(true);
                      setIsManageSubscriptionOpen(false);
                    }}
                  >
                    Manage Subscription
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-sm text-gray-600 mb-4">
                    You don't have an active Premium subscription.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-blue-600 border-blue-200 hover:bg-blue-50"
                    onClick={() => redirectToCheckout()}
                  >
                    Subscribe ($10/mo)
                  </Button>
                </>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsManageSubscriptionOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Subscription Cancellation Dialog */}
      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Subscription</DialogTitle>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="font-medium mb-2">Current Plan</h3>
              <p className="text-sm text-gray-600 mb-1">Premium Subscription</p>
              <p className="text-sm text-gray-600">$10/month</p>
            </div>
            
            <div className="border-t pt-4">
              <h4 className="text-sm text-gray-500 mb-4">Subscription Options</h4>
              <Button 
                variant="outline" 
                className="text-red-600 border-gray-200"
                onClick={() => {
                  setIsFinalConfirmOpen(true);
                  setIsCancelDialogOpen(false);
                }}
              >
                Cancel Subscription
              </Button>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsCancelDialogOpen(false)}>
              Back
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Final Cancellation Confirmation Dialog */}
      <Dialog open={isFinalConfirmOpen} onOpenChange={setIsFinalConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Subscription</DialogTitle>
            <DialogDescription>
              Are you absolutely sure you want to cancel your Premium subscription?
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-sm text-gray-500 mb-2">
              This action cannot be undone. Your subscription will be canceled, but:
            </p>
            <ul className="text-sm text-gray-500 space-y-1 list-disc ml-5">
              <li>You'll continue to have access until the end of your current billing period</li>
              <li>You won't be charged again after this period ends</li>
              <li>You can resubscribe at any time</li>
            </ul>
          </div>
          
          {cancellationResult && !cancellationResult.success && (
            <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm mb-4">
              Error: {cancellationResult.message}
            </div>
          )}
          
          <DialogFooter className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsFinalConfirmOpen(false);
                setIsCancelDialogOpen(true);
              }}
            >
              Keep Subscription
            </Button>
            <Button 
              variant="destructive"
              onClick={handleCancelSubscription}
              disabled={isCancelling}
            >
              {isCancelling ? 'Cancelling...' : 'Yes, Cancel Subscription'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

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
  
  // Use our paper search hook
  const { searchResults, isSearching, error: searchError, search } = usePaperSearch();

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

      // Safety check: Only cache if we got a valid response with an ID
      if (response && response.id) {
        // Normalize the URL if it's an arXiv abstract URL before caching
        let contentToCache = cachedContent;
        if (type === 'url' && typeof cachedContent === 'string' && cachedContent.includes('arxiv.org/abs/')) {
          try {
            const arxivId = cachedContent.split('arxiv.org/abs/')[1].split(/[?#]/)[0];
            const normalizedUrl = `https://arxiv.org/pdf/${arxivId}.pdf`;
            console.log('Normalized arXiv URL before caching:', normalizedUrl);
            contentToCache = normalizedUrl;
          } catch (error) {
            console.error('Error normalizing arXiv URL for caching:', error);
            // Continue with original URL if normalization fails
          }
        }
        
        // Cache the content using IndexedDB
        try {
          await cachePdf(response.id, type, contentToCache);
          console.log(`Content cached successfully for paper ${response.id}`);
        } catch (cacheError) {
          console.error('Failed to cache content:', cacheError);
          
          // Fallback to localStorage for URL caching if IndexedDB fails
          if (type === 'url') {
            try {
              localStorage.setItem(`paper_${response.id}_content_type`, type);
              localStorage.setItem(`paper_${response.id}_content`, contentToCache as string);
              console.log('Fallback: URL cached in localStorage');
            } catch (localStorageError) {
              console.error('Failed to cache in localStorage:', localStorageError);
              // Continue even if caching fails entirely - it's not critical for operation
            }
          }
        }
        
        // Create a paper object with minimal information
        const newPaper: PaperResponse = {
          id: response.id,
          title: "Processing...",
          authors: [],
          abstract: "",
          publication_date: new Date().toISOString(),
          source_url: type === 'url' ? input as string : "",
          source_type: type === 'url' ? (isArxivUrl(input as string) ? 'arxiv' : 'pdf') : 'other',
          tags: []
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
      } else {
        // Handle case where response is missing or doesn't have an ID
        throw new Error("Invalid response from server - missing paper ID");
      }
    } catch (err: unknown) {
      console.error('Error uploading paper:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload paper';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle search input changes
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.trim()) {
      search(query);
    }
    // We don't need to reset search results when query is empty
    // The hook will handle that internally
  };

  // Clear search and reset to normal paper list
  const clearSearch = () => {
    setSearchQuery('');
    // No need to reset search results here, just clearing the query will
    // cause the hook to reset results internally
  };
  
  // Determine which papers to display based on search state
  const displayedPapers = searchQuery.trim() ? searchResults : papers;

  // Format papers for graph view
  const formattedPapers = displayedPapers.map(paper => ({
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
            {/* Use subscription context for subscription actions */}
            <SubscriptionActions />
            
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
                    placeholder="Search papers by title, author, or content..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={handleSearchInputChange}
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
              ) : isSearching ? (
                <div className="bg-white rounded-xl shadow-md p-8 text-center border border-gray-100">
                  <Loader2 size={24} className="mx-auto text-blue-500 mb-4 animate-spin" />
                  <h3 className="text-lg font-medium text-gray-700 mb-2">Searching papers...</h3>
                </div>
              ) : error || searchError ? (
                <div className="bg-white rounded-xl shadow-md p-8 text-center border border-gray-100">
                  <h3 className="text-lg font-medium text-red-600 mb-2">Error loading papers</h3>
                  <p className="text-gray-500 mb-4">{error || (searchError && searchError.message)}</p>
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
                  {displayedPapers.length > 0 ? (
                    displayedPapers.map(paper => (
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
                        <Button variant="outline" onClick={clearSearch}>
                          Clear search
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <PaperGraphView papers={formattedPapers.map(paper => ({
                  ...paper,
                  date: paper.publication_date || new Date().toISOString(),
                  skillLevel: 0,
                  authors: Array.isArray(paper.authors) ? paper.authors.map(author => 
                    typeof author === 'string' ? author : (author?.name || '')
                  ) : []
                }))} />
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
