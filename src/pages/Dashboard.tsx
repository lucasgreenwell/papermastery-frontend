
import React, { useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Brain, LogOut, Search, Upload, Network, ListFilter } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import PaperCard from '@/components/ui-components/PaperCard';
import PaperUploadForm from '@/components/ui-components/PaperUploadForm';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import PaperGraphView from '@/components/ui-components/PaperGraphView';

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'graph'>('list');
  
  // Mock data for papers
  const [papers, setPapers] = useState([
    {
      id: '1',
      title: 'Attention Is All You Need',
      authors: ['Ashish Vaswani', 'Noam Shazeer', 'Niki Parmar'],
      date: 'June 12, 2017',
      skillLevel: 75,
    },
    {
      id: '2',
      title: 'BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding',
      authors: ['Jacob Devlin', 'Ming-Wei Chang', 'Kenton Lee', 'Kristina Toutanova'],
      date: 'October 11, 2018',
      skillLevel: 45,
    },
    {
      id: '3',
      title: 'Deep Residual Learning for Image Recognition',
      authors: ['Kaiming He', 'Xiangyu Zhang', 'Shaoqing Ren', 'Jian Sun'],
      date: 'December 10, 2015',
      skillLevel: 30,
    },
  ]);

  const handlePaperUpload = async (input: string, type: 'url' | 'file') => {
    // This would connect to your backend to process the paper
    // For now, we'll just add a mock paper to the list
    
    const newPaper = {
      id: (papers.length + 1).toString(),
      title: type === 'url' ? 'New Paper from URL' : input,
      authors: ['Author One', 'Author Two'],
      date: new Date().toLocaleDateString(),
      skillLevel: 0,
    };
    
    setPapers([newPaper, ...papers]);
    
    toast({
      title: "Paper uploaded successfully",
      description: "Your paper is now being processed.",
    });
  };

  const filteredPapers = papers.filter(paper => 
    paper.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    paper.authors.some(author => author.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Get display name - either from user metadata or fallback to email
  const displayName = user?.user_metadata?.name || user?.email || 'User';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="w-full px-2 sm:px-4 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2">
            <Brain className="text-blue-600" size={24} />
            <span className="font-bold text-xl">Paper Mastery</span>
          </Link>
          
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              Welcome, {displayName}
            </div>
            <Button variant="outline" size="sm" onClick={() => signOut()}>
              <LogOut size={16} className="mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>
      
      <main className="w-full px-2 sm:px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-6">My Research Papers</h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <PaperUploadForm onSubmit={handlePaperUpload} />
            </div>
            
            <div className="lg:col-span-2 space-y-6">
              {/* View Toggle */}
              <div className="bg-white rounded-xl shadow-md p-4 border border-gray-100 flex justify-between items-center">
                <p className="text-sm text-gray-500">
                  {viewMode === 'list' 
                    ? 'List view shows your papers in a chronological list.' 
                    : 'Graph view shows the relationship between papers.'}
                </p>
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
              
              {/* Search */}
              <div className="bg-white rounded-xl shadow-md p-4 border border-gray-100">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <Input
                    placeholder="Search papers by title or author..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              
              {/* Papers: List or Graph View */}
              {viewMode === 'list' ? (
                <div className="space-y-4">
                  {filteredPapers.length > 0 ? (
                    filteredPapers.map(paper => (
                      <PaperCard
                        key={paper.id}
                        id={paper.id}
                        title={paper.title}
                        authors={paper.authors}
                        date={paper.date}
                        skillLevel={paper.skillLevel}
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
                <PaperGraphView papers={papers} />
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
