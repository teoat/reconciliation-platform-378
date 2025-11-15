# Architecture Decision Records (ADRs)

This directory contains Architecture Decision Records (ADRs) that document the key architectural decisions made during the development of the Reconciliation Platform.

## What is an ADR?

An Architecture Decision Record (ADR) is a document that captures an important architectural decision made along with its context and consequences.

## ADR Structure

Each ADR follows this structure:

1. **Title**: A short, descriptive title
2. **Status**: Proposed, Accepted, Rejected, Deprecated, Superseded
3. **Context**: The situation that led to this decision
4. **Decision**: The change that was made
5. **Consequences**: The resulting context after the decision
6. **Alternatives Considered**: Other options that were considered
7. **Related ADRs**: Links to related decisions

## Current ADRs

| ADR | Title | Status | Date |
|-----|-------|--------|------|
| [001](001-frontend-architecture.md) | Frontend Architecture Choice | Accepted | 2024-01-15 |
| [002](002-state-management.md) | State Management Strategy | Accepted | 2024-01-16 |
| [003](003-api-communication.md) | API Communication Pattern | Accepted | 2024-01-17 |
| [004](004-ml-matching-approach.md) | ML-Based Record Matching | Accepted | 2024-01-18 |
| [005](005-realtime-updates.md) | Real-time Updates Implementation | Accepted | 2024-01-19 |
| [006](006-testing-strategy.md) | Testing Strategy and Framework | Accepted | 2024-01-20 |

## How to Create a New ADR

1. Copy the [ADR Template](template.md)
2. Number it sequentially (e.g., `007-new-decision.md`)
3. Fill in all sections
4. Update the README table
5. Commit to version control

## ADR Template

See [template.md](template.md) for the ADR template.