// --- On-page error reporting (so Safari can’t hide the truth) ---
const jsBadge = document.getElementById("jsBadge");
const errBox = document.getElementById("errBox");

window.addEventListener("error", (e) => {
  errBox.classList.remove("hidden");
  errBox.textContent = "JS ERROR:\n" + (e.message || "unknown") + "\n" + (e.filename || "") + ":" + (e.lineno || "");
  jsBadge.textContent = "JS: ERROR";
});

function setBadgeOk() {
  jsBadge.textContent = "JS: LOADED ✅";
  jsBadge.style.background = "rgba(0,184,148,.14)";
  jsBadge.style.color = "rgba(0,110,90,.95)";
}

const canvas = document.getElementById("cv");
if (!canvas) throw new Error("Canvas #cv not found");
const ctx = canvas.getContext("2d");
if (!ctx) throw new Error("Canvas 2D context failed");

// HUD
const fillEl = document.getElementById("fill");
const pctEl = document.getElementById("pct");
const mEl = document.getElementById("m");

// Controls
const leftBtn = document.getElementById("leftBtn");
const rightBtn = document.getElementById("rightBtn");
const jumpBtn = document.getElementById("jumpBtn");

const winOverlay = document.getElementById("win");
const replayBtn = document.getElementById("replay");
const continueBtn = document.getElementById("continue");

setBadgeOk();

// --- Canvas sizing (DPR) ---
let W = 0, H = 0, DPR = 1;

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

// --- Physics ---
const gravity = 2200;
const moveSpeed = 320;
const jumpForce = 780;
const friction = 0.85;

const keys = { left:false, right:false, jump:false };

const player = { x:80, y:0, w:90, h:135, vx:0, vy:0, grounded:false };

// --- Character image (your link kept exactly) ---
const playerImg = new Image();
playerImg.src = "https://github.com/KN1GHTW1NG/16March/raw/refs/heads/main/assets/IMG_2114.png";
let imgReady = false;
playerImg.onload = () => (imgReady = true);

// --- Level ---
let groundY = 0;
let platforms = [];
const goal = { x: 2050, w: 120, h: 80 };

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
}

// --- Keyboard input ---
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

// --- Touch D-pad (hold, not sticky) ---
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

// --- Game loop ---
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

  if (keys.left) player.vx = -moveSpeed;
  else if (keys.right) player.vx = moveSpeed;
  else player.vx *= friction;

  if (keys.jump && player.grounded) {
    player.vy = -jumpForce;
    player.grounded = false;
  }

  player.vy += gravity * dt;

  player.x += player.vx * dt;
  player.y += player.vy * dt;

  player.grounded = false;

  // Stand on platforms (ground segments)
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

  // Pits reset
  if (player.y > H + 200) respawn();

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
  mEl.textContent = Math.floor(player.x / 10) + "m";
}

function draw() {
  // If you still see white, JS isn’t running or is erroring (errBox will show)
  ctx.clearRect(0, 0, W, H);

  // Instant proof draw is running: small magenta square
  ctx.fillStyle = "#ff00ff";
  ctx.fillRect(8, 8, 18, 18);

  // Sky
  ctx.fillStyle = "#87CEEB";
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  ctx.translate(-cameraX, 0);

  // Ground
  ctx.fillStyle = "#3CB371";
  for (let p of platforms) {
    ctx.fillRect(p.x, groundY, p.width, 140);
  }

  // Goal placeholder
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

// INIT
resize();
requestAnimationFrame(loop);