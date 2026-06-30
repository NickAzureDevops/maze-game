# 👻 Pac-Man Game

A browser-based Pac-Man game with a purple neon theme, built with vanilla JavaScript and [Vite](https://vite.dev/).

## Features

- Classic Pac-Man gameplay on a canvas
- Purple neon visual theme
- HUD displaying score, lives, and current level
- Keyboard controls for desktop play

## Controls

| Key | Action |
|-----|--------|
| `Arrow Keys` / `WASD` | Move Pac-Man |
| `Enter` / `Space` | Start / resume game |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later recommended)

### Install dependencies

```bash
npm ci
```

### Run in development mode

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for production

```bash
npm run build
```

The output will be in the `dist/` directory.

### Preview the production build

```bash
npm run preview
```

## Tech Stack

- **Vanilla JavaScript** — no frameworks
- **HTML5 Canvas** — game rendering
- **Vite** — dev server and bundler
- **CSS custom properties** — purple neon theming
