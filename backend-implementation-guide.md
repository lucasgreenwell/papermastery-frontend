# Backend Implementation Guide: Consultation Scheduling System

## Overview
This document outlines the backend requirements for supporting our consultation scheduling system. The frontend UI allows users to book time slots with researchers, submit questions, and process payments.

## Data Models

### Researcher
```typescript
interface Researcher {
  id: string;
  user_id?: string;  // ID of user account if researcher has one
  name: string;
  email: string;
  bio?: string;
  expertise: string[];  // e.g. ["machine learning", "physics"]
  achievements?: string[];
  rate: number;  // hourly rate in USD
  verified: boolean;
  avatar_url?: string;
  affiliation?: string;  // university/institution
  author?: boolean;  // if researcher is author of the paper
}
```

### TimeSlot
```typescript
interface TimeSlot {
  id: string;
  researcher_id: string;
  start_time: string;  // ISO datetime string
  end_time: string;    // ISO datetime string
  available: boolean;
  session_id?: string;  // populated if booked
}
```

### Session
```typescript
interface Session {
  id: string;
  user_id: string;
  researcher_id: string;
  time_slot_id: string;
  paper_id?: string;
  questions?: string;
  status: "scheduled" | "completed" | "canceled";
  payment_status: "pending" | "completed" | "failed" | "refunded";
  zoom_link?: string;
  created_at: string;
  updated_at: string;
}
```

## API Endpoints

### Researcher Endpoints
```
GET /api/researchers - List researchers with pagination
GET /api/researchers/:id - Get single researcher details
GET /api/researchers/search?query=... - Search researchers by name/expertise
```

### Time Slot Endpoints
```
GET /api/time-slots?researcher_id=:id&date=:date - Get researcher's available slots for a date
GET /api/time-slots/:id - Get details of a specific time slot
```

### Booking Endpoints
```
POST /api/sessions - Create a new booking
  Body: {
    time_slot_id: string;
    questions?: string;
    paper_id?: string;
  }

GET /api/sessions - Get user's booked sessions
GET /api/sessions/:id - Get details of a specific session
PATCH /api/sessions/:id/cancel - Cancel a booked session
```

### Payment Integration
```
POST /api/payment/intent - Create payment intent for Stripe
  Body: {
    session_id: string;
  }
  Response: {
    client_secret: string;
  }

POST /api/payment/confirm - Confirm payment completed
  Body: {
    session_id: string;
    payment_intent_id: string;
  }
```

## Implementation Details

### 1. Time Slot Availability

When retrieving time slots:
- Return all slots for the specified date and researcher
- Mark slots as `available: false` if already booked
- Include time in user's timezone where possible

```json
// Example response for GET /api/time-slots?researcher_id=123&date=2023-04-20
{
  "time_slots": [
    {
      "id": "slot1",
      "researcher_id": "123",
      "start_time": "2023-04-20T09:00:00Z",
      "end_time": "2023-04-20T10:00:00Z",
      "available": true
    },
    {
      "id": "slot2",
      "researcher_id": "123",
      "start_time": "2023-04-20T10:00:00Z",
      "end_time": "2023-04-20T11:00:00Z",
      "available": false
    }
  ]
}
```

### 2. Booking Process

The booking flow should:
1. Check slot availability before allowing booking
2. Create unpaid session record initially
3. Process payment through Stripe 
4. Update session status after successful payment
5. Send confirmation emails with Zoom links

Use a transaction to ensure slot isn't double-booked:
```sql
BEGIN TRANSACTION;
-- Check if slot is still available
SELECT available FROM time_slots WHERE id = :time_slot_id FOR UPDATE;
-- Mark slot as unavailable
UPDATE time_slots SET available = FALSE, session_id = :session_id WHERE id = :time_slot_id;
-- Create session record
INSERT INTO sessions (...) VALUES (...);
COMMIT;
```

### 3. Security Considerations

- Implement authorization to ensure users can only:
  - Book available slots
  - View/cancel their own sessions
  - See researcher details

- Validate all inputs, particularly:
  - Time slot IDs existence and availability
  - Date formats and ranges
  - Payment amounts matching researcher rates

### 4. Zoom Integration

- Automatically generate Zoom meetings for booked sessions:
  - Create meeting via Zoom API after successful payment
  - Include meeting link in session details and confirmation email
  - Consider calendar invitations (.ics files)

### 5. Researcher Availability Management

Implement a separate API for researchers to:
- Set recurring availability patterns
- Block specific dates/times
- View and manage their bookings

## Error Handling

All endpoints should return appropriate HTTP status codes:
- 400: Bad Request - Invalid input
- 401: Unauthorized - Authentication required
- 403: Forbidden - Insufficient permissions
- 404: Not Found - Resource doesn't exist
- 409: Conflict - Resource already booked/in use
- 500: Internal Server Error - Unexpected issues

Error responses should include:
```json
{
  "error": {
    "code": "SLOT_UNAVAILABLE",
    "message": "This time slot is no longer available",
    "details": {}
  }
}
```

## Database Considerations

Refer to the existing database schema in `consulting_database_schema.md` which includes tables for:
- researchers
- sessions
- payments
- reviews

Ensure proper indexing on frequently queried fields:
- researcher_id in time_slots table
- date fields for time-based queries
- user_id in sessions table

## Notifications

Implement notification triggers for:
- Booking confirmations
- Payment receipts
- Session reminders (24h and 1h before)
- Cancellation notifications 