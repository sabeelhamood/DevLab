# DevLab Environment & Infrastructure Setup

## 1. Environment Configuration

| Environment       | Purpose                                           | Hosting                                       | Configuration Highlights                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ----------------- | ------------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Local Development | Feature builds, manual QA, contract test playback | Developer machines                            | - Frontend: `npm run dev` (Vite) served at `http://localhost:5173` <br> - Backend: `npm run dev` (Express + nodemon) at `http://localhost:3001` <br> - Supabase local project (optional) via Supabase CLI; otherwise point to staging schemas read-only <br> - MongoDB Atlas Dev cluster (shared) <br> - `.env.development` files referencing mock microservice URLs and sandbox Judge0/Gemini keys <br> - Storybook-style component playground optional via `npm run dev:playground` |
| Shared Testing    | Automated unit/integration, contract tests        | GitHub Actions CI runners                     | - Use existing GitHub workflows (`.github/workflows`) without modification <br> - Spin up backend with `npm run dev` (Railway ephemeral) using CI secrets <br> - Supabase test schema populated via migration scripts <br> - Judge0 & Gemini mocked using recorded fixtures, with optional smoke tests (nightly) hitting live sandbox <br> - Reports published as workflow artifacts                                                                                                  |
| Staging           | Pre-production, QA, feature demos                 | Railway (backend), Vercel preview deployments | - Backend deploys via GitHub Actions to Railway staging service (same config files) <br> - Frontend preview (Vercel preview build) pointing to staging backend URL <br> - Supabase staging DB with full RLS <br> - MongoDB Atlas staging cluster <br> - Rotating Gemini/Judge0 keys separate from production <br> - Feature flags enabled for new microservice integrations                                                                                                           |
| Production        | Live environment for organizations                | Railway (backend), Vercel (frontend)          | - Use existing deployment files (`railway.json`, `vercel.json`, GitHub Actions workflows) unchanged <br> - Railway service with autoscaling (CPU/RAM triggers) <br> - Vercel build env includes `VITE_API_URL=https://devlab-backend-production.up.railway.app` <br> - Supabase production tenant DB and MongoDB Atlas prod cluster <br> - Secrets managed through GitHub Actions → Railway/Vercel environment configs <br> - WAF/CDN policies via Vercel Edge if needed              |

## 2. CI/CD Pipeline Setup

- **GitHub Actions** (already present):
  - `lint-test.yml`: runs ESLint, Prettier check, Vitest, Jest, and integration suites.
  - `deploy-frontend.yml`: builds Vite app and deploys to Vercel using existing secrets
    (`VERCEL_PROJECT_ID`, `VERCEL_TOKEN`).
  - `deploy-backend.yml`: deploys Express service to Railway using existing secrets
    (`RAILWAY_PROJECT_ID`, `RAILWAY_TOKEN`).
- Additions (within existing workflows, no file changes required):
  - Step to run contract tests with mock servers before deployment.
  - Upload coverage reports (Vitest + Jest) to GitHub summary.
  - Nightly scheduled workflow (`cron`) executing k6 load tests against staging and posting results
    to Ops channel.

## 3. Testing Infrastructure

- **Unit Tests**: Vitest (frontend), Jest (backend). Run in CI using `npm run test:frontend` /
  `npm run test:backend` scripts present in repo.
- **ESM Support**: Set `NODE_OPTIONS=--experimental-vm-modules` locally before running backend Jest
  suites to enable ESM imports (`$env:NODE_OPTIONS="--experimental-vm-modules"` in PowerShell).
- **Integration/Contract Tests**: Located under `tests/integration` with Supertest + Pact for
  microservice contracts. Use mock servers when external services unavailable.
- **E2E Tests**: Playwright suite in `tests/e2e`, targeting staging environment nightly.
- **Mocking Strategy**:
  - Judge0 & Gemini requests intercepted via MSW (frontend) and nock (backend) for deterministic CI
    runs.
  - If live smoke tests enabled, they run after mocks and guard against free-tier rate limit
    exhaustion.
- **Data Fixtures**: Supabase seed scripts per environment stored under
  `backend/src/config/initDatabase.js` (extend as needed).

## 4. Monitoring & Logging

- **Backend Metrics**: Expose `/metrics` (Prometheus format) via existing Express server; scrape
  with Railway or external monitor (e.g., Grafana Cloud).
- **Health Checks**: `/health` (basic), `/readiness` (checks DB, Redis, external API reachability)
  used by Railway auto-restart.
- **Logging**: Winston + MongoDB transport writing to `audit_logs`, `error_logs`,
  `integration_events` collections with 12-month TTL.
- **Alerting**: UptimeRobot/Checkly monitors frontend/backend endpoints. PagerDuty (or email/slack)
  for critical alerts (Judge0/Gemini failure spikes, export retries beyond threshold).
- **Frontend Analytics**: Minimal logging of runtime errors using Sentry (optional) with scrubbed
  data.

## 5. Security Infrastructure

- **Authentication**: Enforce JWT validation via `authMiddleware`; mimic Auth MS in dev using static
  tokens.
- **Authorization**: RBAC checks ensuring `learner` and `trainer/system` roles map to appropriate
  routes; RLS policies guard data access.
- **Secrets Management**: All secrets (Gemini keys, RapidAPI key, Supabase URL/Key) stored in
  Railway/Vercel env vars populated from GitHub secrets. No secrets committed.
- **Network Security**: HTTPS enforced by Vercel and Railway; CORS configured to allow EduCore
  domains; Helmet for security headers; rate limiting on sensitive routes.
- **Data Protection**: Supabase (Postgres) encryption at rest, MongoDB Atlas encryption, hashed
  identifiers where stored, pseudonymous IDs for competitions.

## 6. Cloud Infrastructure Provisioning

- **Railway**: Primary backend service, Redis (queue), and optional worker service all defined via
  existing `railway.json`. Autoscaling policies configured in Railway dashboard (CPU > 70% for 5 min
  → scale up).
- **Vercel**: Frontend deployment using existing `vercel.json`; preview deployments per branch;
  environment variables managed via Vercel dashboard synced from GitHub secrets.
- **Supabase**: Managed Postgres. Use migration scripts (`npm run db:migrate`) to keep schema in
  sync; row-level security enforced.
- **MongoDB Atlas**: Shared cluster for dev/test, dedicated cluster for prod. Configure IP allow
  list, SCRAM auth.
- **Redis**: Railway add-on for BullMQ queue; configure persistence for competition queue
  resilience.

## 7. Development Tools & Workflow Automation

- **Tooling**: VS Code + ESLint/Prettier extensions, Tailwind IntelliSense, Postman collections for
  APIs, Thunder Client scripts for quick testing.
- **Scripts**: Root `package.json` already includes `setup`, `lint`, `quality`, etc. Extend
  `npm run quality` to trigger contract and accessibility tests.
- **Git Hooks**: Husky (already configured) to run lint + tests on pre-commit/pre-push.
- **Documentation**: Keep ADRs/API docs under `docs/`; update runbooks when environment settings
  change.

## 8. TDD Environment Setup

- **Test Runner Configuration**:
  - Vitest config (frontend) ensures JSX transform, CSS handling, MSW integration.
  - Jest config (backend) uses `jest.config.js` with Babel transpilation.
- **Mock Frameworks**: `msw` for frontend network mocks, `nock` for backend HTTP mocks,
  `supabase-js` test utilities for DB mocking.
- **Continuous Testing**: GitHub Actions watchers triggered on PRs; optional `npm run test:watch`
  for local TDD loops.
- **Traceability**: Link each test suite to ROADMAP task IDs in descriptions to simplify audit.

## 9. AI/Automation Enhancements

- Automated prompt regression tests to ensure Gemini outputs stay within expected ranges.
- AI-powered log anomaly detection (optional) using Elastic/Splunk integrations for future
  scalability.
- Static application security testing (Snyk/Dependabot) already integrated via GitHub; configure for
  weekly runs.
- Accessibility automation (axe-core CI plugin) executed after frontend build.

## 10. Validation & Readiness Confirmation

- All environments documented with clear access instructions and secrets paths.
- CI/CD pipelines validated end-to-end using existing GitHub Actions; no deployment file changes
  required.
- Monitoring, logging, and alerting pathways defined for Judge0/Gemini outages and export failures.
- Security controls (JWT, RLS, secret management) outlined and mapped to implementation tasks in
  `ROADMAP.md`.

With this setup plan, DevLab can proceed to implementation while maintaining consistency with the
existing deployment configurations in the repository.
