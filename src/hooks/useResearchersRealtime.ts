import { useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';

// Define a type for the researcher data structure
export interface ResearcherData {
  id: string;
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
  [key: string]: unknown;
}

interface ResearchersRealtimeResult {
  researchers: ResearcherData[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export function useResearchersRealtime(limit: number = 10): ResearchersRealtimeResult {
  const [researchers, setResearchers] = useState<ResearcherData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    setLoading(true);
    
    // Set up Supabase realtime subscription for the entire researchers table
    const subscription = supabase
      .channel('researchers-list')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'researchers',
        },
        () => {
          // When any change happens, refresh the entire list
          fetchResearchers();
        }
      )
      .subscribe();
    
    // Initial fetch of all researchers
    const fetchResearchers = async () => {
      try {
        const { data, error } = await supabase
          .from('researchers')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(limit);
          
        if (error) {
          throw error;
        }
        
        if (data) {
          setResearchers(data as ResearcherData[]);
          setLastUpdated(new Date());
        }
      } catch (err: unknown) {
        console.error('Error fetching researchers:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    
    fetchResearchers();
    
    // Cleanup
    return () => {
      subscription.unsubscribe();
    };
  }, [limit]);
  
  return { researchers, loading, error, lastUpdated };
} 