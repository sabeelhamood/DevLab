# System Architecture & Technical Design

## CURSOR AI Role Definition

**Prompt for Cursor AI**

> You are an expert system architect and database engineer.  
> Your responsibility is to design the complete system architecture for this project, selecting the optimal technologies, databases, and frameworks, defining data models, APIs, and project structure, based on the project requirements and previous deliverables.  
> You must work interactively, reasoning through trade-offs, dependencies, and best practices.  
> At the end of the architecture phase, you must ask me for approval before proceeding to the actual implementation.

## Instructions for Cursor AI

1. Review all previous deliverables: (Project Foundation, Requirements, Feature Planning, etc.).
2. Design full system architecture, including layers, components, data models, APIs, and infrastructure.
3. Propose folder/project structure:
   - Separate **Frontend**, **Backend**, and **Tests** directories.
   - Group modules logically for scalability and maintainability.
4. Provide actionable, implementation-ready outputs, including:
   - Technology stack selection
   - Database design (models, normalization/denormalization, indexing)
   - API definitions (endpoints, methods, request/response schemas)
   - Security model (auth, encryption, threat mitigation)
   - Infrastructure plan (cloud/on-prem, deployment, monitoring, backup)
   - Data quality and analytics integration
5. Justify all choices for performance, scalability, maintainability, and cost-effectiveness.
6. Highlight risks, trade-offs, and AI-assisted optimization recommendations.
7. Before moving to implementation, ask for **approval of the proposed architecture**. No code should be generated for production until the architecture is approved.
8. Before executing this template, read the latest clarificationsAndRefinements.md and follow all existing clarifications and refinements. Implement the template tasks accordingly. After completion, append any new clarifications or refinements generated here to the same file. Do not modify or delete existing content; only add new entries. This keeps the file up-to-date for subsequent templates.
9. If there is anything unclear and you want more details, ask me questions so I can help you and clarify things for you.

## Required Outputs:

### 1. System Architecture

- Overall system design with layers, components, and interactions.

### 2. Diagrams

- High-level system diagram
- Component interaction diagram
- Data flow diagram
- Deployment & integration diagrams

### 3. Technology Stack

- **Frontend:** frameworks, libraries, rationale
- **Backend:** frameworks, libraries, rationale
- **Database:** type, data models, indexing, rationale
- **Infrastructure:** cloud/on-prem, deployment strategy, rationale

### 4. Database Design

- Entities, relationships, normalization/denormalization
- ETL/ELT and migration strategy
- Indexing and performance optimization

### 5. API Definitions

- Endpoints, HTTP methods, request/response structures
- Authentication and authorization strategy

### 6. Security Model

- Auth & permissions
- Encryption at rest & in transit
- Threat models & mitigations

### 7. Cloud / Infrastructure

- Topology and component layout
- Backup and disaster recovery
- Monitoring, logging, and observability

### 8. Data Quality & Analytics

- Validation rules & governance
- BI and analytics integration points

### 9. Folder & Project Structure

- Separate **Frontend**, **Backend**, and **Tests** folders
- Logical module/component grouping for scalability
- Best practices for maintainability

### 10. AI / Automation Enhancements

- AI-assisted recommendations for architecture patterns
- Technology compatibility validation
- Performance/scalability prediction
- Data design optimization

### 11. Clarifications & Refinements Document

A dedicated, continually updated clarificationsAndRefinements.md file that stores all refinements from this template's execution.
Do not modify existing entries — only append new ones.
Each refinement must be tied to a specific FEATURE and categorized under Frontend, Backend, or DB.
Refinements must be specific and detailed, not general.
This file ensures accuracy and consistency for future templates or development steps.

---

## System and Component Diagrams

Prompt: "Provide high-level system architecture, component diagrams, and how components interact. Include data flow, deployment, and integration diagrams where possible."

## Technology Stack Justification

Prompt: "List proposed technologies, frameworks, and tools for frontend, backend, data, and infrastructure layers. Include rationale for each choice, Feel free to ask me any questions that might help you."

## Database and Schema Design

Prompt: "Describe database types, schemas, data models, normalization/denormalization strategies, indexing, ETL/ELT processes, and data migration strategies, Feel free to ask me any questions that might help you.."

## API and Protocol Definitions

Prompt: "Define all APIs, endpoints, data contracts, protocols, and interface specifications required for inter-component communication."

## Security Architecture and Threat Modeling

Prompt: "Outline security architecture, authentication/authorization models, encryption, and threat models considered at the design stage."

## Cloud/Infrastructure Design

Prompt: "Detail target hosting environment (cloud, on-premise, hybrid), infrastructure topology, provisioning strategy, backup and recovery plans, and governance, Feel free to ask me any questions that might help you."

## Data Quality and Analytics Integration

Prompt: "Define data quality validation, governance strategies, and integration points for analytics or BI tools."

Folder Organization and Project Structure

Prompt: "Describe the overall folder organization and project structure, including separation between frontend and backend, logical grouping of modules/components, and adherence to best practices for scalability and maintainability."

## AI/Automation Enhancement

Prompt: "Use AI-assisted tools to recommend architecture patterns, validate technology compatibility, predict performance/scalability issues, and optimize data design."

---

## Validation Checkpoint

Prompt: "Have architecture diagrams, technology choices, database design, API specs, security models, infrastructure plans, and data quality strategies been reviewed, validated for feasibility, scalability, and approved by stakeholders? and all refinements from this template appended to the clarificationsAndRefinements.md file?"



