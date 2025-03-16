import { ResearcherCollectionForm } from "../../components/consulting/ResearcherCollectionForm";
import { ResearchersList } from "../../components/consulting/ResearchersList";
import { Button } from "../../components/ui/button";
import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { ResearcherData } from "../../hooks/useResearchersRealtime";

// Sample researchers with papers for quick form filling
interface ExampleResearcher {
  name: string;
  affiliation: string;
  position: string;
  paper_title: string;
  email?: string;
  researcher_id?: string;
}

const exampleResearchers: ExampleResearcher[] = [
  {
    name: "Yoshua Bengio",
    affiliation: "University of Montreal",
    position: "Full Professor",
    paper_title: "Deep Learning"
  },
  {
    name: "Geoffrey Hinton",
    affiliation: "University of Toronto",
    position: "Professor Emeritus",
    paper_title: "Learning representations by back-propagating errors"
  },
  {
    name: "Andrew Ng",
    affiliation: "Stanford University",
    position: "Professor",
    paper_title: "Building High-level Features Using Large Scale Unsupervised Learning"
  },
  {
    name: "Danqi Chen",
    affiliation: "Princeton University",
    position: "Assistant Professor",
    paper_title: "Reading Wikipedia to Answer Open-Domain Questions"
  },
  {
    name: "Jennifer Doudna",
    affiliation: "UC Berkeley",
    position: "Professor",
    paper_title: "A programmable dual-RNA-guided DNA endonuclease in adaptive bacterial immunity"
  }
];

export default function Playground() {
  const [selectedResearcher, setSelectedResearcher] = useState<ExampleResearcher | null>(null);
  const [formValues, setFormValues] = useState({
    name: "",
    affiliation: "",
    position: "",
    paper_title: "",
    email: "",
    researcher_id: ""
  });
  
  // Function to fill the form with researcher data
  const fillForm = (researcher: ExampleResearcher) => {
    setSelectedResearcher(researcher);
    setFormValues({
      ...formValues,
      name: researcher.name,
      affiliation: researcher.affiliation,
      position: researcher.position,
      paper_title: researcher.paper_title,
      email: researcher.email || "",
      researcher_id: researcher.researcher_id || ""
    });
  };

  // Function to fill the form with data from the database
  const fillFormFromDatabase = (researcher: ResearcherData) => {
    setFormValues({
      name: researcher.name || "",
      affiliation: typeof researcher.affiliation === 'string' ? researcher.affiliation : 
                 (researcher.affiliation?.institution || ""),
      position: researcher.position || "",
      paper_title: "",  // Database researchers might not have a paper title
      email: researcher.email || "",
      researcher_id: researcher.id || ""
    });
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Researcher Data Collection</h1>
      <p className="mb-8 text-gray-600">
        Use this page to collect and enrich researcher data from external APIs and view all researchers in the database with real-time updates.
      </p>
      
      <Tabs defaultValue="form" className="space-y-8">
        <TabsList className="mb-4">
          <TabsTrigger value="form">Collect Data</TabsTrigger>
          <TabsTrigger value="database">Database View</TabsTrigger>
        </TabsList>
        
        <TabsContent value="form" className="space-y-8">
          <div className="mb-6 border-l-4 border-blue-500 bg-blue-50 p-4">
            <h2 className="text-lg font-semibold text-blue-700 mb-2">Realtime Processing</h2>
            <p className="mb-2">
              Researcher data collection now happens entirely in the background with realtime updates. 
              When you submit a request, you'll immediately see a progress indicator, and data will 
              appear as it's collected (typically takes 2-5 minutes).
            </p>
            
            <div className="mb-4 p-3 rounded border border-amber-300 bg-amber-50">
              <h3 className="font-medium text-amber-800 mb-1">Before Testing</h3>
              <p className="text-sm text-amber-700">
                Ensure the backend API is running and accessible at <code className="px-1 py-0.5 bg-amber-100 rounded">http://localhost:8000</code>.
                Also verify that Supabase realtime channels are enabled for the researchers table.
              </p>
            </div>
            
            <h3 className="font-medium mb-2">Quick Fill Examples:</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {exampleResearchers.map((researcher, index) => (
                <Button 
                  key={index} 
                  variant="outline" 
                  onClick={() => fillForm(researcher)}
                  className={selectedResearcher?.name === researcher.name ? "bg-blue-100 border-blue-400" : ""}
                >
                  {researcher.name}
                </Button>
              ))}
            </div>
            
            <div className="mt-4 text-yellow-700 bg-yellow-50 p-2 rounded">
              <p><strong>Note:</strong> The APIs have rate limits. Please wait a few minutes between requests.</p>
            </div>
          </div>
          
          <ResearcherCollectionForm defaultValues={formValues} />
        </TabsContent>
        
        <TabsContent value="database">
          <ResearchersList limit={25} onSelectResearcher={fillFormFromDatabase} />
        </TabsContent>
      </Tabs>
    </div>
  );
} 