'use strict';

const COLS = 10;
const ROWS = 20;
const BLOCK = 30;

const RETRO_COLORS = [
  null,
  '#4dd0e1', // 1 I - cyan
  '#ffd54f', // 2 O - yellow
  '#ba68c8', // 3 T - purple
  '#81c784', // 4 S - green
  '#e57373', // 5 Z - red
  '#64b5f6', // 6 J - pale blue
  '#ffb74d', // 7 L - orange
  '#f5f5f5', // 8 WILD (comodín, producido por el power-up Tinte)
  '#ff8a65', // 9 PLUS (pentominó +)
  '#9575cd', // 10 U (pentominó U)
  '#4db6ac', // 11 Y (pentominó Y)
  '#fff59d', // 12 SINGLE (recompensa tras Tetris)
  '#a1887f', // 13 HOLLOW (3x3 hueco, reto)
  '#78909c', // 14 GARBAGE (basura / bloques fijos)
];

// --- Skins (temas visuales) ---
// Índices 1–14 igual que RETRO_COLORS.
const NEON_COLORS = [
  null,
  '#00e5ff', '#ffee00', '#d500f9', '#00ff6a', '#ff1744', '#2979ff', '#ff9100',
  '#ffffff', '#ff5722', '#7c4dff', '#1de9b6', '#f4ff81', '#bcaaa4', '#90a4ae',
];

const PASTEL_COLORS = [
  null,
  '#a8e6ef', '#fff1b0', '#d9b8ee', '#b8e6c1', '#f5b5b5', '#b5d4f5', '#fcd5a5',
  '#fffafa', '#ffc4b0', '#c9bdec', '#a9e0d8', '#fff8c5', '#d7c7bf', '#c5d0d6',
];

const PIXEL_COLORS = [
  null,
  '#00b8d4', '#e6c200', '#9c27b0', '#43a047', '#e53935', '#1e88e5', '#fb8c00',
  '#eeeeee', '#f4511e', '#5e35b1', '#00897b', '#fdd835', '#8d6e63', '#607d8b',
];

function roundRectPath(context, x, y, w, h, r) {
  context.beginPath();
  context.moveTo(x + r, y);
  context.arcTo(x + w, y, x + w, y + h, r);
  context.arcTo(x + w, y + h, x, y + h, r);
  context.arcTo(x, y + h, x, y, r);
  context.arcTo(x, y, x + w, y, r);
  context.closePath();
}

// Cada skin aporta su paleta y su función de dibujo de un bloque:
// draw(context, px, py, size, color) pinta un bloque con esquina superior
// izquierda en (px, py) píxeles y lado `size`.
const SKINS = {
  retro: {
    label: 'Retro',
    colors: RETRO_COLORS,
    draw(context, px, py, size, color) {
      context.fillStyle = color;
      context.fillRect(px + 1, py + 1, size - 2, size - 2);
      context.fillStyle = 'rgba(255,255,255,0.12)';
      context.fillRect(px + 1, py + 1, size - 2, Math.max(2, size * 0.13));
    },
  },
  neon: {
    label: 'Neon',
    colors: NEON_COLORS,
    draw(context, px, py, size, color) {
      const inset = Math.max(1, size * 0.1);
      context.save();
      context.shadowColor = color;
      context.shadowBlur = size * 0.5;
      context.fillStyle = color;
      context.fillRect(px + inset, py + inset, size - inset * 2, size - inset * 2);
      context.restore();
      // núcleo oscuro: deja solo un borde brillante, como un tubo de neón
      const b = Math.max(1.5, size * 0.13);
      context.fillStyle = 'rgba(0,0,10,0.62)';
      context.fillRect(px + inset + b, py + inset + b, size - (inset + b) * 2, size - (inset + b) * 2);
    },
  },
  pastel: {
    label: 'Pastel',
    colors: PASTEL_COLORS,
    draw(context, px, py, size, color) {
      const inset = Math.max(1, size * 0.06);
      const w = size - inset * 2;
      roundRectPath(context, px + inset, py + inset, w, w, size * 0.28);
      context.fillStyle = color;
      context.fill();
      context.strokeStyle = 'rgba(255,255,255,0.7)';
      context.lineWidth = Math.max(1, size * 0.05);
      context.stroke();
      // brillo suave arriba a la izquierda
      roundRectPath(context, px + size * 0.22, py + size * 0.2, size * 0.34, size * 0.14, size * 0.07);
      context.fillStyle = 'rgba(255,255,255,0.55)';
      context.fill();
    },
  },
  pixel: {
    label: 'Pixel art',
    colors: PIXEL_COLORS,
    draw(context, px, py, size, color) {
      // rejilla de 6x6 "píxeles" con bisel claro/oscuro y motivo de textura
      const u = (size - 2) / 6;
      const x0 = px + 1, y0 = py + 1;
      context.fillStyle = color;
      context.fillRect(x0, y0, size - 2, size - 2);
      context.fillStyle = 'rgba(255,255,255,0.35)';           // bisel claro (arriba/izquierda)
      context.fillRect(x0, y0, u * 6, u);
      context.fillRect(x0, y0, u, u * 6);
      context.fillStyle = 'rgba(0,0,0,0.38)';                 // bisel oscuro (abajo/derecha)
      context.fillRect(x0, y0 + u * 5, u * 6, u);
      context.fillRect(x0 + u * 5, y0, u, u * 6);
      context.fillStyle = 'rgba(255,255,255,0.22)';           // píxeles de textura
      context.fillRect(x0 + u * 2, y0 + u * 2, u, u);
      context.fillRect(x0 + u * 3, y0 + u * 3, u, u);
      context.fillStyle = 'rgba(0,0,0,0.16)';
      context.fillRect(x0 + u * 3, y0 + u * 2, u, u);
      context.fillRect(x0 + u * 2, y0 + u * 3, u, u);
    },
  },
};

const SKIN_KEY = 'skin';
const DEFAULT_SKIN = 'retro';

let skin = SKINS[DEFAULT_SKIN];
let COLORS = skin.colors;   // paleta activa; cambia con applySkin()

const WILD = 8;
const GARBAGE = 14;

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
  [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]], // 1 I
  [[2,2],[2,2]],                              // 2 O
  [[0,3,0],[3,3,3],[0,0,0]],                 // 3 T
  [[0,4,4],[4,4,0],[0,0,0]],                 // 4 S
  [[5,5,0],[0,5,5],[0,0,0]],                 // 5 Z
  [[6,0,0],[6,6,6],[0,0,0]],                 // 6 J
  [[0,0,7],[7,7,7],[0,0,0]],                 // 7 L
  null,                                        // 8 WILD - nunca se genera como pieza
  [[0,9,0],[9,9,9],[0,9,0]],                 // 9 PLUS (pentominó)
  [[10,0,10],[10,10,10],[0,0,0]],            // 10 U (pentominó)
  [[0,0,0,0],[11,11,11,11],[0,11,0,0],[0,0,0,0]], // 11 Y (pentominó)
  [[12]],                                      // 12 SINGLE (recompensa)
  [[13,13,13],[13,0,13],[13,13,13]],         // 13 HOLLOW 3x3 (reto)
  null,                                        // 14 GARBAGE - solo relleno de tablero
];

const LINE_SCORES = [0, 100, 300, 500, 800];
const TSPIN_SCORES = [0, 400, 800, 1200, 1600];
const B2B_MULTIPLIER = 1.5;
const PERFECT_CLEAR_BONUS = 2000;
const ENERGY_PER_LINE = 10;

const PENTO_CHANCE = 0.10;   // probabilidad de piezas +, U, Y
const HOLLOW_CHANCE = 0.04;  // probabilidad de la pieza 3x3 hueca

const SLOW_MS = 10000;
const REVEAL_MS = 30000;

const GARBAGE_INTERVAL = 10000;
const SPRINT_TIME = 120000;
const SPRINT_TARGET_LINES = 40;
const SURVIVAL_TIME = 120000;
const INVISIBLE_TARGET_LINES = 20;
const REVERSE_TARGET_LINES = 30;
const REVERSE_START_LEVEL = 3;
const FIXED_ROWS = 6;

const MAX_START_LEVEL = 10;       // tope del selector de nivel inicial (pausa)
const RESUME_INPUT_LOCK_MS = 200; // bloqueo de teclas del juego tras reanudar

// --- Récords locales (localStorage) ---
const RECORDS_KEY = 'tetris.records';
const NAME_KEY = 'tetris.playerName';
const TOP_N = 5;
const NAME_MAX = 12;
const DEFAULT_NAME = 'Jugador';

const MODE_INFO = {
  classic:   { label: 'Clásico' },
  sprint:    { label: 'Sprint 40L' },
  garbage:   { label: 'Basura' },
  fixed:     { label: 'Bloques fijos' },
  invisible: { label: 'Invisible' },
  reverse:   { label: 'Rotación inversa' },
};

const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const nextCanvas = document.getElementById('next-canvas');
const nextCtx = nextCanvas.getContext('2d');
const holdCanvas = document.getElementById('hold-canvas');
const holdCtx = holdCanvas ? holdCanvas.getContext('2d') : null;
const queueCanvas = document.getElementById('queue-canvas');
const queueCtx = queueCanvas ? queueCanvas.getContext('2d') : null;
const scoreEl = document.getElementById('score');
const linesEl = document.getElementById('lines');
const levelEl = document.getElementById('level');
const comboEl = document.getElementById('combo-value');
const energyFillEl = document.getElementById('energy-fill');
const objectiveEl = document.getElementById('objective-text');
const powerupStatusEl = document.getElementById('powerup-status');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlayScore = document.getElementById('overlay-score');
const modeMenuEl = document.getElementById('mode-menu');
const abilityMenuEl = document.getElementById('ability-menu');
const pauseMenuEl = document.getElementById('pause-menu');
const controlsMenuEl = document.getElementById('controls-menu');
const endButtonsEl = document.getElementById('end-buttons');
const resumeBtn = document.getElementById('resume-btn');
const pauseRestartBtn = document.getElementById('pause-restart-btn');
const controlsBtn = document.getElementById('controls-btn');
const controlsBackBtn = document.getElementById('controls-back-btn');
const pauseMenuBtn = document.getElementById('pause-menu-btn');
const levelDownBtn = document.getElementById('level-down');
const levelUpBtn = document.getElementById('level-up');
const startLevelEl = document.getElementById('start-level-value');
const restartBtn = document.getElementById('restart-btn');
const menuBtn = document.getElementById('menu-btn');
const themeToggleBtn = document.getElementById('theme-toggle');
const recordsEl = document.getElementById('records');
const recordsListEl = document.getElementById('records-list');
const recordMessageEl = document.getElementById('record-message');
const recordFormEl = document.getElementById('record-form');
const recordNameInput = document.getElementById('record-name');
const bestComboEl = document.getElementById('best-combo');
const bestLinesEl = document.getElementById('best-lines');
const recordsResetBtn = document.getElementById('records-reset');

const skinSelectEl = document.getElementById('skin-select');

let board, current, queue, hold, canHold, score, lines, level, paused, gameOver, gameWon;
let lastTime, dropAccum, dropInterval, animId;
let mode = 'classic';
let combo, b2b, lastMoveRotate;
let energy, abilityMenuOpen, undoSnapshot;
let nextPowerUpAt, freezeRemaining, slowRemaining, revealRemaining, effects;
let sprintTimeLeft, survivalTimeLeft, garbageAccum;
let startLevel = 1;   // nivel elegido en el menú de pausa para la próxima partida
let baseLevel = 1;    // nivel con el que arrancó la partida en curso
let inputLockUntil = 0;
let overlayView = null;
let muted = false;
let audioCtx = null;
let maxComboRun = 0;
let pendingRecord = null; // récord de la partida actual aún sin nombre/guardar
let savedRecordId = null; // id del récord guardado en esta partida (para resaltarlo)

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
}

applyTheme(getInitialTheme());

function dropIntervalFor(lvl) {
  return Math.max(100, 1000 - (lvl - 1) * 90);
}


function getInitialSkin() {
  try {
    const stored = localStorage.getItem(SKIN_KEY);
    if (stored && SKINS[stored]) return stored;
  } catch (e) { /* localStorage no disponible */ }
  return DEFAULT_SKIN;
}

function applySkin(name) {
  if (!SKINS[name]) name = DEFAULT_SKIN;
  skin = SKINS[name];
  COLORS = skin.colors;
  document.documentElement.setAttribute('data-skin', name);
  try { localStorage.setItem(SKIN_KEY, name); } catch (e) { /* ignorar */ }
  if (skinSelectEl) skinSelectEl.value = name;
  updateGridColor();
  if (current) { draw(); drawNext(); }
}

applySkin(getInitialSkin());

function createBoard() {
  return Array.from({ length: ROWS }, () => new Array(COLS).fill(0));
}

function makePiece(type) {
  const shape = PIECES[type].map(row => [...row]);
  return { type, shape, x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2), y: 0, power: null };
}

function cloneVisualPiece(p) {
  return { type: p.type, power: p.power || null, shape: p.shape.map(row => [...row]), x: p.x, y: p.y };
}

function randomPiece() {
  const roll = Math.random();
  let type;
  if (roll < HOLLOW_CHANCE) {
    type = 13;
  } else if (roll < HOLLOW_CHANCE + PENTO_CHANCE) {
    type = 9 + Math.floor(Math.random() * 3); // 9 (+), 10 (U), 11 (Y)
  } else {
    type = Math.floor(Math.random() * 7) + 1;
  }
  return makePiece(type);
}

function randomPowerUp() {
  const power = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
  return { type: 0, power, shape: [[1]], x: Math.floor(COLS / 2), y: 0 };
}

function refillQueue() {
  while (queue.length < 5) queue.push(randomPiece());
}

function pieceCells(piece) {
  const cells = [];
  for (let r = 0; r < piece.shape.length; r++)
    for (let c = 0; c < piece.shape[r].length; c++)
      if (piece.shape[r][c]) cells.push({ x: piece.x + c, y: piece.y + r });
  return cells;
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

function rotateCCW(shape) {
  const rows = shape.length, cols = shape[0].length;
  const result = Array.from({ length: cols }, () => new Array(rows).fill(0));
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      result[cols - 1 - c][r] = shape[r][c];
  return result;
}

function tryRotate() {
  const reversed = mode === 'reverse' && level >= REVERSE_START_LEVEL;
  const rotated = reversed ? rotateCCW(current.shape) : rotateCW(current.shape);
  const kicks = [0, -1, 1, -2, 2];
  for (const kick of kicks) {
    if (!collide(rotated, current.x + kick, current.y)) {
      current.shape = rotated;
      current.x += kick;
      lastMoveRotate = true;
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

function cornerFilled(x, y) {
  if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return true;
  return !!board[y][x];
}

function detectTSpin() {
  if (current.type !== 3 || !lastMoveRotate) return false;
  const x = current.x, y = current.y;
  let filled = 0;
  if (cornerFilled(x, y)) filled++;
  if (cornerFilled(x + 2, y)) filled++;
  if (cornerFilled(x, y + 2)) filled++;
  if (cornerFilled(x + 2, y + 2)) filled++;
  return filled >= 3;
}

function clearLinesAndScore(tspin) {
  let cleared = 0;
  const flashCells = [];
  for (let r = ROWS - 1; r >= 0; r--) {
    if (isRowFull(board[r])) {
      for (let c = 0; c < COLS; c++) flashCells.push({ x: c, y: r });
      board.splice(r, 1);
      board.unshift(new Array(COLS).fill(0));
      cleared++;
      r++;
    }
  }

  combo = cleared > 0 ? combo + 1 : 0;
  if (combo > maxComboRun) maxComboRun = combo;

  if (cleared === 0) {
    updateHUD();
    return { cleared: 0, perfectClear: false };
  }

  let points;
  let hard;
  let label = null;

  if (tspin) {
    points = (TSPIN_SCORES[cleared] || 0) * level;
    hard = true;
    label = ['', 'T-SPIN SINGLE', 'T-SPIN DOUBLE', 'T-SPIN TRIPLE'][cleared] || 'T-SPIN';
  } else {
    points = (LINE_SCORES[cleared] || 0) * level;
    hard = cleared === 4;
    if (hard) label = 'TETRIS';
  }

  if (hard && b2b) {
    points = Math.floor(points * B2B_MULTIPLIER);
    label = 'B2B ' + (label || '');
  }
  b2b = hard;

  if (combo > 1) points *= combo;

  score += points;
  lines += cleared;
  level = baseLevel + Math.floor(lines / 10);
  dropInterval = dropIntervalFor(level);
  energy = Math.min(100, energy + ENERGY_PER_LINE * cleared);

  while (lines >= nextPowerUpAt) {
    queue.unshift(randomPowerUp());
    nextPowerUpAt += POWERUP_EVERY;
  }
  if (cleared === 4) {
    queue.unshift(makePiece(12)); // recompensa: pieza 1x1 tras un Tetris
  }

  if (flashCells.length) addEffect({ kind: 'flash', cells: flashCells, remaining: 250 });
  if (label) addEffect({ kind: 'label', text: label, remaining: 1200 });
  if (combo > 1) addEffect({ kind: 'label', text: `COMBO x${combo}`, remaining: 1000 });
  sfx(cleared === 4 ? 'tetris' : tspin ? 'tspin' : 'line', combo);

  const perfectClear = board.every(row => row.every(cell => cell === 0));
  if (perfectClear) {
    score += PERFECT_CLEAR_BONUS * level;
    addEffect({ kind: 'label', text: 'PERFECT CLEAR', remaining: 1500 });
    sfx('perfect');
  }

  updateHUD();
  return { cleared, perfectClear };
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
    lastMoveRotate = false;
    score += 1;
    updateHUD();
  } else {
    lockPiece();
  }
}

function lockPiece() {
  if (current.power) {
    activatePowerUp(current);
    clearLinesAndScore(false);
  } else {
    const tspin = detectTSpin();
    if (mode === 'invisible') addEffect({ kind: 'reveal', cells: pieceCells(current), remaining: 500 });
    merge();
    clearLinesAndScore(tspin);
  }
  if (gameOver) return;
  checkModeProgress();
  if (gameOver) return;
  spawn();
}

function checkModeProgress() {
  if (gameOver) return;
  if (mode === 'sprint' && lines >= SPRINT_TARGET_LINES) endGame(true);
  else if (mode === 'invisible' && lines >= INVISIBLE_TARGET_LINES) endGame(true);
  else if (mode === 'reverse' && lines >= REVERSE_TARGET_LINES) endGame(true);
  else if (mode === 'fixed' && !board.some(row => row.includes(GARBAGE))) endGame(true);
}

function spawn() {
  current = queue.shift();
  refillQueue();
  canHold = true;
  lastMoveRotate = false;
  drawNext();
  drawHold();
  if (collide(current.shape, current.x, current.y)) {
    endGame(false);
    return;
  }
  takeSnapshot();
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
      if (!targetColor || targetColor === WILD || targetColor === GARBAGE) {
        const counts = new Array(COLORS.length).fill(0);
        for (let r = 0; r < ROWS; r++)
          for (let c = 0; c < COLS; c++) {
            const v = board[r][c];
            if (v >= 1 && v !== WILD && v !== GARBAGE) counts[v]++;
          }
        let best = 0;
        for (let i = 1; i < COLORS.length; i++) if (counts[i] > counts[best]) best = i;
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
  sfx('powerup');

  updateHUD();
}

// --- Hold ---
function holdPiece() {
  if (paused || gameOver || abilityMenuOpen) return;
  if (current.power || !canHold) return;
  if (hold === null) {
    hold = { type: current.type };
    current = queue.shift();
    refillQueue();
  } else {
    const heldType = hold.type;
    hold = { type: current.type };
    current = makePiece(heldType);
  }
  canHold = false;
  lastMoveRotate = false;
  if (collide(current.shape, current.x, current.y)) {
    endGame(false);
    return;
  }
  drawHold();
  drawNext();
  sfx('hold');
  updateHUD();
}

// --- Habilidades cargables ---
function openAbilityMenu() {
  if (energy < 100 || gameOver || paused || abilityMenuOpen) return;
  abilityMenuOpen = true;
  cancelAnimationFrame(animId);
  overlayTitle.textContent = 'HABILIDAD';
  overlayScore.textContent = '';
  setOverlayView('ability');
  overlay.classList.remove('hidden');
}

function closeAbilityMenu() {
  abilityMenuOpen = false;
  overlay.classList.add('hidden');
  lastTime = performance.now();
  cancelAnimationFrame(animId);
  animId = requestAnimationFrame(loop);
}

function swapCurrentPiece() {
  if (current.power) return;
  const types = [1, 2, 3, 4, 5, 6, 7].filter(t => t !== current.type);
  const type = types[Math.floor(Math.random() * types.length)];
  const candidate = makePiece(type);
  if (!collide(candidate.shape, candidate.x, candidate.y)) current = candidate;
}

function performUndo() {
  if (!undoSnapshot) return;
  const s = undoSnapshot;
  board = s.board.map(row => [...row]);
  score = s.score;
  lines = s.lines;
  level = s.level;
  dropInterval = s.dropInterval;
  combo = s.combo;
  b2b = s.b2b;
  current = cloneVisualPiece(s.current);
  queue = s.queue.map(cloneVisualPiece);
  hold = s.hold ? { ...s.hold } : null;
  canHold = s.canHold;
  nextPowerUpAt = s.nextPowerUpAt;
  drawNext();
  drawHold();
}

function useAbility(n) {
  if (!abilityMenuOpen) return;
  switch (n) {
    case 1: revealRemaining = REVEAL_MS; break;
    case 2: swapCurrentPiece(); break;
    case 3: slowRemaining = SLOW_MS; break;
    case 4: performUndo(); break;
    case 5: canHold = true; break;
    default: return;
  }
  energy = 0;
  sfx('ability');
  updateHUD();
  closeAbilityMenu();
}

function takeSnapshot() {
  undoSnapshot = {
    board: board.map(row => [...row]),
    score, lines, level, dropInterval, combo, b2b,
    current: cloneVisualPiece(current),
    queue: queue.map(cloneVisualPiece),
    hold: hold ? { ...hold } : null,
    canHold,
    nextPowerUpAt,
  };
}

// --- Modo desafío ---
function initFixedBoard() {
  for (let r = ROWS - FIXED_ROWS; r < ROWS; r++) {
    const hole = Math.floor(Math.random() * COLS);
    for (let c = 0; c < COLS; c++) board[r][c] = c === hole ? 0 : GARBAGE;
  }
}

function addGarbageRow() {
  if (board[0].some(c => c !== 0)) {
    endGame(false);
    return;
  }
  const hole = Math.floor(Math.random() * COLS);
  const row = new Array(COLS).fill(GARBAGE);
  row[hole] = 0;
  board.shift();
  board.push(row);
  if (current && collide(current.shape, current.x, current.y)) {
    current.y--;
    if (collide(current.shape, current.x, current.y)) endGame(false);
  }
}

function countGarbageCells() {
  return board.reduce((n, row) => n + row.filter(c => c === GARBAGE).length, 0);
}

function formatTime(ms) {
  const total = Math.ceil(Math.max(0, ms) / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function objectiveLabel() {
  switch (mode) {
    case 'sprint': return `${lines}/${SPRINT_TARGET_LINES} líneas — ${formatTime(sprintTimeLeft)}`;
    case 'garbage': return `Sobrevive: ${formatTime(survivalTimeLeft)}`;
    case 'fixed': return `Bloques fijos: ${countGarbageCells()}`;
    case 'invisible': return `${lines}/${INVISIBLE_TARGET_LINES} líneas (a ciegas)`;
    case 'reverse': return `${lines}/${REVERSE_TARGET_LINES} líneas${level >= REVERSE_START_LEVEL ? ' ⟲' : ''}`;
    default: return 'Modo libre';
  }
}

// --- Sonido (Web Audio sintetizado, sin archivos) ---
function ensureAudio() {
  if (audioCtx) return;
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  } catch (e) {
    audioCtx = null;
  }
}

function sfx(kind, comboLevel) {
  if (muted) return;
  ensureAudio();
  if (!audioCtx) return;
  const freqs = {
    line: 440, tetris: 660, tspin: 550, perfect: 880,
    hold: 330, ability: 740, gameover: 220, win: 990, powerup: 500,
  };
  let freq = freqs[kind] || 440;
  if (comboLevel && comboLevel > 1) freq += (comboLevel - 1) * 40;
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.value = freq;
    osc.connect(gain).connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc.start(now);
    osc.stop(now + 0.25);
  } catch (e) { /* ignore audio errors */ }
}

function updateHUD() {
  scoreEl.textContent = score.toLocaleString();
  linesEl.textContent = lines;
  levelEl.textContent = level;
  if (powerupStatusEl) {
    if (freezeRemaining > 0) {
      powerupStatusEl.textContent = `❄ ${(freezeRemaining / 1000).toFixed(1)}s`;
    } else {
      const remaining = Math.max(0, nextPowerUpAt - lines);
      powerupStatusEl.textContent = `en ${remaining} línea${remaining === 1 ? '' : 's'}`;
    }
  }
  if (comboEl) comboEl.textContent = combo > 1 ? `x${combo}` : '—';
  if (energyFillEl) {
    energyFillEl.style.width = energy + '%';
    energyFillEl.classList.toggle('full', energy >= 100);
  }
  if (objectiveEl) objectiveEl.textContent = objectiveLabel();
}

function drawBlock(context, x, y, colorIndex, size, alpha) {
  if (!colorIndex) return;
  const color = COLORS[colorIndex];
  context.globalAlpha = alpha ?? 1;
  skin.draw(context, x * size, y * size, size, color);
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
  skin.draw(context, x * size, y * size, size, info.color);
  //︎ fuerza la variante monocromática (texto) del glifo en vez del
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

  // board (en modo "invisible" los bloques asentados no se dibujan, salvo un
  // breve destello justo tras asentarse, vía el efecto 'reveal')
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const v = board[r][c];
      if (!v) continue;
      if (mode === 'invisible') {
        const reveal = effects.find(e => e.kind === 'reveal' && e.cells.some(cc => cc.x === c && cc.y === r));
        if (reveal) drawBlock(ctx, c, r, v, BLOCK, Math.max(0, reveal.remaining / 500));
        continue;
      }
      drawBlock(ctx, c, r, v, BLOCK);
    }
  }

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
  // velo de ralentización
  if (slowRemaining > 0) {
    ctx.fillStyle = 'rgba(255, 213, 79, 0.08)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  drawHold();
  drawQueuePreview();
}

function drawEffects() {
  const labels = effects.filter(e => e.kind === 'label');
  for (const eff of effects) {
    if (eff.kind === 'flash') {
      const alpha = Math.max(0, eff.remaining / 250) * 0.8;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#ffffff';
      for (const cell of eff.cells) ctx.fillRect(cell.x * BLOCK, cell.y * BLOCK, BLOCK, BLOCK);
      ctx.globalAlpha = 1;
    } else if (eff.kind === 'label') {
      const idx = labels.indexOf(eff);
      const alpha = Math.min(1, eff.remaining / 1000);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.strokeStyle = 'rgba(0,0,0,0.6)';
      ctx.lineWidth = 4;
      const y = canvas.height / 2 + (idx - (labels.length - 1) / 2) * 26;
      ctx.strokeText(eff.text, canvas.width / 2, y);
      ctx.fillText(eff.text, canvas.width / 2, y);
      ctx.globalAlpha = 1;
    }
  }
}

function drawNext() {
  if (!nextCtx) return;
  const NB = 30;
  nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
  const piece = queue[0];
  if (!piece) return;
  const shape = piece.shape;
  const offX = Math.floor((4 - shape[0].length) / 2);
  const offY = Math.floor((4 - shape.length) / 2);
  for (let r = 0; r < shape.length; r++)
    for (let c = 0; c < shape[r].length; c++)
      if (shape[r][c]) {
        if (piece.power) drawPowerBlock(nextCtx, offX + c, offY + r, piece.power, NB);
        else drawBlock(nextCtx, offX + c, offY + r, shape[r][c], NB);
      }
}

function drawHold() {
  if (!holdCtx) return;
  holdCtx.clearRect(0, 0, holdCanvas.width, holdCanvas.height);
  holdCanvas.classList.toggle('locked', !canHold);
  if (!hold) return;
  const NB = 30;
  const shape = PIECES[hold.type];
  const offX = Math.floor((4 - shape[0].length) / 2);
  const offY = Math.floor((4 - shape.length) / 2);
  for (let r = 0; r < shape.length; r++)
    for (let c = 0; c < shape[r].length; c++)
      if (shape[r][c]) drawBlock(holdCtx, offX + c, offY + r, shape[r][c], NB);
}

function drawQueuePreview() {
  if (!queueCtx) return;
  const visible = revealRemaining > 0;
  queueCanvas.style.display = visible ? 'block' : 'none';
  if (!visible) return;
  queueCtx.clearRect(0, 0, queueCanvas.width, queueCanvas.height);
  const slotW = queueCanvas.width / 5;
  for (let i = 0; i < 5 && i < queue.length; i++) {
    const piece = queue[i];
    const shape = piece.shape;
    const cell = Math.min(8, Math.floor((slotW - 4) / shape[0].length));
    const offX = i * slotW + (slotW - shape[0].length * cell) / 2;
    const offY = (queueCanvas.height - shape.length * cell) / 2;
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (!shape[r][c]) continue;
        const color = piece.power ? ((POWERUPS[piece.power] || {}).color || '#fff') : (COLORS[shape[r][c]] || '#fff');
        skin.draw(queueCtx, offX + c * cell, offY + r * cell, cell, color);
      }
    }
  }
}

// --- Récords ---
function emptyRecords() {
  return { top: [], bestCombo: 0, maxLines: 0 };
}

function loadRecords() {
  try {
    const raw = JSON.parse(localStorage.getItem(RECORDS_KEY));
    if (!raw || typeof raw !== 'object') return emptyRecords();
    const top = (Array.isArray(raw.top) ? raw.top : [])
      .filter(r => r && Number.isFinite(r.score))
      .map(r => ({
        name: String(r.name || '').slice(0, NAME_MAX) || DEFAULT_NAME,
        score: r.score,
        lines: Number(r.lines) || 0,
        mode: String(r.mode || ''),
        id: r.id,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, TOP_N);
    return { top, bestCombo: Number(raw.bestCombo) || 0, maxLines: Number(raw.maxLines) || 0 };
  } catch (e) {
    return emptyRecords();
  }
}

let records = loadRecords();

function saveRecords() {
  try { localStorage.setItem(RECORDS_KEY, JSON.stringify(records)); } catch (e) { /* almacenamiento no disponible */ }
}

// Posición (0-based) que ocuparía una puntuación; los empates quedan detrás de los existentes.
function rankFor(sc) {
  const i = records.top.findIndex(r => r.score < sc);
  return i === -1 ? records.top.length : i;
}

function qualifiesForTop(sc) {
  return sc > 0 && rankFor(sc) < TOP_N;
}

function updateBests() {
  if (maxComboRun > records.bestCombo) records.bestCombo = maxComboRun;
  if (lines > records.maxLines) records.maxLines = lines;
  saveRecords();
}

function commitPendingRecord() {
  if (!pendingRecord) return;
  const name = recordNameInput.value.trim().slice(0, NAME_MAX) || DEFAULT_NAME;
  const entry = { ...pendingRecord, name, id: Date.now() };
  records.top.splice(rankFor(entry.score), 0, entry);
  records.top.length = Math.min(records.top.length, TOP_N);
  pendingRecord = null;
  savedRecordId = entry.id;
  try { localStorage.setItem(NAME_KEY, name); } catch (e) { /* ignore */ }
  saveRecords();
}

function resetRecords() {
  if (!confirm('¿Borrar todos los récords?')) return;
  records = emptyRecords();
  savedRecordId = null;
  saveRecords();
  renderRecords();
}

function renderRecords() {
  const rows = records.top.map(r => ({ ...r, highlight: r.id === savedRecordId && savedRecordId !== null }));
  const pendingRank = pendingRecord ? rankFor(pendingRecord.score) : -1;
  if (pendingRecord) {
    rows.splice(pendingRank, 0, { name: recordNameInput.value.trim() || '···', score: pendingRecord.score, lines: pendingRecord.lines, mode: pendingRecord.mode, highlight: true });
  }

  recordsListEl.textContent = '';
  if (!rows.length) {
    const li = document.createElement('li');
    li.className = 'empty';
    li.textContent = 'Sin récords todavía';
    recordsListEl.appendChild(li);
  }
  rows.slice(0, TOP_N).forEach((r, i) => {
    const li = document.createElement('li');
    if (r.highlight) li.classList.add('highlight');
    li.title = `${r.mode ? r.mode + ' · ' : ''}${r.lines} líneas`;
    const rank = document.createElement('span');
    rank.className = 'rec-rank';
    rank.textContent = `${i + 1}.`;
    const name = document.createElement('span');
    name.className = 'rec-name';
    name.textContent = r.name;
    const sc = document.createElement('span');
    sc.className = 'rec-score';
    sc.textContent = r.score.toLocaleString();
    li.append(rank, name, sc);
    recordsListEl.appendChild(li);
  });

  bestComboEl.textContent = records.bestCombo > 1 ? `x${records.bestCombo}` : '—';
  bestLinesEl.textContent = records.maxLines;

  const message = pendingRecord ? `¡Entraste al top ${TOP_N}! Puesto #${pendingRank + 1}`
    : gameOver && savedRecordId !== null ? '¡Récord guardado!' : '';
  recordMessageEl.textContent = message;
  recordMessageEl.classList.toggle('hidden', !message);
  recordFormEl.classList.toggle('hidden', !pendingRecord);
}

function setOverlayView(view) {
  overlayView = view;
  if (pauseMenuEl) pauseMenuEl.classList.toggle('hidden', view !== 'pause');
  if (controlsMenuEl) controlsMenuEl.classList.toggle('hidden', view !== 'controls');
  if (modeMenuEl) modeMenuEl.classList.toggle('hidden', view !== 'mode');
  if (abilityMenuEl) abilityMenuEl.classList.toggle('hidden', view !== 'ability');
  if (endButtonsEl) endButtonsEl.classList.toggle('hidden', view !== 'end');
  // los récords se muestran en el menú inicial y en el game over (no en la pausa)
  const showRecords = view === 'mode' || (view === 'end' && gameOver);
  recordsEl.classList.toggle('hidden', !showRecords);
  if (showRecords) renderRecords();
}

function endGame(won) {
  gameOver = true;
  gameWon = !!won;
  updateBests();
  pendingRecord = qualifiesForTop(score)
    ? { score, lines, mode: (MODE_INFO[mode] || {}).label || '' }
    : null;
  if (pendingRecord) {
    let lastName = '';
    try { lastName = localStorage.getItem(NAME_KEY) || ''; } catch (e) { /* ignore */ }
    recordNameInput.value = lastName;
  }
  cancelAnimationFrame(animId);
  overlayTitle.textContent = won ? '¡OBJETIVO CUMPLIDO!' : 'GAME OVER';
  overlayScore.textContent = `Puntuación: ${score.toLocaleString()}`;
  setOverlayView('end');
  overlay.classList.remove('hidden');
  sfx(won ? 'win' : 'gameover');
  draw();
  if (pendingRecord) recordNameInput.focus();
}

function showModeMenu(isInitial) {
  commitPendingRecord();
  savedRecordId = null;
  cancelAnimationFrame(animId);
  paused = false;
  overlayTitle.textContent = 'TETRIS';
  overlayScore.textContent = isInitial ? '' : `Puntuación: ${score.toLocaleString()}`;
  setOverlayView('mode');
  overlay.classList.remove('hidden');
}

function showPauseMenu() {
  overlayTitle.textContent = 'PAUSA';
  overlayScore.textContent = `Puntuación: ${score.toLocaleString()}`;
  updateStartLevelUI();
  setOverlayView('pause');
  overlay.classList.remove('hidden');
  if (resumeBtn) resumeBtn.focus();
}

function pauseGame() {
  paused = true;
  cancelAnimationFrame(animId);
  showPauseMenu();
}

function resumeGame() {
  paused = false;
  overlay.classList.add('hidden');
  if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
  inputLockUntil = performance.now() + RESUME_INPUT_LOCK_MS;
  lastTime = performance.now();
  cancelAnimationFrame(animId);
  animId = requestAnimationFrame(loop);
}

function togglePause() {
  // No hay partida en curso en el menú de modos, tras game over ni con el menú de habilidades.
  if (gameOver || abilityMenuOpen || overlayView === 'mode') return;
  if (paused) resumeGame();
  else pauseGame();
}

function updateStartLevelUI() {
  if (startLevelEl) startLevelEl.textContent = startLevel;
  if (levelDownBtn) levelDownBtn.disabled = startLevel <= 1;
  if (levelUpBtn) levelUpBtn.disabled = startLevel >= MAX_START_LEVEL;
}

function changeStartLevel(delta) {
  startLevel = Math.min(MAX_START_LEVEL, Math.max(1, startLevel + delta));
  updateStartLevelUI();
}

function loop(ts) {
  if (gameOver || paused || abilityMenuOpen) return;
  const dt = ts - lastTime;
  lastTime = ts;

  if (mode === 'sprint') {
    sprintTimeLeft = Math.max(0, sprintTimeLeft - dt);
  } else if (mode === 'garbage') {
    survivalTimeLeft = Math.max(0, survivalTimeLeft - dt);
    garbageAccum += dt;
  }

  if (revealRemaining > 0) revealRemaining = Math.max(0, revealRemaining - dt);
  if (slowRemaining > 0) slowRemaining = Math.max(0, slowRemaining - dt);

  if (freezeRemaining > 0) {
    freezeRemaining = Math.max(0, freezeRemaining - dt);
  } else {
    const effectiveInterval = slowRemaining > 0 ? dropInterval * 2 : dropInterval;
    dropAccum += dt;
    if (dropAccum >= effectiveInterval) {
      dropAccum = 0;
      if (!collide(current.shape, current.x, current.y + 1)) {
        current.y++;
        lastMoveRotate = false;
      } else {
        lockPiece();
      }
    }
  }

  if (!gameOver && mode === 'garbage' && garbageAccum >= GARBAGE_INTERVAL) {
    garbageAccum -= GARBAGE_INTERVAL;
    addGarbageRow();
  }
  if (!gameOver && mode === 'sprint' && sprintTimeLeft <= 0) {
    endGame(lines >= SPRINT_TARGET_LINES);
  }
  if (!gameOver && mode === 'garbage' && survivalTimeLeft <= 0) {
    endGame(true);
  }

  if (effects.length) {
    for (const eff of effects) eff.remaining -= dt;
    effects = effects.filter(eff => eff.remaining > 0);
  }

  updateHUD();

  if (gameOver) {
    draw();
    return;
  }

  draw();
  animId = requestAnimationFrame(loop);
}

function init(startMode) {
  commitPendingRecord();
  savedRecordId = null;
  maxComboRun = 0;
  mode = startMode || mode || 'classic';
  board = createBoard();
  score = 0;
  lines = 0;
  baseLevel = startLevel;
  level = baseLevel;
  paused = false;
  gameOver = false;
  gameWon = false;
  dropInterval = dropIntervalFor(level);
  dropAccum = 0;
  nextPowerUpAt = POWERUP_EVERY;
  freezeRemaining = 0;
  slowRemaining = 0;
  revealRemaining = 0;
  effects = [];
  combo = 0;
  b2b = false;
  lastMoveRotate = false;
  energy = 0;
  hold = null;
  canHold = true;
  abilityMenuOpen = false;
  inputLockUntil = 0;
  undoSnapshot = null;
  sprintTimeLeft = SPRINT_TIME;
  survivalTimeLeft = SURVIVAL_TIME;
  garbageAccum = 0;

  queue = [];
  refillQueue();

  if (mode === 'fixed') initFixedBoard();

  lastTime = performance.now();
  spawn();
  updateHUD();
  overlayView = null;
  overlay.classList.add('hidden');
  cancelAnimationFrame(animId);
  animId = requestAnimationFrame(loop);
}

document.addEventListener('keydown', e => {
  if (e.target instanceof HTMLInputElement) return; // escribiendo el nombre del récord
  if (e.code === 'KeyM') { muted = !muted; return; }
  if (abilityMenuOpen) {
    if (e.code === 'Escape') { closeAbilityMenu(); return; }
    const map = { Digit1: 1, Digit2: 2, Digit3: 3, Digit4: 4, Digit5: 5 };
    if (map[e.code]) useAbility(map[e.code]);
    return;
  }
  if (e.code === 'KeyP') { if (!e.repeat) togglePause(); return; }
  if (e.code === 'Escape') {
    if (e.repeat) return;
    if (paused && overlayView === 'controls') showPauseMenu();
    else togglePause();
    return;
  }
  // Con el menú de pausa abierto (o justo al reanudar) las teclas del juego no hacen nada.
  if (paused || gameOver || performance.now() < inputLockUntil) return;
  switch (e.code) {
    case 'ArrowLeft':
      if (!collide(current.shape, current.x - 1, current.y)) { current.x--; lastMoveRotate = false; }
      break;
    case 'ArrowRight':
      if (!collide(current.shape, current.x + 1, current.y)) { current.x++; lastMoveRotate = false; }
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
    case 'KeyC':
    case 'ShiftLeft':
    case 'ShiftRight':
      holdPiece();
      break;
    case 'KeyE':
      openAbilityMenu();
      break;
  }
  updateHUD();
});

if (restartBtn) restartBtn.addEventListener('click', () => init(mode));
if (menuBtn) menuBtn.addEventListener('click', () => showModeMenu(false));
if (resumeBtn) resumeBtn.addEventListener('click', resumeGame);
if (pauseRestartBtn) pauseRestartBtn.addEventListener('click', () => init(mode));
if (pauseMenuBtn) pauseMenuBtn.addEventListener('click', () => showModeMenu(false));
if (controlsBtn) controlsBtn.addEventListener('click', () => {
  overlayTitle.textContent = 'CONTROLES';
  overlayScore.textContent = '';
  setOverlayView('controls');
  if (controlsBackBtn) controlsBackBtn.focus();
});
if (controlsBackBtn) controlsBackBtn.addEventListener('click', showPauseMenu);
if (levelDownBtn) levelDownBtn.addEventListener('click', () => changeStartLevel(-1));
if (levelUpBtn) levelUpBtn.addEventListener('click', () => changeStartLevel(1));

recordFormEl.addEventListener('submit', e => {
  e.preventDefault();
  commitPendingRecord();
  renderRecords();
});
recordNameInput.addEventListener('input', () => { if (pendingRecord) renderRecords(); });
recordsResetBtn.addEventListener('click', resetRecords);
document.querySelectorAll('.mode-btn').forEach(btn => {
  btn.addEventListener('click', () => init(btn.dataset.mode));
});
document.querySelectorAll('.ability-btn').forEach(btn => {
  btn.addEventListener('click', () => useAbility(Number(btn.dataset.ability)));
});

themeToggleBtn.addEventListener('click', () => {
  const newTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  applyTheme(newTheme);
});

if (skinSelectEl) {
  skinSelectEl.addEventListener('change', () => {
    applySkin(skinSelectEl.value);
    skinSelectEl.blur(); // que las flechas no sigan cambiando el selector mientras se juega
  });
}

showModeMenu(true);
