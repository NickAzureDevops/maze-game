# 🧩 Maze Game

A browser-based maze game with a modern dashboard shell, built with vanilla JavaScript and [Vite](https://vite.dev/).

![Maze Game dashboard preview](./public/maze-game-dashboard.png)

This repository is the **Game Agent** side of a broader **GitHub Copilot Apps** demo. It keeps Maze Game playable while acting as the event producer for the wider system.

- **In this repo** — context-aware code reasoning, safe event instrumentation, and gameplay-preserving changes
- **In the broader system** — backend services, multi-repo orchestration, full-stack generation, and end-to-end event flow with [NickAzureDevops/maze-services](https://github.com/NickAzureDevops/pac-man-services)

Together, this Maze Game repo and [NickAzureDevops/maze-services](https://github.com/NickAzureDevops/pac-man-services) demonstrate:

- **Context-aware reasoning** — Copilot understands existing code in both repos and makes targeted changes.
- **Planning and approval workflow** — Plans can be generated, reviewed, and then executed across repos.
- **Multi-repository orchestration** — Copilot coordinates changes in the producer and consumer repos together.
- **Full-stack generation** — The demo spans frontend gameplay, backend services, and dashboard behavior.
- **Event-driven architecture understanding** — Copilot models the flow from game events to service ingestion to UI updates.

## Controls

| Key | Action |
|-----|--------|
| `Arrow Keys` / `WASD` | Move player |
| `Enter` / `Space` | Start / resume game |

## Getting Started

- [Node.js](https://nodejs.org/) (v18 or later recommended)

```bash
npm ci
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

```bash
npm run build
npm run preview
```
