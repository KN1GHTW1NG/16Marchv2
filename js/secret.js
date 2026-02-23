// secret.js
const toast = document.getElementById("toast");
const toastTitle = document.getElementById("toastTitle");
const toastText = document.getElementById("toastText");
const toastBtn = document.getElementById("toastBtn");

const continueBtn = document.getElementById("continueBtn");
const statusText = document.getElementById("statusText");

const NEXT_URL = "montage.html"; // change if needed

toastBtn.addEventListener("click", () => toast.classList.add("hidden"));

// ---------------- AUDIO (iOS-safe: unlock on tap) ----------------
let audioCtx = null;
function ensureAudio(){
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AC();
  }
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

function makeDistortionCurve(amount){
  const n = 44100;
  const curve = new Float32Array(n);
  const k = typeof amount === "number" ? amount : 50;
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1;
    curve[i] = ((3 + k) * x * 20 * Math.PI / 180) / (Math.PI + k * Math.abs(x));
  }
  return curve;
}

// Wrong buzzer
function playBuzzer(){
  const ctx = ensureAudio();
  const t0 = ctx.currentTime;

  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  osc1.type = "sawtooth";
  osc2.type = "square";

  osc1.frequency.setValueAtTime(170, t0);
  osc1.frequency.exponentialRampToValueAtTime(85, t0 + 0.18);

  osc2.frequency.setValueAtTime(120, t0);
  osc2.frequency.exponentialRampToValueAtTime(70, t0 + 0.18);

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(1600, t0);
  filter.frequency.exponentialRampToValueAtTime(700, t0 + 0.22);

  const waveShaper = ctx.createWaveShaper();
  waveShaper.curve = makeDistortionCurve(35);
  waveShaper.oversample = "4x";

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(0.35, t0 + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.22);

  osc1.connect(filter);
  osc2.connect(filter);
  filter.connect(waveShaper);
  waveShaper.connect(gain);
  gain.connect(ctx.destination);

  osc1.start(t0);
  osc2.start(t0);
  osc1.stop(t0 + 0.24);
  osc2.stop(t0 + 0.24);
}

// Correct tick
function playTick(){
  const ctx = ensureAudio();
  const t0 = ctx.currentTime;

  const o = ctx.createOscillator();
  o.type = "triangle";
  o.frequency.setValueAtTime(880, t0);
  o.frequency.exponentialRampToValueAtTime(1320, t0 + 0.08);

  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(0.18, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.14);

  o.connect(g);
  g.connect(ctx.destination);

  o.start(t0);
  o.stop(t0 + 0.16);
}

// All-correct sparkle
function playSuccess(){
  const ctx = ensureAudio();
  const t0 = ctx.currentTime;

  const master = ctx.createGain();
  master.gain.setValueAtTime(0.0001, t0);
  master.gain.exponentialRampToValueAtTime(0.30, t0 + 0.02);
  master.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.70);
  master.connect(ctx.destination);

  const notes = [659.25, 783.99, 987.77, 1318.51];
  notes.forEach((f, i) => {
    const o = ctx.createOscillator();
    o.type = "triangle";
    const g = ctx.createGain();
    const start = t0 + i * 0.08;

    o.frequency.setValueAtTime(f, start);
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(0.20, start + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, start + 0.22);

    o.connect(g);
    g.connect(master);
    o.start(start);
    o.stop(start + 0.25);
  });
}

// ---------------- QUIZ LOGIC ----------------
const questions = Array.from(document.querySelectorAll(".q"));
const correctMap = {};   // qKey -> true/false selected correctly
const pickedMap = {};    // qKey -> button element picked

function shake(el){
  el.animate(
    [
      { transform: "translateX(0)" },
      { transform: "translateX(-7px)" },
      { transform: "translateX(7px)" },
      { transform: "translateX(0)" }
    ],
    { duration: 240, iterations: 1 }
  );
}

function updateContinue(){
  const total = questions.length;
  const answered = Object.keys(pickedMap).length;
  const allAnswered = answered === total;
  const allCorrect = allAnswered && Object.values(correctMap).every(Boolean);

  if (!allCorrect){
    continueBtn.disabled = true;
    continueBtn.classList.remove("ready");
    statusText.textContent = allAnswered
      ? "Almost. One (or more) answers are wrong 😼"
      : "Pick all 4 correct answers.";
    return;
  }

  continueBtn.disabled = false;
  continueBtn.classList.add("ready");
  statusText.textContent = "Unlocked 💗 Tap Continue to You.";
}

questions.forEach((q) => {
  const qKey = q.dataset.q;
  const opts = Array.from(q.querySelectorAll(".opt"));

  opts.forEach((btn) => {
    btn.addEventListener("click", () => {
      // iOS unlock audio on any tap
      ensureAudio();

      // If this question already locked correct, ignore further taps
      if (correctMap[qKey] === true) return;

      // Clear styles on all options in this question
      opts.forEach(o => o.classList.remove("selected", "wrong"));

      // Mark selection
      btn.classList.add("selected");
      pickedMap[qKey] = btn;

      const isCorrect = btn.dataset.correct === "true";
      correctMap[qKey] = isCorrect;

      if (!isCorrect){
        playBuzzer();
        btn.classList.add("wrong");
        shake(btn);

        toastTitle.textContent = "Nope 😼";
        toastText.textContent = "Not that one.\n\nTry again — you’ll know it when you see it 👀";
        toast.classList.remove("hidden");

        // keep it selectable again later (do NOT lock)
        updateContinue();
        return;
      }

      // Correct: lock the chosen option visually
      playTick();
      btn.classList.add("correct");

      // Disable other options for this question
      opts.forEach(o => {
        if (o !== btn) o.disabled = true;
      });

      // If all correct now: success sound once
      const total = questions.length;
      const answered = Object.keys(pickedMap).length;
      const allAnswered = answered === total;
      const allCorrect = allAnswered && Object.values(correctMap).every(Boolean);
      if (allCorrect) playSuccess();

      updateContinue();
    });
  });
});

// Continue behavior
continueBtn.addEventListener("click", () => {
  ensureAudio();
  if (continueBtn.disabled) {
    playBuzzer();
    shake(continueBtn);
    return;
  }
  window.location.href = NEXT_URL;
});

// Initial
updateContinue();