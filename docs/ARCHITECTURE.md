# DevLab System Architecture

## Overview

DevLab is an EduCore AI microservice that delivers AI-personalized practice and competition
experiences for enterprise learners. The solution reuses the existing workspace structure:

- `frontend/`: React 18 + Tailwind SPA deployed on Vercel
- `backend/`: Node 20 + Express API deployed on Railway
- `tests/`: shared automated test suites
- Deployment automation: existing GitHub Actions workflows (no modifications required)

The service integrates in real time with Judge0 (RapidAPI) for code execution and Gemini for content
generation, while communicating with other EduCore microservices via REST (and optional gRPC
adapters).

## High-Level Architecture

```
   +------------------+           +-----------------------+           +-------------------------+
   |      Vercel      |           |        Railway        |           |       Data Stores       |
   |------------------|           |-----------------------|           |-------------------------|
   |  React/Tailwind  | <--REST--> |  Express API (BE)     | <--SQL--> |  Supabase Postgres (PG) |
   |  SPA (Frontend)  |           |  Background Workers    |           |-------------------------|
   |                  |           |  Redis Queue           | <--Logs--> |   MongoDB Atlas (MDB)  |
   +------------------+           +-----------------------+           +-------------------------+
             |                               |   ^
             |                               |   |
             |                               v   |
             |                        +----------------+
             |                        | Integration     |
             |                        | Clients (REST/  |
             |                        | gRPC Adapters)  |
             |                        +----------------+
             |                               |
             |                               v
             |               +----------------------------------------------+
             |               |                External Services             |
             |               |----------------------------------------------|
             |               | Judge0 (RapidAPI)  | Gemini API              |
             |               | Course Builder MS  | Content Studio MS       |
             |               | Assessment MS      | Learning Analytics MS   |
             |               | Auth MS            |                         |
             |               +----------------------------------------------+
             |
             +--> REST API calls from SPA to Express handle practice sessions,
                  competitions, trainer validation, assessment passthrough, and
                  analytics export.

             +--> Worker processes async tasks (competition matchmaking, retries)
                  pulling from Redis, persisting state in Postgres/Mongo, and
                  invoking external integrations when required.
```

### Key Responsibilities

- **Frontend SPA**: Practice workspace, competition lobby, timed matches, accessibility controls,
  ambient audio/animations.
- **Express API**: Routes, controllers, services for practice, competition, trainer validation,
  assessment support, analytics export.
- **Redis + Worker**: Queue management for competition matchmaking, asynchronous retries (Learning
  Analytics export, Judge0/Gemini fallbacks).
- **Postgres (Supabase)**: Business data – sessions, competitions, staging questions, queues.
  Row-level security scoped by organization.
- **MongoDB Atlas**: Operational data – logs, audit events, integration metrics with TTL retention.
- **External APIs**: Judge0 (code execution), Gemini (generation, hints, feedback), EduCore
  microservices via REST.

## API & Integration Diagram

```
| Step | Origin            | Destination        | Interaction / Endpoint                                  |
|------|-------------------|--------------------|----------------------------------------------------------|
| 1    | Course Builder MS | DevLab API         | POST /api/v1/competitions/invitations                    |
| 2    | DevLab API        | Frontend SPA       | Invitation surfaced via REST GET /competitions/invitations|
| 3    | Learner (UI)      | DevLab API         | POST /api/v1/competitions/{id}/accept or /decline        |
| 4    | DevLab API        | Gemini API         | Evaluate hints/feedback (practice or competition)        |
| 5    | Content Studio MS | DevLab API         | POST /api/v1/questions/validate or /generate             |
| 6    | DevLab API        | Gemini API         | Validate relevance / generate question + hints + tests   |
| 7    | DevLab API        | Content Studio MS  | AJAX payload response with question package              |
| 8    | DevLab API        | Assessment MS      | POST /api/v1/questions/theoretical (proxy)               |
| 9    | Assessment MS     | DevLab API         | Response with theoretical question                       |
| 10   | Frontend SPA      | DevLab API         | POST /api/v1/practice/sessions/{id}/run                  |
| 11   | DevLab API        | Judge0 API         | Submit code execution                                    |
| 12   | Judge0 API        | DevLab API         | Execution result                                         |
| 13   | DevLab API        | Frontend SPA       | Run results payload                                      |
| 14   | Frontend SPA      | DevLab API         | POST /api/v1/practice/sessions/{id}/submit               |
| 15   | DevLab API        | Gemini API         | Review solution + fraud detection                        |
| 16   | Gemini API        | DevLab API         | Feedback + AI flag                                       |
| 17   | DevLab API        | Frontend SPA       | Feedback message to learner                              |
| 18   | DevLab API        | Learning Analytics | POST /api/v1/analytics/competitions (competition export) |
```

## Component Responsibilities

- **Practice Service**: Generates sessions from Content Studio payloads, tracks hint usage,
  orchestrates Judge0 runs, calls Gemini for feedback, cleans temporary questions when acknowledged.
- **Competition Service**: Queues anonymous invitations, matches opponents, manages timers, trains
  background worker to evaluate results, stores outcomes, exports to Learning Analytics.
- **Trainer Service**: Validates trainer-authored questions through Gemini, enriches with test
  cases/hints, or passes theoretical requests to Assessment.
- **Integration Clients**: Dedicated adapters (`GeminiClient`, `Judge0Client`,
  `CourseBuilderClient`, etc.) with retry, timeout, and mock data support when external services are
  unavailable.

## Security & Deployment Notes

- JWT authentication enforced with required claims (`sub`, `role`, `org_id`, `exp`).
- Roles: `learner` (practice/competitions), `trainer` (question endpoints), `system`
  (cross-microservice).
- HTTPS/TLS enforced end-to-end; Helmet, CORS policies, rate limiting enabled.
- CI/CD: existing GitHub Actions workflows (lint → test → scan → deploy) remain unchanged and
  continue deploying frontend to Vercel and backend to Railway.
- Secrets managed via GitHub Actions → Railway/Vercel; multiple Gemini API keys rotated when limits
  hit.

## Data Flow Summary

1. Content Studio requests questions → DevLab consults Gemini (or Assessment for theoretical) →
   returns enriched payload.
2. Learner practices → front-end calls Judge0 via DevLab → Gemini provides hints/feedback → results
   stored in Supabase, actions logged in Mongo.
3. Course Builder triggers competition invitation → DevLab queues learners and handles match
   lifecycle → Judge0 + Gemini evaluate submissions → results exported to Learning Analytics.
4. Background workers monitor pending exports, queue health, and purge stale staging records.

For detailed API specifications and schema definitions, refer to the Requirements Discovery document
and backend service contracts.
