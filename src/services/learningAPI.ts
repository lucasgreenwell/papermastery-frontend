/**
 * Learning API service for interacting with the learning endpoints.
 */

import { api } from './apiClient';
import { 
  LearningPath, 
  LearningItem, 
  UserProgressRecord, 
  AnswerResult,
  CardItem,
  QuestionItem
} from './types';

/**
 * Learning API service
 */
export const learningAPI = {
  /**
   * Retrieves or generates a learning path for a paper.
   * 
   * @param paperId - The ID of the paper
   * @param useMockForTests - Whether to use mock data for tests
   * @returns A promise that resolves to a learning path object
   */
  async getLearningPath(paperId: string, useMockForTests: boolean = false): Promise<LearningPath> {
    return api.get<LearningPath>(`/learning/papers/${paperId}/learning-path`, {
      params: { use_mock_for_tests: useMockForTests }
    });
  },
  
  /**
   * Retrieves learning materials for a paper, optionally filtered by difficulty level.
   * 
   * @param paperId - The ID of the paper
   * @param difficultyLevel - Optional difficulty level to filter by (1-3)
   * @param useMockForTests - Whether to use mock data for tests
   * @returns A promise that resolves to an array of learning items
   */
  async getLearningMaterials(
    paperId: string, 
    difficultyLevel?: number, 
    useMockForTests: boolean = false
  ): Promise<LearningItem[]> {
    return api.get<LearningItem[]>(`/learning/papers/${paperId}/materials`, {
      params: { 
        difficulty_level: difficultyLevel,
        use_mock_for_tests: useMockForTests 
      }
    });
  },
  
  /**
   * Retrieves a specific learning item by ID.
   * 
   * @param itemId - The ID of the learning item
   * @returns A promise that resolves to a learning item object
   */
  async getLearningItem(itemId: string): Promise<LearningItem> {
    return api.get<LearningItem>(`/learning/learning-items/${itemId}`);
  },
  
  /**
   * Records a user's progress on a learning item.
   * 
   * @param itemId - The ID of the learning item
   * @param completed - Whether the item is completed
   * @returns A promise that resolves when the progress is recorded
   */
  async recordProgress(
    itemId: string, 
    completed: boolean
  ): Promise<void> {
    return api.post<void>(`/learning/learning-items/${itemId}/progress`, {
      completed
    });
  },
  
  /**
   * Records a user's progress on a paper's summary or related papers.
   * 
   * @param paperId - The ID of the paper
   * @param progressType - The type of progress ('summary' or 'related_papers')
   * @returns A promise that resolves when the progress is recorded
   */
  async recordPaperProgress(
    paperId: string,
    progressType: 'summary' | 'related_papers'
  ): Promise<void> {
    return api.post<void>(`/learning/papers/${paperId}/progress`, {
      progress_type: progressType
    });
  },
  
  /**
   * Submits an answer to a quiz question and gets feedback.
   * 
   * @param questionId - The ID of the quiz question
   * @param selectedAnswer - The index of the selected answer
   * @returns A promise that resolves to an answer result object
   */
  async submitAnswer(questionId: string, selectedAnswer: number): Promise<AnswerResult> {
    return api.post<AnswerResult>(`/learning/questions/${questionId}/answer`, {
      selected_answer: selectedAnswer
    });
  },
  
  /**
   * Retrieves a user's progress on learning materials.
   * 
   * @param paperId - Optional paper ID to filter progress by paper
   * @returns A promise that resolves to an array of user progress records
   */
  async getUserProgress(paperId?: string): Promise<UserProgressRecord[]> {
    return api.get<UserProgressRecord[]>('/learning/user/progress', {
      params: { paper_id: paperId }
    });
  },
  
  /**
   * Forces generation of a new learning path for a paper.
   * 
   * @param paperId - The ID of the paper
   * @returns A promise that resolves to a learning path object
   */
  async generateNewLearningPath(paperId: string): Promise<LearningPath> {
    return api.post<LearningPath>(`/learning/papers/${paperId}/generate-learning-path`);
  },
  
  /**
   * Retrieves flashcards for a paper.
   * 
   * @param paperId - The ID of the paper
   * @param useMockForTests - Whether to use mock data for tests
   * @returns A promise that resolves to an array of flashcard items
   */
  async getFlashcards(paperId: string, useMockForTests: boolean = false): Promise<CardItem[]> {
    return api.get<CardItem[]>(`/learning/papers/${paperId}/flashcards`, {
      params: { use_mock_for_tests: useMockForTests }
    });
  },
  
  /**
   * Retrieves quiz questions for a paper.
   * 
   * @param paperId - The ID of the paper
   * @param useMockForTests - Whether to use mock data for tests
   * @returns A promise that resolves to an array of quiz question items
   */
  async getQuizQuestions(paperId: string, useMockForTests: boolean = false): Promise<QuestionItem[]> {
    return api.get<QuestionItem[]>(`/learning/papers/${paperId}/quiz-questions`, {
      params: { use_mock_for_tests: useMockForTests }
    });
  },
  
  /**
   * Retrieves a user's answers to quiz questions.
   * 
   * @param paperId - Optional paper ID to filter answers by paper
   * @returns A promise that resolves to an array of user answers with question details
   */
  async getUserAnswers(paperId?: string): Promise<any[]> {
    return api.get<any[]>('/learning/user/answers', {
      params: { paper_id: paperId }
    });
  }
}; 