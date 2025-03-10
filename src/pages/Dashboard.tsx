import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  Brain, 
  Clock, 
  List, 
  Grid, 
  Network,
  LayoutGrid 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Toggle } from '@/components/ui/toggle';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import PaperCard from '@/components/ui-components/PaperCard';
import { useToast } from '@/hooks/use-toast';
import PapersGraph from '@/components/ui-components/PapersGraph';

const Dashboard = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'graph'>('list');
  
  // Mock data for demonstration
  const papers = [
    {
      id: '1',
      title: 'Attention Is All You Need',
      authors: ['Ashish Vaswani', 'Noam Shazeer', 'Niki Parmar'],
      date: '2017-06-12',
      abstract: 'The dominant sequence transduction models are based on complex recurrent or convolutional neural networks that include an encoder and a decoder. The best performing models also connect the encoder and decoder through an attention mechanism. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely.',
      pdfUrl: 'https://arxiv.org/pdf/1706.03762.pdf',
      categories: ['deep-learning', 'nlp'],
      readingStatus: 'in-progress',
      skillLevel: 65,
    },
    {
      id: '2',
      title: 'BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding',
      authors: ['Jacob Devlin', 'Ming-Wei Chang', 'Kenton Lee', 'Kristina Toutanova'],
      date: '2018-10-11',
      abstract: 'We introduce a new language representation model called BERT, which stands for Bidirectional Encoder Representations from Transformers. Unlike recent language representation models, BERT is designed to pre-train deep bidirectional representations from unlabeled text by jointly conditioning on both left and right context in all layers.',
      pdfUrl: 'https://arxiv.org/pdf/1810.04805.pdf',
      categories: ['deep-learning', 'nlp'],
      readingStatus: 'not-started',
      skillLevel: 0,
    },
    {
      id: '3',
      title: 'GPT-3: Language Models are Few-Shot Learners',
      authors: ['Tom B. Brown', 'Benjamin Mann', 'Nick Ryder'],
      date: '2020-05-28',
      abstract: 'Recent work has demonstrated substantial gains on many NLP tasks and benchmarks by pre-training on a large corpus of text followed by fine-tuning on a specific task. While typically task-agnostic in architecture, this method still requires task-specific fine-tuning datasets of thousands or tens of thousands of examples. By contrast, humans can generally perform a new language task from only a few examples or from simple instructions.',
      pdfUrl: 'https://arxiv.org/pdf/2005.14165.pdf',
      categories: ['deep-learning', 'nlp'],
      readingStatus: 'completed',
      skillLevel: 100,
    },
    {
      id: '4',
      title: 'An Image is Worth 16x16 Words: Transformers for Image Recognition at Scale',
      authors: ['Alexey Dosovitskiy', 'Lucas Beyer', 'Alexander Kolesnikov'],
      date: '2020-10-22',
      abstract: 'While the Transformer architecture has become the de-facto standard for natural language processing tasks, its applications to computer vision remain limited. In vision, attention is either applied in conjunction with convolutional networks, or used to replace certain components of convolutional networks while keeping their overall structure in place.',
      pdfUrl: 'https://arxiv.org/pdf/2010.11929.pdf',
      categories: ['deep-learning', 'computer-vision'],
      readingStatus: 'not-started',
      skillLevel: 20,
    },
  ];
  
  // Filter papers based on search term
  const filteredPapers = papers.filter(paper => 
    paper.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    paper.authors.some(author => author.toLowerCase().includes(searchTerm.toLowerCase())) ||
    paper.abstract.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Toggle between list and graph views
  const handleViewChange = (value: string) => {
    if (value === 'list' || value === 'graph') {
      setViewMode(value);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 flex items-center justify-between">
            <div className="flex items-center">
              <Brain className="text-blue-600 mr-2" size={28} />
              <h1 className="text-xl font-bold">Paper Mastery</h1>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                Account
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6">Your Paper Library</h2>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              {/* View toggle */}
              <ToggleGroup type="single" value={viewMode} onValueChange={handleViewChange} className="flex border rounded-md">
                <ToggleGroupItem value="list" aria-label="List view">
                  <List size={18} />
                </ToggleGroupItem>
                <ToggleGroupItem value="graph" aria-label="Graph view">
                  <Network size={18} />
                </ToggleGroupItem>
              </ToggleGroup>
              
              {/* Search bar */}
              <div className="relative flex-1 min-w-[200px] sm:min-w-[300px]">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Search papers..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <Button className="flex-shrink-0" onClick={() => toast({ title: "Upload feature", description: "This feature is not implemented yet." })}>
              <Plus className="mr-2 h-4 w-4" /> Add Paper
            </Button>
          </div>
          
          <Tabs defaultValue="all">
            <TabsList className="mb-6">
              <TabsTrigger value="all">All Papers</TabsTrigger>
              <TabsTrigger value="in-progress">In Progress</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="not-started">Not Started</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="mt-0">
              {viewMode === 'list' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredPapers.map((paper) => (
                    <PaperCard
                      key={paper.id}
                      id={paper.id}
                      title={paper.title}
                      authors={paper.authors}
                      date={paper.date}
                      skillLevel={paper.skillLevel}
                    />
                  ))}
                </div>
              ) : (
                <PapersGraph />
              )}
            </TabsContent>
            
            <TabsContent value="in-progress" className="mt-0">
              {viewMode === 'list' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredPapers.filter(p => p.readingStatus === 'in-progress').map((paper) => (
                    <PaperCard
                      key={paper.id}
                      id={paper.id}
                      title={paper.title}
                      authors={paper.authors}
                      date={paper.date}
                      skillLevel={paper.skillLevel}
                    />
                  ))}
                </div>
              ) : (
                <PapersGraph />
              )}
            </TabsContent>
            
            <TabsContent value="completed" className="mt-0">
              {viewMode === 'list' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredPapers.filter(p => p.readingStatus === 'completed').map((paper) => (
                    <PaperCard
                      key={paper.id}
                      id={paper.id}
                      title={paper.title}
                      authors={paper.authors}
                      date={paper.date}
                      skillLevel={paper.skillLevel}
                    />
                  ))}
                </div>
              ) : (
                <PapersGraph />
              )}
            </TabsContent>
            
            <TabsContent value="not-started" className="mt-0">
              {viewMode === 'list' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredPapers.filter(p => p.readingStatus === 'not-started').map((paper) => (
                    <PaperCard
                      key={paper.id}
                      id={paper.id}
                      title={paper.title}
                      authors={paper.authors}
                      date={paper.date}
                      skillLevel={paper.skillLevel}
                    />
                  ))}
                </div>
              ) : (
                <PapersGraph />
              )}
            </TabsContent>
          </Tabs>
        </div>
        
        <div>
          <h2 className="text-2xl font-bold mb-6">Recent Activity</h2>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 p-2 rounded-full">
                  <Clock size={16} className="text-blue-700" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">2 hours ago</p>
                  <p className="font-medium">You reached 65% mastery on "Attention Is All You Need"</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 p-2 rounded-full">
                  <Clock size={16} className="text-blue-700" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Yesterday</p>
                  <p className="font-medium">You completed "GPT-3: Language Models are Few-Shot Learners"</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 p-2 rounded-full">
                  <Clock size={16} className="text-blue-700" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">3 days ago</p>
                  <p className="font-medium">You added "An Image is Worth 16x16 Words" to your library</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
