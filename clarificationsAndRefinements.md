# Clarifications & Refinements

## Competition

### Backend

- 2025-11-07: DevLab owns competition orchestration only; analytics and post-competition insights
  remain in Learning Analytics. Persist competition metadata in Supabase; rely on mock integrations
  until other services are live.
- 2025-11-07: Maintain full competition anonymity—use pseudonymous identifiers in all internal
  payloads and UI, revealing real learner identities only within Learning Analytics exports.
- 2025-11-07: Queue Course Builder invitations until matching anonymous opponents accept; support
  declines and re-queuing without blocking other invites.

### Frontend

- 2025-11-07: Competition UI should focus on functionality and real-time feedback; analytics
  dashboards are expressly out of scope for DevLab.
- 2025-11-07: Apply game-inspired experience with ambient audio, automatic timers, and motivating
  animations while keeping accessibility controls available.

## Practice Sessions

### Backend

- 2025-11-07: Integrate with Gemini and Judge0 (RapidAPI) using live credentials. Delete generated
  questions from Supabase once Content Studio or Assessment confirms receipt. Theoretical question
  generation is delegated to Assessment; DevLab acts as a passthrough.
- 2025-11-07: Gemini must evaluate correctness, deliver actionable feedback, and perform fraud
  detection to distinguish human vs. AI-generated submissions, returning guidance or warnings
  accordingly.
- 2025-11-07: Use REST (and gRPC if required) for all interactions—avoid WebSocket-based
  communication for practice and competition flows.
- 2025-11-07: Enforce exactly three Gemini hints per question; supplies reset per question even
  within multi-question sessions.

### Database

- 2025-11-07: Store practice questions temporarily in Supabase and purge after confirmation; retain
  competition questions indefinitely. Log operational data in MongoDB Atlas.

## Access Control

### Backend

- 2025-11-07: Restrict practice and competition APIs to users with `learner` role; block
  question-creation endpoints unless the JWT role indicates `trainer` or higher.

## Authentication

### Backend

- 2025-11-07: Authentication is provided by an external Auth microservice. DevLab expects validated
  JWTs and will mock tokens until the integration is available.

## UI Experience

### Frontend

- 2025-11-07: Apply the provided dark emerald design system with day/night, high-contrast,
  colorblind, large-font, and reduced-motion modes, ensuring smooth transitions and accessibility
  focus states.

## Environment & Secrets

### Backend

- 2025-11-07: Environment keys (Gemini, Supabase, Mongo, Judge0) are provided via Railway; no local
  `.env` files should be required—optional `.env.local` loading only occurs if a developer creates
  one.

### Frontend

- 2025-11-07: `VITE_API_URL` is configured as a Vercel environment variable; no local `.env` file is
  necessary by default.
