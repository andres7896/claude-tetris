# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A playable classic Tetris built in vanilla JavaScript (ES6+) with HTML5 Canvas and CSS. No dependencies, no build step, no `package.json` — three files cooperate: `index.html`, `style.css`, `game.js`.

## Running the game

Open `index.html` directly in a browser, or serve it statically:

```bash
python3 -m http.server 8000
npx serve .
php -S localhost:8000
```

There is no test suite, linter, or build/bundle process. Verify changes by opening the page in a browser and playing.

## Architecture

All game logic lives in `game.js` (single file, no modules). Key pieces:

- **Board model**: `board` is a `ROWS × COLS` matrix; each cell is `0` (empty) or a color index `1–7` identifying which piece locked there.
- **Pieces**: `PIECES` defines the 7 tetrominoes as square matrices; `randomPiece()` picks one and spawns it centered at the top. `current` and `next` hold the active and upcoming piece objects (`{ type, shape, x, y }`).
- **Rotation**: `rotateCW()` transposes + reverses rows. `tryRotate()` applies it and, if the rotated shape collides, attempts wall-kick offsets `[0, -1, 1, -2, 2]` before giving up.
- **Collision**: `collide(shape, ox, oy)` checks board bounds and overlap with locked cells; used by movement, rotation, ghost projection, and spawn (game-over check).
- **Lock/merge/clear cycle**: `lockPiece()` → `merge()` (bakes current piece into `board`) → `clearLines()` (scans bottom-up, splices full rows, unshifts empty ones at top, updates score/lines/level) → `spawn()` (promotes `next` to `current`, generates new `next`, checks game-over).
- **Game loop**: `loop(ts)` runs via `requestAnimationFrame`, accumulates elapsed time in `dropAccum`, and advances the piece down one row (or locks it) once `dropAccum >= dropInterval`.
- **Scoring/leveling**: `LINE_SCORES = [0, 100, 300, 500, 800]` multiplied by `level`; hard drop adds 2 pts/cell, soft drop 1 pt/row. Level increases every 10 lines; `dropInterval = max(100, 1000 - (level-1)*90)` ms.
- **Ghost piece**: `ghostY()` projects the current piece straight down to its landing row; drawn at `globalAlpha = 0.2`.
- **Rendering**: `draw()` clears and redraws the grid, locked board, ghost piece, and current piece each frame onto `#board`; `drawNext()` renders the upcoming piece on the separate `#next-canvas`.
- **Input**: a single `keydown` listener dispatches arrows/`X`/`Space`/`P` to movement, rotation, soft/hard drop, and pause; ignored while `paused` or `gameOver`.

### Tunable constants (top of `game.js`)

`COLS`, `ROWS`, `BLOCK` (cell size in px), `COLORS`, `LINE_SCORES`, initial `dropInterval`. If `COLS`/`ROWS`/`BLOCK` change, update the `#board` canvas `width`/`height` in `index.html` to match (`COLS × BLOCK` by `ROWS × BLOCK`).
