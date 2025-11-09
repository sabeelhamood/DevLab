# Code Review & Quality Gates

## CURSOR AI Role Definition

**Prompt for CURSOR AI:**

> YOU ARE A SENIOR AI-DRIVEN CODE QUALITY ENGINEER.  
> Your responsibility is to autonomously define, enforce, and optimize code review processes, quality gates, and CI/CD integration.  
> You will design workflows, automate reviewer assignments, enforce static analysis, linting, coverage, and security checks.  
> Provide actionable recommendations and AI-assisted optimizations to ensure maintainable, secure, and high-quality code.

---

## Instruction

- Define code review workflow, branch protection, and PR standards.
- Specify linting, static analysis, security scanning, and coverage thresholds.
- Implement reviewer automation, metrics tracking, and AI-enhanced suggestions.
- Ensure alignment with CI/CD pipelines and enforce quality gates.
- Provide descriptive, actionable outputs for team adoption and integration.
- Before executing this template, read the latest clarificationsAndRefinements.md and follow all existing clarifications and refinements. Implement the template tasks accordingly. After completion, append any new clarifications or refinements generated here to the same file. Do not modify or delete existing content; only add new entries. This keeps the file up-to-date for subsequent templates.
- If there is anything unclear and you want more details, ask me questions so I can help you and clarify things for you.

---

## Output:

1. **Code Review Policy & PR Templates**  
   Clear workflow, branch rules, required reviewers, and standardized PR/issue templates.

2. **Linting, Static Analysis & Security Gates**  
   List of automated quality checks, tools, and enforcement mechanisms.

3. **Coverage Thresholds & Branch Protection**  
   Branch protection rules, coverage requirements, and integration with CI/CD.

4. **Reviewer Automation & Metrics**  
   Automated assignment strategies, key metrics, and reporting mechanisms.

5. **AI/Automation Enhancements**  
   AI-assisted PR summaries, risk scoring, refactoring suggestions, and insights for review optimization.

6. **Validation & Compliance Confirmation**  
   Confirmation that all PRs meet quality gates, branch protection is enforced, coverage thresholds are met, and KPIs are tracked.
7. **Clarifications & Refinements Document**
   A dedicated, continually updated clarificationsAndRefinements.md file that stores all refinements from this template's execution.
   Do not modify existing entries — only append new ones.
   Each refinement must be tied to a specific FEATURE and categorized under Frontend, Backend, or DB.
   Refinements must be specific and detailed, not general.
   This file ensures accuracy and consistency for future templates or development steps.

---

## Code Review Policy and PR Templates

Prompt: "Define the code review workflow including:

- Version control system (GitHub, GitLab, Bitbucket, etc.)
- Mandatory reviews before merging into protected branches
- Required number of reviewers per PR
- Roles required for approval (senior dev, security lead, QA)
- PR and issue templates to standardize submissions
- CODEOWNERS or automated reviewer assignment"

## Linting, Static Analysis, and Security Scanning

Prompt: "Specify automation and quality gates including:

- Linting and automatic formatting enforcement (Prettier, Black, clang-format)
- Static code analysis tools (SonarQube, ESLint, pylint, etc.)
- Security and dependency scans before merging
- Minimum code coverage thresholds for PR approval"

## Coverage Thresholds and Branch Protection

Prompt: "Define branch protection rules, including:

- Enforcement of code review completion
- Validation that automated gates pass before merge
- Minimum coverage requirements
- Integration with CI/CD pipelines"

## Reviewer Automation and Metrics Tracking

Prompt: "Track and optimize code review process including:

- Reviewer assignment automation and AI routing
- Metrics such as mean time to review (MTTR), review participation rate
- Code quality trend reports
- AI insights for review bottlenecks and risky changes"

## AI/Automation Enhancement

Prompt: "Leverage AI to:

- Auto-generate PR summaries highlighting logic changes
- Flag high-risk or complex changes for senior review
- Suggest inline review comments or refactoring opportunities
- Score PRs for maintainability, security, and risk"

---

## Validation Checkpoint

Prompt: "Ensure all PRs meet automated quality gates, branch protection rules are enforced, code coverage thresholds are met, reviewer automation is validated, and KPIs are tracked and all refinements from this template appended to the clarificationsAndRefinements.md file"



