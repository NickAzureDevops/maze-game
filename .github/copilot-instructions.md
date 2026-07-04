# Copilot Instructions — copilot-quiz

## Build & run

```bash
npm ci                # install dependencies
npm run dev           # Vite dev server → http://localhost:5173
npm run build         # production build to dist/
npm run preview       # preview production build
```

No test suite or linter is configured.

## Architecture

Vite + vanilla JS single-page quiz app. This is the **event producer** half of a two-repo system; it emits fire-and-forget HTTP events to [copilot-quiz-service](https://github.com/NickAzureDevops/copilot-quiz-service) (the consumer/dashboard).

```
index.html          → quiz shell, HUD, answer grid
src/main.js         → quiz flow, scoring, UI state, calls emitEvent()
src/counter.js      → emitEvent() — HTTP bridge to copilot-quiz-service
src/style.css       → all styling
```

Scoring: correct answers earn `SCORE_PER_CORRECT` (100) plus a streak bonus (`STREAK_BONUS_STEP` × streak). Achievement milestones are defined in `ACHIEVEMENT_MILESTONES`.

## Event emission contract

`emitEvent(type, payload)` in `src/counter.js` POSTs to `http://localhost:3001/event`. It must stay **fire-and-forget** — errors are silently swallowed via `.catch(() => {})`.

Envelope shape:
```json
{ "type": "<event-type>", "timestamp": "<ISO-8601>", "payload": { … } }
```

### Allowed event types (only these two)

| Type | When | Payload |
|------|------|---------|
| `scoreUpdated` | Every score change | `{ "score", "delta", "level" }` |
| `achievementCandidate` | Milestone hit, streak multiple, level advance, quiz complete | `{ "score", "achievement", "level" }` |

**Never emit `achievementTriggered`** — it is rejected by copilot-quiz-service.

## Constraints

- Do not change the Vite tooling contract (`npm run dev/build/preview`).
- Do not change the event endpoint (`http://localhost:3001/event`) unless explicitly asked.
- Event failures must never block quiz interactivity.
- This repo is frontend-only — no backend routes.

## Integration testing

1. Start the service: `cd ../copilot-quiz-service && node src/server.js`
2. Start the quiz: `npm run dev`
3. Answer questions to earn points.
4. Open `http://localhost:3001` — events should appear within 2 seconds.
5. Check browser console for CORS errors (there should be none).

## Repo skills & prompts

- `.github/skills/event-schema-validation/` — validates emitEvent calls against the copilot-quiz-service contract.
- `.github/prompts/event-schema-validation.prompt.md` — prompt to invoke that skill.
- `.github/prompts/game-agent.prompt.md` — Game Agent prompt.
