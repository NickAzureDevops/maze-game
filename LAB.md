# 🧩 GitHub Copilot Apps — Demo Lab

> **Total time: 20–30 minutes**
> **Goal:** Show how GitHub Copilot Apps evolves a legacy game into a multi-repo, event-driven system using Plan Mode, Agent Mode, MCP, Workflow Automation, multi-repo tasks, and Canvas.

## ⏱️ Timing Guide

| Segment | Feature | Time |
| --- | --- | --- |
| 0:00 | Setup + narrative framing | 2 min |
| 2:00 | **Plan Mode** | 4 min |
| 6:00 | **Canvas** | 3 min |
| 9:00 | **Agent Mode / Agent Merge** | 5 min |
| 14:00 | **MCP** | 4 min |
| 18:00 | **Multi-repo task** | 5 min |
| 23:00 | **Workflow Automation** | 4 min |
| 27:00 | Close + live demo | 3 min |

---

---

## 🏗️ System Overview

```javascript
┌──────────────────────────────┐
│       CANVAS (Runtime)       │
│   Plan + Agents + Approval   │
└─────────────┬────────────────┘
              │
   ┌──────────┼──────────────┐
   ▼          ▼              ▼
🎮 maze-game   🌐 pac-man-services   🔗 MCP Layer
(event producer) (event consumer)   (tool bridge)
   │                   │
   └──── HTTP POST ────┘
         /event
              ▼
      live dashboard UI
```

| Repo | Role |
| --- | --- |
| **maze-game** (this repo) | Legacy frontend — Game Agent instruments it |
| **pac-man-services** | AI-built backend — Platform Agent creates it |

---

## 🟡 Setup (2 min)

Before starting, have these open and ready:

1. [maze-game](https://github.com/NickAzureDevops/maze-game) open in GitHub Copilot Apps
2. [pac-man-services](https://github.com/NickAzureDevops/pac-man-services) open in a second tab
3. Game running locally: `npm run dev` → `http://localhost:5173`

**Opening line:**
> "This is a legacy game. We're not going to rewrite it. We're going to use Copilot Apps to evolve it into a connected, multi-repo, event-driven system."

Play the game for 10 seconds. Show it works. Then stop.

---

## 🟣 1. Plan Mode (4 min)

> **What you're showing:** Copilot reasons about an existing codebase and proposes a structured plan before touching any code.

### What to do

In the Copilot Chat panel in the maze-game session, type:

> "I want to add event emission to this game — post to a local service when the score changes or an achievement milestone is reached. Show me a plan first, don't make any changes yet."

### What Copilot does

- Reads `src/main.js`, `src/counter.js`, and `.github/instructions/`
- Identifies where score changes happen
- Proposes a plan listing exactly which files change and what is protected

### What to point out

- Copilot found the score logic without being told where it lives
- The plan calls out what it will **not** touch (gameplay, rendering, controls)
- Nothing has been written yet — this is pure reasoning

**Key message:**
> "Plan Mode separates reasoning from execution. The agent thinks first, you approve, then it acts."

---

## 🟦 2. Canvas (3 min)

> **What you're showing:** Canvas is the visual workspace where plans are displayed, approved, and tracked.

### What to do

After the plan appears, point to the Canvas panel. Walk through:

1. **Plan view** — the proposed steps are listed with file targets and constraints
2. **Approval gate** — the "Approve" button is visible; nothing runs until you click it
3. **Execution state** — after approval, each step shows in-progress / done status in real time

### What to point out

- Canvas is not just a chat window — it's an orchestration surface
- The human stays in control: plan is always reviewed before execution
- You can edit the plan in Canvas before approving (show the edit icon)

**Key message:**
> "Canvas is where planning becomes execution — with a human in the loop."

---

## 🤖 3. Agent Mode / Agent Merge (5 min)

> **What you're showing:** Agents are role-scoped workers. Each agent has defined permissions, a target repo, and a job. Agent Merge shows multiple agents contributing to the same outcome.

### What to do

Approve the plan. Watch the **Game Agent** execute:

1. It updates `src/counter.js` with the `emitEvent()` function
2. It adds `emitEvent('scoreUpdated', ...)` call sites in `src/main.js`
3. It adds milestone checks for `achievementCandidate`

Then switch to the pac-man-services tab. Trigger the **Platform Agent**:

> "Build the event platform for this game. It needs a POST /event endpoint, a GET /events endpoint, and a live dashboard. Accept only scoreUpdated and achievementCandidate events."

Show both agents working — Game Agent on one repo, Platform Agent on the other.

### Agent Merge

With both agents done, trigger the **Integration Agent**:

> "Verify both repos are compatible — check that the event schema from maze-game matches what pac-man-services accepts."

Point out that the Integration Agent reads from both repos and produces a single validation result. This is **Agent Merge** — multiple agents contributing to one outcome.

### What to point out

- Each agent has a defined role and scope — it can't overstep
- Game Agent will not touch gameplay constants even if asked
- Agent Merge coordinates across repo boundaries

**Key message:**
> "Agents are not generic assistants — they are role-scoped workers with defined boundaries. Agent Merge lets them collaborate."

---

## 🔗 4. MCP (4 min)

> **What you're showing:** MCP (Model Context Protocol) is the tool bridge that lets agents interact with repos, APIs, and runtime state safely.

### What to do

In the Canvas execution view, click into any completed agent step to expand the tool call log. Show:

- `read_file` — agent reading `src/main.js` before modifying it
- `write_file` — agent writing the updated file
- `bash` — running `npm run dev` to verify the server starts

Then explain what MCP is:

> "Each of these is an MCP tool call. MCP is the protocol that defines what tools agents can use, what they can read, and what they can write. It's what makes agent actions auditable and safe."

### What to point out

- Every file read and write is visible — no hidden side effects
- Agents can only use tools that are declared in their MCP config
- MCP tools include: file read/write, shell commands, HTTP calls, repo search

**Key message:**
> "MCP is the tool layer between the agent's reasoning and the real world. It keeps agents powerful but auditable."

---

## 🗂️ 5. Multi-repo Task (5 min)

> **What you're showing:** A single Copilot session that spans two repositories and coordinates changes across both.

### What to do

Open a new session with **both repos** available. Type:

> "The maze-game emits events and pac-man-services receives them. Show me the full event flow from the game to the dashboard and confirm the schema matches end to end."

Watch Copilot:

1. Read `src/counter.js` in maze-game — finds the POST shape
2. Read `src/server.js` in pac-man-services — finds the accepted event types
3. Compare schemas and confirm they match
4. Report which events flow and what the dashboard will show

### Then run it live

```bash


# Terminal 1 — game
cd maze-game && npm run dev

# Terminal 2 — platform
cd pac-man-services && node src/server.js
```

Play the game. Open `http://localhost:3001`. Show events appearing in the dashboard as you score points.

### What to point out

- One session, two repos — Copilot holds context across both
- No copy-pasting between tabs to verify compatibility
- The live demo closes the loop: you can see the event flow happen in real time

**Key message:**
> "Multi-repo tasks are where Copilot Apps goes beyond a single-file editor. It reasons about systems, not just files."

---

## ⚙️ 6. Workflow Automation (4 min)

> **What you're showing:** Repeatable, scheduled, or trigger-based automation — the full pipeline as a workflow.

### What to do

In Copilot Apps, open **Workflows** and show (or create) a workflow with this prompt:

> "Every time a new commit is pushed to maze-game: check that all emitEvent calls use only allowed event types (scoreUpdated, achievementCandidate), and that no gameplay constants were modified."

Walk through the workflow config:

- **Trigger:** push to maze-game
- **Agent:** Game Agent
- **Prompt:** schema + safety check
- **Output:** pass/fail report in the session

### What to point out

- This runs automatically — no human needs to remember to check
- The same agent reasoning that worked interactively can be scheduled
- Workflows turn one-off agent tasks into standing guardrails

**Key message:**
> "Workflow Automation means the system keeps watching, not just the developer. Copilot becomes a continuous team member."

---

## 🏁 Close (3 min)

Run the full system one more time. Play the game. Show the dashboard updating live.

**Closing line:**
> "We started with a legacy game. Copilot Apps understood it in seconds, planned the changes, got human approval through Canvas, used MCP to execute safely, coordinated across two repos, and now runs as an automated workflow. This is what AI-native engineering looks like."

### Live checklist

- [ ] Game runs at `http://localhost:5173`
- [ ] Score events appear at `http://localhost:3001` within 2 seconds
- [ ] Achievement events fire at 100, 500, 1000, 2500, 5000 points
- [ ] No CORS errors in the browser console
- [ ] No gameplay disruption from event emission

---

## 📋 Feature Summary

| Feature | One-line proof |
| --- | --- |
| **Plan Mode** | Copilot reasons about the codebase and proposes steps before writing code |
| **Canvas** | Plan is shown, edited, approved, and tracked in a visual workspace |
| **Agent Mode** | Game Agent and Platform Agent execute scoped, role-specific tasks |
| **Agent Merge** | Integration Agent combines outputs from both agents into one validation |
| **MCP** | Every tool call (read, write, run) is visible, declared, and auditable |
| **Multi-repo task** | One session spans both repos and validates cross-repo compatibility |
| **Workflow Automation** | Safety checks run automatically on every push — no human needed |
