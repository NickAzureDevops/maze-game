---
name: event-schema-validation
description: Validate maze-game producer events against the maze-game-services contract. Use when checking emitEvent usage, allowed event types, endpoint correctness, and fire-and-forget behavior.
---

# Event Schema Validation

Validate that `maze-game` emits only supported events to the consumer service contract.

## When to use

Use this skill when:
- reviewing changes in `src/main.js` or `src/counter.js`
- preparing a demo run between `maze-game` and `maze-game-services`
- verifying event contract compatibility after instrumentation changes

## Contract

Producer must emit to:
- `http://localhost:3001/event`

Allowed event types only:
- `scoreUpdated`
- `achievementCandidate`

Envelope shape:

```json
{
  "type": "scoreUpdated | achievementCandidate",
  "timestamp": "ISO-8601",
  "payload": {}
}
```

## Validation procedure

1. Read `src/counter.js` and confirm:
   - `fetch('http://localhost:3001/event', ...)` is used
   - event body includes `type`, `timestamp`, and `payload`
   - network errors are swallowed via `.catch(() => {})`
2. Read `src/main.js` and confirm:
   - `scoreUpdated` is emitted on score increments
   - `achievementCandidate` is emitted at achievement milestones and level-up paths
   - no disallowed event type is emitted
3. Search for invalid type usage:
   - reject any `achievementTriggered`
4. Report PASS/FAIL with file + line references.

## Output format

- **Status:** PASS or FAIL
- **Findings:** concise bullets with `file:line`
- **Fixes needed (if FAIL):** minimal edits only, no gameplay changes

## Constraints

Do not change:
- gameplay logic
- canvas rendering
- controls
- maze layout
- game loop timing
