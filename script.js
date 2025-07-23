// Config
let N = 2;
const TURNS = 15;
const COLORS = ["#f94144", "#90be6d", "#577590"];
const SHAPES = ["star", "rectangle", "square", "circle", "triangle", "kite"];
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

// State
let sequence = [];
let turn = 0;
let responses = [];
let pending = [false, false, false, false];
let intervalId = null;
let acceptingInput = false;
let lockInputTimeoutId = null;

// DOM
const gridEl = document.getElementById("grid");
const resultEl = document.getElementById("result");
const btns = [
  document.getElementById("pos-btn"),
  document.getElementById("col-btn"),
  document.getElementById("shape-btn"),
  document.getElementById("sound-btn")
];
const progressBar = document.getElementById("progress-bar");
const nBackSelect = document.getElementById("nback-level");
const nBackSpan = document.getElementById("nback-span");

// Utility
function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomStimulus() {
  return {
    position: Math.floor(Math.random() * 9),
    color: getRandom(COLORS),
    shape: getRandom(SHAPES),
    letter: ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
  };
}

// Draw grid and highlight current stimulus
function drawGrid(stimulus) {
  gridEl.innerHTML = "";
  for (let i = 0; i < 9; i++) {
    const cell = document.createElement("div");
    cell.className = "grid-cell";
    if (stimulus && stimulus.position === i) {
      cell.classList.add("active");
      cell.appendChild(drawShape(stimulus.color, stimulus.shape));
    }
    gridEl.appendChild(cell);
  }
}

// Shapes SVGs
function drawShape(color, shape) {
  const size = 46;
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("width", size);
  svg.setAttribute("height", size);

  if (shape === "star") {
    svg.innerHTML = `<polygon points="23,4 28,18 43,18 31,27 35,42 23,33 11,42 15,27 3,18 18,18" fill="${color}"/>`;
  }
  else if (shape === "rectangle") {
    svg.innerHTML = `<rect x="6" y="16" width="34" height="18" rx="4" fill="${color}"/>`;
  }
  else if (shape === "square") {
    svg.innerHTML = `<rect x="10" y="10" width="26" height="26" fill="${color}"/>`;
  }
  else if (shape === "circle") {
    svg.innerHTML = `<circle cx="23" cy="23" r="18" fill="${color}"/>`;
  }
  else if (shape === "triangle") {
    svg.innerHTML = `<polygon points="23,8 42,38 4,38" fill="${color}"/>`;
  }
  else if (shape === "kite") {
    svg.innerHTML = `<polygon points="23,5 36,23 23,41 10,23" fill="${color}"/>`;
  }
  return svg;
}

// Letter audio via SpeechSynthesis
function speakLetter(letter) {
  if ('speechSynthesis' in window) {
    const utter = new SpeechSynthesisUtterance(letter);
    utter.lang = "en-US";
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  }
}

// Button event handlers
btns.forEach((btn, i) => {
  btn.addEventListener("click", () => {
    if (!acceptingInput) return;
    pending[i] = !pending[i];
    btn.classList.remove("match-correct","match-wrong");
    btn.classList.add("clicked");
    btn.classList.toggle("selected", pending[i]);
    setTimeout(() => btn.classList.remove("clicked"), 300);
    // Show correctness feedback for this button
    if (turn > N) {
      const curr = sequence[turn-1];
      const prev = sequence[turn-1-N];
      let isCorrect = false;
      if (i===0) isCorrect = curr.position === prev.position;
      if (i===1) isCorrect = curr.color === prev.color;
      if (i===2) isCorrect = curr.shape === prev.shape;
      if (i===3) isCorrect = curr.letter === prev.letter;
      if (pending[i]) {
        btn.classList.add(isCorrect ? "match-correct" : "match-wrong");
        setTimeout(() => btn.classList.remove("match-correct","match-wrong"), 900);
      }
    }
  });
});

function clearAllButtonStates() {
  btns.forEach(btn => {
    btn.classList.remove("selected");
    btn.classList.remove("match-correct");
    btn.classList.remove("match-wrong");
  });
}

// Progress bar update
function updateProgressBar(turn) {
  const percent = ((turn) / TURNS) * 100;
  progressBar.style.width = percent + "%";
}

function nextTurn() {
  // Store responses of previous turn
  if (turn > 0) {
    responses.push([...pending]);
    pending = [false, false, false, false];
    clearAllButtonStates();
  }
  if (turn >= TURNS) {
    clearInterval(intervalId);
    acceptingInput = false;
    finish();
    return;
  }
  updateProgressBar(turn);
  let stim = sequence[turn];
  drawGrid(stim);
  speakLetter(stim.letter);
  acceptingInput = true;
  lockInputTimeoutId = setTimeout(() => {
    acceptingInput = false;
    clearAllButtonStates();
  }, 2500);
  turn++;
}

function finish() {
  // Lock in last responses (after turn TURNS)
  responses.push([...pending]);
  // Calculate separate scores
  let shapeScore = 0, posScore = 0, colorScore = 0, audioScore = 0;
  for (let i = N; i < sequence.length; i++) {
    const prev = sequence[i - N];
    const curr = sequence[i];
    const resp = responses[i - 1] || [false, false, false, false];
    // 0=pos, 1=color, 2=shape, 3=audio
    if (curr.position === prev.position && resp[0]) posScore++;
    if (curr.position !== prev.position && !resp[0]) posScore++;
    if (curr.color === prev.color && resp[1]) colorScore++;
    if (curr.color !== prev.color && !resp[1]) colorScore++;
    if (curr.shape === prev.shape && resp[2]) shapeScore++;
    if (curr.shape !== prev.shape && !resp[2]) shapeScore++;
    if (curr.letter === prev.letter && resp[3]) audioScore++;
    if (curr.letter !== prev.letter && !resp[3]) audioScore++;
  }
  resultEl.innerHTML = `
    <h2>Your Scores</h2>
    <p>Shape: <b>${shapeScore} / ${(sequence.length-N)}</b></p>
    <p>Position: <b>${posScore} / ${(sequence.length-N)}</b></p>
    <p>Color: <b>${colorScore} / ${(sequence.length-N)}</b></p>
    <p>Audio: <b>${audioScore} / ${(sequence.length-N)}</b></p>
    <p style="margin-top:10px"><b>Total: ${shapeScore + posScore + colorScore + audioScore} / ${(sequence.length-N)*4}</b></p>
  `;
}

// N-back select handler
nBackSelect.addEventListener("change", (e) => {
  N = parseInt(e.target.value, 10);
  nBackSpan.textContent = N;
  restartGame();
});

// Ensure span matches N at first
nBackSpan.textContent = N;

function restartGame() {
  if (intervalId) clearInterval(intervalId);
  if (lockInputTimeoutId) clearTimeout(lockInputTimeoutId);
  sequence = [];
  for (let i = 0; i < TURNS + 4; i++) {
    sequence.push(randomStimulus());
  }
  turn = 0;
  responses = [];
  pending = [false, false, false, false];
  resultEl.innerHTML = "";
  updateProgressBar(0);
  drawGrid(sequence[0]);
  setTimeout(() => {
    nextTurn();
    intervalId = setInterval(nextTurn, 2500);
  }, 700);
}

// Start on load
window.onload = restartGame;
