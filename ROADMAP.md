# DevLab ROADMAP

Status Legend: `To Do` | `In Progress` | `Done` | `Rework`

## Feature F1 – Adaptive Practice Workspace

| Task ID    | Description                                                                                       | Status      | References                                                                                                                          | Dependencies               | Tests / Validation                                                | Definition of Done                                                        |
| ---------- | ------------------------------------------------------------------------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------- | -------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------- |
| F1-API-001 | Scaffold practice session routes/controllers with RBAC guardrails.                                | Done        | `docs/FEATURE_PLANNING.md#1-feature-specifications`, `clarificationsAndRefinements.md`, `tests/integration/practiceRoutes.test.cjs` | Auth middleware baseline   | Jest unit tests for controllers; contract tests for role access   | Routes accept JWT, respond with mock data, tests pass, lint clean         |
| F1-SVC-002 | Implement practiceService with Judge0 submission pipeline and transient storage policies.         | Done        | Same as above                                                                                                                       | Supabase schema deployment | Integration tests with mocked Judge0; data cleanup job verified   | Service stores session data, purges on acknowledgement, tests & lint pass |
| F1-FE-003  | Build `PracticePage`, `QuestionCard`, `HintPanel`, `CodeRunner` components with state management. | To Do       | `docs/FEATURE_PLANNING.md#2-component-breakdown-dependencies`                                                                       | API endpoints available    | Vitest + React Testing Library coverage; Cypress/Playwright smoke | UI renders questions, handles run/submit flows, accessibility checks pass |
| F1-GEM-004 | Create Gemini prompt templates & caching for hints/feedback, enforce hint count limit.            | In Progress | `clarificationsAndRefinements.md`                                                                                                   | practiceService skeleton   | Jest integration tests with Gemini mock; fallback messaging test  | Hint counters persisted, fallback alerts implemented, coverage met        |
| F1-OPS-005 | Configure Supabase tables (`practice_sessions`, `practice_questions`, `hint_usage`) with RLS.     | To Do       | `docs/ARCHITECTURE.md`                                                                                                              | Database access            | Supabase migration tests; RLS policy unit tests                   | Tables deployed, RLS verified via tests, migrations documented            |

## Feature F2 – Gemini Hint & Feedback Engine

| Task ID    | Description                                                             | Status | References                                                    | Dependencies            | Tests / Validation                                         | Definition of Done                                          |
| ---------- | ----------------------------------------------------------------------- | ------ | ------------------------------------------------------------- | ----------------------- | ---------------------------------------------------------- | ----------------------------------------------------------- |
| F2-SVC-001 | Build feedbackService with fraud detection heuristic and audit logging. | To Do  | `docs/FEATURE_PLANNING.md#1-feature-specifications`           | F1 data models          | Jest service tests; Mongo audit log assertions             | Fraud flags logged, warning message returned, tests green   |
| F2-FE-002  | Implement feedback toasts, AI-usage warnings, cached hint reuse UI.     | To Do  | `docs/FEATURE_PLANNING.md#2-component-breakdown-dependencies` | F1 front-end components | Vitest snapshot & state tests                              | UI displays warnings, cached hints reused, tests pass       |
| F2-OPS-003 | Add Gemini key rotation and rate limiting config.                       | To Do  | `docs/ARCHITECTURE.md`                                        | feedbackService         | Unit tests for rate limiter; chaos test for key exhaustion | Multiple keys configured, fallback key tested, logs emitted |

## Feature F3 – Competition Orchestration

| Task ID    | Description                                                                                                   | Status | References                                                                                                                             | Dependencies               | Tests / Validation                                                | Definition of Done                                                           |
| ---------- | ------------------------------------------------------------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- | ----------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| F3-API-001 | Expose invitation, acceptance, decline, and match endpoints with queue management.                            | Done   | `docs/FEATURE_PLANNING.md#1-feature-specifications`, `clarificationsAndRefinements.md`, `tests/integration/competitionRoutes.test.cjs` | Redis setup, F7 security   | Jest controller tests; contract tests with Course Builder         | Endpoints return correct statuses, queue states persisted, tests pass        |
| F3-SVC-002 | Implement competitionService (matching logic, timers, Judge0/Gemini orchestration).                           | Done   | `docs/ARCHITECTURE.md`                                                                                                                 | F3-API-001, F1/F2 services | Integration tests with mocked external APIs; timer unit tests     | Matches created, timers tracked, results computed, coverage met              |
| F3-FE-003  | Build `CompetitionInvites`, `MatchLobby`, `CompetitionArena`, `TimerDisplay`, `AudioController`.              | To Do  | `docs/FEATURE_PLANNING.md#2-component-breakdown-dependencies`                                                                          | F3 endpoints               | UI tests (Vitest/Playwright); accessibility audit                 | UI handles queue, timers, ambient audio with mute toggle, passes WCAG checks |
| F3-EXP-004 | Implement analyticsExporter with retry worker and Learning Analytics API contracts.                           | Done   | `docs/FEATURE_PLANNING.md#1-feature-specifications`, `src/services/__tests__/learningAnalyticsExporter.test.cjs`                       | Worker infrastructure      | Integration test with mock analytics service; retry scenario test | Successful exports persisted, retries logged, metrics emitted                |
| F3-DB-005  | Create Supabase tables (`queue_invitations`, `competitions`, `competition_questions`, `competition_results`). | To Do  | `docs/ARCHITECTURE.md`                                                                                                                 | Database migrations tool   | Migration tests; RLS validation                                   | Tables deployed, indexes set, anonymization enforced                         |

## Feature F4 – Trainer Question Validation & Generation

| Task ID    | Description                                                              | Status      | References                                                                                      | Dependencies           | Tests / Validation                                         | Definition of Done                                                |
| ---------- | ------------------------------------------------------------------------ | ----------- | ----------------------------------------------------------------------------------------------- | ---------------------- | ---------------------------------------------------------- | ----------------------------------------------------------------- |
| F4-API-001 | Implement `/questions/validate` and `/questions/generate` endpoints.     | Done        | `docs/FEATURE_PLANNING.md#1-feature-specifications`, `tests/integration/trainerRoutes.test.cjs` | F7 security            | Controller unit tests; schema validation tests             | Endpoints validate inputs, respond in AJAX format, tests pass     |
| F4-SVC-002 | Build trainerService with Gemini relevance checks and staging lifecycle. | Done        | `clarificationsAndRefinements.md`                                                               | Supabase staging table | Integration tests with Gemini mock; deletion workflow test | Staging entries created/cleared, responses accurate, coverage met |
| F4-DB-003  | Design `question_staging` table with TTL cleanup job.                    | In Progress | `docs/ARCHITECTURE.md`                                                                          | Database migrations    | Migration test; cron job unit test                         | Table live, TTL job verified, documentation updated               |

## Feature F5 – Assessment Collaboration

| Task ID    | Description                                                 | Status | References                 | Dependencies | Tests / Validation                    | Definition of Done                                           |
| ---------- | ----------------------------------------------------------- | ------ | -------------------------- | ------------ | ------------------------------------- | ------------------------------------------------------------ |
| F5-API-001 | Proxy theoretical question requests to Assessment.          | To Do  | `docs/FEATURE_PLANNING.md` | F7 auth      | Contract tests with Assessment mock   | Requests forwarded untouched, responses returned, tests pass |
| F5-SVC-002 | Provide code question bundles without hints for Assessment. | To Do  | `docs/FEATURE_PLANNING.md` | F4 staging   | Service unit tests; schema validation | Payload excludes hints, adheres to spec, coverage met        |

## Feature F6 – Learning Analytics Export

| Task ID    | Description                                              | Status | References                                          | Dependencies         | Tests / Validation                       | Definition of Done                               |
| ---------- | -------------------------------------------------------- | ------ | --------------------------------------------------- | -------------------- | ---------------------------------------- | ------------------------------------------------ |
| F6-SVC-001 | Persist analytics export queue with exponential backoff. | To Do  | `docs/FEATURE_PLANNING.md#1-feature-specifications` | Redis, Mongo logging | Integration tests with failure scenarios | Queue retries logged, dead-letter alerts emitted |
| F6-OPS-002 | Create monitoring dashboards/alerts for export failures. | To Do  | `docs/ARCHITECTURE.md`                              | Logging service      | Alert simulation tests                   | Alerts fire on threshold, runbooks updated       |

## Feature F7 – Security & Access Control

| Task ID     | Description                                                  | Status | References                                                    | Dependencies  | Tests / Validation                              | Definition of Done                                              |
| ----------- | ------------------------------------------------------------ | ------ | ------------------------------------------------------------- | ------------- | ----------------------------------------------- | --------------------------------------------------------------- |
| F7-AUTH-001 | Implement JWT validation middleware with role enforcement.   | To Do  | `clarificationsAndRefinements.md`, `docs/ARCHITECTURE.md`     | Auth MS mock  | Unit tests; contract tests for forbidden access | Requests with invalid role rejected, logs created, coverage met |
| F7-RLS-002  | Apply Supabase row-level security policies per organization. | To Do  | `docs/FEATURE_PLANNING.md#2-component-breakdown-dependencies` | F1/F3 schemas | Policy tests; manual verification               | Cross-org data access blocked, tests pass                       |
| F7-SEC-003  | Configure Helmet, rate limiting, audit logging baseline.     | To Do  | `docs/ARCHITECTURE.md`                                        | Express app   | Security regression tests; OWASP Zap scan       | Headers set, rate limits enforced, scans clean                  |

## Feature F8 – Observability & Resilience

| Task ID    | Description                                                            | Status | References                 | Dependencies   | Tests / Validation                      | Definition of Done                                               |
| ---------- | ---------------------------------------------------------------------- | ------ | -------------------------- | -------------- | --------------------------------------- | ---------------------------------------------------------------- |
| F8-LOG-001 | Implement structured logging to Mongo with correlation IDs.            | To Do  | `docs/FEATURE_PLANNING.md` | F7 security    | Unit tests; log inspection script       | Logs contain IDs, PII masked, retention working                  |
| F8-MET-002 | Expose Prometheus metrics and readiness probes.                        | To Do  | `docs/ARCHITECTURE.md`     | Express app    | Metrics unit tests; k6 threshold checks | `/metrics` returns expected data, readiness endpoints integrated |
| F8-RES-003 | Add circuit breakers and graceful messaging for Judge0/Gemini outages. | To Do  | `docs/FEATURE_PLANNING.md` | F1/F2 services | Chaos tests; UI fallback tests          | Circuit breakers trip, user sees fallback messages, tests pass   |

## Feature F9 – Immersive UI & Accessibility

| Task ID     | Description                                                                 | Status | References                                                    | Dependencies      | Tests / Validation                                  | Definition of Done                                             |
| ----------- | --------------------------------------------------------------------------- | ------ | ------------------------------------------------------------- | ----------------- | --------------------------------------------------- | -------------------------------------------------------------- |
| F9-UI-001   | Implement theme toggles (day/night, high contrast, colorblind, large font). | To Do  | `clarificationsAndRefinements.md`, `docs/FEATURE_PLANNING.md` | F1 front-end base | Vitest snapshot tests; axe-core accessibility tests | Toggles persist state, accessibility checks pass               |
| F9-ANIM-002 | Create competition animations, ambient audio with user controls.            | To Do  | `docs/FEATURE_PLANNING.md`                                    | F3 components     | UI interaction tests; performance profiling         | Animations run at 60fps baseline, audio mute works, tests pass |
| F9-A11Y-003 | Conduct WCAG 2.1 AA audit & remediate issues.                               | To Do  | `docs/FEATURE_PLANNING.md#9-validation-roadmap-confirmation`  | All features      | Accessibility test reports                          | Audit complete, issues resolved, documentation updated         |

---

All tasks must remain `To Do` until formally started. Update status, references, and DoD progress as
work advances. Any completed task edits require setting prior status to `Rework` before
modification.
