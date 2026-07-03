# 🧩 GitHub Copilot Apps — Demo Lab

> **Total time: 20–30 minutes**
> **Goal:** Show how GitHub Copilot Apps evolves a quiz app into a multi-repo, event-driven system using Canvas, Plan Mode, Agent Mode, MCP, Multi-repo tasks, and Agent Skills.

Reference video:
- https://www.youtube.com/watch?v=fpP20wKaKRc&t=1s

## 🚀 Demo opener — 3 power pillars

- **Canvas (live plan, approval gate, artifact trace)**  
  Show plan view, approval control, real-time status, and changed-file trace.
- **Different modes (Interactive vs Plan, same prompt different control)**  
  Show that execution policy changes while the prompt stays the same.
- **Cross-repo execution + Agent Merge (one outcome from multiple scoped agents)**  
  Show producer + service coordination with one integrated compatibility result.

## 🎬 Live flow (runtime-first)

1. **Canvas runtime moment** → show live plan + approval + artifact trace.
2. **Control modes moment** → same prompt in Interactive vs Plan (different control policy).
3. **Scoped agents moment** → Game Agent + Platform Agent.
4. **Agent Merge moment** → Integration Agent returns one end-to-end compatibility verdict.
5. **Repeatability moment** → run validation skill to prove reusable capability.

## 🏗️ System Overview

```javascript
┌──────────────────────────────┐
│       CANVAS (Runtime)       │
│   Plan + Agents + Approval   │
└─────────────┬────────────────┘
              │
   ┌──────────┼──────────────┐
   ▼          ▼              ▼
🎮 maze-game   🌐 maze-game-services   🔗 MCP Layer
(event producer) (event consumer)    (tool bridge)
   │                   │
   └──── HTTP POST ────┘
         /event
              ▼
      live dashboard UI
```

| Repo | Role |
| --- | --- |
| **maze-game** (this repo) | Legacy frontend — Game Agent instruments it |
| **maze-game-services** | AI-built backend — Platform Agent creates it |

**Service repo (hosts `POST /event`):**  
https://github.com/NickAzureDevops/maze-game-services

---

## 🟦 1. Canvas (3 min)

> **Opening thesis — say this out loud:**
> "Traditional UIs are for *using* software. Canvas is for *shaping* software while it runs. It's Human-to-AI-to-System — and it actually executes."

### Quick run-through (90 sec)

1. Open Canvas and show the **plan list** (file targets + protected areas).
2. Point to **Approve** and say: “Nothing runs until I approve.”
3. Approve and show step status moving **in-progress → done**.
4. Open the **artifact log** and show changed files.
5. Edit one step briefly to prove human control.

> **Demo note:** keep the quiz panel with a **red neon border glow** so the live surface stands out on stage.

**Key message:**  
> "This is live and executable. The AI proposes, the human approves, and Canvas tracks execution."

---

## 🟣 2. Control Modes (30 sec mention)

> **What you're showing:** Same prompt, different control policy.

### Live script

1. In Copilot Chat, type:

> "I want to instrument this Copilot Apps quiz so it posts events to a local service when score updates and achievement milestones are reached. Show me a plan first, don't make any changes yet."

2. Point once at the plan + approval gate and say:
    - “It reasoned first.”
    - “Nothing runs until approval.”
3. Briefly call out Interactive mode:
    - “In Interactive, it asks and we steer decisions step-by-step.”

---

## 🤖 3. Agent Mode / Agent Merge (5 min)

> **This section shows Agent Merge used as a skill invocation, not a manual summary.**

### Live script (60 sec)

1. Run **Game Agent** in `maze-game` (quiz producer).
2. Run **Platform Agent** in `maze-game-services` (service side).
3. Create a PR from agent output (use the PR action from the agent run).
4. Open that PR in a PR-bound Copilot session (this is what enables **Agent merge**).
5. Run **Integration Agent** and invoke the **Agent Merge skill**.

Game Agent prompt:
> "Instrument this quiz app repo (maze-game) to emit scoreUpdated and achievementCandidate events to http://localhost:3001/event using { type, timestamp, payload } and fire-and-forget error handling. Keep quiz UI behavior unchanged. The endpoint is implemented in maze-game-services (https://github.com/NickAzureDevops/maze-game-services)."

Platform Agent prompt:
> "Build the event platform for this quiz app in maze-game-services. It needs a POST /event endpoint, a GET /events endpoint, and a live dashboard. Accept only scoreUpdated and achievementCandidate events."

PR creation prompt (run after agent changes are ready):
> "Create a pull request for this branch titled 'Demo: quiz event instrumentation for Agent Merge' with a short summary of event contract compatibility and changed files."

Say:
> "Now I split work across scoped agents, then invoke Agent Merge to return one compatibility verdict."

Integration prompt:
> "Use Agent Merge to combine Game Agent and Platform Agent outputs. Return one PASS/FAIL compatibility result with mismatches grouped by repo."

Close line:
> "Agent Merge is a reusable skill: multiple scoped agent outputs, one system-level answer."


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

> "The quiz app (`maze-game`) emits events and `maze-game-services` receives them. Show me the full event flow from quiz to dashboard and confirm the schema matches end to end."

Watch Copilot:

1. Read `src/counter.js` in maze-game — finds the POST shape
2. Read `src/server.js` in maze-game-services — finds the accepted event types
3. Compare schemas and confirm they match
4. Report which events flow and what the dashboard will show

### Then run it live

```bash

# Terminal 1 — game
cd maze-game && npm run dev

# Terminal 2 — platform
cd maze-game-services && node src/server.js
```

Play the quiz. Open `http://localhost:3001`. Show events appearing in the dashboard as score updates happen.

### What to point out

- One session, two repos — Copilot holds context across both
- No copy-pasting between tabs to verify compatibility
- The live demo closes the loop: you can see the event flow happen in real time

**Key message:**
> "Multi-repo tasks are where Copilot Apps goes beyond a single-file editor. It reasons about systems, not just files."

---

## ⚙️ 6. Agent Skills (4 min)

> **What you're showing:** Skills are reusable, packaged capabilities you give an agent — turning one-off reasoning into shared team knowledge.

### What a skill is (30 sec — say this)

> "An agent on its own can reason. A skilled agent can *act* — reliably, repeatedly, across any session. Skills are how you encode what the agent knows into something it can reuse."

### Show a skill being invoked live (2 min)

In the Game Agent session, type:

> "Use the event schema validation skill to check that every emitEvent call in src/main.js uses only scoreUpdated or achievementCandidate, and that the payload shape matches the contract."

Skill file in this repo:
- `.github/prompts/event-schema-validation.prompt.md`
- `.github/skills/event-schema-validation/SKILL.md`

**What to point out:**
- The agent doesn't re-read the codebase from scratch — it calls the skill
- The skill returns a structured pass/fail result with specific line references
- This is the same check that ran during Agent Mode, now packaged and reusable

### Show skills composing across agents (90 sec)

Switch to the Integration Agent session and type:

> "Run the event schema validation skill against both maze-game and maze-game-services and confirm the contracts match end to end."

**What to point out:**
- The same skill runs in two different agents against two different repos
- Neither agent needed to be told how to validate — the skill carries that knowledge
- This is how you scale: write the reasoning once, share it across the system

### What to point out

- Skills are not scripts — they're agent-callable capabilities with structured output
- Any agent with the skill can invoke it — Game Agent, Platform Agent, Integration Agent
- Skills turn ad-hoc prompts into standing team knowledge

**Key message:**
> "Skills are how agents get extended. You don't retrain them — you give them new capabilities. Agents can be extended, composed, and shared across your whole engineering system."

---

## 🏁 Close (3 min)

Run the full system one more time. Play the quiz. Show the dashboard updating live.

**Closing line:**
> "We started with a quiz app. Copilot Apps understood it in seconds, planned the changes, got human approval through Canvas, used MCP to execute safely, coordinated across two repos, and extended the agents with reusable skills. This is what AI-native engineering looks like."

### Live checklist

- [ ] Quiz app runs at `http://localhost:5173`
- [ ] Score events appear at `http://localhost:3001` within 2 seconds
- [ ] Achievement events fire at 100, 500, 1000, 2500, 5000 points
- [ ] No CORS errors in the browser console
- [ ] No quiz interaction disruption from event emission

---

## 📋 Feature Summary (aligned to the demo pillars)

| Pillar | One-line proof |
| --- | --- |
| **Canvas** | Live plan, approval gate, execution state, and artifact trace are visible in one surface |
| **Different modes** | Same prompt behaves differently across Interactive and Plan modes for control vs collaboration |
| **Cross-repo + Agent Merge** | Scoped agents work in separate repos and produce one integrated compatibility result |
