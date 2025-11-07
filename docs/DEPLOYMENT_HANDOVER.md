# DevLab CI/CD Deployment, Documentation & Handover

> **Reminder:** Do not trigger live deployment until Vercel project is created and linked. Await
> confirmation before running deployment workflows.

## 1. CI/CD Pipelines

- **GitHub Actions Workflows (existing):**
  - `frontend-ci.yml`: install, lint, test, build artifacts for Vercel.
  - `backend-ci.yml`: install, lint, test, package for Railway.
  - `deploy-frontend.yml`: deploy `frontend/` to Vercel (manual approval).
  - `deploy-backend.yml`: deploy `backend/` to Railway (manual approval).
- **Enhancements:**
  - Add steps for coverage upload, SonarCloud scan, OWASP ZAP.
  - Introduce workflow dispatch to support staging vs. production deployments.

## 2. Deployment Strategy & Rollout

- **Frontend:** Vercel (SPA). Production deploy via GitHub Action (disabled until Vercel project
  ready).
- **Backend:** Railway Node service with autoscaling.
- **Approach:** Blue/green by leveraging Railway environments; Vercel preview URLs for smoke
  testing.
- **Rollback:**
  - Frontend: revert to previous Vercel deployment (`vercel rollback`).
  - Backend: Railway rollback to last successful build or scale down new service.
- **Secrets Management:** GitHub -> Vercel/Railway via Action secrets (`VERCEL_TOKEN`,
  `RAILWAY_TOKEN`, API keys).

## 3. Cloud Configuration

- **Vercel env vars:** `VITE_API_URL`, future analytics keys.
- **Railway env vars:** `GEMINI_API_KEY`, `SUPABASE_*`, `MONGO_URL`, `x-rapidapi-*`, etc.
- **Supabase/Mongo:** already provisioned; migrations handled via scripts in `backend/src/config`.
- **Monitoring Hooks:** configure Vercel Analytics, Railway logs, optional New Relic (backlog).

## 4. Post-Deployment Validation

- **Automated Smoke Tests:**
  - Frontend: `npm run test:e2e` (Playwright) hitting preview/staging.
  - Backend: health check (`/health`), practice session creation, competition flow.
- **Manual Checklist:**
  - Validate practice session from learner view.
  - Accept competition invite, finish match, confirm analytics export queued.
  - Check logs for errors within 30 minutes post-release.

## 5. Documentation & Knowledge Transfer

- **Runbooks:**
  - Deployment runbook (this document + environment info).
  - Incident response in `docs/INCIDENT_RESPONSE.md` (to be authored when go-live nears).
- **System Docs:** Architecture, Testing, Security already in `docs/`.
- **Training:** handover meeting covering CI pipelines, rollback procedures, environment access.

## 6. TDD Artifacts & Coverage

- Coverage reports stored as CI artifacts; plan to integrate Codecov.
- Tests tied to ROADMAP tasks; maintain traceability in PR template.
- Ensure TDD compliance highlighted in review checklist (Code Review doc).

## 7. Validation & Next Steps

- Await Vercel project creation before running `deploy-frontend.yml` (currently paused).
- Confirm Railway service connections and environment variables in secrets store.
- Outstanding actions: configure SonarCloud, ZAP, incident runbook, Playwright pipeline.
