const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const progressFill = document.getElementById("progressFill");
const percentEl = document.getElementById("percent");

const leftBtn = document.getElementById("leftBtn");
const rightBtn = document.getElementById("rightBtn");
const jumpBtn = document.getElementById("jumpBtn");

const winBox = document.getElementById("winBox");
const continueBtn = document.getElementById("continueBtn");

let W,H;

function resize(){
  const cssW = Math.min(420, window.innerWidth-20);
  const cssH = window.innerHeight*0.75;

  canvas.width = cssW;
  canvas.height = cssH;

  W = cssW;
  H = cssH;

  groundY = H - 140;
}
window.addEventListener("resize", resize);
resize();


// ---------------- IMAGES ----------------
const playerImg = new Image();
playerImg.src = "assets/IMG_2114.png";

const carImg = new Image();
carImg.src = "assets/IMG_2121.png";

let carHeight = 100;

carImg.onload = () => {
  const scale = 150 / carImg.width;
  carHeight = carImg.height * scale;
};


// ---------------- PHYSICS ----------------
const gravity = 2000;
const speed = 350;
const jumpPower = 900;

const player = {
  x: 80,
  y: 0,
  w: 90,    // bigger
  h: 130,
  vx: 0,
  vy: 0,
  grounded:false
};

let groundY = H - 140;


// ---------------- LEVEL ----------------
let platforms = [];
let crates = [];
let goalX = 2400;

function buildLevel(){
  platforms = [
    {x:0, y:groundY, w:500, h:40},
    {x:700, y:groundY-80, w:200, h:40},   // elevated ledge
    {x:1100, y:groundY, w:400, h:40},
    {x:1700, y:groundY-100, w:220, h:40}, // higher ledge
    {x:2100, y:groundY, w:500, h:40}
  ];

  crates = [
    {x:820, y:groundY-130, w:60, h:60},
    {x:1200, y:groundY-60, w:60, h:60},
    {x:1820, y:groundY-160, w:60, h:60}
  ];
}
buildLevel();


// ---------------- CONTROLS ----------------
const keys = {};

document.addEventListener("keydown", e=>{
  if(e.key==="ArrowLeft"||e.key==="a") keys.left=true;
  if(e.key==="ArrowRight"||e.key==="d") keys.right=true;
  if(e.key==="ArrowUp"||e.key===" ") keys.jump=true;
});

document.addEventListener("keyup", e=>{
  if(e.key==="ArrowLeft"||e.key==="a") keys.left=false;
  if(e.key==="ArrowRight"||e.key==="d") keys.right=false;
  if(e.key==="ArrowUp"||e.key===" ") keys.jump=false;
});

leftBtn.onpointerdown=()=>keys.left=true;
leftBtn.onpointerup=()=>keys.left=false;

rightBtn.onpointerdown=()=>keys.right=true;
rightBtn.onpointerup=()=>keys.right=false;

jumpBtn.onpointerdown=()=>{
  if(player.grounded){
    player.vy = -jumpPower;
    player.grounded = false;
  }
};


// ---------------- GAME LOOP ----------------
let cameraX = 0;

function update(dt){

  // Horizontal movement
  if(keys.left) player.vx = -speed;
  else if(keys.right) player.vx = speed;
  else player.vx *= 0.85;

  // Jump
  if(keys.jump && player.grounded){
    player.vy = -jumpPower;
    player.grounded = false;
  }

  player.vy += gravity*dt;

  player.x += player.vx*dt;
  player.y += player.vy*dt;

  player.grounded = false;

  // Platform collisions
  for(let p of platforms){
    if(player.x + player.w > p.x &&
       player.x < p.x + p.w &&
       player.y + player.h > p.y &&
       player.y + player.h < p.y + 50 &&
       player.vy >= 0){

        player.y = p.y - player.h;
        player.vy = 0;
        player.grounded = true;
    }
  }

  // Crate collisions (standable)
  for(let c of crates){
    if(player.x + player.w > c.x &&
       player.x < c.x + c.w &&
       player.y + player.h > c.y &&
       player.y + player.h < c.y + 50 &&
       player.vy >= 0){

        player.y = c.y - player.h;
        player.vy = 0;
        player.grounded = true;
    }
  }

  // Falling reset
  if(player.y > H + 200){
    player.x = 80;
    player.y = 0;
    player.vy = 0;
  }

  // Win
  if(player.x > goalX){
    winBox.classList.remove("hidden");
  }

  // Progress
  const progress = Math.min(player.x/goalX,1);
  progressFill.style.width = (progress*100)+"%";
  percentEl.textContent = Math.floor(progress*100)+"%";

  cameraX = player.x - 150;
}

function draw(){
  ctx.clearRect(0,0,W,H);

  ctx.save();
  ctx.translate(-cameraX,0);

  // Sky
  ctx.fillStyle="#87CEEB";
  ctx.fillRect(0,0,4000,H);

  // Platforms
  ctx.fillStyle="#3CB371";
  for(let p of platforms){
    ctx.fillRect(p.x,p.y,p.w,p.h);
  }

  // Crates
  ctx.fillStyle="#8B4513";
  for(let c of crates){
    ctx.fillRect(c.x,c.y,c.w,c.h);
  }

  // Car (fixed ratio)
  if(carImg.complete){
    ctx.drawImage(carImg, goalX, groundY-carHeight, 150, carHeight);
  }

  // Player
  if(playerImg.complete){
    ctx.drawImage(playerImg, player.x, player.y, player.w, player.h);
  }

  ctx.restore();
}

let last=performance.now();
function loop(now){
  const dt=(now-last)/1000;
  last=now;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

continueBtn.onclick=()=>window.location.href="cargame.html";