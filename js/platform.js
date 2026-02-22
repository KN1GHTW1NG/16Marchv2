// platform.js — Portrait platform runner with jumpable pits + progress + pink win modal

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const progressFill = document.getElementById("progressFill");
const percentEl = document.getElementById("percent");

const leftBtn = document.getElementById("leftBtn");
const rightBtn = document.getElementById("rightBtn");
const jumpBtn = document.getElementById("jumpBtn");

const winBox = document.getElementById("winBox");
const continueBtn = document.getElementById("continueBtn");

// -------------------- HiDPI portrait sizing --------------------
let W = 0, H = 0, DPR = 1;

function resize() {
  DPR = Math.max(1, Math.min(3, window.devicePixelRatio || 1));

  // Fill phone screen nicely (portrait)
  const cssW = Math.min(430, window.innerWidth - 20);
  const cssH = Math.min(window.innerHeight * 0.78, 820);

  canvas.style.width = cssW + "px";
  canvas.style.height = cssH + "px";

  canvas.width = Math.round(cssW * DPR);
  canvas.height = Math.round(cssH * DPR);

  W = cssW;
  H = cssH;

  // draw in CSS pixels
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
}
window.addEventListener("resize", () => {
  resize();
  buildLevel();        // rebuild platforms to new size
  clampPlayerToGround();
});

// -------------------- Tiny click sound (buttons) --------------------
let audioCtx;
function clickSound(){
  try{
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const t = audioCtx.currentTime;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = "square";
    o.frequency.setValueAtTime(520, t);
    o.frequency.exponentialRampToValueAtTime(320, t+0.04);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.10, t+0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t+0.07);
    o.connect(g); g.connect(audioCtx.destination);
    o.start(t); o.stop(t+0.08);
  } catch(e){}
}

// -------------------- Physics --------------------
const gravity = 2300;      // px/s^2
const moveSpeed = 330;     // px/s
const jumpVelocity = 820;  // px/s (upwards)

const frictionGround = 0.86;
const airControl = 0.65;

const keys = { left:false, right:false, jump:false };

// Player box is logical collider; sprite scales independently (for anti-crop)
const player = {
  x: 90,
  y: 0,
  w: 54 * 1.5,    // ~50% bigger collider than old
  h: 78 * 1.5,
  vx: 0,
  vy: 0,
  grounded: false
};

// Images (LOCAL PATHS ✅)
const playerImg = new Image();
playerImg.src = "assets/IMG_2114.png";
let playerReady = false;
playerImg.onload = () => (playerReady = true);

const carImg = new Image();
carImg.src = "assets/IMG_2121.png";
let carReady = false;
carImg.onload = () => (carReady = true);

// -------------------- Level geometry --------------------
let groundY = 0;

// Platforms are ground segments with gaps (pits) between them
let platforms = []; // {x, w}
let levelStartX = 0;
let levelEndX = 0;

// Goal car
const goal = {
  x: 0,
  y: 0,
  w: 120,
  h: 80
};

// Compute a jumpable gap size
function maxJumpableGap() {
  // Conservative jump distance:
  // time in air roughly ~ (2 * jumpVelocity / gravity)
  const tAir = (2 * jumpVelocity) / gravity;
  const horiz = moveSpeed * tAir * 0.78; // 0.78 safety factor
  return Math.max(140, Math.min(220, horiz)); // clamp to a nice range
}

function buildLevel() {
  groundY = H - 160;

  const gap = Math.round(maxJumpableGap() * 0.78); // guaranteed jumpable
  const seg = 280;                                 // platform segment width
  const startPad = 120;

  platforms = [];
  let x = 0;

  // Build 6 pits (7 platforms) — all jumpable
  // You can tweak counts later.
  platforms.push({ x: x, w: seg + startPad });      x += seg + startPad;
  x += gap;

  platforms.push({ x: x, w: seg });                 x += seg;
  x += gap;

  platforms.push({ x: x, w: seg });                 x += seg;
  x += gap;

  platforms.push({ x: x, w: seg });                 x += seg;
  x += gap;

  platforms.push({ x: x, w: seg });                 x += seg;
  x += gap;

  platforms.push({ x: x, w: seg });                 x += seg;
  x += gap;

  platforms.push({ x: x, w: seg + 220 });           x += seg + 220;

  levelStartX = 0;
  levelEndX = x;

  // Place goal car near end, sitting on ground
  goal.w = 140;
  goal.h = 90;
  goal.x = levelEndX - 190;
  goal.y = groundY - goal.h;

  clampPlayerToGround();
}

function clampPlayerToGround() {
  // spawn on first platform
  player.x = 90;
  player.y = groundY - player.h;
  player.vx = 0;
  player.vy = 0;
  player.grounded = true;
}

// -------------------- Controls: keyboard + D-pad + swipe --------------------
document.addEventListener("keydown", (e) => {
  const k = e.key;
  if (k === "ArrowLeft" || k === "a" || k === "A") keys.left = true;
  if (k === "ArrowRight"|| k === "d" || k === "D") keys.right = true;
  if (k === "ArrowUp" || k === " " ) keys.jump = true;
});

document.addEventListener("keyup", (e) => {
  const k = e.key;
  if (k === "ArrowLeft" || k === "a" || k === "A") keys.left = false;
  if (k === "ArrowRight"|| k === "d" || k === "D") keys.right = false;
  if (k === "ArrowUp" || k === " " ) keys.jump = false;
});

// D-pad press-and-hold (better on phone)
function bindHold(btn, downFn, upFn){
  if(!btn) return;
  btn.addEventListener("pointerdown", (e)=>{ e.preventDefault(); clickSound(); downFn(); });
  btn.addEventListener("pointerup",   (e)=>{ e.preventDefault(); upFn(); });
  btn.addEventListener("pointercancel",(e)=>{ e.preventDefault(); upFn(); });
  btn.addEventListener("pointerleave",(e)=>{ e.preventDefault(); upFn(); });
}

bindHold(leftBtn,  ()=>{ keys.left = true; }, ()=>{ keys.left = false; });
bindHold(rightBtn, ()=>{ keys.right = true; }, ()=>{ keys.right = false; });

if (jumpBtn){
  jumpBtn.addEventListener("pointerdown", (e)=>{
    e.preventDefault();
    clickSound();
    // immediate jump tap feels better
    if (player.grounded) {
      player.vy = -jumpVelocity;
      player.grounded = false;
    }
  });
}

// Optional swipe jump/left/right on canvas (nice on iPhone)
let startX = null, startY = null;
canvas.addEventListener("pointerdown", (e)=>{ startX = e.clientX; startY = e.clientY; });
canvas.addEventListener("pointerup", (e)=>{
  if(startX == null) return;
  const dx = e.clientX - startX;
  const dy = e.clientY - startY;
  startX = startY = null;

  if (Math.abs(dy) > Math.abs(dx) && dy < -30) {
    // swipe up = jump
    if (player.grounded) { player.vy = -jumpVelocity; player.grounded = false; clickSound(); }
    return;
  }
  if (Math.abs(dx) < 28) return;
  if (dx < 0) { keys.left = true; keys.right = false; setTimeout(()=>keys.left=false, 120); clickSound(); }
  else        { keys.right = true; keys.left = false; setTimeout(()=>keys.right=false,120); clickSound(); }
});

// -------------------- Camera + UI progress --------------------
let cameraX = 0;

function updateProgress(){
  const p = clamp((player.x - levelStartX) / (goal.x - levelStartX), 0, 1);
  progressFill.style.width = (p * 100).toFixed(0) + "%";
  percentEl.textContent = Math.floor(p * 100) + "%";
}

// -------------------- Collision helpers --------------------
function isStandingOnPlatform(px, pw) {
  // player feet within platform range + at ground line
  return (
    player.x + player.w > px &&
    player.x < px + pw
  );
}

function rectOverlap(a, b){
  return !(
    a.x + a.w <= b.x ||
    a.x >= b.x + b.w ||
    a.y + a.h <= b.y ||
    a.y >= b.y + b.h
  );
}

// -------------------- Drawing (no halo/crop) --------------------
function drawSky(){
  // blue sky
  const g = ctx.createLinearGradient(0,0,0,H);
  g.addColorStop(0, "#87CEEB");
  g.addColorStop(1, "#EAF8FF");
  ctx.fillStyle = g;
  ctx.fillRect(0,0,W,H);

  // clouds
  ctx.globalAlpha = 0.92;
  ctx.fillStyle = "rgba(255,255,255,.95)";
  for(let i=0;i<6;i++){
    const x = (i*220 + (performance.now()*0.02)%220) - 90;
    const y = 60 + (i%3)*34;
    ctx.beginPath();
    ctx.ellipse(x, y, 46, 24, 0, 0, Math.PI*2);
    ctx.ellipse(x+46, y+6, 34, 18, 0, 0, Math.PI*2);
    ctx.ellipse(x+18, y-10, 32, 18, 0, 0, Math.PI*2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawGroundAndPits(){
  // draw platforms as grass blocks with depth shading
  for (const p of platforms){
    // top grass
    ctx.fillStyle = "#3CB371";
    ctx.fillRect(p.x, groundY, p.w, H - groundY);

    // darker dirt depth strip
    ctx.fillStyle = "#2E8B57";
    ctx.fillRect(p.x, groundY + 24, p.w, H - (groundY + 24));

    // highlight edge on top
    ctx.fillStyle = "rgba(255,255,255,0.18)";
    ctx.fillRect(p.x, groundY, p.w, 6);
  }
}

function drawGoalCar(){
  const x = goal.x;
  const y = goal.y;

  // shadow
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = "rgba(0,0,0,.8)";
  ctx.beginPath();
  ctx.ellipse(x + goal.w/2, y + goal.h + 10, goal.w*0.42, 10, 0, 0, Math.PI*2);
  ctx.fill();
  ctx.globalAlpha = 1;

  if (carReady){
    // prevent halo: snap to pixels + no smoothing
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(carImg, Math.round(x), Math.round(y), goal.w, goal.h);
  } else {
    ctx.fillStyle = "#FFB6C1";
    ctx.fillRect(x, y, goal.w, goal.h);
  }
}

function drawPlayerSprite(){
  // no halo: integer snapping + smoothing off
  ctx.imageSmoothingEnabled = false;

  // preserve aspect ratio and scale ~50% bigger already via collider
  const ratio = (playerReady && playerImg.height) ? (playerImg.width / playerImg.height) : (player.w / player.h);

  // We draw the sprite slightly larger than collider for “hero” feel
  const scale = 1.12;

  let drawH = player.h * scale;
  let drawW = drawH * ratio;

  // Keep within reasonable width so it doesn't look weird
  const maxW = player.w * 1.35;
  if (drawW > maxW){
    drawW = maxW;
    drawH = drawW / ratio;
  }

  // Center sprite over collider
  const x = Math.round(player.x + player.w/2 - drawW/2);
  const y = Math.round(player.y + player.h - drawH);

  // subtle shadow
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = "rgba(0,0,0,.75)";
  ctx.beginPath();
  ctx.ellipse(player.x + player.w/2, player.y + player.h + 8, player.w*0.38, 8, 0, 0, Math.PI*2);
  ctx.fill();
  ctx.globalAlpha = 1;

  if (playerReady){
    ctx.drawImage(playerImg, x, y, Math.round(drawW), Math.round(drawH));
  } else {
    ctx.fillStyle = "#ff4d6d";
    ctx.fillRect(player.x, player.y, player.w, player.h);
  }
}

// -------------------- Game loop --------------------
let last = performance.now();
let finished = false;

function update(dt){
  if (finished) return;

  // input -> acceleration
  const moving = (keys.left ? -1 : 0) + (keys.right ? 1 : 0);

  if (player.grounded){
    if (moving !== 0) player.vx = moving * moveSpeed;
    else player.vx *= frictionGround;
  } else {
    // air control
    if (moving !== 0) player.vx = lerp(player.vx, moving * moveSpeed, airControl * dt * 8);
  }

  // jump (keyboard)
  if (keys.jump && player.grounded){
    player.vy = -jumpVelocity;
    player.grounded = false;
  }

  // gravity
  player.vy += gravity * dt;

  // integrate
  player.x += player.vx * dt;
  player.y += player.vy * dt;

  // platform collision (only vertical, for clean behavior)
  player.grounded = false;

  // If player is at/below groundY, only allow standing if over a platform segment
  if (player.y + player.h >= groundY){
    // check if feet are over any platform segment
    let onAny = false;
    for (const p of platforms){
      if (isStandingOnPlatform(p.x, p.w)){
        onAny = true;
        break;
      }
    }
    if (onAny && player.vy >= 0){
      player.y = groundY - player.h;
      player.vy = 0;
      player.grounded = true;
    }
  }

  // falling into pit -> respawn (gentle)
  if (player.y > H + 240){
    clampPlayerToGround();
    cameraX = 0;
  }

  // camera follow
  cameraX = lerp(cameraX, player.x - 160, 0.12);

  // progress bar
  updateProgress();

  // win check: overlap with goal zone
  const playerBox = { x: player.x, y: player.y, w: player.w, h: player.h };
  const goalBox   = { x: goal.x+12, y: goal.y+8, w: goal.w-24, h: goal.h-10 };

  if (rectOverlap(playerBox, goalBox)){
    finished = true;
    // show pink modal (your CSS already makes it pink)
    winBox.classList.remove("hidden");
  }
}

function draw(){
  ctx.clearRect(0,0,W,H);

  drawSky();

  ctx.save();
  ctx.translate(-cameraX, 0);

  drawGroundAndPits();
  drawGoalCar();
  drawPlayerSprite();

  ctx.restore();
}

function loop(now){
  const dt = Math.min(0.033, (now - last)/1000);
  last = now;

  update(dt);
  draw();

  requestAnimationFrame(loop);
}

// Continue to car game
continueBtn.addEventListener("click", ()=>{
  clickSound();
  // go to next page in your story
  window.location.href = "cargame.html";
});

// -------------------- Utils --------------------
function clamp(v,a,b){ return Math.max(a, Math.min(b, v)); }
function lerp(a,b,t){ return a + (b-a)*t; }

// -------------------- Start --------------------
resize();
buildLevel();
updateProgress();
requestAnimationFrame(loop);
