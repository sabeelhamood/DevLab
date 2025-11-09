# Universal Master Project Development Template

# Overview

- A structured, AI-driven project development framework managed entirely by CURSOR AI, covering the full lifecycle from planning to deployment. Designed for universal adaptability across all technologies, project types, and methodologies.

# Global Rules

- AI-Led Execution: No human developers — CURSOR AI handles all implementation and validation.
- Quality & Safety: Enforced TDD, risk management, and rollback protocols.
- Continuous Context: AI maintains full project history and validation logic.
- Sequential Progression: Each phase completes only after validation checkpoints.

# Core Principles

- Technology Agnostic & Scalable — adaptable to any stack or project size.
- Methodology Inclusive — compatible with Agile, DevOps, or hybrid workflows.
- Automation & Governance — integrated CI/CD, quality control, and feedback loops for continuous improvement.

---

# ROADMAP & Checklist Control

The ROADMAP.md file serves as the central control, documentation, and progress management tool throughout all development phases.

Creation and Update Process
At the end of each phase (Requirements, Flow, Architecture, Implementation), the ROADMAP.md file is automatically created or updated to reflect all current tasks, features, and dependencies derived from the system’s core documentation.
Any modification in the Requirements, Flow, or Architecture documents will trigger an automatic update of the ROADMAP, ensuring real-time alignment and full traceability between planning and implementation.

File Structure
The ROADMAP will be organized by system features, allowing every major feature to have its own dedicated section with maximum granularity.
Each feature section will include:
Detailed subtasks – broken down to the smallest actionable level (functions, UI components, API calls, unit tests, etc.).
Task status – clearly defined as To Do / In Progress / Done / Rework.
Source references – links to related requirement documents, architecture diagrams, or code sections.
Dependencies – a list of other tasks or modules that this feature relies on.
Test links – direct connections to unit, integration, or QA test cases.
Definition of Done (DoD) – a clear definition of completion criteria, including requirement coverage, validation, testing, and code review.

Control Layer & AI Governance
The AI uses the ROADMAP as a strict control layer before writing or modifying any code:
Code or tasks marked as Done cannot be changed or overwritten unless their status is explicitly updated to Rework with a documented reason.
Every code generation or modification request must pass through ROADMAP validation, ensuring proper documentation, justification, and traceability.
This guarantees a controlled and auditable workflow, maintaining consistency between Requirements → Architecture → Implementation → Testing.

Overall Purpose
The goal is to make the ROADMAP the central nervous system of the project — a living, intelligent, and fully traceable management layer that provides:
A complete and up-to-date view of all features and development progress.
High-resolution tracking of every subtask across the system.

# 📄 Clarifications & Refinements Log

The clarificationsAndRefinements.md file is a dedicated document used to maintain a centralized log of all clarifications, adjustments, and refinements made throughout the development process.

This file is organized by features, and within each feature, refinements are categorized by Backend, Frontend, and Database when applicable. Each refinement is specific and actionable, ensuring full clarity during implementation.

🛠️ How It Works

Source of Refinements:
All refinements in this file originate from questions CURSOR asks the user during execution, or custom instructions the user specifies. These refinements are context-aware and relate to precise implementation details, not general ideas.

Specificity Requirement:
Each refinement must be as detailed and specific as possible — e.g.:

“The submit button should be green with the hex code #4CAF50, width: 150px, and corner radius: 8px.”
Rather than:
“Make the button look good.”

Structure by Feature & Layer:
Each feature has its own section. Within that feature, refinements are categorized under:

Backend

Frontend

Database

Lifecycle:
The file evolves as a living document — refinements are only appended, never modified or removed, ensuring traceability and version safety.

Usage in Templates:
Every CURSOR template must:

Review refinements relevant to its feature and layer before starting.

Append new specific refinements under the correct feature and layer after execution.

Project Alignment:
This ensures all micro-decisions and implementation nuances are documented and communicated consistently across the team and phases.

# Master Development Lifecycle Phases

---

## Phase 1: Project Foundation & Strategic Planning

**Template:** `input_template_project_foundation.md`

### Objective

Provide a clear and structured description of the project, outlining its purpose, goals, and value proposition within its intended context.

### Key Deliverables

- A concise project overview defining its vision, mission, and primary objectives
- Description of the problem being addressed and the solution concept
- Clarification of the project’s scope, target audience, and expected impact
- Requirements gathering
- Summary of the project’s unique approach or innovation

**AI Enhancement:** Business model validation, opportunity assessment, alignment verification  
**Validation Checkpoint:** ✅ Strategic alignment confirmed, stakeholder consensus achieved

---

## Phase 2: Requirements Discovery & Analysis

**Template:** `input_template_requirements_discovery.md`

### Objective

Comprehensive requirements gathering, analysis, and traceability.

### Key Deliverables

- Functional & non-functional specifications
- User stories, epics, and acceptance criteria
- Business rules and constraints
- Integration and dependency documentation
- Compliance and security requirements
- UX and accessibility standards
- TDD: Acceptance criteria written as testable specs

**AI Enhancement:** Automated conflict detection, completeness validation, prioritization  
**Validation Checkpoint:** ✅ Requirements validated, sign-off obtained

---

## Phase 3: System Architecture & Technical Design

**Template:** `input_template_architecture_design.md`

### Objective

Define comprehensive system and data architecture, including technical specifications, design patterns, and data management strategy, ensuring scalability, governance, and optimization.

### Key Deliverables

- System and component diagrams
- Technology stack justification
- Database and schema design
- API and protocol definitions
- Security and threat modeling
- Cloud/infrastructure design
- ETL/ELT processes and data migration strategy
- Backup, recovery, and data governance plan
- Data quality validation and analytics integration
- folder organization

**AI Enhancement:** Pattern recommendation, compatibility validation, performance modeling, and data optimization insights  
**Validation Checkpoint:** ✅ Architecture and data framework approved, scalability and governance validated

---

## Phase 4: Feature Planning & Component Breakdown

**Template:** `input_template_feature_planning.md`

### Objective

Decompose features into manageable development units and roadmap creation as output.

### Key Deliverables

- Feature specifications and testable criteria
- Dependency mapping
- Development task breakdown
- Sprint and resource planning
- User journeys and workflows
- Feature prioritization and release roadmap
- TDD: Test specs for each component

**AI Enhancement:** Task decomposition, dependency optimization  
**Validation Checkpoint:** ✅ Roadmap approved, dependencies resolved

---

## Phase 5: Development Environment & Infrastructure Setup

**Template:** `input_template_environment_setup.md`

### Objective

Establish robust environments for development, testing, staging, and production.

### Key Deliverables

- Environment configuration and standardization
- CI/CD pipeline setup
- Testing infrastructure and data management
- Monitoring and logging systems
- Security and access control configuration
- Cloud provisioning and optimization

**AI Enhancement:** Configuration validation, cost optimization  
**Validation Checkpoint:** ✅ Environments operational, security validated

---

## Phase 6: Core Development & Implementation

**Template:** `input_template_core_development.md`

### Objective

Implement primary functionality with full TDD workflow, ensuring code quality, compliance, and sequential progression.

### Key Deliverables

- Core logic, API, and UI implementation
- Full TDD workflow execution
- Algorithm optimization and testing
- Mock testing for third-party services
- Code quality, security, and coverage verification
- Phase deliverables approval and documentation
- Sequential execution with mandatory checkpoints
- Requirements traceability, KPI achievement, and ROI confirmation

**AI Enhancement:** Code analysis, automated refactoring, and validation assistance
**Validation Checkpoint:** ✅ Standards met, integration tested, approvals confirmed, and progression checkpoints passed

---

### Phase 6.1 — Code Review & Quality Gates

**Template:** `input_template_code_review.md`

### Objective

Formalize code review and enforce automated quality gates.

### Key Deliverables

- Review policy and PR templates
- Linting, static analysis, security scanning
- Coverage thresholds and branch protection
- Reviewer automation and metrics tracking

**AI Enhancement:** PR summarization, risk flagging  
**Validation Checkpoint:** ✅ All PRs meet quality gates and KPIs

---

## Phase 7: Quality Assurance & Testing Strategy

**Template:** `input_template_testing_strategy.md`

### Objective

Ensure reliability, stability, and test-first methodology compliance.

### Key Deliverables

- Unit, integration, and performance testing
- Load, stress, and security testing
- Test coverage >95% for TDD components
- Continuous testing integration

**AI Enhancement:** Intelligent test generation and defect prediction  
**Validation Checkpoint:** ✅ Quality standards exceeded

---

## Phase 8: Security Implementation & Compliance

**Template:** `input_template_security_compliance.md`

### Objective

Implement and validate complete security compliance.

### Key Deliverables

- Security audits and penetration tests
- Encryption, monitoring, and IAM systems
- Incident response planning

**AI Enhancement:** Vulnerability scanning, compliance tracking  
**Validation Checkpoint:** ✅ Audit passed, systems secure

---

## Phase 9: CI/CD Deployment, Documentation & Handover

**Template:** `input_template_deployment_handover.md`

### Objective

Execute reliable production deployments with full CI/CD automation and produce complete technical documentation for smooth transition and operational continuity.

### Key Deliverables

- CI/CD pipelines for build, test, deployment, and promotion
- Infrastructure-as-Code (IaC) and container registry integration
- Rollout, rollback, and release gating plans
- Blue-green or canary deployment setup
- Secrets management and observability guardrails
- Post-deployment validation and runbooks
- Technical and user documentation
- Deployment and troubleshooting guides
- ADRs (Architectural Decision Records) and rationale tracking
- Enforced TDD artifacts and test coverage thresholds

**AI Enhancement:** Automated pipeline generation, flaky-test detection, optimized release planning, rollback execution, and auto-generation of documentation and knowledge-transfer materials.
**Validation Checkpoint:** ✅ Deployment verified, rollback tested, documentation generated, and knowledge successfully transferred.

---

# Template Reference Library

### Input Templates

1. `input_template_project_foundation.md`
2. `input_template_requirements_discovery.md`
3. `input_template_architecture_design.md`
4. `input_template_feature_planning.md`
5. `input_template_environment_setup.md`
6. `input_template_core_development.md`
7. `input_template_code_review.md`
8. `input_template_testing_strategy.md`
9. `input_template_security_compliance.md`
10. `input_template_deployment_handover.md`

---

## Conclusion

This **Universal Master Project Development Template** serves as an **AI-driven, end-to-end framework** ensuring that no part of the software development lifecycle is overlooked, while remaining adaptable to all project types, technologies, and organizational structures.



