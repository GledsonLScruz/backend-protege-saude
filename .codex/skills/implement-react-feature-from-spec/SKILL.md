---
name: implement-react-feature-from-spec
description: Implement approved feature specs in this React + Vite + TypeScript repository. Use when translating spec acceptance criteria into code changes across routes, components, services, and styles while preserving type safety and existing architecture.
---

# Implementation Workflow

1. Read the target spec in `specs/` and extract acceptance criteria.
2. Map each criterion to code touchpoints:
- Routes: `src/app/`
- Pages/components: `src/pages/`, `src/components/`
- API/domain logic: `src/services/`
- Shared types/hooks/utils: `src/types/`, `src/hooks/`, `src/utils/`

3. Implement in small commits/patches with strict TypeScript compatibility.
4. Run required checks:
- `npm run spec:validate`
- `npm run lint`
- `npm run build`

5. Produce a criterion-by-criterion delivery summary.

## Guardrails
- Do not expand scope beyond the spec without updating the spec first.
- Keep UI states explicit for loading, success, and error paths.
- Keep API calls centralized in services.
