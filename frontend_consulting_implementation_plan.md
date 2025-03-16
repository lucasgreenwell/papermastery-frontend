Sprint 2: Consulting Step and Subscription Prompt (Steps 11-20)
Create ConsultingStep.tsx.
Fetch is_subscribed.
Navigate if subscribed.
Show prompt if not.
Add "Subscribe Now" button.
Handle success redirection.
Add loading states.
Handle errors.
Use toast feedback.
Make prompt dismissible.

Sprint 3: Consulting Page for Subscribed Users (Steps 21-30)
Create ConsultingPage.tsx.
Fetch researchers.
Add "Book Session" for verified.
Add "Request Outreach" for unverified.
Implement researcher cards.
Add calendar.
Add time slot UI.
Add confirmation dialogs.
Handle loading.
Handle errors.

Sprint 4: Session Booking UI (Steps 31-40)
Implement booking flow.
Call POST /consulting/sessions.
Show confirmation.
Integrate Stripe.
Display payment UI.
Add to dashboard.
Add cancellation UI.
Add rescheduling.
Handle time zones.
Prevent conflicts.

Sprint 5: Researcher Onboarding UI (Steps 41-50)
Create ResearcherRegister.tsx.
Pre-fill email.
Add password input.
Handle errors.
Redirect to SessionAccept.tsx.
Implement acceptance UI.
Add confirmation.
Handle errors.
Create dashboard.
Add session UI.

Sprint 6: Dashboard Enhancements (Steps 51-60)
Update Dashboard.tsx.
Display Zoom links.
Add status indicators.
Add cancellation.
Add rescheduling.
Show payment history.
Display subscription.
Add analytics.
Add export UI.
Ensure responsiveness.

Sprint 7: Review and Rating UI (Steps 61-70)
Add review form.
Add star component.
Handle comments.
Submit reviews.
Display on profiles.
Add moderation.
Add analytics UI.
Notify users.
Handle disputes.
Restrict to completed.

Sprint 8: Subscription Management UI (Steps 71-80)
Create subscription page.
Show status.
Add renewal.
Add cancellation.
Handle changes.
Add payment methods.
Display invoices.
Add analytics.
Show warnings.
Ensure secure UI.

Sprint 9: Security and Compliance UI (Steps 81-90)
Add consent UI.
Add opt-out.
Display terms.
Add GDPR features.
Add cookie consent.
Add export requests.
Link privacy policy.
Handle deletions.
Add 2FA UI.
Ensure resets.

Sprint 10: Testing and Quality Assurance (Steps 91-100)
Write unit tests.
Add integration tests.
Implement Cypress tests.
Set up test envs.
Generate test data.
Test accessibility.
Test performance.
Set up CI/CD.
Run user testing.
Document results.