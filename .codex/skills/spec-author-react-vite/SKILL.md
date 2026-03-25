---
name: spec-author-react-vite
description: Write or update feature specs for this React + Vite + TypeScript admin project. Use when planning new features, refactors, API integrations, or UX changes that require clear problem framing, scope, and acceptance criteria before implementation.
---

# Spec Authoring Workflow

1. Gather context from:
- Target files under `src/`
- Existing behavior in routes, services, and UI components
- API contracts touched by the change

2. Create or update a spec in `specs/` using `specs/templates/feature-spec.md`.

3. Keep the spec behavioral:
- Describe what users/admins can do after the change.
- Define measurable acceptance criteria.
- State explicit non-goals.

4. Include implementation notes only when they reduce ambiguity (e.g., migration or rollout constraints).

5. Validate required sections:
- `## Problem`
- `## Scope`
- `## Acceptance Criteria`
- `## Out of Scope`

## Output Contract
- Return the final spec path.
- Include a short “open questions” section if decisions remain blocked.
