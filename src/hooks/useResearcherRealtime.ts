import { useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';
import { ResearcherCollectionResponse } from '../services/types';

// Define a more specific type for researcher data
interface ResearcherData {
  id: string;
  name: string;
  email?: string;
  affiliation?: string | {
    institution?: string;
    department?: string;
  };
  position?: string;
  bio?: string;
  expertise?: string[] | string; // Can be stored as JSON string
  achievements?: string[] | string; // Can be stored as JSON string
  publications?: string[] | string | Array<{ title: string; venue?: string; year?: number; }>; // Can be stored in various formats
  additional_emails?: string[] | string; // Can be stored as JSON string
  collection_sources?: string[] | string; // Can be stored as JSON string
  status?: string;
  created_at?: string;
  updated_at?: string;
  collected_at?: string;
  researcher_id?: string; // Added for compatibility with API response
  [key: string]: unknown; // For any additional fields from Supabase, using unknown instead of any
}

interface ResearcherRealtimeResult {
  researcher: ResearcherData | null; // Use our specific type instead of any
  loading: boolean;
  error: string | null;
  progress: number; // 0-100% progress indicator
  lastUpdated: Date | null;
}

export function useResearcherRealtime(researcherId: string | null): ResearcherRealtimeResult {
  const [researcher, setResearcher] = useState<ResearcherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    if (!researcherId) {
      return;
    }
    
    setLoading(true);
    setProgress(10); // Initial progress indicator
    
    // Set up Supabase realtime subscription
    const subscription = supabase
      .channel(`researcher-${researcherId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'researchers',
          filter: `id=eq.${researcherId}`,
        },
        (payload) => {
          console.log('Received realtime update:', payload);
          setResearcher(payload.new as ResearcherData);
          setLastUpdated(new Date());
          setProgress(100); // Complete when we get a full update
          setLoading(false);
        }
      )
      .subscribe();
    
    // Initial fetch for current data
    const fetchInitialData = async () => {
      try {
        setProgress(30);
        const { data, error } = await supabase
          .from('researchers')
          .select('*')
          .eq('id', researcherId)
          .single();
          
        if (error) {
          throw error;
        }
        
        if (data) {
          setResearcher(data as ResearcherData);
          setProgress(data.email ? 100 : 50); // If we have email, likely complete
          setLastUpdated(new Date());
        } else {
          // If no data found, it's likely still processing
          setProgress(40);
          
          // Start a progress simulation
          const progressInterval = setInterval(() => {
            setProgress(prev => {
              const newProgress = prev + 1;
              // Don't go above 95% until we get real data
              return newProgress > 95 ? 95 : newProgress;
            });
          }, 3000); // Increment every 3 seconds
          
          return () => clearInterval(progressInterval);
        }
      } catch (err: unknown) {
        console.error('Error fetching researcher:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        setProgress(0);
      } finally {
        setLoading(false);
      }
    };
    
    fetchInitialData();
    
    // Cleanup
    return () => {
      subscription.unsubscribe();
    };
  }, [researcherId]);
  
  return { researcher, loading, error, progress, lastUpdated };
} 