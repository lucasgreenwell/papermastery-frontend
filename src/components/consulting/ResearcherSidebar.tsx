import React, { useState } from 'react';
import { GraduationCap, Mail, ExternalLink, InfoIcon, Check, User } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Separator } from '../ui/separator';
import { Skeleton } from '../ui/skeleton';
import { Badge } from '../ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { ScrollArea } from '../ui/scroll-area';

export interface Researcher {
  id: string;
  name: string;
  email: string;
  bio?: string;
  expertise?: string[];
  rate: number;
  verified: boolean;
  isAuthor?: boolean;
}

interface Paper {
  id: string;
  title: string;
  authors?: string[];
  abstract?: string;
  // Add other fields as needed
}

interface ResearcherSidebarProps {
  loading: boolean;
  error: string | null;
  researchers: Researcher[];
  selectedResearcher: string | null;
  onSelectResearcher: (researcherId: string) => void;
  paper: Paper | null;
  hasSubscription?: boolean;
}

// Improve type safety by defining a specific type for authors
interface PaperAuthor {
  name: string;
  affiliations?: string[];
}

type AuthorType = string | PaperAuthor;

interface ProcessedAuthor {
  name: string;
  inPlatform: boolean;
}

const ResearcherSidebar = ({
  loading,
  error,
  researchers,
  selectedResearcher,
  onSelectResearcher,
  paper,
  hasSubscription = true, // Default to true since we're assuming all users are subscribed
}: ResearcherSidebarProps) => {
  const [outreachRequested, setOutreachRequested] = useState<Record<string, boolean>>({});
  
  // Function to extract authors from paper
  const extractAuthors = () => {
    if (!paper || !paper.authors) return [];
    return paper.authors.map((author: AuthorType) => {
      // Handle case where author is an object with name property
      const authorName = typeof author === 'object' && author !== null ? author.name : author;
      return {
        name: authorName,
        inPlatform: researchers.some(r => r.name === authorName),
      };
    });
  };
  
  const authors = extractAuthors();
  
  const handleOutreachRequest = (authorName: string) => {
    // In a real application, you'd make an API call here
    setOutreachRequested(prev => ({ ...prev, [authorName]: true }));
    
    // Simulated: Instantly create a default researcher after request
    const newResearcher: Researcher = {
      id: `auto-${Date.now()}`,
      name: authorName,
      email: `${authorName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
      bio: `Researcher in the field related to this paper.`,
      expertise: ['Research', 'Academic Writing'],
      rate: 35,
      verified: true,
      isAuthor: true
    };
    
    // Simulate adding the researcher to the list
    setTimeout(() => {
      alert(`Outreach request for ${authorName} processed. Researcher will appear in the list when the API endpoint is implemented.`);
    }, 1000);
  };

  // Loading state with skeleton UI
  if (loading) {
    return (
      <Card className="h-full border-gray-200 flex flex-col">
        <CardHeader className="px-4 py-3 border-b border-gray-100 flex-shrink-0">
          <CardTitle className="text-lg flex items-center gap-2 text-gray-800">
            <GraduationCap className="h-5 w-5 text-blue-600" />
            <span>Available Experts</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 flex-grow">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col gap-2">
                <div className="space-y-1 flex-1">
                  <Skeleton className="h-4 w-3/5" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
                <Skeleton className="h-8 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="h-full border-gray-200 flex flex-col">
        <CardHeader className="px-4 py-3 border-b border-gray-100 flex-shrink-0">
          <CardTitle className="text-lg flex items-center gap-2 text-gray-800">
            <GraduationCap className="h-5 w-5 text-blue-600" />
            <span>Available Experts</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 flex-grow flex items-center">
          <div className="text-red-500 bg-red-50 p-3 rounded-md text-xs flex items-center w-full">
            <div>Error loading researchers: {error}</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Main content
  return (
    <Card className="h-full border-gray-200 flex flex-col">
      <CardHeader className="px-5 py-4 border-b border-gray-100 flex-shrink-0">
        <CardTitle className="text-lg flex items-center gap-2 text-gray-800">
          <GraduationCap className="h-5 w-5 text-blue-600" />
          <span>Available Experts</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex-grow overflow-hidden">
        <ScrollArea className="h-full">
          <div className="px-5 py-4 space-y-4">
            {/* Available Platform Researchers */}
            {researchers.length > 0 && (
              <div className="space-y-4">
                {researchers.map((researcher) => (
                  <div key={researcher.id} className="p-3 rounded-xl border border-gray-200 hover:border-blue-200 transition-colors shadow-sm">
                    <div className="flex-1 mb-3">
                      <div className="flex items-center flex-wrap gap-1.5 mb-1">
                        <h4 className="font-medium text-sm text-gray-800 mr-1">{researcher.name}</h4>
                        
                        {researcher.verified && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <span className="inline-flex items-center bg-blue-50 border border-blue-200 text-blue-700 h-5 px-2 whitespace-nowrap rounded-full text-[10px] font-medium">
                                  <Check size={10} className="mr-0.5" /> Verified
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs">This expert's identity has been verified</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        
                        {researcher.isAuthor && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <span className="inline-flex items-center bg-purple-50 border border-purple-200 text-purple-700 h-5 px-2 whitespace-nowrap rounded-full text-[10px] font-medium">
                                  <User size={10} className="mr-0.5" /> Author
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs">Author of this paper</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <p className="text-xs text-blue-700 font-medium">${researcher.rate}/15 min</p>
                        
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-full hover:bg-gray-100">
                                <InfoIcon size={12} />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-[240px]">
                              <div>
                                <p className="font-medium text-xs">{researcher.name}</p>
                                <p className="text-xs mt-1 text-gray-600">
                                  {researcher.bio || "Expert in this field with relevant experience."}
                                </p>
                                {researcher.expertise && (
                                  <div className="mt-2 flex flex-wrap gap-1">
                                    {researcher.expertise.map((exp, idx) => (
                                      <span key={idx} className="inline-block bg-gray-100 text-gray-800 text-[10px] px-1.5 py-0.5 rounded">
                                        {exp}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                    
                    <Button
                      size="sm"
                      className={`w-full text-xs rounded-lg py-2 h-auto
                        ${selectedResearcher === researcher.id 
                          ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm' 
                          : 'bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-300 text-gray-700'}`}
                      onClick={() => onSelectResearcher(researcher.id)}
                    >
                      {selectedResearcher === researcher.id ? 'Selected' : 'Select Expert'}
                    </Button>
                  </div>
                ))}
              </div>
            )}
            
            {/* Separator if we have both sections */}
            {researchers.length > 0 && authors.length > 0 && (
              <Separator className="my-5" />
            )}
            
            {/* Paper Authors */}
            {authors.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xs font-semibold text-gray-500 border-b border-gray-100 pb-2">
                  Paper Authors
                </h3>
                
                {authors.map((author: ProcessedAuthor, idx) => (
                  <div key={idx} className="p-3 rounded-xl border border-gray-200 hover:border-blue-200 transition-colors shadow-sm">
                    <div className="flex-1 mb-2">
                      <div className="flex items-center flex-wrap gap-1.5">
                        <h4 className="font-medium text-sm text-gray-800 mr-1">{author.name}</h4>
                        
                        {author.inPlatform && (
                          <span className="inline-flex items-center bg-green-50 border border-green-200 text-green-700 h-5 px-2 whitespace-nowrap rounded-full text-[10px] font-medium">
                            Available
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {author.inPlatform ? (
                      <p className="text-[11px] text-green-700 bg-green-50 p-2 rounded-lg mb-2">
                        This author is available for booking on our platform.
                      </p>
                    ) : outreachRequested[author.name] ? (
                      <div className="flex items-center gap-1.5 text-amber-600 text-[11px] bg-amber-50 p-2 rounded-lg mb-2">
                        <Check size={12} />
                        <span>Outreach request sent</span>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-[11px] h-auto py-1.5 rounded-lg border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                        onClick={() => handleOutreachRequest(author.name)}
                      >
                        <Mail className="mr-1.5 h-3 w-3" />
                        Request Consultation
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {/* Empty state */}
            {researchers.length === 0 && authors.length === 0 && (
              <div className="py-10 px-5 text-center">
                <GraduationCap className="h-8 w-8 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-sm mb-4">No experts available at this time.</p>
                <Button asChild variant="outline" size="sm" className="text-xs rounded-lg">
                  <a href="/consulting/experts">
                    View All Experts
                  </a>
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default ResearcherSidebar; 