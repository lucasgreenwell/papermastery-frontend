/**
 * Type definitions for API services
 */

/**
 * Author information
 */
export interface Author {
  name: string;
  affiliations: string[];
}

/**
 * Related paper information
 */
export interface RelatedPaper {
  id: string;
  title: string;
  arxiv_id?: string;
  source_url?: string;
  source_type?: 'arxiv' | 'pdf' | 'other';
}

/**
 * Paper response from the API
 */
export interface PaperResponse {
  id: string;
  arxiv_id?: string;
  source_url: string;
  source_type: 'arxiv' | 'pdf' | 'other';
  title: string;
  authors: Author[];
  abstract: string;
  publication_date: string;
  categories?: string[];
  status?: 'pending' | 'processing' | 'completed' | 'failed';
  created_at?: string;
  updated_at?: string;
  pdf_url?: string;
  related_papers?: RelatedPaper[];
  summaries?: any;
  tags?: string[];
}

/**
 * Paper submission response from the API (UUID only)
 */
export interface PaperSubmitResponse {
  id: string;
}

/**
 * API error response
 */
export interface ApiError {
  message: string;
  originalError?: any;
}

/**
 * Learning item types
 */
export type LearningItemType = 'text' | 'video' | 'flashcard' | 'quiz';

/**
 * Video item in a learning item's metadata
 */
export interface VideoItem {
  video_id: string;
  title: string;
  channel: string;
  duration?: string;
  thumbnail?: string;
}

/**
 * Quiz question in a learning item's metadata
 */
export interface QuizQuestion {
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string;
}

/**
 * Learning item from the API
 */
export interface LearningItem {
  id: string;
  paper_id: string;
  type: 'concepts' | 'methodology' | 'results' | 'video' | 'quiz' | 'flashcard' | 'summary' | 'slides';
  title: string;
  content: string;
  metadata: any;
  created_at: string;
  updated_at: string;
}

/**
 * Learning path from the API
 */
export interface LearningPath {
  id: string;
  paper_id: string;
  title: string;
  description: string;
  items: LearningItem[];
  created_at: string;
  estimated_time_minutes: number;
}

/**
 * User progress record from the API
 */
export interface UserProgressRecord {
  user_id: string;
  item_id: string;
  status: string;
  time_spent_seconds: number;
  timestamp: string;
}

/**
 * Answer result from the API
 */
export interface AnswerResult {
  is_correct: boolean;
  correct_answer: number;
  explanation: string;
  user_id: string;
  question_id: string;
  selected_answer: number;
  timestamp: string;
}

/**
 * Flashcard item from the API
 */
export interface CardItem {
  id: string;
  paper_id: string;
  front: string;
  back: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  created_at?: string;
  updated_at?: string;
}

/**
 * Quiz question item from the API
 */
export interface QuestionItem {
  id: string;
  paper_id: string;
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  created_at?: string;
  updated_at?: string;
}

// Researcher Collection Types
export interface ResearcherCollectionRequest {
  name: string;
  affiliation?: string;
  paper_title?: string;
  position?: string;
  email?: string;
  researcher_id?: string;
  run_in_background?: boolean;
}

export interface ResearcherPublication {
  title: string;
  details: string;
}

export interface ResearcherCollectionResponse {
  success: boolean;
  message: string;
  data: {
    status: string;
    researcher_id?: string;
    name: string;
    email?: string;
    additional_emails?: string[];
    affiliation?: string | { 
      institution?: string;
      department?: string;
    };
    position?: string;
    expertise?: string[];
    achievements?: string[];
    bio?: string;
    publications?: string[] | Array<{ 
      title: string; 
      venue?: string; 
      year?: number;
    }>;
    collection_sources?: string[];
    collected_at?: string;
  }
} 