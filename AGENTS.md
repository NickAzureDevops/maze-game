# AGENTS.md — pac-man-game

Browser-based Pac-Man game that emits events to pac-man-services.
This is a **legacy system being AI-instrumented** — a Vite + vanilla JS app.

## Setup

```bash
npm install
npm run dev   # starts Vite dev server on http://localhost:5173
```

## Project structure

```
src/
  main.js       # game loop, canvas rendering, score logic, emitEvent calls
  counter.js    # emitEvent() function — HTTP bridge to pac-man-services
  style.css     # game styles
index.html      # canvas + HUD structure
```

## What you MAY change

- `src/counter.js` — the `emitEvent` implementation
- `emitEvent` call sites in `src/main.js` (adding/fixing calls only)
- Event type strings and payload shapes to match the platform schema

## What you MUST NOT change

- Canvas rendering logic (`draw()` function)
- Ghost AI or movement (`moveGhost()` function)
- Maze layout (`TEMPLATE` array)
- Keyboard controls (`keydown` handler)
- Game loop timing (`PAC_SPEED`, `GHOST_SPEED`)
- `index.html` structure or HUD element IDs

## Event emission rules

All events POST fire-and-forget to `http://localhost:3001/event`:

```js
fetch('http://localhost:3001/event', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ type, timestamp: new Date().toISOString(), payload }),
}).catch(() => {}) // never let event errors affect gameplay
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
**Never use `achievementTriggered` — it is rejected by pac-man-services.**

## Test

1. Start pac-man-services: `cd ../pac-man-services && node src/server.js`
2. Start game: `npm run dev`
3. Open game in browser, earn points
4. Open `http://localhost:3001` — events should appear within 2 seconds
5. Check browser console for CORS errors (there should be none)

## Integration context

Consumer repo: https://github.com/NickAzureDevops/pac-man-services

This repo is the event **producer** only. Do not add API routes or dashboard logic here.
