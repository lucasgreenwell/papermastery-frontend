import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { ResearcherCollectionResponse } from "../../services/types";

// Define a type for the researcher data structure
interface ResearcherData {
  id?: string;
  name: string;
  email?: string;
  affiliation?: string | {
    institution?: string;
    department?: string;
  };
  position?: string;
  bio?: string;
  expertise?: string[] | string;
  achievements?: string[] | string;
  publications?: string[] | string | Array<{ 
    title: string; 
    venue?: string; 
    year?: number;
  }>;
  additional_emails?: string[] | string;
  collection_sources?: string[] | string;
  researcher_id?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
  collected_at?: string;
  [key: string]: unknown; // For any additional fields, using unknown instead of any
}

interface ResearcherDataDisplayProps {
  data: ResearcherCollectionResponse | { 
    success: boolean;
    message: string;
    data: ResearcherData; // Use our specific type instead of any
  };
}

export function ResearcherDataDisplay({ data }: ResearcherDataDisplayProps) {
  if (!data.success) {
    return (
      <Card className="border-red-300">
        <CardHeader>
          <CardTitle className="text-red-600">Collection Failed</CardTitle>
          <CardDescription>{data.message}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Handle both API response format and direct Supabase data
  const result = data.data as ResearcherData;
  
  // Only show the "processing started" card if we have an API response with that status
  if (result.status === "background_started") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Data Collection Started</CardTitle>
          <CardDescription>
            The data collection process has been started in the background.
            Results will be stored in the database.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-1">Name</h3>
              <p>{result.name}</p>
            </div>
            {result.affiliation && (
              <div>
                <h3 className="font-semibold mb-1">Affiliation</h3>
                {typeof result.affiliation === 'string' ? (
                  <p>{result.affiliation}</p>
                ) : (
                  <p>
                    {result.affiliation.institution || ''}
                    {result.affiliation.department ? `, ${result.affiliation.department}` : ''}
                  </p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Handle the main researcher data display (either from API or Supabase)
  return (
    <Card>
      <CardHeader>
        <CardTitle>Researcher Data</CardTitle>
        <CardDescription>{data.message || "Researcher data collected successfully"}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Name display */}
          {result.name && (
            <div>
              <h3 className="font-semibold mb-1">Name</h3>
              <p>{result.name}</p>
            </div>
          )}
          
          {/* Affiliation display - handle both string and object types */}
          {result.affiliation && (
            <div>
              <h3 className="font-semibold mb-1">Affiliation</h3>
              {typeof result.affiliation === 'string' ? (
                <p>{result.affiliation}</p>
              ) : (
                <div>
                  {result.affiliation.institution && <p><strong>Institution:</strong> {result.affiliation.institution}</p>}
                  {result.affiliation.department && <p><strong>Department:</strong> {result.affiliation.department}</p>}
                </div>
              )}
            </div>
          )}
          
          {/* Position display */}
          {result.position && (
            <div>
              <h3 className="font-semibold mb-1">Position</h3>
              <p>{result.position}</p>
            </div>
          )}

          {/* Email display */}
          {(result.email || (result.additional_emails && result.additional_emails.length > 0)) && (
            <div>
              <h3 className="font-semibold mb-1">Email</h3>
              {result.email && <p>{result.email}</p>}
              
              {result.additional_emails && result.additional_emails.length > 0 && (
                <div className="mt-1">
                  <h4 className="text-sm font-medium">Additional Emails:</h4>
                  <ul className="text-sm list-disc pl-5">
                    {(typeof result.additional_emails === 'string' 
                      ? JSON.parse(result.additional_emails) 
                      : result.additional_emails
                    ).map((email: string, index: number) => (
                      <li key={index}>{email}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          
          {/* ID display */}
          {result.id && (
            <div>
              <h3 className="font-semibold mb-1">ID</h3>
              <p className="font-mono text-sm">{result.id}</p>
            </div>
          )}
        </div>

        {/* Biography display */}
        {result.bio && (
          <div>
            <h3 className="font-semibold mb-1">Biography</h3>
            <p className="text-sm">{result.bio}</p>
          </div>
        )}

        {/* Expertise display - handle both array and JSON string */}
        {result.expertise && (
          <div>
            <h3 className="font-semibold mb-1">Expertise</h3>
            <div className="flex flex-wrap gap-2">
              {(typeof result.expertise === 'string' 
                ? JSON.parse(result.expertise) 
                : result.expertise
              ).map((item: string, index: number) => (
                <Badge key={index} variant="outline">{item}</Badge>
              ))}
            </div>
          </div>
        )}

        {/* Achievements display - handle both array and JSON string */}
        {result.achievements && (
          <div>
            <h3 className="font-semibold mb-1">Achievements</h3>
            <ul className="list-disc pl-5 text-sm space-y-1">
              {(typeof result.achievements === 'string' 
                ? JSON.parse(result.achievements) 
                : result.achievements
              ).map((item: string, index: number) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Publications display - handle various formats */}
        {result.publications && (
          <div>
            <h3 className="font-semibold mb-1">
              Publications 
              {Array.isArray(result.publications) && ` (${result.publications.length})`}
            </h3>
            <ul className="text-sm list-disc pl-5 max-h-60 overflow-y-auto pr-2 space-y-2">
              {(() => {
                let pubs = result.publications;
                
                // Parse if it's a JSON string
                if (typeof pubs === 'string') {
                  try {
                    pubs = JSON.parse(pubs);
                  } catch (e) {
                    // If parsing fails, treat as single string
                    return <li>{String(pubs)}</li>;
                  }
                }
                
                if (!Array.isArray(pubs)) {
                  return <li>No publications available</li>;
                }
                
                return pubs.map((pub: {title: string; venue?: string; year?: number} | string, index: number) => (
                  <li key={index} className="mb-1">
                    {typeof pub === 'string' ? pub : (
                      <div>
                        <span className="font-medium">{pub.title}</span>
                        {(pub.venue || pub.year) && (
                          <span className="text-gray-600">
                            {pub.venue && <> ({pub.venue})</>}
                            {pub.year && <>, {pub.year}</>}
                          </span>
                        )}
                      </div>
                    )}
                  </li>
                ));
              })()}
            </ul>
          </div>
        )}

        {/* Data sources section */}
        {result.collection_sources && (
          <div className="pt-4 border-t">
            <h3 className="font-semibold mb-1 text-sm">Data Sources</h3>
            <div className="flex flex-wrap gap-1">
              {(typeof result.collection_sources === 'string' 
                ? JSON.parse(result.collection_sources) 
                : result.collection_sources
              ).map((source: string, index: number) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {source}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        {/* Timestamps */}
        <div className="text-xs text-gray-500 pt-4 border-t">
          {result.created_at && (
            <p>Created: {new Date(result.created_at).toLocaleString()}</p>
          )}
          {result.updated_at && (
            <p>Last updated: {new Date(result.updated_at).toLocaleString()}</p>
          )}
          {result.collected_at && (
            <p>Collected at: {new Date(result.collected_at).toLocaleString()}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 