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
}

/**
 * Paper response from the API
 */
export interface PaperResponse {
  id: string;
  arxiv_id: string;
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
  description: string;
  thumbnail: string;
  channel: string;
  duration: string;
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
  type: LearningItemType;
  title: string;
  content: string;
  metadata: Record<string, any>;
  difficulty_level: number;
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
  front: string;
  back: string;
}

/**
 * Quiz question item from the API
 */
export interface QuestionItem {
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string;
} 