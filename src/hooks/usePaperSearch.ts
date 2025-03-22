import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PaperResponse } from '@/services/types';
import { useToast } from '@/hooks/use-toast';

interface UsePaperSearchReturn {
  searchResults: PaperResponse[];
  isSearching: boolean;
  error: Error | null;
  search: (query: string) => Promise<void>;
}

// Debounce helper function
const debounce = <F extends (...args: any[]) => any>(func: F, waitFor: number) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<F>): Promise<ReturnType<F>> => {
    if (timeout) {
      clearTimeout(timeout);
    }

    return new Promise(resolve => {
      timeout = setTimeout(() => {
        resolve(func(...args));
      }, waitFor);
    });
  };
};

// Client-side search helper
const clientSideSearch = (papers: PaperResponse[], query: string): PaperResponse[] => {
  const lowercaseQuery = query.toLowerCase();
  return papers.filter(paper => {
    // Check title
    if (paper.title.toLowerCase().includes(lowercaseQuery)) {
      return true;
    }
    
    // Check authors
    if (paper.authors && Array.isArray(paper.authors)) {
      const hasMatchingAuthor = paper.authors.some(author => {
        if (typeof author === 'string') {
          return author.toLowerCase().includes(lowercaseQuery);
        }
        if (author && author.name) {
          return author.name.toLowerCase().includes(lowercaseQuery);
        }
        return false;
      });
      
      if (hasMatchingAuthor) {
        return true;
      }
    }
    
    // No match in title or authors
    return false;
  });
};

export function usePaperSearch(): UsePaperSearchReturn {
  const [searchResults, setSearchResults] = useState<PaperResponse[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();
  const lastQueryRef = useRef<string>('');
  const lastResultsRef = useRef<PaperResponse[]>([]);
  const allPapersRef = useRef<PaperResponse[]>([]);

  // Fetch all papers initially and store them for client-side filtering
  useEffect(() => {
    const fetchAllPapers = async () => {
      try {
        const { data, error } = await supabase
          .from('papers')
          .select('*');
          
        if (error) throw error;
        
        if (data) {
          allPapersRef.current = data as PaperResponse[];
        }
      } catch (err) {
        console.error('Error fetching all papers for search:', err);
      }
    };
    
    fetchAllPapers();
    
    return () => {
      setSearchResults([]);
    };
  }, []);

  // Create a debounced search function to avoid too many requests
  const debouncedSearch = useCallback(
    debounce(async (query: string): Promise<void> => {
      // If query is empty, reset results
      if (!query.trim()) {
        setSearchResults([]);
        return;
      }

      // Skip if query hasn't changed and we already have results
      if (query === lastQueryRef.current && lastResultsRef.current.length > 0) {
        return;
      }

      setIsSearching(true);
      setError(null);
      lastQueryRef.current = query;

      try {
        // First, try client-side filtering on the papers we already have
        const clientResults = clientSideSearch(allPapersRef.current, query);
        
        // If we found results with client-side filtering, return those
        if (clientResults.length > 0) {
          lastResultsRef.current = clientResults;
          setSearchResults(clientResults);
          setIsSearching(false);
          return;
        }

        // If no client-side results, try server-side title search
        const { data: titleResults, error: titleError } = await supabase
          .from('papers')
          .select('*')
          .ilike('title', `%${query}%`);

        if (titleError) throw titleError;

        // If we found results in titles, return those
        if (titleResults && titleResults.length > 0) {
          lastResultsRef.current = titleResults as PaperResponse[];
          setSearchResults(titleResults as PaperResponse[]);
          setIsSearching(false);
          return;
        }

        // If no results in titles, try full text search
        const { data: fullTextResults, error: fullTextError } = await supabase
          .from('papers')
          .select('*')
          .textSearch('full_text', query, {
            type: 'plain',  // Use plain text search for better compatibility
            config: 'english'  // Use English dictionary for stemming
          });

        if (fullTextError) throw fullTextError;

        // Return full text search results
        lastResultsRef.current = (fullTextResults || []) as PaperResponse[];
        setSearchResults((fullTextResults || []) as PaperResponse[]);
      } catch (err) {
        console.error('Search error:', err);
        setError(err as Error);
        toast({
          title: "Search Error",
          description: `Failed to search papers: ${(err as Error).message}`,
          variant: "destructive",
        });
      } finally {
        setIsSearching(false);
      }
    }, 100), // 100ms debounce delay (reduced for better responsiveness)
    [toast]
  );

  const search = useCallback(
    async (query: string): Promise<void> => {
      // Immediately update with client-side filtering for instant feedback
      if (query.trim()) {
        const instantResults = clientSideSearch(allPapersRef.current, query);
        setSearchResults(instantResults);
      } else {
        setSearchResults([]);
      }
      
      // Then do the debounced server-side search if needed
      await debouncedSearch(query);
    },
    [debouncedSearch]
  );

  return {
    searchResults,
    isSearching,
    error,
    search
  };
} 