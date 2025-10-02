const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const gridSize = 40;
const rows = canvas.height / gridSize;
const cols = canvas.width / gridSize;

/* ---------------- CONFIG ---------------- */
const NUM_BLOCKS = 5;      // 🔴 number of movable blocks
const TIME_LIMIT = 60;     // ⏱️ seconds allowed
const BLOCK_POINTS = 100;  // 🏆 points per matched block
const TIME_BONUS = 10;     // 🕒 points per second left if all matched
/* ----------------------------------------- */

// ---- COLORS ----
const css = getComputedStyle(document.documentElement);
const COLOR_BG          = css.getPropertyValue('--bg').trim() || '#f6f7f8';
const GRID_LINE         = css.getPropertyValue('--grid-line').trim() || '#e2e6ea';
const COLOR_BLOCK       = css.getPropertyValue('--block').trim() || '#e74c3c';
const COLOR_TARGET      = css.getPropertyValue('--target').trim() || '#7b4fa1';
const COLOR_TARGET_HIT  = css.getPropertyValue('--target-hit').trim() || '#28a745';
const COLOR_WIN         = css.getPropertyValue('--win').trim() || '#3498db';
const COLOR_LOSE        = '#e74c3c';

// ---- GAME SETUP ----
const topHalf = Math.floor(rows / 2);

function randomUniquePositions(count, minY, maxY, taken = []) {
  const positions = [];
  while (positions.length < count) {
    const x = Math.floor(Math.random() * (cols - 2)) + 1; // avoid edges
    const y = Math.floor(Math.random() * (maxY - minY)) + minY;
    if (y <= 0 || y >= rows - 1) continue;
    const conflict =
      taken.some(p => p.x === x && p.y === y) ||
      positions.some(p => p.x === x && p.y === y);
    if (!conflict) positions.push({ x, y });
  }
  return positions;
}

let blocks = randomUniquePositions(NUM_BLOCKS, 1, topHalf);
let targets = randomUniquePositions(NUM_BLOCKS, topHalf, rows - 1, blocks);

let finished = false;
let lost = false;
let score = 0;

// ---- TIMER ----
let timeLeft = TIME_LIMIT;
const timerInterval = setInterval(() => {
  if (finished || lost) return;
  timeLeft--;
  if (timeLeft <= 0) {
    lost = true;
    clearInterval(timerInterval);
  }
  updateScore();
  draw();
}, 1000);

// ---- DRAGGING ----
let dragging = null;
canvas.addEventListener('mousedown', startDrag);
canvas.addEventListener('mousemove', drag);
canvas.addEventListener('mouseup', endDrag);
canvas.addEventListener('mouseleave', endDrag);

canvas.addEventListener('touchstart', e => startDrag(toMouse(e)), {passive:false});
canvas.addEventListener('touchmove', e => {drag(toMouse(e)); e.preventDefault();}, {passive:false});
canvas.addEventListener('touchend', e => endDrag(toMouse(e)));

function toMouse(touchEvent){
  const rect = canvas.getBoundingClientRect();
  const t = touchEvent.touches[0] || touchEvent.changedTouches[0];
  return {clientX: t.clientX - rect.left, clientY: t.clientY - rect.top};
}

function startDrag(e){
  if (finished || lost) return;
  const pos = mousePos(e);
  const bIndex = blocks.findIndex(b =>
    pos.x >= b.x * gridSize && pos.x < (b.x+1)*gridSize &&
    pos.y >= b.y * gridSize && pos.y < (b.y+1)*gridSize
  );
  if (bIndex >= 0) {
    dragging = {
      index: bIndex,
      offsetX: pos.x - blocks[bIndex].x * gridSize,
      offsetY: pos.y - blocks[bIndex].y * gridSize
    };
  }
}

function drag(e){
  if (!dragging || finished || lost) return;
  const pos = mousePos(e);
  const bx = Math.floor((pos.x - dragging.offsetX + gridSize/2)/gridSize);
  const by = Math.floor((pos.y - dragging.offsetY + gridSize/2)/gridSize);
  if (bx>=0 && bx<cols && by>=0 && by<rows){
    blocks[dragging.index] = {x:bx, y:by};
  }
  updateScore();
  draw();
}

function endDrag(){
  if (dragging){
    dragging=null;
    if (checkAllMatched() && !finished){
      finished = true;
      clearInterval(timerInterval);
      // Add time bonus
      score += timeLeft * TIME_BONUS;
    }
    draw();
  }
}

function mousePos(e){
  const rect = canvas.getBoundingClientRect();
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  };
}

// ---- LOGIC ----
function isOnTarget(block) {
  return targets.some(t => t.x === block.x && t.y === block.y);
}

function checkAllMatched() {
  return blocks.every(isOnTarget);
}

function updateScore(){
  const matched = blocks.filter(isOnTarget).length;
  score = matched * BLOCK_POINTS;
}

// ---- DRAW ----
function draw() {
  ctx.fillStyle = COLOR_BG;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Grid
  ctx.strokeStyle = GRID_LINE;
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      ctx.strokeRect(i * gridSize, j * gridSize, gridSize, gridSize);
    }
  }

  // HUD
  ctx.fillStyle = "#000";
  ctx.font = "20px Arial";
  ctx.fillText(`Time: ${timeLeft}s`, 10, 25);
  ctx.fillText(`Score: ${score}`, 10, 50);

  // Targets
  targets.forEach(t => {
    const hit = blocks.some(b => b.x === t.x && b.y === t.y);
    ctx.fillStyle = hit ? COLOR_TARGET_HIT : COLOR_TARGET;
    ctx.fillRect(t.x * gridSize, t.y * gridSize, gridSize, gridSize);
  });

  // Blocks
  blocks.forEach(b => {
    ctx.fillStyle = isOnTarget(b) ? COLOR_TARGET_HIT : COLOR_BLOCK;
    ctx.fillRect(b.x * gridSize, b.y * gridSize, gridSize, gridSize);
  });

  if (finished) {
    ctx.fillStyle = COLOR_WIN;
    ctx.font = "30px Arial";
    ctx.fillText(`All matched! Final Score: ${score}`, 20, canvas.height / 2);
  }
  if (lost) {
    ctx.fillStyle = COLOR_LOSE;
    ctx.font = "30px Arial";
    ctx.fillText(`Time's up! Final Score: ${score}`, 30, canvas.height / 2);
  }
}

updateScore();
draw();
