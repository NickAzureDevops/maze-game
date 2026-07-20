# GitHub Copilot Apps — Demo Lab

> **20–30 min** | Quiz app → multi-repo event-driven system with Canvas, Agents, MCP, and Skills.

## Architecture

```javascript
Canvas (Plan + Approval + Execution)
        │
   ┌────┼────────────┐
   ▼    ▼            ▼
🎮 Quiz  🌐 Service   🔗 MCP
(producer) (consumer)  (tools)
   └── POST /event ──┘
```

| Repo | Role |
| --- | --- |
| copilot-quiz (this) | Event producer |
| [copilot-quiz-service](https://github.com/NickAzureDevops/copilot-quiz-service) | Event consumer + dashboard |

## Demo Flow (20 min)

### 1. Canvas + Plan Mode (4 min)
Prompt: *"Instrument this quiz to post events to a local service. Show me a plan first."*

Show plan → approve → execution → artifacts.

### 2. Agents (6 min)
**Game Agent:** *"Wire up event emission for scoreUpdated and achievementCandidate"*

**Platform Agent:** *"Build POST /event, GET /events, and a live dashboard."*

**Agent Merge:** One compatibility verdict across both repos.

> **Highlight reasoning:** Pause to show *why* Copilot chose specific components and how it interprets cross-repo schema consistency.

### 3. Skills & Automations (5 min)
Open Automations → Skills. Show `event-schema-validation` under copilot-quiz and `azure-observability` under copilot-quiz-service.

Invoke skill: *"Check that emitEvent calls use only allowed types with correct payload shape."*

Then show automations — set up a scheduled task (e.g., daily issue triage or repo audit) that spans both repos. This demonstrates multi-repo coordination running on autopilot.

### 4. Run it live (5 min)
Start both services, play the quiz, and show events appearing on the dashboard in real-time. This is the proof that everything works end-to-end.
```bash
cd copilot-quiz && npm run dev
cd copilot-quiz-service && node src/server.js
```

### 5. Close (2 min)
> "We planned it, agents built it, skills validated it, automations run it — and it all works. That's AI-native engineering."

## Checklist
- [ ] Quiz at `localhost:5173`
- [ ] Events at `localhost:3001` within 2s
- [ ] No CORS errors
- [ ] No quiz disruption from event failures

---

## Bonus: Visual Delight

**Quiz UI**
- Glow animation on score update
- Confetti burst on quiz completion
- Shake animation after 3 wrong answers

**Dashboard signal**
- After 3 wrong answers, the quiz emits an `achievementCandidate` with `"Chaos streak unlocked!"`.
- This stays within the valid producer contract while giving the dashboard a gold-highlight moment.