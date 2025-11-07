# DevLab Code Review & Quality Gates

## 1. Code Review Workflow

- **Version Control:** GitHub (main branch protected, feature branches per task/TODO).
- **PR Requirements:**
  - Descriptive title prefixed with scope (e.g., `backend:`, `frontend:`) and linked roadmap/TODO
    ID.
  - Summary sections: Context, Changes, Testing, Risk.
  - Include links to relevant `docs/` deliverables and clarifications.
- **Mandatory Reviewers:**
  - 1 reviewer from the owning domain (frontend/backend) + 1 cross-domain reviewer for shared
    changes.
  - Security-sensitive files (`backend/src/middleware/security.js`, secrets handling) require
    security reviewer sign-off.
- **Review Timing:** Async reviews SLA 24h; use GitHub auto-request and Slack notifications.
- **Blocking Criteria:**
  - Failed CI checks or lint/test coverage regressions.
  - Missing tests for new logic.
  - Security/performance regressions identified by reviewer or tooling.

## 2. Branch Protection & PR Standards

- **Protected Branches:** `main`, future release branches (e.g., `release/*`).
- **Branch Policies:**
  - Require status checks: `frontend-ci`, `backend-ci`, `lint`, `tests`, `sonar` (when configured).
  - Require PR approval from two reviewers (or one domain + one automated check for docs-only
    changes).
  - Enforce linear history; squash merges default.
- **PR Template (summary):**
  - Checklist: tests run, lint, docs updated, clarifications added.
  - Risk assessment (Low/Med/High) with mitigation plan.
  - QA steps to reproduce (when UI impact).

## 3. Automated Quality Gates

- **Linting:**
  - Frontend: `npm run lint` (ESLint + React plugin, Prettier).
  - Backend: `npm run lint` (ESLint with Node rules).
  - Gate: zero errors; warnings allowed only for TODO-tagged legacy files.
- **Testing:**
  - Frontend Vitest suite (`npm test -- run`).
  - Backend Jest (`npm test`, with `NODE_OPTIONS=--experimental-vm-modules`).
  - Gate: changed files must have associated tests; coverage thresholds (frontend 80%, backend 85%).
- **Security/Static Analysis:**
  - `npm audit` (frontend/backend) run weekly + on PR (non-blocking unless high severity).
  - SonarCloud (to be connected) for code smells, duplication, hotspots.
  - Dependency bot (Dependabot) for updates.
- **Coverage Reporting:**
  - Upload coverage to Codecov or Sonar (TBD). PR comment summarizing delta.

## 4. Reviewer Automation & Metrics

- **CODEOWNERS:** Map directories to domain reviewers (frontend, backend, security, docs).
- **GitHub Actions:** Auto-assign reviewers based on label (e.g., `area:frontend`).
- **Metrics:**
  - MTTR (time to first review, merged lead time).
  - Review participation rate per contributor.
  - PR rework rate (# of force pushes after review comment).
- **Dashboards:**
  - GitHub Insights / custom Looker (future) to track review queue.
  - Slack digest summarizing open PRs >24h.

## 5. AI/Automation Enhancements

- **AI Draft Review:** Use GitHub Copilot / ChatGPT plugin to generate first-pass review summary
  (highlight risky areas, missing tests).
- **PR Risk Scoring:** Leverage Sonar + custom script (TODO) to label PRs `risk:high` when touching
  security-critical modules or large diff >500 LOC.
- **Automated Suggestions:**
  - ESLint `--fix` and Prettier via Husky pre-commit hooks.
  - AI assistant to propose refactorings for lint warnings/complexity.
- **Knowledge Base:** Persist decisions in `docs/` and highlight related clarifications in PR
  template.

## 6. Validation & Compliance

- All required checks must be green prior to merge (enforced via branch protection).
- Reviewers confirm:
  - Checklist completed (tests, lint, docs, clarifications).
  - No high severity vulnerabilities or security gaps.
  - PR linked to ROADMAP task and, when needed, clarifications.
- Periodic audit (monthly) to verify process adherence and adjust thresholds.
