import { format } from 'date-fns';
import { apiService } from './api-service';
import { 
  Researcher, 
  TimeSlot, 
  Session, 
  PaymentIntent, 
  CreateSessionRequest,
  CreatePaymentIntentRequest,
  CreateOutreachRequest,
  OutreachRequest
} from './models';
import { availabilityToTimeSlots } from './adapters';

/**
 * API functions for the consulting feature
 */
export const consultingApi = {
  /**
   * Get a researcher by ID
   */
  async getResearcher(researcherId: string): Promise<Researcher> {
    return apiService.get<Researcher>(`/researchers/${researcherId}`);
  },
  
  /**
   * Get researcher associated with a paper
   */
  async getResearcherByPaper(paperId: string): Promise<Researcher> {
    return apiService.get<Researcher>(`/researchers/paper/${paperId}`);
  },
  
  /**
   * Get available time slots for a researcher on a specific date
   */
  async getAvailableTimeSlots(researcherId: string, date: Date): Promise<TimeSlot[]> {
    const formattedDate = format(date, 'yyyy-MM-dd');
    
    // First get the researcher availability
    const researcher = await this.getResearcher(researcherId);
    
    // Then convert availability to time slots
    return availabilityToTimeSlots(researcherId, researcher.availability, date);
  },
  
  /**
   * Create a new session (book a time slot)
   */
  async createSession(sessionRequest: CreateSessionRequest): Promise<Session> {
    return apiService.post<Session>('/sessions', sessionRequest);
  },
  
  /**
   * Get all sessions for the current user
   */
  async getUserSessions(): Promise<Session[]> {
    return apiService.get<Session[]>('/sessions');
  },
  
  /**
   * Get session details
   */
  async getSession(sessionId: string): Promise<Session> {
    return apiService.get<Session>(`/sessions/${sessionId}`);
  },
  
  /**
   * Cancel a session
   */
  async cancelSession(sessionId: string): Promise<Session> {
    return apiService.post<Session>(`/sessions/${sessionId}/cancel`, {});
  },
  
  /**
   * Create a payment intent for a session
   */
  async createPaymentIntent(request: CreatePaymentIntentRequest): Promise<PaymentIntent> {
    return apiService.post<PaymentIntent>('/payments/intent', request);
  },
  
  /**
   * Create an outreach request to a researcher not yet on the platform
   */
  async createOutreachRequest(request: CreateOutreachRequest): Promise<OutreachRequest> {
    return apiService.post<OutreachRequest>('/outreach', request);
  },
  
  /**
   * Create a consulting subscription
   */
  async createSubscription(): Promise<any> {
    return apiService.post('/subscriptions', {});
  }
}; 