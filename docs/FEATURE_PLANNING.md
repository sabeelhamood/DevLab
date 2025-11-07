# DevLab Feature Planning & Component Breakdown

## 1. Feature Specifications

| Feature                                           | Description                                                                                                  | Primary Users                 | Acceptance Criteria                                                                                                                                                                                                                   |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F1. Adaptive Practice Workspace                   | Deliver course-aligned practice sessions with Judge0 execution, Gemini hints, and solution reveal workflows. | Learners                      | (a) Practice session loads course questions with metadata; (b) Run Code executes via Judge0 within 5s P95; (c) Hints capped at 3 per question with Reveal flow; (d) Submission returns Gemini feedback and optional AI-usage warning. |
| F2. Gemini Hint & Feedback Engine                 | Manage prompt templates, fraud detection, and feedback caching.                                              | Learners, Trainers            | (a) Hints are contextual and non-spoiling; (b) Fraud detection logs AI use and displays warning; (c) Fail-safe messaging on Gemini outage; (d) Cached hints reused within session.                                                    |
| F3. Competition Orchestration                     | Anonymous matchmaking, timed sessions, judge results, and winner declaration.                                | Learners                      | (a) Invitation screen lists queued matches; (b) Accept/decline updates queue; (c) Timer auto-starts with ambient audio; (d) Gemini adjudicates winner; (e) Results exported to Learning Analytics.                                    |
| F4. Trainer Question Validation & Generation      | Validate trainer-authored questions and generate new ones via Gemini.                                        | Trainers (via Content Studio) | (a) Irrelevant questions rejected with detailed reason; (b) Valid questions enriched with hints/test cases; (c) Generated questions respect skills & language; (d) Temporary question record deleted after acknowledgement.           |
| F5. Assessment & Theoretical Question Passthrough | Supply code questions to Assessment and proxy theoretical requests.                                          | Assessment MS                 | (a) Code question bundles exclude hints; (b) Payload meets assessment spec; (c) Theoretical requests relayed transparently; (d) Retries on failure logged.                                                                            |
| F6. Learning Analytics Export                     | Push competition outcomes and maintain retry queue.                                                          | Learning Analytics MS         | (a) Exports succeed with 200 response; (b) Failed exports retried with exponential backoff; (c) Audit trail stored; (d) Data schema matches analytics spec.                                                                           |
| F7. Security & Access Control                     | Enforce JWT roles, RLS, and secure API posture.                                                              | All                           | (a) Only `learner` accesses practice/competition endpoints; (b) `trainer` or `system` required for question APIs; (c) RLS prevents cross-org access; (d) Rate limits & security headers verified.                                     |
| F8. Observability & Resilience                    | Logging, metrics, incident handling, graceful degradation.                                                   | Ops, Dev                      | (a) Structured logs to Mongo; (b) Metrics exposed at `/metrics`; (c) Alerting thresholds configured; (d) Graceful messaging when Judge0/Gemini unavailable.                                                                           |
| F9. Immersive UI & Accessibility                  | Apply emerald theme, gamified competitions, and accessibility modes.                                         | Learners                      | (a) Theme toggles (day/night, high contrast, colorblind, large font); (b) Animations with reduced-motion support; (c) Ambient audio mute toggle; (d) WCAG 2.1 AA compliance checks pass.                                              |

## 2. Component Breakdown & Dependencies

| Feature | Frontend Components                                                                       | Backend Services                                                                   | Data Stores                                                                         | External Dependencies                              |
| ------- | ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------- |
| F1      | `PracticePage`, `QuestionCard`, `HintPanel`, `CodeRunner`, `SessionHeader`                | `practiceController`, `practiceService`, `judge0Client`, `geminiClient`            | `practice_sessions`, `practice_questions`, `hint_usage`                             | Judge0, Gemini                                     |
| F2      | Shared prompt hooks, toast notifications                                                  | `feedbackService`, `promptTemplates`, cache layer                                  | `hint_usage`, Mongo logs                                                            | Gemini                                             |
| F3      | `CompetitionInvites`, `MatchLobby`, `CompetitionArena`, `TimerDisplay`, `AudioController` | `competitionController`, `competitionService`, `queueManager`, `analyticsExporter` | `queue_invitations`, `competitions`, `competition_questions`, `competition_results` | Course Builder, Judge0, Gemini, Learning Analytics |
| F4      | (UI handled by Content Studio)                                                            | `trainerController`, `trainerService`, `geminiClient`                              | `question_staging`                                                                  | Content Studio, Gemini                             |
| F5      | (N/A)                                                                                     | `assessmentController`, `assessmentService`                                        | `question_staging`                                                                  | Assessment MS                                      |
| F6      | (N/A)                                                                                     | `analyticsController`, `analyticsService`, `retryWorker`                           | `competition_results`, Mongo `integration_events`                                   | Learning Analytics                                 |
| F7      | Auth guard wrappers, role-based menus                                                     | `authMiddleware`, `rbacService`, `securityMiddleware`                              | Supabase RLS policies, Mongo logs                                                   | Auth MS                                            |
| F8      | `StatusToast`, `OfflineNotice`                                                            | `loggingService`, `metricsMiddleware`, `healthController`                          | Mongo `audit_logs`, `error_logs`                                                    | Monitoring stack                                   |
| F9      | `ThemeProvider`, `AccessibilityControls`, `AudioSettings`                                 | Static assets service                                                              | N/A                                                                                 | Howler.js, animation libs                          |

## 3. Task Estimation & Planning

| Sprint | Goals                                                                                                                       | Est. Effort (pts) | Dependencies |
| ------ | --------------------------------------------------------------------------------------------------------------------------- | ----------------- | ------------ |
| S1     | Setup Supabase schemas, Mongo collections, base Express modules, auth middleware, front-end theme scaffolding.              | 20                | None         |
| S2     | Implement practice session flow (F1/F2) with Judge0/Gemini integration and transient storage policies.                      | 28                | S1           |
| S3     | Build competition orchestration (F3) including queue, timers, ambient UI, analytics export skeleton.                        | 34                | S1           |
| S4     | Trainer validation & generation services (F4), Assessment passthrough (F5), finalize Learning Analytics export (F6).        | 24                | S2, S3       |
| S5     | Security hardening (F7), observability & resilience (F8), accessibility polish & cross-browser tests (F9), full regression. | 26                | All prior    |

## 4. User Journeys & Workflows

- **Learner Practice Journey**: Invitation → Select course → Practice session (question list, run
  code, hints, submit) → Feedback → Optional reveal → Session summary.
- **Learner Competition Journey**: Invitation queue → Opponent selection → Countdown lobby → Timed
  questions (code editor, Judge0 runs) → Submission results → Winner announcement → Export to
  analytics.
- **Trainer Content Journey** (via Content Studio): Submit question → DevLab validation → Receive
  enriched payload → Publish to course → Acknowledge to trigger deletion.
- **Assessment Integration**: Assessment requests code bundles → DevLab returns sanitized questions
  → Assessment delivers theoretical question; DevLab relays to Content Studio.

## 5. Feature Prioritization & Release Plans

| Priority | Feature    | Release Notes                                                                     |
| -------- | ---------- | --------------------------------------------------------------------------------- |
| P0       | F1, F2, F7 | Core practice loop, Gemini feedback, security baseline.                           |
| P1       | F3, F6     | Competition orchestration and analytics export to enable organizational insights. |
| P1       | F4, F5     | Trainer validation and assessment collaboration to keep content fresh.            |
| P2       | F8         | Observability & resilience improvements.                                          |
| P2       | F9         | Immersive UI polish and advanced accessibility features.                          |

## 6. Cross-Functional Coordination

- **Product & Instructional Design**: Align skill mappings, macro/micro competency tagging,
  competition rules.
- **Content Studio Team**: Coordinate API payload formats, trainer UX feedback, question
  acknowledgement workflow.
- **Assessment Team**: Validate delivery cadence for code questions, finalize theoretical question
  spec.
- **Learning Analytics**: Confirm export schema, schedule for data ingestion, handle pseudonym
  mapping.
- **Security & Compliance**: Review RLS policies, audit logging, penetration test schedule.
- **DevOps**: Ensure GitHub Actions, Railway, Vercel environments remain consistent; monitor rate
  limits for Judge0/Gemini.

## 7. TDD Integration

- Write Vitest/Jest tests before implementation per feature: session reducer tests,
  controller/service tests with mocks, contract tests for external microservices.
- Establish Pact-style contract suites for Course Builder, Content Studio, Assessment, Learning
  Analytics endpoints using mock servers.
- Include Judge0 & Gemini integration tests with recorded fixtures for CI (live smoke tests gated).

## 8. AI/Automation Enhancements

- Automated prompt tuning for Gemini using stored test cases and evaluation harness.
- Repo-wide static analysis + AI PR summaries to spotlight risky diffs.
- Nightly performance tests with k6; automated regression alerts when latency thresholds breached.
- AI-assisted accessibility auditing (axe-core) integrated into CI.

## 9. Validation & Roadmap Confirmation

- Requirements traceability established through features F1–F9.
- Dependencies mapped; sprint plan supports incremental delivery while maintaining deployment
  readiness.
- Updated `ROADMAP.md` captures granular tasks, DoD, status controls for ongoing governance.
