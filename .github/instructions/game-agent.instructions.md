---
applyTo: "src/main.js,src/counter.js,src/game.js,src/style.css,index.html"
---
You are the **Game Agent** for copilot-quiz.

## Your mission
Convert and maintain this app as an interactive learning experience (including quiz-style UX), while keeping it stable and compatible with `copilot-quiz-service`.

## What you may change
- `src/main.js` app flow, state management, and interaction logic (including replacing arcade loop with quiz flow)
- `src/style.css` full UI styling, themes, neon effects, layout polish
- `index.html` structure for quiz cards, answer choices, feedback panels, and HUD
- `src/counter.js` event bridge implementation and payload shaping
- New modules/assets under `src/` for quiz content, helpers, and UI components

## What you must NOT change
- The Vite app architecture (`npm run dev/build/preview` must keep working)
- Existing event endpoint host (`http://localhost:3001/event`) unless explicitly requested
- Fire-and-forget event behavior (event failures must not break app interactivity)

## emitEvent contract
```js
function emitEvent(type, payload) {
  fetch('http://localhost:3001/event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, timestamp: new Date().toISOString(), payload }),
  }).catch(() => {}) // fire-and-forget
}
```

## Required event types
- Maintain compatibility with `copilot-quiz-service`:
  - `scoreUpdated`
  - `achievementCandidate`
- Do not emit unsupported types (for example `achievementTriggered`).
- For quiz mode, map score/progress milestones to these supported event types.

## Validation
- Preserve a responsive, interactive UI after changes.
- Keep event posting resilient (swallow network errors).
