import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PaperResponse, LearningItem } from '@/services/types';
import { Database } from '@/integrations/supabase/types';

// Type for paper from Supabase
type SupabasePaper = Database['public']['Tables']['papers']['Row'];

// Type for learning item from Supabase
type SupabaseItem = Database['public']['Tables']['items']['Row'];

// Type for progress item from Supabase
type SupabaseProgress = Database['public']['Tables']['progress']['Row'];

export function usePaperSubscription(paperId: string) {
  const [paper, setPaper] = useState<PaperResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  // Store the initial PDF URL to maintain consistency
  const [initialPdfUrl, setInitialPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!paperId) return;
    
    setIsLoading(true);
    
    // First fetch the initial data
    const fetchInitialData = async () => {
      try {
        const { data, error } = await supabase
          .from('papers')
          .select('*')
          .eq('id', paperId)
          .single();
          
        if (error) throw error;
        
        // Transform data to match PaperResponse interface
        let pdfUrl = data.pdf_url;
        
        if (!pdfUrl) {
          if (data.source_type === 'arxiv' && data.arxiv_id) {
            pdfUrl = `https://arxiv.org/pdf/${data.arxiv_id}`;
          } else if (data.source_type === 'pdf') {
            pdfUrl = data.source_url;
          }
        }
        
        // Store the initial PDF URL
        setInitialPdfUrl(pdfUrl);
        
        setPaper({
          ...data,
          pdf_url: pdfUrl
        });
      } catch (err) {
        console.error('Error fetching paper:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch paper'));
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchInitialData();
    
    // Then set up the subscription
    const subscription = supabase
      .channel(`papers:${paperId}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'papers',
        filter: `id=eq.${paperId}`
      }, payload => {
        // Transform data to match PaperResponse interface
        const updatedData = payload.new;
        
        // Keep the initial PDF URL to avoid switching while loaded
        // Only update other fields
        setPaper(currentPaper => {
          if (!currentPaper) return null;
          
          return {
            ...updatedData,
            pdf_url: initialPdfUrl || currentPaper.pdf_url
          };
        });
      })
      .subscribe();
      
    // Clean up subscription on unmount
    return () => {
      supabase.removeChannel(subscription);
    };
  }, [paperId]);
  
  return { paper, isLoading, error };
}

export function useLearningItemsSubscription(paperId: string) {
  const [learningItems, setLearningItems] = useState<LearningItem[]>([]);
  const [videoItems, setVideoItems] = useState<LearningItem[]>([]);
  const [quizItems, setQuizItems] = useState<LearningItem[]>([]);
  const [flashcardItems, setFlashcardItems] = useState<LearningItem[]>([]);
  const [keyConceptsItems, setKeyConceptsItems] = useState<LearningItem[]>([]);
  const [methodologyItems, setMethodologyItems] = useState<LearningItem[]>([]);
  const [resultsItems, setResultsItems] = useState<LearningItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!paperId) return;
    
    setIsLoading(true);
    
    // First fetch the initial data
    const fetchInitialData = async () => {
      try {
        const { data, error } = await supabase
          .from('items')
          .select('*')
          .eq('paper_id', paperId);
          
        if (error) throw error;
        
        if (data) {
          // Process and categorize items
          const transformedItems = data.map(item => {
            // Basic transformation for all items
            const baseItem = {
              ...item,
              title: item.data?.title || '',
              content: item.data?.content || '',
              metadata: item.data?.metadata || {},
              created_at: item.created_at || new Date().toISOString(),
              updated_at: item.updated_at || new Date().toISOString()
            };
            
            // Special handling for different item types
            if (item.type === 'video') {
              // For video items - extract video info
              return {
                ...baseItem,
                // Handle case where videos might be in a different structure
                videos: item.videos || baseItem.metadata?.videos || null
              };
            } else if (item.type === 'quiz') {
              // For quiz items - ensure questions are properly structured
              return {
                ...baseItem
              };
            } else if (item.type === 'flashcard') {
              // For flashcard items - ensure cards data is accessible
              return {
                ...baseItem
              };
            }
            
            // Default case for other item types (concepts, methodology, results)
            return baseItem;
          });
          
          setLearningItems(transformedItems);
          
          // Filter items by type
          const videos = transformedItems.filter(item => item.type === 'video');
          const quizzes = transformedItems.filter(item => item.type === 'quiz');
          const cards = transformedItems.filter(item => item.type === 'flashcard');
          const concepts = transformedItems.filter(item => item.type === 'concepts');
          const methodology = transformedItems.filter(item => item.type === 'methodology');
          const results = transformedItems.filter(item => item.type === 'results');

          setVideoItems(videos);
          setQuizItems(quizzes);
          setFlashcardItems(cards);
          setKeyConceptsItems(concepts);
          setMethodologyItems(methodology);
          setResultsItems(results);
        }
      } catch (err) {
        console.error('Error fetching learning items:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch learning items'));
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchInitialData();
    
    // Then set up the subscription for new items
    const subscription = supabase
      .channel(`items:${paperId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'items',
        filter: `paper_id=eq.${paperId}` 
      }, payload => {
        const newItemRaw = payload.new;
        
        // Transform the item to match expected format - same logic as initial fetch
        let newItem = {
          ...newItemRaw,
          title: newItemRaw.data?.title || '',
          content: newItemRaw.data?.content || '',
          metadata: newItemRaw.data?.metadata || {},
          created_at: newItemRaw.created_at || new Date().toISOString(),
          updated_at: newItemRaw.updated_at || new Date().toISOString()
        };
        
        // Special handling for different item types
        if (newItemRaw.type === 'video') {
          newItem = {
            ...newItem,
            videos: newItemRaw.videos || newItem.metadata?.videos || null
          };
        }
        
        setLearningItems(current => [...current, newItem]);
        
        // Update the appropriate category
        switch (newItemRaw.type) {
          case 'video':
            setVideoItems(current => [...current, newItem]);
            break;
          case 'quiz':
            setQuizItems(current => [...current, newItem]);
            break;
          case 'flashcard':
            setFlashcardItems(current => [...current, newItem]);
            break;
          case 'concepts':
            setKeyConceptsItems(current => [...current, newItem]);
            break;
          case 'methodology':
            setMethodologyItems(current => [...current, newItem]);
            break;
          case 'results':
            setResultsItems(current => [...current, newItem]);
            break;
        }
      })
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'items',
        filter: `paper_id=eq.${paperId}` 
      }, payload => {
        const updatedItemRaw = payload.new;
        
        // Transform the item to match expected format - same logic as above
        let updatedItem = {
          ...updatedItemRaw,
          title: updatedItemRaw.data?.title || '',
          content: updatedItemRaw.data?.content || '',
          metadata: updatedItemRaw.data?.metadata || {},
          created_at: updatedItemRaw.created_at || new Date().toISOString(),
          updated_at: updatedItemRaw.updated_at || new Date().toISOString()
        };
        
        // Special handling for different item types
        if (updatedItemRaw.type === 'video') {
          updatedItem = {
            ...updatedItem,
            videos: updatedItemRaw.videos || updatedItem.metadata?.videos || null
          };
        }
        
        // Update in the main items list
        setLearningItems(current => 
          current.map(item => item.id === updatedItem.id ? updatedItem : item)
        );
        
        // Update in the appropriate category
        switch (updatedItem.type) {
          case 'video':
            setVideoItems(current => 
              current.map(item => item.id === updatedItem.id ? updatedItem : item)
            );
            break;
          case 'quiz':
            setQuizItems(current => 
              current.map(item => item.id === updatedItem.id ? updatedItem : item)
            );
            break;
          case 'flashcard':
            setFlashcardItems(current => 
              current.map(item => item.id === updatedItem.id ? updatedItem : item)
            );
            break;
          case 'concepts':
            setKeyConceptsItems(current => 
              current.map(item => item.id === updatedItem.id ? updatedItem : item)
            );
            break;
          case 'methodology':
            setMethodologyItems(current => 
              current.map(item => item.id === updatedItem.id ? updatedItem : item)
            );
            break;
          case 'results':
            setResultsItems(current => 
              current.map(item => item.id === updatedItem.id ? updatedItem : item)
            );
            break;
        }
      })
      .on('postgres_changes', { 
        event: 'DELETE', 
        schema: 'public', 
        table: 'items',
        filter: `paper_id=eq.${paperId}` 
      }, payload => {
        const deletedItem = payload.old;
        
        // Remove from main items list
        setLearningItems(current => 
          current.filter(item => item.id !== deletedItem.id)
        );
        
        // Remove from the appropriate category
        switch (deletedItem.type) {
          case 'video':
            setVideoItems(current => 
              current.filter(item => item.id !== deletedItem.id)
            );
            break;
          case 'quiz':
            setQuizItems(current => 
              current.filter(item => item.id !== deletedItem.id)
            );
            break;
          case 'flashcard':
            setFlashcardItems(current => 
              current.filter(item => item.id !== deletedItem.id)
            );
            break;
          case 'concepts':
            setKeyConceptsItems(current => 
              current.filter(item => item.id !== deletedItem.id)
            );
            break;
          case 'methodology':
            setMethodologyItems(current => 
              current.filter(item => item.id !== deletedItem.id)
            );
            break;
          case 'results':
            setResultsItems(current => 
              current.filter(item => item.id !== deletedItem.id)
            );
            break;
        }
      })
      .subscribe();
      
    // Clean up subscription on unmount
    return () => {
      supabase.removeChannel(subscription);
    };
  }, [paperId]);
  
  return { 
    learningItems, 
    videoItems,
    quizItems,
    flashcardItems,
    keyConceptsItems,
    methodologyItems,
    resultsItems,
    isLoading, 
    error 
  };
}

export function useProgressSubscription(paperId: string) {
  const [completedItems, setCompletedItems] = useState<string[]>([]);
  const [summaryCompleted, setSummaryCompleted] = useState(false);
  const [relatedPapersCompleted, setRelatedPapersCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    const fetchInitialProgress = async () => {
      setIsLoading(true);
      
      try {
        // First, fetch all items for this paper to get their IDs
        const { data: itemsData, error: itemsError } = await supabase
          .from('items')
          .select('id')
          .eq('paper_id', paperId);
          
        if (itemsError) throw itemsError;
        
        // Get the array of item IDs
        const itemIds = itemsData.map(item => item.id);
        
        // Then fetch progress records for those items
        const { data: progressData, error: progressError } = await supabase
          .from('progress')
          .select('*')
          .in('item_id', itemIds);
          
        if (progressError) throw progressError;
        
        // Process the progress data
        if (progressData && progressData.length > 0) {
          // Extract completed item IDs
          const completedItemIds = progressData
            .filter(record => record.completed)
            .map(record => record.item_id);
            
          setCompletedItems(completedItemIds);
        }
        
        // Check paper's summary and related papers completion status
        const { data: paperData, error: paperError } = await supabase
          .from('papers')
          .select('summary_completed, related_papers_completed')
          .eq('id', paperId)
          .single();
        
        if (paperError) throw paperError;
        
        if (paperData) {
          setSummaryCompleted(!!paperData.summary_completed);
          setRelatedPapersCompleted(!!paperData.related_papers_completed);
        }
        
      } catch (err) {
        console.error('Error fetching progress data:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch progress data'));
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchInitialProgress();
    
    // Set up subscription for progress changes
    const subscription = supabase
      .channel('progress-changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'progress'
      }, payload => {
        // For new progress records
        const progressRecord = payload.new as SupabaseProgress;
        
        if (progressRecord.completed) {
          // Add to completed items
          setCompletedItems(prev => [...prev, progressRecord.item_id]);
        }
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'progress'
      }, payload => {
        // For deleted progress records
        const oldRecord = payload.old as SupabaseProgress;
        
        if (oldRecord.item_id) {
          // Remove from completed items
          setCompletedItems(prev => prev.filter(id => id !== oldRecord.item_id));
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'progress'
      }, payload => {
        // For updated progress records
        const updatedRecord = payload.new as SupabaseProgress;
        
        if (updatedRecord.completed) {
          // Add to completed items if not already there
          setCompletedItems(prev => {
            if (prev.includes(updatedRecord.item_id)) return prev;
            return [...prev, updatedRecord.item_id];
          });
        } else {
          // Remove from completed items
          setCompletedItems(prev => prev.filter(id => id !== updatedRecord.item_id));
        }
      });
      
    // Set up a subscription for paper summary and related papers completion status
    const paperSubscription = supabase
      .channel('paper-completion')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'papers',
        filter: `id=eq.${paperId}`
      }, payload => {
        const updatedPaper = payload.new as { summary_completed?: boolean; related_papers_completed?: boolean };
        
        if (updatedPaper.hasOwnProperty('summary_completed')) {
          setSummaryCompleted(!!updatedPaper.summary_completed);
        }
        
        if (updatedPaper.hasOwnProperty('related_papers_completed')) {
          setRelatedPapersCompleted(!!updatedPaper.related_papers_completed);
        }
      })
      .subscribe();
      
    // Merge the subscriptions
    subscription.subscribe();
    
    // Clean up
    return () => {
      supabase.removeChannel(subscription);
      supabase.removeChannel(paperSubscription);
    };
  }, [paperId]);
  
  return {
    completedItems,
    summaryCompleted,
    relatedPapersCompleted,
    isLoading,
    error
  };
} 