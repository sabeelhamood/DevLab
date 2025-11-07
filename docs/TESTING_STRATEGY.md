# DevLab Quality Assurance & Testing Strategy

## 1. TDD Validation

- **Process Enforcement:**
  - All new features follow Red-Green-Refactor flow. PR template requires linking to failing test
    commit or test description.
  - Husky pre-commit runs relevant unit tests (`npm test -- --run` for frontend,
    `npm test -- --runInBand <pattern>` for backend) when touching spec files.
  - CI rejects PRs without accompanying tests when logic added (GitHub Action checks diff for
    `.js/.jsx` without `*.test` updates).
- **Audit:** Weekly sample of merged PRs to ensure tests preceded implementation; findings recorded
  in `docs/QA_AUDIT_LOG.md` (to be created after first audit).

## 2. Coverage Targets & Metrics

- **Frontend:** 80% statements/branches (Vitest). Coverage summary uploaded to PR via GitHub Action.
- **Backend:** 85% statements/branches (Jest). Coverage stored in artifacts and reported in PR
  comment.
- **Quality Metrics:**
  - Defect escape rate (bugs reported post-release vs. during review).
  - Mean time to detect flaky tests (tracked via rerun analytics).
  - Stability threshold: CI runs must pass ≥95% of time (monitor via GitHub workflow dashboard).

## 3. Unit, Integration & System Testing

- **Frontend:**
  - Unit: Component hooks & UI logic (Vitest + React Testing Library).
  - Integration: Page-level flows using Playwright (planned for Phase 7.1) pointing to mocked APIs.
- **Backend:**
  - Unit: Services/utilities with Jest mocks.
  - Integration: Supertest covering route end-to-end with stubbed external APIs (Judge0, Gemini,
    etc.).
- **System/E2E:**
  - Cypress/Playwright suite hitting staging environment (CI nightly + pre-release).
  - Synthetic checks of competition invitations, practice session lifecycle.

## 4. Performance & Load Testing

- **Goals:** Ensure low response latency (<200ms P95 for API) and stable executor throughput
  (Judge0/Gemini usage).
- **Tools:** k6 scripts targeting backend endpoints, run nightly against staging; results tracked in
  Grafana (TBD) or test artifacts.
- **Scenarios:** 500 concurrent learners fetching practice sessions, 100 simultaneous competitions,
  Gemini hint requests spike.
- **Acceptance:** <1% error rate, P95 <500ms under load, auto-scaling strategy documented in
  environment setup.

## 5. Security & Vulnerability Testing

- **Automation:** npm audit, Snyk (planned), OWASP ZAP baseline scan on backend staging nightly.
- **Manual:** Quarterly penetration test, review of auth & competition anonymity.
- **Checklists:** Authentication (JWT validation, role guard), input sanitization (middleware),
  dependency updates.

## 6. User Acceptance Testing (UAT)

- **Stakeholders:** Product owner, instructional designer, representative trainer.
- **Process:**
  - UAT plan per release referencing ROADMAP features.
  - Checklist in `docs/UAT_CHECKLIST.md` (to be populated per cycle).
  - Sign-off recorded before deployment to production.

## 7. Automated Testing Framework

- **Frontend:** Vitest, React Testing Library, Playwright (scheduled). Tests located under
  `src/components/**/__tests__` and `src/pages/**/__tests__`.
- **Backend:** Jest with `tests/integration`, `src/services/__tests__`.
  `NODE_OPTIONS=--experimental-vm-modules` exported in CI for ESM support.
- **CI Pipelines:** GitHub Actions `frontend-ci`, `backend-ci` run lint + tests, upload coverage,
  and fail fast.
- **Mocking:** MSW (planned) for frontend integration, `nock` for backend third-party stubs.

## 8. Bug Tracking & Resolution

- **Tool:** GitHub Issues with labels (`bug`, `sev:high/med/low`, `area:*`).
- **Workflow:**
  - Triage within 24 hours, assign owner, link to failing tests.
  - Severity SLAs: High (fix or rollback within 4h), Medium (1 day), Low (next sprint).
  - Defect template collects reproduction steps, expected/actual behavior, environment.
- **Metrics:** Bug reopen rate, average resolution time, severity distribution.

## 9. AI/Automation Enhancements

- AI-assisted test case generation (compare coverage gaps, suggest edge cases) via GitHub Copilot
  Labs.
- Automated flaky test detection (rerun failed tests, mark flaky label, open issue).
- Performance baseline predictions with k6 + AI heuristic to flag anomalies.

## 10. Validation Checkpoint

- Testing strategy documented and reviewed with QA owner.
- Coverage thresholds, gates, and UAT process approved.
- Action items: finalize Playwright suite, set up Sonar/Codecov, populate UAT checklist.
