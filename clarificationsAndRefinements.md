# Clarifications & Refinements Log

This document captures actionable refinements grouped by feature and delivery layer. Entries are append-only to preserve traceability.

---

## Feature F1 · AI-Powered Question Generation

### Backend
- (2025-11-09) Content Studio payload now supplies `amount`, `topic_id`, `topic_name`, `skills`, `question_type`, `programming_language`, and `humanLanguage`; backend handlers and Gemini prompts must consume these fields directly when generating or validating questions.
- (2025-11-09) Gemini must assign a progressive difficulty ladder for every batch of generated questions: first question “basic”, each subsequent question harder, last question hardest; single-question flows still require an explicit difficulty label.
- (2025-11-09) All Gemini prompts (single-question, bulk-generation, trainer validation) must mirror the exact payload structures provided by Content Studio and Assessment, including `nanoSkills`, `microSkills`, `programming_language`, `humanLanguage`, and optional trainer seed questions, guaranteeing seamless alignment when switching from mock to live services.
- (2025-11-09) Every generated question response includes a `request_id`; the requesting microservice must call the `confirm-questions` action once data is persisted on their side so DEVLAB can delete the associated document from the MongoDB `temp_questions` collection.

### Frontend
- (2025-11-09) Content Studio and other consuming clients must render the delivered question data using their own UI components; AJAX payloads provide structured content (question text, clues, Judge0 config, difficulty labels) but no styling or markup, so frontends should replicate DEVLAB’s look and feel if desired.
- (2025-11-09) DEVLAB’s UI theme standardizes on Tailwind CSS slate/gray surfaces with indigo accents (`bg-indigo-600` primary buttons, hover `bg-indigo-700`, neutral backgrounds like `bg-gray-50`/`bg-gray-100` for cards, rounded corners, and subtle drop shadows for depth); any new frontend work should follow this palette and component structure for consistency.

### Database
- (2025-11-09) DEVLAB does not use caching layers; persistence relies solely on Supabase (business data, including temporary and persistent question/competition records) and MongoDB Atlas (operational logs, errors, and system events); database credentials are sourced exclusively from Railway environment variables `SUPABASE_URL`, `SUPABASE_KEY`, and `MONGO_URL`.
- (2025-11-09) Question data (including hints and test cases) is transient: store it in Supabase `temp_questions` with status `pending` until the originating microservice acknowledges receipt via the confirmation endpoint, then delete the record; competition data is strictly persistent for DEVLAB dashboards and downstream Learning Analytics.

---

## Feature F6 · Instructor Tools & Content Management

### Backend
- (2025-11-09) Competition invitations for course completers are generated via the unified gateway or legacy endpoint using the mock competition service until live endpoints are available; invitation payloads must include `course_id`, `course_name`, and primary `learner_id`, and respond with 202 Accepted to reflect fire-and-forget behavior.
- (2025-11-09) Competition data forwarded to Learning Analytics must include `learner1_id`, `learner2_id`, `course_id`, unified `timer`, per-learner performance snapshots, `score`, `questions_answered`, `competition_id`, and `created_at` to enable downstream reporting.
- (2025-11-09) Assessment microservice requests for coding questions supply `topic_name`, `programming_language`, `number_of_questions`, `nano_skills`, and `micro_skills`; DEVLAB must return an AJAX-friendly package without hints or solutions, preserving Judge0 configuration for Assessment’s own workflows.
- (2025-11-09) Theoretical question requests arriving from Assessment (or content studio workflows that proxy to Assessment) must be forwarded directly, maintaining the payload shape and capturing Assessment’s HTML/text responses without alteration.
- (2025-11-09) Course Builder triggers anonymous competition invitations via `/api/data-request` (or the legacy endpoint) using `requester_service: "course-builder"` with `payload` that includes at least `course_id`, `course_name`, and `learner_id`; DEVLAB must respond with `202 Accepted`, echoing the generated invitation metadata while delegating matchmaking to downstream services.

### Frontend
- (2025-11-09) Competitions remain anonymous to participants; UI must avoid exposing the opponent’s identity and instead show generic learner labels while still displaying shared metrics (timer, score, answered questions).

### Database
- (2025-11-09) Competition records must link invitation metadata and analytics payloads through `competition_id`, supporting audit trails and reconciliation between Course Builder and Learning Analytics datasets.

---

## Feature F10 · Microservice & Ecosystem Integration

### Backend
- (2025-11-09) External microservice traffic now enters via `/api/data-request`; routing is determined by `requester_service` and `payload.action`, and handlers must maintain compatibility with both mock data and future real microservice responses.
- (2025-11-09) Gateway responses must mirror the structure returned by the underlying handler so legacy `/api/external/*` endpoints and the unified entry point stay functionally equivalent.
- (2025-11-09) Gateway routing must function with the existing mock microservice layer (for offline development) while remaining transparent when real endpoints replace the mocks—no gateway changes should be required during the switchover.
- (2025-11-09) AJAX responses intentionally contain structured data only (question content, test cases, hints, Judge0 metadata, difficulty labels); visual styling and layout remain the responsibility of the consuming client (e.g., Content Studio UI).
- (2025-11-09) Persistent competition data is stored exclusively in Supabase (`competitions` table); creation events run through the gateway must upsert competition records and later analytics updates append to the same record so historical results are never lost.

### Frontend
- (2025-11-09) Unified gateway responses are UI-neutral; consuming dashboards should show aggregated gateway activity (service, action, status) using existing logging or monitoring views without depending on HTML embedded in the response.

### Database
- _No refinements recorded._

---

