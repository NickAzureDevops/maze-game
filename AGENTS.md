# AGENTS.md — copilot-quiz

Browser-based Copilot Quiz (Vite + vanilla JS) with optional event emission to copilot-quiz-service.

## Setup

```bash
npm install
npm run dev   # starts Vite dev server on http://localhost:5173
```

## Project structure

```
src/
  main.js       # quiz flow, scoring logic, UI state, emitEvent calls
  counter.js    # emitEvent() function — HTTP bridge to copilot-quiz-service
  style.css     # quiz UI styles
index.html      # quiz shell + HUD structure
```

## What you MAY change

- `src/main.js` quiz logic, question flow, scoring, and UI state
- `src/style.css` visuals, glow/theme, HUD presentation, and responsive polish
- `index.html` structure for quiz UI elements
- `src/counter.js` event bridge behavior and payload fields
- New `src/*` modules/assets (including SVG-based player rendering helpers)

## What you MUST NOT change

- Development/build tooling contract (`npm run dev`, `npm run build`, `npm run preview`)
- Event posting endpoint host unless explicitly requested (`http://localhost:3001/event`)
- Fire-and-forget behavior for event emission (never block quiz flow on network failures)

## Event emission rules (when events are used)

All events POST fire-and-forget to `http://localhost:3001/event`:

```js
fetch('http://localhost:3001/event', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ type, timestamp: new Date().toISOString(), payload }),
}).catch(() => {}) // never let event errors affect quiz flow
```

### scoreUpdated
Emit on every score change:
```json
{ "score": 100, "delta": 10, "level": 1 }
```

### achievementCandidate
Emit once per milestone (100, 500, 1000, 2500, 5000 points) and on level up:
```json
{ "score": 500, "achievement": "Reached 500 points!", "level": 1 }
```
**Never use `achievementTriggered` — it is rejected by copilot-quiz-service.**

## Test

1. Start copilot-quiz-service: `cd ../copilot-quiz-service && node src/server.js`
2. Start app: `npm run dev`
3. Open the quiz in browser and answer questions to earn points
4. Open `http://localhost:3001` — events should appear within 2 seconds
5. Check browser console for CORS errors (there should be none)

## Integration context

Consumer repo: https://github.com/NickAzureDevops/copilot-quiz-service

This repo can be developed as a full quiz client. Avoid adding backend API routes here; keep it a front-end app.
