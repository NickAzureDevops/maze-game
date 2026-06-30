import './style.css'
import { emitEvent } from './counter.js'

// ─── DOM ─────────────────────────────────────────────────────────────────────
const canvas  = document.getElementById('game')
const ctx     = canvas.getContext('2d')
const overlay = document.getElementById('overlay')
const scoreEl = document.getElementById('score')
const livesEl = document.getElementById('lives')
const levelEl = document.getElementById('level')

// ─── Config ──────────────────────────────────────────────────────────────────
const T = 20, COLS = 28, ROWS = 28
const PAC_SPEED = 10, GHOST_SPEED = 14, POWER_FRAMES = 300
const ACHIEVEMENTS = [100, 500, 1000, 2500, 5000]

// 1=wall  0=dot  2=power-pellet  3=empty
const TEMPLATE = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,1,1,1,0,1,1,1,1,0,1,0,1,1,0,1,0,1,1,1,1,0,1,1,1,0,1],
  [1,2,1,1,1,0,1,1,1,1,0,1,0,1,1,0,1,0,1,1,1,1,0,1,1,1,2,1],
  [1,0,1,1,1,0,1,1,1,1,0,1,0,1,1,0,1,0,1,1,1,1,0,1,1,1,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,1,1,1,0,1,1,0,1,1,0,1],
  [1,0,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,1,1,1,0,1,1,0,1,1,0,1],
  [1,0,0,0,0,0,1,1,0,0,0,0,0,1,1,0,0,0,0,0,0,1,1,0,0,0,0,1],
  [1,1,1,1,1,0,1,1,1,1,3,3,1,1,1,1,1,3,3,1,1,1,1,0,1,1,1,1],
  [1,1,1,1,1,0,1,1,1,1,3,3,3,3,3,3,3,3,3,1,1,1,1,0,1,1,1,1],
  [1,1,1,1,1,0,1,1,3,3,3,3,3,3,3,3,3,3,3,3,3,1,1,0,1,1,1,1],
  [3,3,3,3,3,0,1,1,3,1,1,3,3,3,3,3,3,1,1,3,3,1,1,0,3,3,3,3],
  [1,1,1,1,1,0,1,1,3,1,1,3,3,3,3,3,3,1,1,3,3,1,1,0,1,1,1,1],
  [3,3,3,3,3,0,1,1,3,3,3,3,3,3,3,3,3,3,3,3,3,1,1,0,3,3,3,3],
  [1,1,1,1,1,0,1,1,3,1,1,1,1,1,1,1,1,1,1,1,3,1,1,0,1,1,1,1],
  [1,1,1,1,1,0,1,1,3,3,3,3,3,3,3,3,3,3,3,3,3,1,1,0,1,1,1,1],
  [1,1,1,1,1,0,1,1,3,1,1,1,1,1,1,1,1,1,1,1,3,1,1,0,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,1,1,1,0,1,1,1,1,0,1,0,1,1,0,1,0,1,1,1,1,0,1,1,1,0,1],
  [1,2,0,3,3,0,0,0,0,0,0,0,0,3,3,0,0,0,0,0,0,0,0,3,3,0,2,1],
  [1,1,0,3,0,0,1,0,1,1,1,1,1,1,1,1,1,1,1,1,0,1,0,3,0,0,1,1],
  [1,0,0,0,0,1,1,0,0,0,0,0,0,1,1,0,0,0,0,0,0,1,1,0,0,0,0,1],
  [1,0,1,1,1,1,1,1,0,1,1,1,0,1,1,0,1,1,1,0,1,1,1,1,1,1,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3],
  [3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3],
]

// ─── State ───────────────────────────────────────────────────────────────────
let maze, score, lives, level, gameState
let pac, ghosts, powerTimer, achievementsHit, frame, dotCount

// ─── Helpers ─────────────────────────────────────────────────────────────────
const wrap   = col => ((col % COLS) + COLS) % COLS
const isWall = (col, row) => row >= 0 && row < ROWS && maze[row][wrap(col)] === 1

// ─── Overlay ─────────────────────────────────────────────────────────────────
function showOverlay(title, subtitle) {
  overlay.querySelector('h2').textContent = title
  overlay.querySelector('p').innerHTML   = subtitle
  overlay.style.display = ''
}
function hideOverlay() { overlay.style.display = 'none' }

// ─── Init ────────────────────────────────────────────────────────────────────
function initGame() {
  maze = TEMPLATE.map(r => [...r])
  score = 0; lives = 3; level = 1; frame = 0; powerTimer = 0
  achievementsHit = new Set()
  gameState = 'idle'
  dotCount = maze.flat().filter(c => c === 0 || c === 2).length
  spawnPac(); spawnGhosts(); updateHUD()
  showOverlay('\u{1F47B} Pac-Man', 'Press <strong>Enter</strong> or <strong>Space</strong> to start')
}

function spawnPac() {
  pac = { col: 14, row: 24, dx: 0, dy: 0, nextDx: 0, nextDy: 0, mouth: 0, mouthDir: 1 }
}

function spawnGhosts() {
  ghosts = [
    { col: 13, row: 13, dx:  0, dy: -1, color: '#FF0000', frightened: false },
    { col: 14, row: 13, dx:  0, dy:  1, color: '#FFB8FF', frightened: false },
    { col: 12, row: 14, dx: -1, dy:  0, color: '#00FFFF', frightened: false },
    { col: 15, row: 14, dx:  1, dy:  0, color: '#FFB852', frightened: false },
  ]
}

// ─── Input ───────────────────────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') {
    if (gameState === 'idle')  { gameState = 'playing'; hideOverlay() }
    else if (gameState === 'dead') { initGame(); gameState = 'playing'; hideOverlay() }
    e.preventDefault(); return
  }
  if (gameState !== 'playing') return
  switch (e.key) {
    case 'ArrowLeft':  case 'a': pac.nextDx = -1; pac.nextDy =  0; break
    case 'ArrowRight': case 'd': pac.nextDx =  1; pac.nextDy =  0; break
    case 'ArrowUp':    case 'w': pac.nextDx =  0; pac.nextDy = -1; break
    case 'ArrowDown':  case 's': pac.nextDx =  0; pac.nextDy =  1; break
    default: return
  }
  e.preventDefault()
})

// ─── Scoring ─────────────────────────────────────────────────────────────────
function addScore(delta) {
  score += delta; updateHUD()
  emitEvent('scoreUpdated', { score, delta, level })
  for (const m of ACHIEVEMENTS) {
    if (score >= m && !achievementsHit.has(m)) {
      achievementsHit.add(m)
      emitEvent('achievementCandidate', { score, achievement: `Reached ${m} points!`, level })
    }
  }
}

function updateHUD() {
  scoreEl.textContent = score
  livesEl.textContent = lives
  levelEl.textContent = level
}

// ─── Update ──────────────────────────────────────────────────────────────────
function update() {
  if (gameState !== 'playing') return
  frame++

  // Animate mouth
  pac.mouth += pac.mouthDir * 0.06
  if (pac.mouth >= 0.25) pac.mouthDir = -1
  if (pac.mouth <= 0)    pac.mouthDir =  1

  // Power timer
  if (powerTimer > 0 && --powerTimer === 0) ghosts.forEach(g => { g.frightened = false })

  // Move Pac-Man
  if (frame % PAC_SPEED === 0) {
    const nc = wrap(pac.col + pac.nextDx), nr = pac.row + pac.nextDy
    if (!isWall(nc, nr)) { pac.dx = pac.nextDx; pac.dy = pac.nextDy }

    if (pac.dx !== 0 || pac.dy !== 0) {
      const mc = wrap(pac.col + pac.dx), mr = pac.row + pac.dy
      if (!isWall(mc, mr)) { pac.col = mc; pac.row = mr }

      const cell = maze[pac.row]?.[pac.col]
      if (cell === 0) {
        maze[pac.row][pac.col] = 3; dotCount--; addScore(10)
      } else if (cell === 2) {
        maze[pac.row][pac.col] = 3; dotCount--; addScore(50)
        powerTimer = POWER_FRAMES
        ghosts.forEach(g => { g.frightened = true })
      }

      if (dotCount === 0) nextLevel()
    }
  }

  // Move ghosts
  if (frame % GHOST_SPEED === 0) ghosts.forEach(moveGhost)

  // Collision
  for (const g of ghosts) {
    if (g.col === pac.col && g.row === pac.row) {
      if (g.frightened) {
        Object.assign(g, { col: 13, row: 13, frightened: false })
        addScore(200)
      } else {
        onDied(); return
      }
    }
  }
}

function moveGhost(g) {
  const DIRS = [{ dx:1,dy:0},{ dx:-1,dy:0},{ dx:0,dy:1},{ dx:0,dy:-1}]
  let opts = DIRS
    .filter(d => !(d.dx === -g.dx && d.dy === -g.dy))
    .filter(d => !isWall(wrap(g.col + d.dx), g.row + d.dy))
  if (!opts.length) opts = DIRS.filter(d => !isWall(wrap(g.col + d.dx), g.row + d.dy))
  if (!opts.length) return

  const dist = d => Math.abs(wrap(g.col + d.dx) - pac.col) + Math.abs((g.row + d.dy) - pac.row)
  const chosen = g.frightened
    ? opts[Math.floor(Math.random() * opts.length)]
    : opts.reduce((best, d) => dist(d) < dist(best) ? d : best)

  g.col = wrap(g.col + chosen.dx); g.row += chosen.dy
  g.dx = chosen.dx; g.dy = chosen.dy
}

function onDied() {
  lives--; updateHUD()
  emitEvent('scoreUpdated', { score, delta: 0, lives, level })
  if (lives <= 0) {
    gameState = 'dead'
    showOverlay('\u{1F480} Game Over', `Final Score: ${score} &nbsp;|&nbsp; Press Enter to restart`)
  } else {
    spawnPac(); spawnGhosts(); powerTimer = 0
  }
}

function nextLevel() {
  level++; maze = TEMPLATE.map(r => [...r])
  dotCount = maze.flat().filter(c => c === 0 || c === 2).length
  spawnPac(); spawnGhosts(); powerTimer = 0; updateHUD()
  emitEvent('achievementCandidate', { score, achievement: `Level ${level} reached!`, level })
}

// ─── Draw ────────────────────────────────────────────────────────────────────
function draw() {
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const x = c * T, y = r * T
      if (maze[r][c] === 1) {
        ctx.fillStyle = '#1a1aff'; ctx.fillRect(x, y, T, T)
        ctx.strokeStyle = '#0000aa'; ctx.lineWidth = 1
        ctx.strokeRect(x + 0.5, y + 0.5, T - 1, T - 1)
      } else if (maze[r][c] === 0) {
        ctx.fillStyle = '#ffcc00'
        ctx.beginPath(); ctx.arc(x + T/2, y + T/2, 2, 0, Math.PI * 2); ctx.fill()
      } else if (maze[r][c] === 2) {
        ctx.fillStyle = '#ffcc00'
        ctx.beginPath(); ctx.arc(x + T/2, y + T/2, 5, 0, Math.PI * 2); ctx.fill()
      }
    }
  }

  // Ghosts
  for (const g of ghosts) {
    const gx = g.col * T + T/2, gy = g.row * T + T/2, gr = T/2 - 1
    ctx.fillStyle = g.frightened ? (frame % 20 < 10 ? '#2121de' : '#fff') : g.color
    ctx.beginPath()
    ctx.arc(gx, gy - 2, gr, Math.PI, 0)
    ctx.lineTo(gx + gr, gy + gr - 2)
    ctx.quadraticCurveTo(gx + gr * 0.67, gy + gr + 1, gx + gr * 0.33, gy + gr - 2)
    ctx.quadraticCurveTo(gx,             gy + gr + 1, gx - gr * 0.33, gy + gr - 2)
    ctx.quadraticCurveTo(gx - gr * 0.67, gy + gr + 1, gx - gr,        gy + gr - 2)
    ctx.lineTo(gx - gr, gy - 2)
    ctx.closePath(); ctx.fill()
    if (!g.frightened) {
      ctx.fillStyle = '#fff'
      ctx.beginPath(); ctx.arc(gx - 3, gy - 3, 3, 0, Math.PI * 2); ctx.fill()
      ctx.beginPath(); ctx.arc(gx + 3, gy - 3, 3, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = '#00f'
      ctx.beginPath(); ctx.arc(gx - 2, gy - 3, 1.5, 0, Math.PI * 2); ctx.fill()
      ctx.beginPath(); ctx.arc(gx + 4, gy - 3, 1.5, 0, Math.PI * 2); ctx.fill()
    }
  }

  // Pac-Man
  const px = pac.col * T + T/2, py = pac.row * T + T/2
  const rot = pac.dx === -1 ? Math.PI : pac.dy === -1 ? -Math.PI/2 : pac.dy === 1 ? Math.PI/2 : 0
  ctx.fillStyle = '#FFD700'
  ctx.beginPath()
  ctx.moveTo(px, py)
  ctx.arc(px, py, T/2 - 2, rot + pac.mouth, rot + Math.PI * 2 - pac.mouth)
  ctx.closePath(); ctx.fill()
}

// ─── Loop ────────────────────────────────────────────────────────────────────
function loop() { update(); draw(); requestAnimationFrame(loop) }

initGame()
loop()
