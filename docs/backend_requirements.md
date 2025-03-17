# Backend Requirements for Consulting Booking System

## Overview
The consulting booking system allows users to book video consultations with researchers and domain experts related to specific papers. The frontend implementation provides a three-column layout with researchers, a calendar, and time slots.

## API Endpoints Required

### 1. Researcher Endpoints

#### GET `/api/consulting/researchers`
- **Purpose**: Retrieve all available researchers on the platform
- **Query Parameters**:
  - `paperId` (optional): Filter researchers by relevance to a specific paper
- **Response Format**:
```json
{
  "researchers": [
    {
      "id": "string",
      "name": "string",
      "email": "string",
      "bio": "string",
      "expertise": ["string"],
      "rate": "number",
      "verified": "boolean",
      "isAuthor": "boolean"
    }
  ]
}
```

#### GET `/api/consulting/researchers/:id`
- **Purpose**: Retrieve details of a specific researcher
- **Response Format**: Same as above for a single researcher

#### POST `/api/consulting/researchers/outreach`
- **Purpose**: Submit request to invite a researcher (author) to the platform
- **Request Body**:
```json
{
  "name": "string",
  "paperId": "string",
  "email": "string" // Optional, if known
}
```
- **Response Format**:
```json
{
  "success": "boolean",
  "message": "string",
  "requestId": "string"
}
```

### 2. Availability Endpoints

#### GET `/api/consulting/availability/:researcherId`
- **Purpose**: Retrieve availability for a specific researcher
- **Query Parameters**:
  - `startDate`: ISO date string for start of range
  - `endDate`: ISO date string for end of range
- **Response Format**:
```json
{
  "availabilityByDay": [
    {
      "date": "ISO date string (YYYY-MM-DD)",
      "hasSlots": "boolean"
    }
  ]
}
```

#### GET `/api/consulting/timeslots/:researcherId/:date`
- **Purpose**: Retrieve available time slots for a specific researcher on a given date
- **Response Format**:
```json
{
  "timeSlots": [
    {
      "id": "string",
      "start_time": "ISO datetime string",
      "end_time": "ISO datetime string",
      "available": "boolean",
      "researcher_id": "string"
    }
  ]
}
```

### 3. Booking Endpoints

#### POST `/api/consulting/sessions`
- **Purpose**: Book a session with a researcher
- **Request Body**:
```json
{
  "timeSlotId": "string",
  "researcherId": "string",
  "paperId": "string",
  "questions": "string", // Optional pre-session questions
  "recordSession": "boolean"
}
```
- **Response Format**:
```json
{
  "success": "boolean",
  "sessionId": "string",
  "message": "string",
  "zoomLink": "string", // Optional, might be generated later
  "startTime": "ISO datetime string",
  "endTime": "ISO datetime string"
}
```

#### GET `/api/consulting/sessions/:id`
- **Purpose**: Retrieve details of a specific session
- **Response Format**:
```json
{
  "id": "string",
  "researcher": {
    "id": "string",
    "name": "string",
    // Other researcher details...
  },
  "paper": {
    "id": "string",
    "title": "string",
    // Other paper details...
  },
  "start_time": "ISO datetime string",
  "end_time": "ISO datetime string",
  "status": "scheduled | completed | canceled",
  "zoom_link": "string",
  "questions": "string",
  "record_session": "boolean"
}
```

## Database Models Required

Based on the consulting database schema, we need the following models:

### Researcher Model
- id (UUID, primary key)
- user_id (UUID, foreign key to auth.users)
- name (VARCHAR)
- email (VARCHAR, unique)
- bio (TEXT)
- expertise (JSONB)
- achievements (JSONB)
- availability (JSONB)
- rate (DECIMAL)
- verified (BOOLEAN)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

### Session Model
- id (UUID, primary key)
- user_id (UUID, foreign key to auth.users)
- researcher_id (UUID, foreign key to researchers)
- paper_id (UUID, foreign key to papers)
- start_time (TIMESTAMP)
- end_time (TIMESTAMP)
- status (VARCHAR: 'scheduled', 'completed', 'canceled')
- zoom_link (VARCHAR)
- questions (TEXT)
- record_session (BOOLEAN)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

### Outreach Request Model
- id (UUID, primary key)
- user_id (UUID, foreign key to auth.users)
- researcher_email (VARCHAR)
- paper_id (UUID, foreign key to papers)
- status (VARCHAR: 'pending', 'accepted', 'declined')
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

## Integration Requirements

### Zoom API Integration
- Generate Zoom meeting links for scheduled sessions
- Provide authentication for both the user and researcher
- Support recording if requested by the user

### Email Notifications
- Send invitation emails to researchers for outreach requests
- Send confirmation emails for booked sessions
- Send reminder emails before scheduled sessions
- Send cancellation notifications when sessions are canceled

## Default Behavior

### Default Availability
- For researchers who join the platform, they should be able to set their availability.
- Default availability should be weekdays (Monday-Friday) from 9 AM to 5 PM, excluding lunch hour (12 PM-1 PM).
- Time slots should be in 15-minute increments.

### Default Rates
- New researchers should be prompted to set their rates during onboarding.
- A recommended default rate of $35-45 per 15-minute session should be suggested.

## Special Considerations

### Time Zones
- All times should be stored in UTC in the database.
- API responses should include the timezone information or provide a way for clients to specify their preferred timezone.
- The frontend will handle timezone conversion for display purposes.

### Author Verification
- When authors join the platform via outreach requests, there needs to be a verification mechanism to ensure they are indeed the authors of the claimed papers.
- This might involve email verification (using institutional emails) or manual verification by administrators.

## Data Seeding (for Development)
- For testing purposes, seed the database with mock researchers, availability, and sessions.
- Create realistic availability patterns with some periods marked as unavailable.
- Generate a mix of verified and unverified researchers, some of whom are authors of papers in the system.

---

This document outlines the basic backend requirements for the consulting booking system. Please adapt these specifications to match your existing backend architecture and conventions. 