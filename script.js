const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const gridSize = 40;
const rows = canvas.height / gridSize;
const cols = canvas.width / gridSize;

// Colors from CSS
const _CSS = getComputedStyle(document.documentElement);
const COLOR_BG         = _CSS.getPropertyValue('--bg').trim() || '#f6f7f8';
const GRID_LINE       = _CSS.getPropertyValue('--grid-line').trim() || '#e2e6ea';
const COLOR_BLOCK     = _CSS.getPropertyValue('--block').trim() || '#e74c3c';        // red
const COLOR_PLAYER    = _CSS.getPropertyValue('--player').trim() || '#f1c40f';       // yellow
const COLOR_TARGET    = _CSS.getPropertyValue('--target').trim() || '#7b4fa1';       // purple
const COLOR_TARGET_HIT= _CSS.getPropertyValue('--target-hit').trim() || '#28a745';   // green
const COLOR_WIN       = _CSS.getPropertyValue('--win').trim() || '#3498db';

// Player (yellow)
let player = { x: 1, y: 1 };

// Blocks (red by default)
let blocks = [
  { x: 3, y: 3 },
  { x: 5, y: 2 },
];

// Targets (purple until hit)
let targets = [
  { x: 6, y: 3 },
  { x: 2, y: 6 },
];

let won = false;

function isOnTargetPos(x, y) {
  return targets.some(t => t.x === x && t.y === y);
}
function isOnTarget(block) {
  return isOnTargetPos(block.x, block.y);
}
function checkWin() {
  return blocks.every(isOnTarget);
}

function draw() {
  // background
  ctx.fillStyle = COLOR_BG;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // grid
  ctx.strokeStyle = GRID_LINE;
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      ctx.strokeRect(i * gridSize, j * gridSize, gridSize, gridSize);
    }
  }

  // draw targets (base purple)
  targets.forEach(t => {
    ctx.fillStyle = COLOR_TARGET;
    ctx.fillRect(t.x * gridSize, t.y * gridSize, gridSize, gridSize);
  });

  // draw blocks; if a block sits on a target, color it green
  blocks.forEach(b => {
    const hit = isOnTarget(b);
    ctx.fillStyle = hit ? COLOR_TARGET_HIT : COLOR_BLOCK;
    ctx.fillRect(b.x * gridSize, b.y * gridSize, gridSize, gridSize);
  });

  // draw player (yellow)
  ctx.fillStyle = COLOR_PLAYER;
  ctx.fillRect(player.x * gridSize, player.y * gridSize, gridSize, gridSize);

  // Win text
  if (won) {
    ctx.fillStyle = COLOR_WIN;
    ctx.font = "24px Arial";
    ctx.fillText("You Win!", canvas.width / 2 - 50, canvas.height / 2);
  }
}

function movePlayer(dx, dy) {
  if (won) return;

  const newX = player.x + dx;
  const newY = player.y + dy;

  // Is there a block where the player wants to move?
  const block = blocks.find(b => b.x === newX && b.y === newY);

  if (block) {
    const blockNewX = block.x + dx;
    const blockNewY = block.y + dy;

    const blockHitsBlock = blocks.some(b => b !== block && b.x === blockNewX && b.y === blockNewY);
    const inBounds =
      blockNewX >= 0 && blockNewX < cols &&
      blockNewY >= 0 && blockNewY < rows;

    if (inBounds && !blockHitsBlock) {
      // push block
      block.x = blockNewX;
      block.y = blockNewY;

      // move player into the vacated space
      player.x = newX;
      player.y = newY;
    }
  } else {
    // move player into empty cell
    const inBounds =
      newX >= 0 && newX < cols &&
      newY >= 0 && newY < rows;

    if (inBounds) {
      player.x = newX;
      player.y = newY;
    }
  }

  // recompute win after any move
  if (checkWin()) won = true;

  draw();
}

document.addEventListener("keydown", e => {
  if (e.key === "ArrowUp") movePlayer(0, -1);
  if (e.key === "ArrowDown") movePlayer(0, 1);
  if (e.key === "ArrowLeft") movePlayer(-1, 0);
  if (e.key === "ArrowRight") movePlayer(1, 0);
});

// initial paint
draw();
