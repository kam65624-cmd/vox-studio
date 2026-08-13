# Codex Operating Contract — VOX Studio

You are not free to redesign the product architecture while implementing it.

## Source of truth order
1. PRD
2. Architecture Bible
3. Technical Blueprint
4. Design System
5. Phase-specific acceptance criteria

## Every task
- inspect before editing
- preserve existing working behavior
- make the smallest coherent change
- add tests
- run lint
- run typecheck
- run tests
- run build
- fix failures
- summarize changed files

## Never
- fabricate provider capabilities
- hard-code API keys
- bypass contracts
- delete canonical assets
- create duplicate state stores without reason
- install libraries without justification
- mark a feature complete without a smoke test

## Definition of Done
A feature is done only when it works through its real boundary, is tested, is typed, is observable and has the intended premium UX.
