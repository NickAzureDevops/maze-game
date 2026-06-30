import './style.css'
import { emitEvent } from './counter.js'

// ── Canvas & DOM ──────────────────────────────────────────────
const canvas = document.getElementById('game')
const ctx = canvas.getContext('2d')
const overlay = document.getElementById('overlay')
const overlayTitle = overlay.querySelector('h2')
const overlayMsg = overlay.querySelector('p')
const scoreEl = document.getElementById('score')
const livesEl = document.getElementById('lives')
const levelEl = document.getElementById('level')

// ── Constants ─────────────────────────────────────────────────
const TILE = 20
const COLS = 28
const ROWS = 28
const BASE_SPEED = 2        // px per frame at 60 fps
const GHOST_BASE_SPEED = 1.6

// Tile types
const DOT   = 0
const WALL  = 1
const POWER = 2
const EMPTY = 3  // non-passable for Pac-Man, passable for ghosts
const GHOST_HOUSE = 4

// Directions (index maps to DIR_VEC)
const RIGHT = 0, UP = 1, LEFT = 2, DOWN = 3
const DIR_VEC = [
  { dc:  1, dr:  0 },
  { dc:  0, dr: -1 },
  { dc: -1, dr:  0 },
  { dc:  0, dr:  1 },
]

// ── Maze template ─────────────────────────────────────────────
// '#'=wall  '.'=dot  'o'=power  ' '=empty  'X'=ghost house
// Each row is exactly 28 characters.
const MAP_TEMPLATE = [
  '############################', // 0
  '#............##............#', // 1
  '#.####.#####.##.#####.####.#', // 2
  '#o####.#####.##.#####.####o#', // 3
  '#.####.#####.##.#####.####.#', // 4
  '#..........................#', // 5
  '#.####.##.########.##.####.#', // 6
  '#.####.##.########.##.####.#', // 7
  '#......##..........##......#', // 8
  '######.######  ######.######', // 9
  '######.######  ######.######', // 10
  '######.##          ##.######', // 11
  '######.## #XXXXXX# ##.######', // 12
  '######.## #XXXXXX# ##.######', // 13
  '######.## #XXXXXX# ##.######', // 14
  '######.## ######## ##.######', // 15
  '######.##          ##.######', // 16
  '######.######  ######.######', // 17
  '#......##..........##......#', // 18
  '#.####.##.########.##.####.#', // 19
  '#.####.##.########.##.####.#', // 20
  '#..........................#', // 21
  '#o####.#####.##.#####.####o#', // 22
  '#.####.#####.##.#####.####.#', // 23
  '#............##............#', // 24
  '#.####.#####.##.#####.####.#', // 25
  '#............##............#', // 26
  '############################', // 27
]

function parseMap(tpl) {
  return tpl.map(row =>
    row.split('').map(ch => {
      if (ch === '.') return DOT
      if (ch === '#') return WALL
      if (ch === 'o') return POWER
      if (ch === 'X') return GHOST_HOUSE
      return EMPTY
    })
  )
}

// ── State ─────────────────────────────────────────────────────
let map = []
let totalDots = 0
let dotsEaten = 0
let score = 0
let lives = 3
let level = 1
let running = false
let dying = false

const ACHIEVEMENT_THRESHOLDS = [10, 50, 100, 500, 1000]

// Pac-Man
const pac = {
  x: 0, y: 0,
  dir: LEFT,
  nextDir: LEFT,
  mouth: 0.25,
  mouthDir: -1,  // -1 closing, +1 opening
  speed: BASE_SPEED,
}

// Ghosts
const GHOST_COLORS  = ['#ff0000', '#ff88cc', '#00ccff', '#ffaa00']
const GHOST_SCATTER = [
  { r: 0,  c: 25 },
  { r: 0,  c: 2  },
  { r: 27, c: 25 },
  { r: 27, c: 2  },
]
const RELEASE_DELAYS = [0, 5000, 10000, 15000]  // ms after level start

let ghosts = []
let frightenedMs = 0
const FRIGHTENED_DURATION = 7000
let ghostEatStreak = 0
let levelStartTime = 0
let scatterMode = true
let modeTimer = 0
// Alternating scatter/chase durations (ms)
const MODE_DURATIONS = [7000, 20000, 7000, 20000, 5000, 20000, 5000, Infinity]
let modeIdx = 0

// ── Init ──────────────────────────────────────────────────────
function initLevel() {
  map = parseMap(MAP_TEMPLATE)
  totalDots = 0
  dotsEaten = 0
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      if (map[r][c] === DOT || map[r][c] === POWER) totalDots++

  // Pac-Man starts at row 21, col 13 (open corridor below ghost house)
  pac.x = tileCenter(13)
  pac.y = tileCenter(21)
  pac.dir = LEFT
  pac.nextDir = LEFT
  pac.mouth = 0.25
  pac.mouthDir = -1
  pac.speed = BASE_SPEED + (level - 1) * 0.15

  ghosts = GHOST_COLORS.map((color, i) => ({
    x: tileCenter(i === 0 ? 13 : (i === 1 ? 13 : (i === 2 ? 11 : 15))),
    y: tileCenter(i === 0 ? 11 : 13),
    dir:   i % 2 === 0 ? LEFT : RIGHT,
    color,
    // States: 'house' | 'leaving' | 'chase' | 'scatter' | 'frightened' | 'eaten'
    state: i === 0 ? 'leaving' : 'house',
    releaseDelay: RELEASE_DELAYS[i],
    speed: GHOST_BASE_SPEED + (level - 1) * 0.1,
    tr: GHOST_SCATTER[i].r,
    tc: GHOST_SCATTER[i].c,
    flash: false,
  }))

  frightenedMs = 0
  ghostEatStreak = 0
  scatterMode = true
  modeTimer = 0
  modeIdx = 0
  levelStartTime = performance.now()
  dying = false
}

function initGame() {
  score = 0
  lives = 3
  level = 1
  initLevel()
  updateHUD()
}

// ── Helpers ───────────────────────────────────────────────────
function tileCenter(t) { return t * TILE + TILE / 2 }

function tileOf(px) { return Math.floor(px / TILE) }

function tileAt(r, c) {
  if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return WALL
  return map[r][c]
}

function pacCanEnter(r, c) {
  const t = tileAt(r, c)
  return t === DOT || t === POWER
}

function ghostCanEnter(r, c) {
  const t = tileAt(r, c)
  return t !== WALL
}

function dist2(r1, c1, r2, c2) {
  return (r1 - r2) ** 2 + (c1 - c2) ** 2
}

// ── HUD ───────────────────────────────────────────────────────
function updateHUD() {
  scoreEl.textContent = score
  livesEl.textContent = lives
  levelEl.textContent = level
}

function addScore(pts) {
  const prev = score
  score += pts
  scoreEl.textContent = score
  emitEvent('scoreUpdated', { score })
  for (const t of ACHIEVEMENT_THRESHOLDS) {
    if (prev < t && score >= t) {
      emitEvent('achievementTriggered', { score, achievement: `Reached ${t} points!` })
    }
  }
}

// ── Input ─────────────────────────────────────────────────────
window.addEventListener('keydown', e => {
  if (!running) {
    if (e.code === 'Enter' || e.code === 'Space') { e.preventDefault(); startGame() }
    return
  }
  e.preventDefault()
  if (e.code === 'ArrowRight' || e.code === 'KeyD') pac.nextDir = RIGHT
  if (e.code === 'ArrowUp'    || e.code === 'KeyW') pac.nextDir = UP
  if (e.code === 'ArrowLeft'  || e.code === 'KeyA') pac.nextDir = LEFT
  if (e.code === 'ArrowDown'  || e.code === 'KeyS') pac.nextDir = DOWN
})

// ── Game flow ─────────────────────────────────────────────────
function startGame() {
  initGame()
  running = true
  overlay.classList.add('hidden')
  lastTs = performance.now()
  requestAnimationFrame(loop)
}

function showOverlay(title, msg) {
  overlayTitle.textContent = title
  overlayMsg.innerHTML = msg
  overlay.classList.remove('hidden')
}

function nextLevel() {
  level++
  initLevel()
  updateHUD()
  running = true
  requestAnimationFrame(loop)
}

function pacDie() {
  if (dying) return
  dying = true
  running = false
  lives--
  updateHUD()
  emitEvent('pacmanDied', { lives, level })
  setTimeout(() => {
    if (lives <= 0) {
      emitEvent('gameOver', { score, level })
      showOverlay('👻 Game Over', `Score: <strong>${score}</strong><br>Press Enter / Space to play again`)
      initGame()
    } else {
      initLevel()
      updateHUD()
      running = true
      requestAnimationFrame(loop)
    }
  }, 1200)
}

// ── Pac-Man movement ──────────────────────────────────────────
function movePac(dt) {
  const dist = pac.speed * dt / 16.667
  const col = tileOf(pac.x)
  const row = tileOf(pac.y)
  const cx = tileCenter(col)
  const cy = tileCenter(row)

  // Try buffered turn when near tile center
  if (pac.nextDir !== pac.dir) {
    const v = DIR_VEC[pac.nextDir]
    if (pacCanEnter(row + v.dr, col + v.dc) &&
        Math.abs(pac.x - cx) < dist + 2 &&
        Math.abs(pac.y - cy) < dist + 2) {
      pac.x = cx
      pac.y = cy
      pac.dir = pac.nextDir
    }
  }

  const v = DIR_VEC[pac.dir]
  const nr = row + v.dr
  const nc = col + v.dc

  if (pacCanEnter(nr, nc)) {
    pac.x += v.dc * dist
    pac.y += v.dr * dist
  } else {
    // Snap to center to avoid sticking into a wall
    if (Math.abs(pac.x - cx) < dist + 2) pac.x = cx
    if (Math.abs(pac.y - cy) < dist + 2) pac.y = cy
  }

  // Horizontal wrap-around (tunnel)
  if (pac.x < -TILE / 2)           pac.x = COLS * TILE + TILE / 2
  if (pac.x > COLS * TILE + TILE / 2) pac.x = -TILE / 2
}

function animatePac(dt) {
  const spd = 0.06 * dt / 16.667
  pac.mouth += pac.mouthDir * spd
  if (pac.mouth <= 0)    { pac.mouth = 0;    pac.mouthDir =  1 }
  if (pac.mouth >= 0.25) { pac.mouth = 0.25; pac.mouthDir = -1 }
}

// ── Dot eating ────────────────────────────────────────────────
function eatDots() {
  const col = tileOf(pac.x)
  const row = tileOf(pac.y)
  if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return
  const t = map[row][col]
  if (t === DOT) {
    map[row][col] = EMPTY
    addScore(10)
    dotsEaten++
  } else if (t === POWER) {
    map[row][col] = EMPTY
    addScore(50)
    dotsEaten++
    activateFrightened()
  }
  if (dotsEaten >= totalDots) {
    running = false
    emitEvent('levelComplete', { score, level })
    setTimeout(nextLevel, 1500)
  }
}

function activateFrightened() {
  frightenedMs = FRIGHTENED_DURATION - (level - 1) * 500
  if (frightenedMs < 2000) frightenedMs = 2000
  ghostEatStreak = 0
  for (const g of ghosts) {
    if (g.state === 'chase' || g.state === 'scatter') {
      g.state = 'frightened'
      g.dir = (g.dir + 2) % 4  // reverse
      g.flash = false
    }
  }
}

// ── Ghost movement ────────────────────────────────────────────
function updateGhosts(dt) {
  const elapsed = performance.now() - levelStartTime
  for (let i = 0; i < ghosts.length; i++) {
    const g = ghosts[i]
    if (g.state === 'house' && elapsed >= g.releaseDelay) {
      g.state = 'leaving'
    }
    setGhostTarget(g, i)
    moveGhost(g, dt)
  }
}

function setGhostTarget(g, i) {
  if (g.state === 'frightened' || g.state === 'house' || g.state === 'leaving') return
  if (g.state === 'eaten') {
    g.tr = 11; g.tc = 13  // ghost house entrance
    return
  }
  if (scatterMode) {
    g.tr = GHOST_SCATTER[i].r
    g.tc = GHOST_SCATTER[i].c
  } else {
    g.tr = tileOf(pac.y)
    g.tc = tileOf(pac.x)
  }
}

function moveGhost(g, dt) {
  const spd = ghostSpeed(g) * dt / 16.667
  switch (g.state) {
    case 'house':   moveGhostInHouse(g, spd);  break
    case 'leaving': moveGhostLeaving(g, spd);  break
    case 'eaten':   moveGhostEaten(g, spd);    break
    default:        moveGhostNormal(g, spd);   break
  }
}

function ghostSpeed(g) {
  if (g.state === 'frightened') return g.speed * 0.5
  if (g.state === 'eaten')      return g.speed * 2
  if (g.state === 'leaving' || g.state === 'house') return g.speed * 0.6
  return g.speed
}

function moveGhostInHouse(g, spd) {
  // Bounce left-right inside ghost house
  const col = tileOf(g.x)
  const row = tileOf(g.y)
  const v = DIR_VEC[g.dir]
  const nc = col + v.dc
  if (tileAt(row, nc) === GHOST_HOUSE || tileAt(row, nc) === EMPTY) {
    g.x += v.dc * spd
  } else {
    g.dir = g.dir === RIGHT ? LEFT : RIGHT
  }
}

function moveGhostLeaving(g, spd) {
  // 1. Move to column 13 (exit column)
  const exitX = tileCenter(13)
  if (Math.abs(g.x - exitX) > 1) {
    if (g.x < exitX) g.x = Math.min(g.x + spd, exitX)
    else             g.x = Math.max(g.x - spd, exitX)
    return
  }
  g.x = exitX
  // 2. Move upward until reaching main maze (row 8)
  g.y -= spd
  const row = tileOf(g.y)
  if (row <= 8) {
    g.y = tileCenter(8)
    g.state = scatterMode ? 'scatter' : 'chase'
    g.dir = LEFT
  }
}

function moveGhostEaten(g, spd) {
  // Navigate back toward ghost house entrance (row 11, col 13)
  const targetX = tileCenter(13)
  const targetY = tileCenter(11)
  if (Math.abs(g.x - targetX) > 1) {
    if (g.x < targetX) g.x = Math.min(g.x + spd, targetX)
    else               g.x = Math.max(g.x - spd, targetX)
    return
  }
  g.x = targetX
  if (g.y < targetY) {
    g.y = Math.min(g.y + spd, targetY)
  } else {
    // Back home — re-enter ghost house
    g.state = 'leaving'
    g.dir = LEFT
  }
}

function moveGhostNormal(g, spd) {
  const col = tileOf(g.x)
  const row = tileOf(g.y)
  const cx = tileCenter(col)
  const cy = tileCenter(row)

  // Make a new direction choice when near tile center
  if (Math.abs(g.x - cx) < spd + 1 && Math.abs(g.y - cy) < spd + 1) {
    g.x = cx
    g.y = cy

    const reverse = (g.dir + 2) % 4
    const valid = []
    for (let d = 0; d < 4; d++) {
      if (d === reverse) continue
      const v = DIR_VEC[d]
      if (ghostCanEnter(row + v.dr, col + v.dc) &&
          tileAt(row + v.dr, col + v.dc) !== GHOST_HOUSE) {
        valid.push(d)
      }
    }
    if (valid.length === 0) valid.push(reverse)

    if (g.state === 'frightened') {
      g.dir = valid[Math.floor(Math.random() * valid.length)]
    } else {
      // Pick direction that minimises distance to target
      let best = valid[0], bestD = Infinity
      for (const d of valid) {
        const v = DIR_VEC[d]
        const d2 = dist2(row + v.dr, col + v.dc, g.tr, g.tc)
        if (d2 < bestD) { bestD = d2; best = d }
      }
      g.dir = best
    }
  }

  const v = DIR_VEC[g.dir]
  g.x += v.dc * spd
  g.y += v.dr * spd

  // Horizontal wrap-around
  if (g.x < -TILE / 2)             g.x = COLS * TILE + TILE / 2
  if (g.x > COLS * TILE + TILE / 2) g.x = -TILE / 2
}

// ── Ghost collision ───────────────────────────────────────────
function checkGhostCollisions() {
  if (dying) return
  for (const g of ghosts) {
    if (g.state === 'house' || g.state === 'leaving' || g.state === 'eaten') continue
    if (Math.abs(pac.x - g.x) < TILE * 0.75 && Math.abs(pac.y - g.y) < TILE * 0.75) {
      if (g.state === 'frightened') {
        ghostEatStreak++
        const pts = 200 * Math.pow(2, ghostEatStreak - 1)
        addScore(pts)
        emitEvent('ghostEaten', { score, points: pts })
        g.state = 'eaten'
        // Show score popup briefly
        showGhostScore(g.x, g.y, pts)
      } else {
        pacDie()
        return
      }
    }
  }
}

const ghostScorePopups = []

function showGhostScore(x, y, pts) {
  ghostScorePopups.push({ x, y, pts, life: 1000 })
}

// ── Scatter/chase cycling ─────────────────────────────────────
function updateModeTimer(dt) {
  if (frightenedMs > 0) return  // pause mode cycling during frightened
  modeTimer += dt
  if (modeTimer >= MODE_DURATIONS[modeIdx]) {
    modeTimer = 0
    modeIdx = Math.min(modeIdx + 1, MODE_DURATIONS.length - 1)
    scatterMode = (modeIdx % 2 === 0)
    for (const g of ghosts) {
      if (g.state === 'chase' || g.state === 'scatter') {
        g.state = scatterMode ? 'scatter' : 'chase'
        g.dir = (g.dir + 2) % 4
      }
    }
  }
}

// ── Frightened timer ──────────────────────────────────────────
function updateFrightened(dt) {
  if (frightenedMs <= 0) return
  frightenedMs -= dt
  const flashing = frightenedMs < 2000 && Math.floor(frightenedMs / 250) % 2 === 1
  for (const g of ghosts) {
    if (g.state === 'frightened') g.flash = flashing
    if (frightenedMs <= 0 && g.state === 'frightened') {
      g.state = scatterMode ? 'scatter' : 'chase'
      g.flash = false
    }
  }
  if (frightenedMs <= 0) { frightenedMs = 0; ghostEatStreak = 0 }
}

// ── Drawing ───────────────────────────────────────────────────
function drawMaze() {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const t = map[r][c]
      const x = c * TILE
      const y = r * TILE

      if (t === WALL) {
        ctx.fillStyle = '#0d0040'
        ctx.fillRect(x, y, TILE, TILE)
        // Purple neon border
        ctx.strokeStyle = '#5b21b6'
        ctx.lineWidth = 1
        ctx.strokeRect(x + 0.5, y + 0.5, TILE - 1, TILE - 1)
      } else if (t === DOT) {
        ctx.beginPath()
        ctx.arc(x + TILE / 2, y + TILE / 2, 2.5, 0, Math.PI * 2)
        ctx.fillStyle = '#e0d0ff'
        ctx.fill()
      } else if (t === POWER) {
        const pulse = (Math.sin(performance.now() / 250) + 1) / 2
        const radius = 5 + pulse * 2
        ctx.beginPath()
        ctx.arc(x + TILE / 2, y + TILE / 2, radius, 0, Math.PI * 2)
        ctx.fillStyle = '#ffe000'
        ctx.shadowColor = '#ffe000'
        ctx.shadowBlur = 8
        ctx.fill()
        ctx.shadowBlur = 0
      } else if (t === GHOST_HOUSE) {
        ctx.fillStyle = '#100020'
        ctx.fillRect(x, y, TILE, TILE)
      }
      // EMPTY / EMPTY cells: black background already cleared
    }
  }

  // Ghost house door line
  ctx.strokeStyle = '#ff88cc'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(11 * TILE, 12 * TILE)
  ctx.lineTo(17 * TILE, 12 * TILE)
  ctx.stroke()
}

function drawPacman() {
  const angle = pac.mouth * Math.PI
  // Rotation offset per direction
  const rot = [0, -Math.PI / 2, Math.PI, Math.PI / 2][pac.dir]

  ctx.save()
  ctx.translate(pac.x, pac.y)
  ctx.rotate(rot)
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.arc(0, 0, TILE / 2 - 1, angle, Math.PI * 2 - angle)
  ctx.closePath()
  ctx.fillStyle = '#ffe000'
  ctx.shadowColor = '#ffe000'
  ctx.shadowBlur = 6
  ctx.fill()
  ctx.shadowBlur = 0
  ctx.restore()
}

function drawGhost(g) {
  const x = g.x, y = g.y
  const r = TILE / 2 - 1

  let bodyColor
  if (g.state === 'eaten') {
    drawEyes(g)
    return
  } else if (g.state === 'frightened') {
    bodyColor = g.flash ? '#f0f0ff' : '#1a1aff'
  } else {
    bodyColor = g.color
  }

  // Body
  ctx.beginPath()
  ctx.arc(x, y - r * 0.2, r, Math.PI, 0)  // rounded top
  ctx.lineTo(x + r, y + r)
  // Wavy skirt (3 bumps)
  const bumpW = (2 * r) / 3
  for (let i = 0; i < 3; i++) {
    const bx = x + r - bumpW * i
    ctx.lineTo(bx - bumpW / 2, y + r - (i % 2 === 0 ? 4 : 0))
  }
  ctx.lineTo(x - r, y + r)
  ctx.closePath()
  ctx.fillStyle = bodyColor
  if (g.state !== 'frightened') {
    ctx.shadowColor = bodyColor
    ctx.shadowBlur = 8
  }
  ctx.fill()
  ctx.shadowBlur = 0

  if (g.state === 'frightened' && !g.flash) {
    // Simple scared face
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(x - 4, y - 3, 2, 0, Math.PI * 2)
    ctx.arc(x + 4, y - 3, 2, 0, Math.PI * 2)
    ctx.fill()
  } else if (g.state !== 'frightened') {
    drawEyes(g)
  }
}

function drawEyes(g) {
  const eyeX = [-4, 4]
  const v = DIR_VEC[g.dir]
  for (const ex of eyeX) {
    // White
    ctx.beginPath()
    ctx.ellipse(g.x + ex, g.y - 3, 3, 3.5, 0, 0, Math.PI * 2)
    ctx.fillStyle = '#ffffff'
    ctx.fill()
    // Pupil
    ctx.beginPath()
    ctx.arc(g.x + ex + v.dc * 1.5, g.y - 3 + v.dr * 1.5, 1.8, 0, Math.PI * 2)
    ctx.fillStyle = '#0044cc'
    ctx.fill()
  }
}

function drawPopups(dt) {
  for (let i = ghostScorePopups.length - 1; i >= 0; i--) {
    const p = ghostScorePopups[i]
    p.life -= dt
    p.y -= 0.3
    if (p.life <= 0) { ghostScorePopups.splice(i, 1); continue }
    ctx.globalAlpha = Math.min(1, p.life / 300)
    ctx.fillStyle = '#ffe000'
    ctx.font = 'bold 12px monospace'
    ctx.textAlign = 'center'
    ctx.fillText(p.pts, p.x, p.y)
    ctx.globalAlpha = 1
  }
}

function draw(dt) {
  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  drawMaze()

  if (!dying) drawPacman()

  for (const g of ghosts) drawGhost(g)

  drawPopups(dt)
}

// ── Game loop ─────────────────────────────────────────────────
let lastTs = 0

function loop(ts) {
  if (!running) return
  const dt = Math.min(ts - lastTs, 50)
  lastTs = ts

  movePac(dt)
  animatePac(dt)
  eatDots()
  updateGhosts(dt)
  checkGhostCollisions()
  updateFrightened(dt)
  updateModeTimer(dt)
  draw(dt)

  requestAnimationFrame(loop)
}

// ── Bootstrap ─────────────────────────────────────────────────
initGame()

// Initial render (static frame before game starts)
;(function initialDraw() {
  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  drawMaze()
  drawPacman()
  for (const g of ghosts) drawGhost(g)
})()
