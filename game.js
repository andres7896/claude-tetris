'use strict';

const COLS = 10;
const ROWS = 20;
const BLOCK = 30;

const COLORS = [
  null,
  '#4dd0e1', // I - cyan
  '#ffd54f', // O - yellow
  '#ba68c8', // T - purple
  '#81c784', // S - green
  '#e57373', // Z - red
  '#64b5f6', // J - pale blue
  '#ffb74d', // L - orange
  '#f5f5f5', // 8 - WILD (comodín, producido por el power-up Tinte)
];

const WILD = 8;

// --- Power-ups ---
const POWERUP_EVERY = 5;   // cada cuántas líneas aparece un power-up
const FREEZE_MS = 5000;    // duración del efecto Congelar
const BLOCK_BONUS = 10;    // puntos por bloque destruido (Bomba/Rayo), x nivel

const POWERUPS = {
  bomb:    { icon: '💣', name: 'BOMBA',     color: '#ff7043' },
  ray:     { icon: '⚡', name: 'RAYO',       color: '#fff176' },
  tint:    { icon: '🎨', name: 'TINTE',      color: '#f06292' },
  gravity: { icon: '⬇',  name: 'GRAVEDAD',   color: '#90a4ae' },
  freeze:  { icon: '❄',  name: 'CONGELAR',   color: '#4fc3f7' },
};
const POWERUP_TYPES = Object.keys(POWERUPS);

const PIECES = [
  null,
  [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]], // I
  [[2,2],[2,2]],                               // O
  [[0,3,0],[3,3,3],[0,0,0]],                  // T
  [[0,4,4],[4,4,0],[0,0,0]],                  // S
  [[5,5,0],[0,5,5],[0,0,0]],                  // Z
  [[6,0,0],[6,6,6],[0,0,0]],                  // J
  [[0,0,7],[7,7,7],[0,0,0]],                  // L
];

const LINE_SCORES = [0, 100, 300, 500, 800];

const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const nextCanvas = document.getElementById('next-canvas');
const nextCtx = nextCanvas.getContext('2d');
const scoreEl = document.getElementById('score');
const linesEl = document.getElementById('lines');
const levelEl = document.getElementById('level');
const powerupStatusEl = document.getElementById('powerup-status');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlayScore = document.getElementById('overlay-score');
const restartBtn = document.getElementById('restart-btn');
const themeToggleBtn = document.getElementById('theme-toggle');

let board, current, next, score, lines, level, paused, gameOver, lastTime, dropAccum, dropInterval, animId;

let gridColor;

function getInitialTheme() {
  const stored = localStorage.getItem('theme');
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function updateGridColor() {
  gridColor = getComputedStyle(document.documentElement).getPropertyValue('--grid-line').trim();
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  updateGridColor();
  if (current) draw();
  if (next) drawNext();
}

applyTheme(getInitialTheme());

function createBoard() {
  return Array.from({ length: ROWS }, () => new Array(COLS).fill(0));
}

function randomPiece() {
  const type = Math.floor(Math.random() * 7) + 1;
  const shape = PIECES[type].map(row => [...row]);
  return { type, shape, x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2), y: 0, power: null };
}

function randomPowerUp() {
  const power = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
  return { type: 0, power, shape: [[1]], x: Math.floor(COLS / 2), y: 0 };
}

function collide(shape, ox, oy) {
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) continue;
      const nx = ox + c;
      const ny = oy + r;
      if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
      if (ny >= 0 && board[ny][nx]) return true;
    }
  }
  return false;
}

function rotateCW(shape) {
  const rows = shape.length, cols = shape[0].length;
  const result = Array.from({ length: cols }, () => new Array(rows).fill(0));
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      result[c][rows - 1 - r] = shape[r][c];
  return result;
}

function tryRotate() {
  const rotated = rotateCW(current.shape);
  const kicks = [0, -1, 1, -2, 2];
  for (const kick of kicks) {
    if (!collide(rotated, current.x + kick, current.y)) {
      current.shape = rotated;
      current.x += kick;
      return;
    }
  }
}

function merge() {
  for (let r = 0; r < current.shape.length; r++)
    for (let c = 0; c < current.shape[r].length; c++)
      if (current.shape[r][c])
        board[current.y + r][current.x + c] = current.shape[r][c];
}

function isRowFull(row) {
  const empty = row.filter(v => v === 0).length;
  if (empty === 0) return true;
  // Una fila con al menos un comodín se considera completa si le falta 1 sola celda.
  return empty === 1 && row.includes(WILD);
}

function clearLines() {
  let cleared = 0;
  for (let r = ROWS - 1; r >= 0; r--) {
    if (isRowFull(board[r])) {
      board.splice(r, 1);
      board.unshift(new Array(COLS).fill(0));
      cleared++;
      r++;
    }
  }
  if (cleared) {
    lines += cleared;
    score += (LINE_SCORES[cleared] || 0) * level;
    level = Math.floor(lines / 10) + 1;
    dropInterval = Math.max(100, 1000 - (level - 1) * 90);
    while (lines >= nextPowerUpAt) {
      pendingPowerUps++;
      nextPowerUpAt += POWERUP_EVERY;
    }
    updateHUD();
  }
}

function ghostY() {
  let gy = current.y;
  while (!collide(current.shape, current.x, gy + 1)) gy++;
  return gy;
}

function hardDrop() {
  const gy = ghostY();
  score += (gy - current.y) * 2;
  current.y = gy;
  lockPiece();
}

function softDrop() {
  if (!collide(current.shape, current.x, current.y + 1)) {
    current.y++;
    score += 1;
    updateHUD();
  } else {
    lockPiece();
  }
}

function lockPiece() {
  if (current.power) {
    activatePowerUp(current);
  } else {
    merge();
  }
  clearLines();
  spawn();
}

function spawn() {
  current = next;
  if (pendingPowerUps > 0) {
    pendingPowerUps--;
    next = randomPowerUp();
  } else {
    next = randomPiece();
  }
  if (collide(current.shape, current.x, current.y)) {
    endGame();
  }
  drawNext();
}

function addEffect(effect) {
  effects.push(effect);
}

function activatePowerUp(piece) {
  const { power, x, y } = piece;
  const cells = [];
  let destroyed = 0;

  switch (power) {
    case 'bomb': {
      for (let r = y - 1; r <= y + 1; r++) {
        for (let c = x - 1; c <= x + 1; c++) {
          if (r < 0 || r >= ROWS || c < 0 || c >= COLS) continue;
          if (board[r][c]) destroyed++;
          board[r][c] = 0;
          cells.push({ x: c, y: r });
        }
      }
      break;
    }
    case 'ray': {
      // columna completa
      for (let r = 0; r < ROWS; r++) {
        if (board[r][x]) destroyed++;
        board[r][x] = 0;
        cells.push({ x, y: r });
      }
      // fila: se cuenta lo que queda (sin la columna, ya contada), luego se
      // elimina la fila y todo lo de arriba baja una posición.
      for (let c = 0; c < COLS; c++) {
        if (c === x) continue;
        if (board[y][c]) destroyed++;
        cells.push({ x: c, y });
      }
      board.splice(y, 1);
      board.unshift(new Array(COLS).fill(0));
      break;
    }
    case 'tint': {
      let targetColor = board[y + 1] ? board[y + 1][x] : 0;
      if (!targetColor || targetColor === WILD) {
        const counts = new Array(8).fill(0);
        for (let r = 0; r < ROWS; r++)
          for (let c = 0; c < COLS; c++)
            if (board[r][c] >= 1 && board[r][c] <= 7) counts[board[r][c]]++;
        let best = 0;
        for (let i = 1; i <= 7; i++) if (counts[i] > counts[best]) best = i;
        targetColor = best || 0;
      }
      if (targetColor) {
        for (let r = 0; r < ROWS; r++)
          for (let c = 0; c < COLS; c++)
            if (board[r][c] === targetColor) {
              board[r][c] = WILD;
              cells.push({ x: c, y: r });
            }
      }
      break;
    }
    case 'gravity': {
      for (let c = 0; c < COLS; c++) {
        let write = ROWS - 1;
        for (let r = ROWS - 1; r >= 0; r--) {
          if (board[r][c]) {
            if (write !== r) {
              board[write][c] = board[r][c];
              board[r][c] = 0;
            }
            write--;
          }
        }
        for (let r = write; r >= 0; r--) board[r][c] = 0;
      }
      break;
    }
    case 'freeze': {
      freezeRemaining = FREEZE_MS;
      break;
    }
  }

  if (destroyed) score += destroyed * BLOCK_BONUS * level;

  if (cells.length) addEffect({ kind: 'flash', cells, remaining: 250 });
  const info = POWERUPS[power];
  if (info) addEffect({ kind: 'label', text: info.name, remaining: 1000 });

  updateHUD();
}

function updateHUD() {
  scoreEl.textContent = score.toLocaleString();
  linesEl.textContent = lines;
  levelEl.textContent = level;
  if (powerupStatusEl) {
    if (freezeRemaining > 0) {
      powerupStatusEl.textContent = `❄ ${(freezeRemaining / 1000).toFixed(1)}s`;
    } else {
      const remaining = nextPowerUpAt - lines;
      powerupStatusEl.textContent = pendingPowerUps > 0
        ? '¡listo!'
        : `en ${remaining} línea${remaining === 1 ? '' : 's'}`;
    }
  }
}

function drawBlock(context, x, y, colorIndex, size, alpha) {
  if (!colorIndex) return;
  const color = COLORS[colorIndex];
  context.globalAlpha = alpha ?? 1;
  context.fillStyle = color;
  context.fillRect(x * size + 1, y * size + 1, size - 2, size - 2);
  // highlight
  context.fillStyle = 'rgba(255,255,255,0.12)';
  context.fillRect(x * size + 1, y * size + 1, size - 2, 4);
  if (colorIndex === WILD) {
    context.fillStyle = 'rgba(0,0,0,0.55)';
    context.font = `${Math.floor(size * 0.6)}px sans-serif`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText('★', x * size + size / 2, y * size + size / 2 + 1);
  }
  context.globalAlpha = 1;
}

function drawPowerBlock(context, x, y, power, size, alpha) {
  const info = POWERUPS[power];
  if (!info) return;
  context.globalAlpha = alpha ?? 1;
  context.fillStyle = info.color;
  context.fillRect(x * size + 1, y * size + 1, size - 2, size - 2);
  context.fillStyle = 'rgba(255,255,255,0.12)';
  context.fillRect(x * size + 1, y * size + 1, size - 2, 4);
  // ︎ fuerza la variante monocromática (texto) del glifo en vez del
  // emoji a color, que muchos motores de canvas no renderizan bien.
  context.fillStyle = 'rgba(0,0,0,0.75)';
  context.font = `bold ${Math.floor(size * 0.55)}px sans-serif`;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(info.icon + '︎', x * size + size / 2, y * size + size / 2 + 1);
  context.globalAlpha = 1;
}

function drawGrid() {
  ctx.strokeStyle = gridColor;
  ctx.lineWidth = 0.5;
  for (let c = 1; c < COLS; c++) {
    ctx.beginPath();
    ctx.moveTo(c * BLOCK, 0);
    ctx.lineTo(c * BLOCK, ROWS * BLOCK);
    ctx.stroke();
  }
  for (let r = 1; r < ROWS; r++) {
    ctx.beginPath();
    ctx.moveTo(0, r * BLOCK);
    ctx.lineTo(COLS * BLOCK, r * BLOCK);
    ctx.stroke();
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawGrid();

  // board
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      drawBlock(ctx, c, r, board[r][c], BLOCK);

  // ghost
  const gy = ghostY();
  for (let r = 0; r < current.shape.length; r++)
    for (let c = 0; c < current.shape[r].length; c++)
      if (current.shape[r][c]) {
        if (current.power) drawPowerBlock(ctx, current.x + c, gy + r, current.power, BLOCK, 0.2);
        else drawBlock(ctx, current.x + c, gy + r, current.shape[r][c], BLOCK, 0.2);
      }

  // current piece
  for (let r = 0; r < current.shape.length; r++)
    for (let c = 0; c < current.shape[r].length; c++)
      if (current.shape[r][c]) {
        if (current.power) drawPowerBlock(ctx, current.x + c, current.y + r, current.power, BLOCK);
        else drawBlock(ctx, current.x + c, current.y + r, current.shape[r][c], BLOCK);
      }

  drawEffects();

  // velo de congelación
  if (freezeRemaining > 0) {
    ctx.fillStyle = 'rgba(79, 195, 247, 0.12)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

function drawEffects() {
  for (const eff of effects) {
    if (eff.kind === 'flash') {
      const alpha = Math.max(0, eff.remaining / 250) * 0.8;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#ffffff';
      for (const cell of eff.cells) {
        ctx.fillRect(cell.x * BLOCK, cell.y * BLOCK, BLOCK, BLOCK);
      }
      ctx.globalAlpha = 1;
    } else if (eff.kind === 'label') {
      const alpha = Math.min(1, eff.remaining / 1000);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 22px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.strokeStyle = 'rgba(0,0,0,0.6)';
      ctx.lineWidth = 4;
      ctx.strokeText(eff.text, canvas.width / 2, canvas.height / 2);
      ctx.fillText(eff.text, canvas.width / 2, canvas.height / 2);
      ctx.globalAlpha = 1;
    }
  }
}

function drawNext() {
  const NB = 30;
  nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
  const shape = next.shape;
  const offX = Math.floor((4 - shape[0].length) / 2);
  const offY = Math.floor((4 - shape.length) / 2);
  for (let r = 0; r < shape.length; r++)
    for (let c = 0; c < shape[r].length; c++)
      if (shape[r][c]) {
        if (next.power) drawPowerBlock(nextCtx, offX + c, offY + r, next.power, NB);
        else drawBlock(nextCtx, offX + c, offY + r, shape[r][c], NB);
      }
}

function endGame() {
  gameOver = true;
  cancelAnimationFrame(animId);
  overlayTitle.textContent = 'GAME OVER';
  overlayScore.textContent = `Puntuación: ${score.toLocaleString()}`;
  overlay.classList.remove('hidden');
}

function togglePause() {
  if (gameOver) return;
  paused = !paused;
  if (!paused) {
    lastTime = performance.now();
    loop(lastTime);
  } else {
    cancelAnimationFrame(animId);
    overlayTitle.textContent = 'PAUSA';
    overlayScore.textContent = '';
    overlay.classList.remove('hidden');
  }
}

function loop(ts) {
  const dt = ts - lastTime;
  lastTime = ts;

  if (freezeRemaining > 0) {
    freezeRemaining = Math.max(0, freezeRemaining - dt);
    if (freezeRemaining === 0) updateHUD();
  } else {
    dropAccum += dt;
    if (dropAccum >= dropInterval) {
      dropAccum = 0;
      if (!collide(current.shape, current.x, current.y + 1)) {
        current.y++;
      } else {
        lockPiece();
      }
    }
  }

  if (freezeRemaining > 0) updateHUD();

  if (effects.length) {
    for (const eff of effects) eff.remaining -= dt;
    effects = effects.filter(eff => eff.remaining > 0);
  }

  draw();
  animId = requestAnimationFrame(loop);
}

function init() {
  board = createBoard();
  score = 0;
  lines = 0;
  level = 1;
  paused = false;
  gameOver = false;
  dropInterval = 1000;
  dropAccum = 0;
  nextPowerUpAt = POWERUP_EVERY;
  pendingPowerUps = 0;
  freezeRemaining = 0;
  effects = [];
  lastTime = performance.now();
  next = randomPiece();
  spawn();
  updateHUD();
  overlay.classList.add('hidden');
  cancelAnimationFrame(animId);
  animId = requestAnimationFrame(loop);
}

document.addEventListener('keydown', e => {
  if (e.code === 'KeyP') { togglePause(); return; }
  if (paused || gameOver) return;
  switch (e.code) {
    case 'ArrowLeft':
      if (!collide(current.shape, current.x - 1, current.y)) current.x--;
      break;
    case 'ArrowRight':
      if (!collide(current.shape, current.x + 1, current.y)) current.x++;
      break;
    case 'ArrowDown':
      softDrop();
      break;
    case 'ArrowUp':
    case 'KeyX':
      tryRotate();
      break;
    case 'Space':
      e.preventDefault();
      hardDrop();
      break;
  }
  updateHUD();
});

restartBtn.addEventListener('click', init);

themeToggleBtn.addEventListener('click', () => {
  const newTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  applyTheme(newTheme);
});

init();
