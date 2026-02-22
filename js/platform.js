const canvas = document.getElementById("cv");
const ctx = canvas.getContext("2d");

// HUD
const fillEl = document.getElementById("fill");
const pctEl = document.getElementById("pct");
const mEl = document.getElementById("m");

// Buttons
const leftBtn = document.getElementById("leftBtn");
const rightBtn = document.getElementById("rightBtn");
const jumpBtn = document.getElementById("jumpBtn");
const replayBtn = document.getElementById("replay");
const continueBtn = document.getElementById("continue");
const winOverlay = document.getElementById("win");

let W = 0;
let H = 0;
let DPR = 1;

// ---------------- RESIZE (important) ----------------
function resize() {
  DPR = Math.max(1, Math.min(3, window.devicePixelRatio || 1));

  const cssW = Math.min(520, window.innerWidth - 20);
  const cssH = Math.min(window.innerHeight * 0.78, 780);

  canvas.style.width = cssW + "px";
  canvas.style.height = cssH + "px";

  canvas.width = Math.floor(cssW * DPR);
  canvas.height = Math.floor(cssH * DPR);

  W = cssW;
  H = cssH;

  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

  buildLevel();
  respawn();
}
window.addEventListener("resize", resize);

// ---------------- PHYSICS ----------------
const gravity = 2200;
const moveSpeed = 320;
const jumpForce = 780;
const friction = 0.85;

const keys = { left:false, right:false, jump:false };

const player = {
  x: 80,
  y: 0,
  w: 90,
  h: 135,
  vx: 0,
  vy: 0,
  grounded: false
};

// ---------------- CHARACTER IMAGE ----------------
const playerImg = new Image();
playerImg.src = "https://github.com/KN1GHTW1NG/16March/raw/refs/heads/main/assets/IMG_2114.png";

let imgReady = false;
playerImg.onload = () => (imgReady = true);

// ---------------- LEVEL ----------------
let groundY = 0;
let platforms = [];
let levelEndX = 0;

function buildLevel() {
  groundY = H - 140;

  platforms = [
    { x: 0, width: 300 },
    { x: 380, width: 260 },
    { x: 720, width: 260 },
    { x: 1060, width: 260 },
    { x: 1400, width: 260 },
    { x: 1740, width: 320 }
  ];

  // end of level for progress calculation
  const last = platforms[platforms.length - 1];
  levelEndX = last.x + last.width;
}

// Goal Car placeholder
const goal = { x: 2050, w: 120, h: 80 };

// ---------------- INPUT ----------------
document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft" || e.key === "a") keys.left = true;
  if (e.key === "ArrowRight" || e.key === "d") keys.right = true;
  if (e.key === " " || e.key === "ArrowUp") keys.jump = true;
});
document.addEventListener("keyup", (e) => {
  if (e.key === "ArrowLeft" || e.key === "a") keys.left = false;
  if (e.key === "ArrowRight" || e.key === "d") keys.right = false;
  if (e.key === " " || e.key === "ArrowUp") keys.jump = false;
});

function hold(btn, down, up) {
  if (!btn) return;
  btn.addEventListener("pointerdown", (e)=>{ e.preventDefault(); down(); });
  btn.addEventListener("pointerup", (e)=>{ e.preventDefault(); up(); });
  btn.addEventListener("pointercancel", (e)=>{ e.preventDefault(); up(); });
  btn.addEventListener("pointerleave", (e)=>{ e.preventDefault(); up(); });
}

hold(leftBtn,  ()=>keys.left=true,  ()=>keys.left=false);
hold(rightBtn, ()=>keys.right=true, ()=>keys.right=false);

if (jumpBtn) {
  jumpBtn.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    if (player.grounded) {
      player.vy = -jumpForce;
      player.grounded = false;
    }
  });
}

// ---------------- GAME LOOP ----------------
let cameraX = 0;
let last = performance.now();
let finished = false;

function respawn() {
  player.x = 80;
  player.y = groundY - player.h;
  player.vx = 0;
  player.vy = 0;
  player.grounded = true;
  cameraX = 0;
  finished = false;
  winOverlay.classList.add("hidden");
  updateHUD();
}

function loop(now) {
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;

  update(dt);
  draw();

  requestAnimationFrame(loop);
}

function update(dt) {
  if (finished) return;

  // Horizontal
  if (keys.left) player.vx = -moveSpeed;
  else if (keys.right) player.vx = moveSpeed;
  else player.vx *= friction;

  // Jump
  if (keys.jump && player.grounded) {
    player.vy = -jumpForce;
    player.grounded = false;
  }

  // Gravity
  player.vy += gravity * dt;

  // Apply movement
  player.x += player.vx * dt;
  player.y += player.vy * dt;

  player.grounded = false;

  // Platform collision (ground segments only)
  for (let p of platforms) {
    if (
      player.x + player.w > p.x &&
      player.x < p.x + p.width &&
      player.y + player.h > groundY &&
      player.y + player.h < groundY + 40 &&
      player.vy >= 0
    ) {
      player.y = groundY - player.h;
      player.vy = 0;
      player.grounded = true;
    }
  }

  // Fall reset (pits)
  if (player.y > H + 200) respawn();

  // Camera follow
  cameraX = player.x - 150;

  // Win
  if (player.x > goal.x) {
    finished = true;
    winOverlay.classList.remove("hidden");
  }

  updateHUD();
}

function updateHUD() {
  const prog = Math.max(0, Math.min(1, player.x / (goal.x + 200)));
  fillEl.style.width = (prog * 100).toFixed(0) + "%";
  pctEl.textContent = Math.floor(prog * 100) + "%";

  // fake “meters” for vibe
  const meters = Math.floor(player.x / 10);
  mEl.textContent = meters + "m";
}

function draw() {
  ctx.clearRect(0, 0, W, H);

  // Sky
  ctx.fillStyle = "#87CEEB";
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  ctx.translate(-cameraX, 0);

  // Ground blocks
  ctx.fillStyle = "#3CB371";
  for (let p of platforms) {
    ctx.fillRect(p.x, groundY, p.width, 140);
  }

  // Goal placeholder (we’ll swap to car PNG later)
  ctx.fillStyle = "pink";
  ctx.fillRect(goal.x, groundY - goal.h, goal.w, goal.h);

  // Player
  drawPlayer();

  ctx.restore();
}

function drawPlayer() {
  if (!imgReady) {
    ctx.fillStyle = "red";
    ctx.fillRect(player.x, player.y, player.w, player.h);
    return;
  }

  // Preserve PNG ratio without squish
  const ratio = playerImg.width / playerImg.height;

  const drawH = player.h;
  const drawW = drawH * ratio;

  const x = Math.round(player.x + player.w / 2 - drawW / 2);
  const y = Math.round(player.y);

  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(playerImg, x, y, Math.round(drawW), Math.round(drawH));
}

// Overlay buttons
replayBtn?.addEventListener("click", respawn);
continueBtn?.addEventListener("click", () => {
  window.location.href = "cargame.html";
});

// ---------------- INIT ----------------
resize();
requestAnimationFrame(loop);