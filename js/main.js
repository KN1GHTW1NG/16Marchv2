// --- tiny click sound (iPhone requires user gesture; button click counts) ---
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
  }catch(e){}
}

function go(url){
  clickSound();
  setTimeout(()=> window.location.href = url, 120);
}

// Page 1 buttons
const yesBtn = document.getElementById("yesBtn");
const noBtn  = document.getElementById("noBtn");
if (yesBtn) yesBtn.addEventListener("click", ()=> go("platform.html"));
if (noBtn)  noBtn.addEventListener("click",  ()=> go("no.html"));

// Page 2 buttons
const comebackBtn = document.getElementById("comebackBtn");
const retryBtn = document.getElementById("retryBtn");
if (comebackBtn) comebackBtn.addEventListener("click", ()=> go("index.html"));
if (retryBtn) retryBtn.addEventListener("click", ()=> go("index.html"));
