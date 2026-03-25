---
name: review-react-admin-changes
description: Review pull-request style changes in this React + Vite + TypeScript admin app, prioritizing regressions, correctness risks, and missing tests against the related spec and acceptance criteria.
---

# Review Workflow

1. Read the related spec in `specs/`.
2. Compare implementation against each acceptance criterion.
3. Prioritize findings by severity:
- Broken behavior
- Data/auth/security risks
- Type/runtime risks
- Missing validation or edge-case handling

4. Validate project gates:
- `npm run spec:validate`
- `npm run lint`
- `npm run build`

5. Report:
- Findings first with file and line references
- Open questions and assumptions
- Brief summary of what is safe vs risky

## Focus Areas
- Route protection and navigation flow
- API error handling via services and UI feedback
- State consistency across async flows
- Accessibility and basic UX resilience
