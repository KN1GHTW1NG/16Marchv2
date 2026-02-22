const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const progressFill = document.getElementById("progressFill");
const percentEl = document.getElementById("percent");

const leftBtn = document.getElementById("leftBtn");
const rightBtn = document.getElementById("rightBtn");
const jumpBtn = document.getElementById("jumpBtn");

const winBox = document.getElementById("winBox");
const continueBtn = document.getElementById("continueBtn");

// -------------------- Sizing (portrait) --------------------
let W = 0, H = 0;
let groundY = 0;

function resize() {
  const cssW = Math.min(430, window.innerWidth - 20);
  const cssH = Math.min(window.innerHeight * 0.78, 860);

  canvas.width = cssW;
  canvas.height = cssH;

  W = cssW;
  H = cssH;

  groundY = H - 155;

  buildLevel();
  respawn();
}
window.addEventListener("resize", resize);

// -------------------- Assets (local) --------------------
const playerImg = new Image();
playerImg.src = "assets/IMG_2114.png";
let playerReady = false;
playerImg.onload = () => (playerReady = true);

const carImg = new Image();
carImg.src = "assets/IMG_2121.png";
let carReady = false;
carImg.onload = () => (carReady = true);

// -------------------- Physics --------------------
const gravity = 2400;
const moveSpeed = 360;
const jumpVelocity = 950;

const player = {
  x: 90,
  y: 0,
  // collider (physics box)
  w: 86,
  h: 128,
  vx: 0,
  vy: 0,
  grounded: false
};

// Visual scale (character bigger without breaking collisions)
const PLAYER_SPRITE_SCALE = 1.65;

// These offsets fix “floating” due to transparent padding inside PNGs.
// If your car/character STILL looks floating, increase these by 6–12.
const CAR_GROUND_CONTACT_OFFSET = 16;     // pushes car down to touch platform
const PLAYER_FOOT_CONTACT_OFFSET = 8;     // pushes sprite down (not collider)

// -------------------- Level --------------------
let platforms = [];   // {x,y,w,h}
let crates = [];      // {x,y,w,h}
let goalX = 0;
let goalPlatformTopY = 0;

function buildLevel() {
  const top = groundY;

  // Hovering ledges = platforms with different y
  platforms = [
    { x: 0,    y: top,      w: 540, h: 40 },
    { x: 720,  y: top - 95, w: 260, h: 40 },  // hovering ledge
    { x: 1150, y: top,      w: 460, h: 40 },
    { x: 1760, y: top - 120,w: 280, h: 40 },  // higher ledge
    { x: 2220, y: top,      w: 560, h: 40 }
  ];

  // Crates you can stand on
  crates = [
    { x: 820,  y: top - 70,  w: 62, h: 62 },
    { x: 1310, y: top - 62,  w: 62, h: 62 },
    { x: 1870, y: top - 92,  w: 62, h: 62 }
  ];

  const last = platforms[platforms.length - 1];
  goalX = last.x + last.w - 210;
  goalPlatformTopY = last.y;
}

function respawn() {
  player.x = 90;
  player.y = platforms[0].y - player.h;
  player.vx = 0;
  player.vy = 0;
  player.grounded = true;

  cameraX = 0;
  finished = false;

  winBox.classList.add("hidden");
  progressFill.style.width = "0%";
  percentEl.textContent = "0%";
}

// -------------------- Controls --------------------
const keys = { left: false, right: false, jump: false };

document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft" || e.key === "a") keys.left = true;
  if (e.key === "ArrowRight" || e.key === "d") keys.right = true;
  if (e.key === "ArrowUp" || e.key === " ") keys.jump = true;
});
document.addEventListener("keyup", (e) => {
  if (e.key === "ArrowLeft" || e.key === "a") keys.left = false;
  if (e.key === "ArrowRight" || e.key === "d") keys.right = false;
  if (e.key === "ArrowUp" || e.key === " ") keys.jump = false;
});

// hold buttons (phone-friendly)
function hold(btn, down, up) {
  if (!btn) return;
  btn.addEventListener("pointerdown", (ev) => { ev.preventDefault(); down(); });
  btn.addEventListener("pointerup", (ev) => { ev.preventDefault(); up(); });
  btn.addEventListener("pointercancel", (ev) => { ev.preventDefault(); up(); });
  btn.addEventListener("pointerleave", (ev) => { ev.preventDefault(); up(); });
}
hold(leftBtn,  () => (keys.left = true),  () => (keys.left = false));
hold(rightBtn, () => (keys.right = true), () => (keys.right = false));

jumpBtn?.addEventListener("pointerdown", (ev) => {
  ev.preventDefault();
  if (player.grounded) {
    player.vy = -jumpVelocity;
    player.grounded = false;
  }
});

// -------------------- Camera --------------------
let cameraX = 0;
function lerp(a, b, t) { return a + (b - a) * t; }

// -------------------- Collision --------------------
function standOn(rect) {
  // Stand only when falling and feet cross the top
  const feetY = player.y + player.h;

  if (
    player.x + player.w > rect.x &&
    player.x < rect.x + rect.w &&
    feetY >= rect.y &&
    feetY <= rect.y + 42 &&
    player.vy >= 0
  ) {
    player.y = rect.y - player.h;
    player.vy = 0;
    player.grounded = true;
  }
}

function overlap(a, b) {
  return !(
    a.x + a.w <= b.x ||
    a.x >= b.x + b.w ||
    a.y + a.h <= b.y ||
    a.y >= b.y + b.h
  );
}

// -------------------- Drawing: sky + clouds --------------------
function drawSky() {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#87CEEB");
  g.addColorStop(1, "#EAF8FF");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // clouds (simple moving blobs)
  const t = performance.now() * 0.02;
  ctx.globalAlpha = 0.95;
  ctx.fillStyle = "rgba(255,255,255,0.95)";
  for (let i = 0; i < 7; i++) {
    const x = (i * 260 + (t % 260)) - 120;
    const y = 60 + (i % 3) * 34;

    ctx.beginPath();
    ctx.ellipse(x, y, 46, 24, 0, 0, Math.PI * 2);
    ctx.ellipse(x + 44, y + 6, 34, 18, 0, 0, Math.PI * 2);
    ctx.ellipse(x + 18, y - 10, 30, 18, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// -------------------- Drawing: platforms look like grass --------------------
function drawPlatform(p) {
  // top grass layer with shine
  const topG = ctx.createLinearGradient(0, p.y, 0, p.y + p.h);
  topG.addColorStop(0, "#48d27a");
  topG.addColorStop(1, "#2faa60");
  ctx.fillStyle = topG;
  ctx.fillRect(p.x, p.y, p.w, p.h);

  // shine highlight strip
  ctx.fillStyle = "rgba(255,255,255,0.22)";
  ctx.fillRect(p.x, p.y, p.w, 6);

  // grass blades (tiny lines)
  ctx.strokeStyle = "rgba(255,255,255,0.10)";
  ctx.lineWidth = 1;
  for (let x = p.x; x < p.x + p.w; x += 14) {
    ctx.beginPath();
    ctx.moveTo(x, p.y + 10);
    ctx.lineTo(x + 3, p.y + 2);
    ctx.stroke();
  }

  // dirt face (depth shading)
  const depth = 120;
  const dirtG = ctx.createLinearGradient(0, p.y + p.h, 0, p.y + p.h + depth);
  dirtG.addColorStop(0, "#2e7d52");
  dirtG.addColorStop(1, "#1f5a3a");
  ctx.fillStyle = dirtG;
  ctx.fillRect(p.x, p.y + p.h, p.w, depth);

  // shadow under lip
  ctx.fillStyle = "rgba(0,0,0,0.12)";
  ctx.fillRect(p.x, p.y + p.h, p.w, 10);
}

// -------------------- Crates (standable) --------------------
function drawCrate(c) {
  // shadow
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.beginPath();
  ctx.ellipse(c.x + c.w / 2, c.y + c.h + 10, c.w * 0.42, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // box
  const g = ctx.createLinearGradient(0, c.y, 0, c.y + c.h);
  g.addColorStop(0, "#b06a35");
  g.addColorStop(1, "#7b4524");
  ctx.fillStyle = g;
  ctx.fillRect(c.x, c.y, c.w, c.h);

  ctx.fillStyle = "rgba(255,255,255,0.16)";
  ctx.fillRect(c.x, c.y, c.w, 6);

  ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.fillRect(c.x, c.y + c.h - 8, c.w, 8);
}

// -------------------- Car: preserve ratio + touch ground --------------------
function drawCar() {
  const baseY = goalPlatformTopY; // top of last platform
  const targetW = 160;

  if (carReady && carImg.naturalWidth > 0) {
    const ratio = carImg.naturalWidth / carImg.naturalHeight;
    const drawW = targetW;
    const drawH = drawW / ratio;

    // push down to compensate for transparent padding
    const x = Math.round(goalX);
    const y = Math.round(baseY - drawH + CAR_GROUND_CONTACT_OFFSET);

    // shadow ON platform top
    ctx.fillStyle = "rgba(0,0,0,0.20)";
    ctx.beginPath();
    ctx.ellipse(x + drawW / 2, baseY + 10, drawW * 0.42, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(carImg, x, y, Math.round(drawW), Math.round(drawH));
  } else {
    ctx.fillStyle = "#FFB6C1";
    ctx.fillRect(goalX, baseY - 90, targetW, 90);
  }
}

// -------------------- Player: NEVER squish (height is master) --------------------
function drawPlayer() {
  // shadow
  ctx.fillStyle = "rgba(0,0,0,0.22)";
  ctx.beginPath();
  ctx.ellipse(player.x + player.w / 2, player.y + player.h + 10, player.w * 0.40, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  if (!playerReady || playerImg.naturalWidth === 0) {
    ctx.fillStyle = "#ff4d6d";
    ctx.fillRect(player.x, player.y, player.w, player.h);
    return;
  }

  const ratio = playerImg.naturalWidth / playerImg.naturalHeight;

  // lock height; width follows ratio -> cannot squish
  const drawH = Math.round(player.h * PLAYER_SPRITE_SCALE);
  const drawW = Math.round(drawH * ratio);

  // center sprite on collider
  const x = Math.round(player.x + player.w / 2 - drawW / 2);
  const y = Math.round(player.y + player.h - drawH + PLAYER_FOOT_CONTACT_OFFSET);

  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(playerImg, x, y, drawW, drawH);
}

// -------------------- Game loop --------------------
let finished = false;
let last = performance.now();

function update(dt) {
  if (finished) return;

  // left/right
  if (keys.left) player.vx = -moveSpeed;
  else if (keys.right) player.vx = moveSpeed;
  else player.vx *= 0.85;

  // jump
  if (keys.jump && player.grounded) {
    player.vy = -jumpVelocity;
    player.grounded = false;
  }

  // gravity
  player.vy += gravity * dt;

  // integrate
  player.x += player.vx * dt;
  player.y += player.vy * dt;

  // stand checks
  player.grounded = false;
  for (const p of platforms) standOn(p);
  for (const c of crates) standOn(c);

  // fall reset
  if (player.y > H + 260) {
    respawn();
    return;
  }

  // camera follow
  cameraX = lerp(cameraX, player.x - 160, 0.12);

  // progress
  const prog = Math.max(0, Math.min(1, player.x / goalX));
  progressFill.style.width = (prog * 100).toFixed(0) + "%";
  percentEl.textContent = Math.floor(prog * 100) + "%";

  // win zone near car
  const playerBox = { x: player.x, y: player.y, w: player.w, h: player.h };
  const carBox = { x: goalX + 10, y: goalPlatformTopY - 160, w: 160, h: 200 };

  if (overlap(playerBox, carBox)) {
    finished = true;
    winBox.classList.remove("hidden");
  }
}

function draw() {
  ctx.clearRect(0, 0, W, H);

  // draw sky first
  drawSky();

  ctx.save();
  ctx.translate(-cameraX, 0);

  // IMPORTANT: pits are “nothing” -> we intentionally do NOT draw them.
  // Since the sky is already drawn, gaps show sky color automatically.

  // platforms + crates
  for (const p of platforms) drawPlatform(p);
  for (const c of crates) drawCrate(c);

  // goal + player
  drawCar();
  drawPlayer();

  ctx.restore();
}

function loop(now) {
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;

  update(dt);
  draw();

  requestAnimationFrame(loop);
}

// continue
continueBtn.addEventListener("click", () => {
  window.location.href = "cargame.html";
});

// start
resize();
requestAnimationFrame(loop);