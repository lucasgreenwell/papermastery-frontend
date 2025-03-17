/**
 * Models matching the backend API response structure
 */

export interface Researcher {
  id: string;
  name: string;
  email: string;
  bio?: string;
  expertise: string[];
  achievements?: string[];
  availability: {
    [day: string]: string[]  // e.g. { "monday": ["09:00-10:00", "14:00-15:00"] }
  };
  rate: number;
  verified: boolean;
  user_id?: string;
  created_at: string;
  updated_at?: string;
}

export interface TimeSlot {
  id: string;
  researcher_id: string;
  start_time: string;  // ISO datetime string
  end_time: string;    // ISO datetime string
  available: boolean;
  session_id?: string;  // populated if booked
}

export interface Session {
  id: string;
  user_id: string;
  researcher_id: string;
  researcher_name?: string;
  paper_id?: string;
  paper_title?: string;
  start_time: string;  // ISO datetime string
  end_time: string;    // ISO datetime string
  status: "scheduled" | "completed" | "canceled";
  zoom_link?: string;
  created_at: string;
  updated_at?: string;
  questions?: string;
}

export interface OutreachRequest {
  id: string;
  user_id: string;
  researcher_email: string;
  paper_id?: string;
  status: "pending" | "accepted" | "declined" | "email_failed";
  created_at: string;
  updated_at?: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  status: "active" | "expired" | "canceled";
  start_date: string;
  end_date?: string;
  created_at: string;
}

export interface Payment {
  id: string;
  user_id: string;
  subscription_id?: string;
  session_id?: string;
  amount: number;
  status: "pending" | "completed" | "failed";
  transaction_id?: string;
  created_at: string;
}

export interface PaymentIntent {
  client_secret: string;
  amount: number;
  type: "session" | "subscription";
}

// Request types matching backend API
export interface CreateSessionRequest {
  researcher_id: string;
  paper_id?: string;
  start_time: string; // ISO datetime string
  end_time: string;   // ISO datetime string
  questions?: string;
}

export interface CreatePaymentIntentRequest {
  type: "session" | "subscription";
  session_id?: string;
}

export interface CreateOutreachRequest {
  researcher_email: string;
  paper_id?: string;
} 