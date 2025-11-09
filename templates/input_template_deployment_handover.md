# CI/CD Deployment, Documentation & Handover

## CURSOR AI Role Definition

**Prompt for CURSOR AI:**

> YOU ARE A SENIOR AI-DRIVEN DEVOPS & RELEASE ENGINEER.  
> Your responsibility is to autonomously generate, configure, and execute **practical CI/CD deployment workflows**.  
> This includes:
>
> - Creating GitHub Actions workflows to deploy the **frontend folder to Vercel** and the **backend folder to Railway**.
> - Configuring all environment variables, secrets, and database connections.
> - Running builds and ensuring both frontend and backend are live.
> - Providing working URLs for both systems that can be opened directly in a browser.
> - Implementing rollback, monitoring, observability, TDD traceability, and documentation handover.  
>   Use AI-assisted optimization to automate pipelines, detect flaky tests, and ensure operational readiness.  
>   **Note:** For live deployment, you require valid credentials/tokens for Vercel, Railway, and GitHub Actions secrets.

---

## Instruction

- Create and execute complete CI/CD pipelines for build, test, deployment, and promotion.
- Deploy frontend folder to Vercel and backend folder to Railway using GitHub Actions.
- Configure all required environment variables, secrets, and database connections.
- Provide working live URLs for both frontend and backend after deployment.
- Implement rollback, contingency, and monitoring procedures.
- Generate comprehensive documentation, runbooks, ADRs, and TDD artifacts.
- Verify deployments with smoke testing and performance checks.
- Ensure traceability to test coverage and TDD artifacts.
- Before executing this template, read the latest clarificationsAndRefinements.md and follow all existing clarifications and refinements. Implement the template tasks accordingly. After completion, append any new clarifications or refinements generated here to the same file. Do not modify or delete existing content; only add new entries. This keeps the file up-to-date for subsequent templates.
- Ask clarifying questions if any information is missing before starting the deployment.

---

## Output

1. **CI/CD Pipelines**  
   Fully implemented, runnable workflows including build, test, deployment, promotion, and IaC integration.

2. **Deployment Strategy & Rollout Plans**  
   Executed strategy description (big bang, phased, blue-green, canary), rollback, contingency, and secrets management.

3. **Cloud Deployment Execution**

   - **Frontend folder → Vercel** (deployed, live, environment configured)
   - **Backend folder → Railway** (deployed, live, environment configured)
   - Provide working URLs for both systems after deployment.

4. **Post-Deployment Validation**  
   Smoke testing, monitoring, observability, performance validation, and issue resolution applied on live systems.

5. **Documentation & Knowledge Transfer**  
   Technical and user documentation, deployment/troubleshooting guides, runbooks, ADRs, and rationale tracking.

6. **TDD Artifacts & Test Coverage**  
   Validation that all test coverage thresholds and TDD artifacts are traceable in production.

7. **Go-Live Support & Handover**  
   Teams, escalation contacts, response plans, and handover procedures for operational continuity.

8. **AI/Automation Enhancements**  
   Automated pipeline optimization, flaky-test detection, optimized release planning, rollback execution, and auto-generated documentation.

9. **Validation & Compliance Confirmation**  
   Confirmation that deployment is verified, rollback procedures tested, documentation generated, and **live cloud URLs are functional**.
10. **Clarifications & Refinements Document**
    A dedicated, continually updated clarificationsAndRefinements.md file that stores all refinements from this template's execution.
    Do not modify existing entries — only append new ones.
    Each refinement must be tied to a specific FEATURE and categorized under Frontend, Backend, or DB.
    Refinements must be specific and detailed, not general.
    This file ensures accuracy and consistency for future templates or development steps.

---

## Cloud Deployment Automation

Prompt:  
"Create and **execute** GitHub Actions workflows to:

1. Deploy the **frontend folder** to **Vercel**, ensuring the site is live and environment variables are correctly configured.
2. Deploy the **backend folder** to **Railway**, ensuring database connections and server start scripts are configured.
3. Provide working URLs for both deployments that can be opened directly in a browser.  
   **Note:** Use secrets/tokens stored in GitHub Actions for authentication and environment configuration."

---

## Validation Checkpoint

Prompt:  
"Has the production deployment been executed, live URLs for frontend and backend provided, rollback procedures verified, monitoring active, documentation completed, and operational handover finalized? and all refinements from this template appended to the clarificationsAndRefinements.md file?"



