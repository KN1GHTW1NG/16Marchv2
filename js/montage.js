const flip = document.getElementById("flip");
const flipInner = document.getElementById("flipInner");
const flipBtn = document.getElementById("flipBtn");
const backBtn = document.getElementById("backBtn");

const fx = document.getElementById("fx");

const noteImg = document.getElementById("noteImg");
const notePlaceholder = document.getElementById("notePlaceholder");
const downloadBtn = document.getElementById("downloadBtn");

// ✅ SET THIS LATER when you upload your handwritten note image:
// Example: "assets/handnote.png"
const NOTE_SRC = ""; // <-- put file path here later

// ----- Flip logic -----
flipBtn.addEventListener("click", () => {
  flip.classList.add("isFlipped");
});
backBtn.addEventListener("click", () => {
  flip.classList.remove("isFlipped");
});

// ----- Note wiring -----
function wireNote(){
  if (!NOTE_SRC) {
    // keep placeholder visible
    downloadBtn.classList.add("disabled");
    downloadBtn.href = "#";
    return;
  }

  noteImg.src = NOTE_SRC;
  noteImg.style.display = "block";
  notePlaceholder.style.display = "none";

  // simple download (same-origin assets)
  downloadBtn.href = NOTE_SRC;
  downloadBtn.setAttribute("download", "note.png");
}
wireNote();

// ----- Continuous confetti + petals -----
const confettiColors = [
  "#FFB6C1","#F8C8DC","#AA336A",
  "#FFD166","#06D6A0","#118AB2",
  "#EF476F","#8338EC","#FFBE0B"
];

function spawnConfettiBurst(){
  // small burst from random x near top
  const burstX = Math.random() * window.innerWidth;
  const count = 12 + Math.floor(Math.random()*10);

  for(let i=0;i<count;i++){
    const b = document.createElement("div");
    b.className = "bit";
    b.style.background = confettiColors[Math.floor(Math.random()*confettiColors.length)];
    b.style.left = (burstX + (Math.random()*120 - 60)) + "px";
    b.style.top = (-20) + "px";

    const dur = 1.1 + Math.random()*0.9;
    b.style.animationDuration = dur + "s";

    // sideways drift via CSS transform in keyframes: we fake it using translateX by setting margin-left-ish (works fine)
    b.style.transform = `rotate(${Math.random()*180}deg)`;

    fx.appendChild(b);
    setTimeout(()=> b.remove(), (dur*1000) + 200);
  }
}

function spawnPetal(){
  const p = document.createElement("div");
  p.className = "petal";
  p.style.left = (Math.random() * window.innerWidth) + "px";
  p.style.top = (-80) + "px";
  const dur = 5.2 + Math.random()*3.2;
  p.style.animationDuration = dur + "s";
  p.style.opacity = (0.45 + Math.random()*0.25).toFixed(2);

  fx.appendChild(p);
  setTimeout(()=> p.remove(), (dur*1000) + 300);
}

// Timers tuned for “continuous but not chaotic”
setInterval(spawnConfettiBurst, 520); // confetti loop
setInterval(spawnPetal, 430);         // petals loop