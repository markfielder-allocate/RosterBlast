const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const timerEl = document.getElementById("timer");
const scoreEl = document.getElementById("score");

/* ---------------- CONFIG ---------------- */
const NUM_BLOCKS = 15;     // number of movable blocks
const TIME_LIMIT = 90;     // time in seconds
const BLOCK_POINTS = 100;  // per matched block
const TIME_BONUS = 10;     // per second left if all matched
const gridSize = 40;
/* ----------------------------------------- */

// --- Dynamically size grid so there’s enough room ---
let gridSide = Math.ceil(Math.sqrt(NUM_BLOCKS * 4)); // ~4x total pieces
if (gridSide < 10) gridSide = 10;
const rows = gridSide;
const cols = gridSide;

canvas.width = cols * gridSize;
canvas.height = rows * gridSize;

// ---- COLORS ----
const css = getComputedStyle(document.documentElement);
const COLOR_BG          = css.getPropertyValue('--bg').trim() || '#f6f7f8';
const GRID_LINE         = css.getPropertyValue('--grid-line').trim() || '#e2e6ea';
const COLOR_BLOCK       = css.getPropertyValue('--block').trim() || '#e74c3c';
const COLOR_TARGET_HIT  = css.getPropertyValue('--target-hit').trim() || '#28a745';
const COLOR_WIN         = css.getPropertyValue('--win').trim() || '#3498db';
const COLOR_LOSE        = '#e74c3c';

// ---- IMAGES ----
const sadNurse = new Image();
sadNurse.src = 'nurse_sad.png';
const happyNurse = new Image();
happyNurse.src = 'nurse_happy.png';

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
  updateHUD();
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
  updateHUD();
  draw();
}

function endDrag(){
  if (dragging){
    dragging=null;
    if (checkAllMatched() && !finished){
      finished = true;
      clearInterval(timerInterval);
      score += timeLeft * TIME_BONUS;
    }
    updateHUD();
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

function updateHUD(){
  timerEl.textContent = `Time: ${timeLeft}s`;
  scoreEl.textContent = `Score: ${score}`;
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

  // Targets with nurse images
  targets.forEach(t => {
    const hit = blocks.some(b => b.x === t.x && b.y === t.y);
    const img = hit ? happyNurse : sadNurse;
    if (img.complete) {
      ctx.drawImage(img, t.x * gridSize, t.y * gridSize, gridSize, gridSize);
    } else {
      img.onload = () => ctx.drawImage(img, t.x * gridSize, t.y * gridSize, gridSize, gridSize);
    }
  });

  // Blocks — red normally, green + happy nurse drawn on top if matched
  blocks.forEach(b => {
    if (isOnTarget(b)) {
      // green background
      ctx.fillStyle = COLOR_TARGET_HIT;
      ctx.fillRect(b.x * gridSize, b.y * gridSize, gridSize, gridSize);
      // happy nurse on top
      if (happyNurse.complete) {
        ctx.drawImage(happyNurse, b.x * gridSize, b.y * gridSize, gridSize, gridSize);
      } else {
        happyNurse.onload = () => ctx.drawImage(happyNurse, b.x * gridSize, b.y * gridSize, gridSize, gridSize);
      }
    } else {
      ctx.fillStyle = COLOR_BLOCK;  // normal red
      ctx.fillRect(b.x * gridSize, b.y * gridSize, gridSize, gridSize);
    }
  });

  if (finished) {
    ctx.fillStyle = COLOR_WIN;
    ctx.font = "24px Arial";
    ctx.fillText(`All matched! Final Score: ${score}`, 20, canvas.height / 2);
  }
  if (lost) {
    ctx.fillStyle = COLOR_LOSE;
    ctx.font = "24px Arial";
    ctx.fillText(`Time's up! Final Score: ${score}`, 30, canvas.height / 2);
  }
}

updateScore();
updateHUD();
draw();
