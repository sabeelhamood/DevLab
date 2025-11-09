# DEVLAB Roadmap & Control Layer

_Last updated: 2025-11-08 · Maintainer: Cursor AI (GPT-5 Codex)_

This roadmap is the authoritative control surface for DEVLAB delivery. Tasks marked **Done** must not be modified unless their status is explicitly reset to **Rework** with a documented rationale in this file. Every implementation request must reference a task ID from this roadmap.

---

## Governance Snapshot

| Phase | Template | Status | Evidence / References | Next Checkpoint |
| --- | --- | --- | --- | --- |
| Phase 1 · Project Foundation | `templates/input_template_project_foundation.md` | Done | `README.md`, `PROJECT_SUMMARY.md` | Confirm any new business directives before backlog changes |
| Phase 2 · Requirements Discovery | `templates/input_template_requirements_discovery.md` | In Progress | `docs/PROJECT_HANDOVER.md`, `docs/API.md` (partial coverage) | Complete gaps for instructor tools & analytics acceptance criteria |
| Phase 3 · System Architecture | `templates/input_template_architecture_design.md` | To Do | — | Produce full architecture dossier & request sponsor approval |
| Phase 4 · Feature Planning | `templates/input_template_feature_planning.md` | To Do | — | Decompose remaining requirements into sprint-sized work packages |
| Phase 5 · Environment Setup | `templates/input_template_environment_setup.md` | In Progress | `backend/railway.json`, `frontend/vite.config.js`, `DEPLOYMENT_SETUP.md` | Finalize observability stack + CI secrets inventory |
| Phase 6 · Core Development | `templates/input_template_core_development.md` | In Progress | Backend/Frontend scaffolds present; tests incomplete | Align backlog with roadmap tasks before iterating |
| Phase 6.1 · Code Review Gates | `templates/input_template_code_review.md` | To Do | `.husky/pre-commit` (partial) | Draft CODEOWNERS, PR template, branch protection rules |
| Phase 7 · QA & Testing Strategy | `templates/input_template_testing_strategy.md` | To Do | — | Define coverage metrics, automation scope, UAT approach |
| Phase 8 · Security & Compliance | `templates/input_template_security_compliance.md` | In Progress | `docs/SECURITY.md`, `backend/src/middleware/security.js` | Schedule penetration test plan + RBAC matrix completion |
| Phase 9 · CI/CD & Handover | `templates/input_template_deployment_handover.md` | To Do | `DEPLOYMENT.md`, `deploy.sh` | Author GitHub Actions workflows for Vercel/Railway deploys |

---

## Feature Control Board

Each feature section lists granular tasks with status gates, explicit dependencies, reference materials, intended tests, and Definition of Done criteria. Owners default to Cursor AI unless otherwise noted.

### Feature F1 · AI-Powered Question Generation

- **Objective:** Deliver adaptive Gemini-backed question generation with alignment to learner profiles.
- **Source References:** `README.md#Key Features`, `backend/src/controllers/questionController.js`, `backend/src/services/gemini.js`, `frontend/src/pages/QuestionPackage.jsx`.
- **Dependencies:** F3 Secure Code Execution, F8 Security & Compliance.
- **Risks / Notes:** Gemini quota management not validated; personalization rules need acceptance criteria in Requirements phase.

#### Subtasks
| Task ID | Description | Status | Dependencies | Test Links |
| --- | --- | --- | --- | --- |
| F1-T01 | Map learner profile inputs to Gemini prompt templates (backend service layer) | In Progress | Phase 2 completion | `tests/integration/questions.personalization.spec.ts` (planned) |
| F1-T02 | Implement feature-flagged Gemini request queue with retry/backoff | To Do | F1-T01, F8-T03 | `backend/tests/unit/services/gemini.retry.test.js` (planned) |
| F1-T03 | Build frontend question generation trigger & loading UX | To Do | F1-T01 | `frontend/src/components/__tests__/QuestionPackage.test.jsx` (planned) |
| F1-T04 | Capture telemetry for prompt/response quality metrics | To Do | F5-T02 | `tests/integration/analytics.gemini-response.spec.ts` (planned) |

#### Definition of Done
- All Gemini prompts versioned and linked to requirements stories.
- Backend handles failures gracefully with circuit breaking and audit logs.
- Frontend exposes generation status and fallback messaging.
- Telemetry events ingested by analytics pipeline with dashboards confirming coverage.
- Associated tests green in CI with >=95% coverage on new modules.

---

### Feature F2 · Multi-Language Practice Workspace

- **Objective:** Provide consistent IDE-like practice surface with syntax highlighting, language selection, and session persistence.
- **Source References:** `frontend/src/components/CodeSandboxContainer.jsx`, `frontend/src/components/Judge0Container.jsx`, `frontend/src/pages/MockCompetitionGameplay.jsx`.
- **Dependencies:** F3 Secure Code Execution.
- **Risks / Notes:** Current UI lacks accessibility review; storage of drafts not implemented.

#### Subtasks
| Task ID | Description | Status | Dependencies | Test Links |
| --- | --- | --- | --- | --- |
| F2-T01 | Normalize language metadata (labels, runtime IDs, default snippets) | In Progress | Phase 2 language catalog | `frontend/src/components/__tests__/languageCatalog.test.jsx` (planned) |
| F2-T02 | Implement persistent workspace state (session storage + API sync) | To Do | F2-T01, F7-T02 | `tests/e2e/workspace-state.spec.ts` (planned) |
| F2-T03 | Add keyboard accessibility & ARIA roles to editor controls | To Do | F2-T01 | `frontend/src/components/__tests__/workspaceAccessibility.test.jsx` (planned) |
| F2-T04 | Integrate theme toggle & layout responsiveness for small screens | To Do | — | `frontend/src/components/__tests__/layoutResponsive.test.jsx` (planned) |

#### Definition of Done
- Language dropdown mirrors backend runtimes; mismatch tests in CI.
- Workspace data survives reload and cross-device sync for authenticated users.
- WCAG 2.1 AA audit passes for editor interactions.
- Responsive layout verified across desktop, tablet, mobile breakpoints.

---

### Feature F3 · Secure Code Execution

- **Objective:** Orchestrate sandboxed executions via Judge0 with throttling, sanitization, and result streaming.
- **Source References:** `backend/src/services/judge0Service.js`, `backend/src/controllers/questionController.js`, `frontend/src/components/Judge0Container.jsx`.
- **Dependencies:** F8 Security & Compliance, F5 Learning Analytics.
- **Risks / Notes:** Need to finalize sandbox timeout thresholds per language; ensure secrets managed via Railway/Vercel.

#### Subtasks
| Task ID | Description | Status | Dependencies | Test Links |
| --- | --- | --- | --- | --- |
| F3-T01 | Harden Judge0 request payload validation & rate limiting | In Progress | F8-T01 | `backend/tests/unit/services/judge0.validation.test.js` (planned) |
| F3-T02 | Implement execution status polling & streaming to frontend | To Do | F3-T01 | `tests/integration/code-execution-stream.spec.ts` (planned) |
| F3-T03 | Store execution logs for analytics & auditing (short-term retention) | To Do | F5-T01 | `backend/tests/integration/judge0.audit.test.js` (planned) |
| F3-T04 | Document fallback pathways if Judge0 unavailable | To Do | F3-T01 | `docs/DEPLOYMENT.md` (update checklist) |

#### Definition of Done
- Execution requests enforce payload schema & per-user throttles.
- Frontend displays live status updates and completion notifications.
- Logs persisted with retention policy and surfaced in monitoring dashboards.
- Runbooks define degradation steps and rollback procedures.

---

### Feature F4 · Real-Time Feedback & Coaching

- **Objective:** Deliver AI-guided hints and feedback loops aligned with learner progress.
- **Source References:** `backend/src/services/gemini.js`, `frontend/src/components/CompetitionQuestionEnhanced.jsx`, `frontend/src/pages/DevHelper.jsx`.
- **Dependencies:** F1 AI Question Generation, F5 Learning Analytics.
- **Risks / Notes:** Need UX validation for feedback frequency; ensure latency <2s target.

#### Subtasks
| Task ID | Description | Status | Dependencies | Test Links |
| --- | --- | --- | --- | --- |
| F4-T01 | Define feedback taxonomy & scoring rubric with stakeholders | To Do | Phase 2 completion | `docs/clarificationsAndRefinements.md` (append) |
| F4-T02 | Implement backend feedback generator with context caching | To Do | F4-T01, F1-T01 | `backend/tests/unit/services/feedbackGenerator.test.js` (planned) |
| F4-T03 | Render inline feedback cards with diff highlights | To Do | F4-T01 | `frontend/src/components/__tests__/feedbackCards.test.jsx` (planned) |
| F4-T04 | Track feedback effectiveness via analytics events | To Do | F5-T02 | `tests/integration/analytics.feedback-effectiveness.spec.ts` (planned) |

#### Definition of Done
- Feedback taxonomy approved and versioned.
- Backend caches conversation context per session with eviction strategy.
- UI displays actionable hints with clear severity levels.
- Analytics confirm feedback consumption correlates with success rate uplift.

---

### Feature F5 · Learning Analytics & Reporting

- **Objective:** Provide actionable learner insights, dashboards, and organizational reporting.
- **Source References:** `backend/src/controllers/analyticsController.js`, `frontend/src/components/CompetitionResultsEnhanced.jsx`, `docs/API.md`.
- **Dependencies:** F1, F3, F4, F7 QA & Testing (data validation).
- **Risks / Notes:** Data warehouse schema TBD; ensure privacy compliance.

#### Subtasks
| Task ID | Description | Status | Dependencies | Test Links |
| --- | --- | --- | --- | --- |
| F5-T01 | Define analytics event schema & Supabase storage model | In Progress | Phase 2 analytics requirements | `backend/tests/unit/models/analyticsEvent.test.js` (planned) |
| F5-T02 | Implement ingestion pipeline & batching with retries | To Do | F5-T01 | `tests/integration/analytics.ingestion.spec.ts` (planned) |
| F5-T03 | Build organizational dashboard UI with filtering | To Do | F5-T01 | `frontend/src/components/__tests__/analyticsDashboard.test.jsx` (planned) |
| F5-T04 | Establish data retention & anonymization policies | To Do | F8-T02 | `docs/SECURITY.md` (update) |

#### Definition of Done
- Event schema documented and enforced via validation tests.
- Pipeline handles spikes and ensures at-least-once delivery.
- Dashboards meet stakeholder requirements and pass usability review.
- Compliance sign-off on retention and anonymization strategy.

---

### Feature F6 · Instructor Tools & Content Management

- **Objective:** Enable instructors to curate question packages, manage invitations, and review learner submissions.
- **Source References:** `frontend/src/components/CompetitionInvitation.jsx`, `frontend/src/pages/CompetitionPage.jsx`, `backend/src/controllers/competitionController.js`.
- **Dependencies:** F5 Analytics (for insights), F8 Security (role-based access).
- **Risks / Notes:** Role definitions incomplete; need approval workflows.

#### Subtasks
| Task ID | Description | Status | Dependencies | Test Links |
| --- | --- | --- | --- | --- |
| F6-T01 | Define instructor role permissions & CRUD matrix | To Do | F8-T01 | `docs/clarificationsAndRefinements.md` (append) |
| F6-T02 | Implement competition CRUD APIs with validation | To Do | F6-T01 | `backend/tests/integration/competition.crud.spec.js` (planned) |
| F6-T03 | Build invitation management UI with status tracking | To Do | F6-T02 | `frontend/src/components/__tests__/CompetitionInvitation.test.jsx` (planned) |
| F6-T04 | Provide submission review tooling with diff & rubric | To Do | F4-T02 | `frontend/src/components/__tests__/SubmissionReview.test.jsx` (planned) |

#### Definition of Done
- ROLE matrix approved and enforced across APIs & UI.
- Instructor workflows cover creation, edit, publish, archive states.
- Invitations expose acceptance status and reminders.
- Review tooling supports annotated feedback and audit trail.

---

### Feature F7 · Quality Assurance & Testing Platform

- **Objective:** Establish comprehensive automated and manual testing frameworks aligned with TDD mandate.
- **Source References:** `docs/TESTING.md`, `.husky/pre-commit`, `package.json` scripts.
- **Dependencies:** Influences all features; ties directly to Phase 7.
- **Risks / Notes:** No automated suites checked in yet; need CI integration.

#### Subtasks
| Task ID | Description | Status | Dependencies | Test Links |
| --- | --- | --- | --- | --- |
| F7-T01 | Author testing strategy document & coverage targets | To Do | Phase 7 template | `docs/TESTING.md` (update) |
| F7-T02 | Scaffold Jest/Vitest suites for frontend & backend | To Do | F7-T01 | `frontend/src/components/__tests__/setup.test.ts` (planned) |
| F7-T03 | Configure integration & e2e pipelines (Playwright/Cypress) | To Do | F7-T02 | `tests/e2e/setup.spec.ts` (planned) |
| F7-T04 | Implement coverage reporting & quality gates in CI | To Do | F7-T02, F9-T01 | `ci/github-actions/test-and-coverage.yml` (planned) |

#### Definition of Done
- Strategy doc approved and version-controlled.
- Unit, integration, e2e suites run locally and in CI with deterministic results.
- Coverage thresholds enforced; failures block merge.
- QA dashboard tracks MTTR, flaky tests, and release readiness.

---

### Feature F8 · Security & Compliance

- **Objective:** Guarantee end-to-end security posture covering application, data, and infrastructure layers.
- **Source References:** `docs/SECURITY.md`, `backend/src/middleware/security.js`, `backend/src/services/security/auditService.js`.
- **Dependencies:** Cross-cutting; prerequisite for production release.
- **Risks / Notes:** Need DPA review for data processors; ensure secret rotation SOPs.

#### Subtasks
| Task ID | Description | Status | Dependencies | Test Links |
| --- | --- | --- | --- | --- |
| F8-T01 | Finalize threat model & RBAC matrix | In Progress | Phase 2 compliance inputs | `docs/SECURITY.md` (update) |
| F8-T02 | Implement data encryption & key management guidelines | To Do | F8-T01 | `docs/DEPLOYMENT.md` (update) |
| F8-T03 | Automate dependency & vulnerability scanning | To Do | F7-T02 | `ci/github-actions/security-scan.yml` (planned) |
| F8-T04 | Draft incident response & escalation playbooks | To Do | F8-T01 | `docs/SECURITY.md` (appendix) |

#### Definition of Done
- Threat model signed off; RBAC enforced in middleware & UI.
- Secrets stored in managed services with rotation schedule.
- Automated scans integrated into CI with alerting.
- Incident playbooks reviewed during tabletop exercise.

---

### Feature F9 · Deployment & Observability Automation

- **Objective:** Deliver automated build/test/deploy pipelines for Railway (backend) and Vercel (frontend) with full observability.
- **Source References:** `DEPLOYMENT.md`, `deploy.sh`, `backend/railway.json`, `frontend/vercel.json`.
- **Dependencies:** F7 Testing, F8 Security.
- **Risks / Notes:** GitHub Actions workflows absent; monitoring stack unspecified.

#### Subtasks
| Task ID | Description | Status | Dependencies | Test Links |
| --- | --- | --- | --- | --- |
| F9-T01 | Author GitHub Actions pipelines for build/test/deploy | To Do | F7-T02 | `ci/github-actions/deploy.yml` (planned) |
| F9-T02 | Configure environment variables & secret management docs | To Do | F8-T02 | `DEPLOYMENT_SETUP.md` (update) |
| F9-T03 | Implement observability stack (logs, metrics, alerts) | To Do | F9-T01 | `docs/SECURITY.md` & `docs/TESTING.md` (append monitoring section) |
| F9-T04 | Define rollback & disaster recovery procedures | To Do | F9-T01 | `FINAL_DEPLOYMENT.md` (update) |

#### Definition of Done
- CI/CD workflows green with gated deployments.
- Secrets documented, injected via platform-specific tooling.
- Monitoring dashboards live with alert thresholds tuned.
- Rollback drills executed & logged.

---

### Feature F10 · Microservice & Ecosystem Integration

- **Objective:** Ensure DEVLAB integrates reliably with EduCore AI services (auth, directory, analytics, content).
- **Source References:** `backend/src/routes/external/`, `backend/src/controllers/external/`, `frontend/src/services/mockMicroservices.js`.
- **Dependencies:** F1, F5, F6.
- **Risks / Notes:** Integration currently mocked; need contract testing with upstream services.

#### Subtasks
| Task ID | Description | Status | Dependencies | Test Links |
| --- | --- | --- | --- | --- |
| F10-T01 | Validate API contracts against EduCore specs | To Do | Phase 2 integration requirements | `tests/integration/external.contract.spec.ts` (planned) |
| F10-T02 | Replace mock services with environment-driven connectors | To Do | F10-T01 | `backend/tests/integration/external.connector.test.js` (planned) |
| F10-T03 | Implement health checks & circuit breakers for dependencies | To Do | F3-T01 | `backend/tests/unit/middleware/dependencyHealth.test.js` (planned) |
| F10-T04 | Document integration runbooks & escalation paths | To Do | F10-T01 | `docs/PROJECT_HANDOVER.md` (update) |

#### Definition of Done
- Contract tests automated and aligned with upstream teams.
- Runtime toggles allow switching between mock and live services.
- Health endpoints expose dependency status for monitoring.
- Runbooks cover failure scenarios and contact trees.

---

## Change Management Rules

1. Every change request must cite the relevant `Task ID` and desired status transition.  
2. To move a task to **In Progress**, ensure prerequisites in the Dependencies column are satisfied.  
3. To mark a task **Done**, attach evidence (PR links, test reports) in the task notes and update associated documentation.  
4. Tasks requiring rework must be annotated with the issue discovered and rollback reference before status changes to **Rework**.  
5. Updates to requirements or architecture documents must immediately trigger review of affected roadmap sections.

---

## Pending Actions Log

- Confirm stakeholder availability for Phase 2 completion workshops (Analytics & Instructor tooling).
- Schedule security tabletop once F8-T04 draft completed.
- Draft GitHub Actions workflow skeleton to accelerate F9-T01 initiation.

---

_End of roadmap. All future development activities must trace back to this document._ 


