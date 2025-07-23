// Config
const N = 2;
const TURNS = 21;
const COLORS = ["#f94144", "#90be6d", "#577590"];
const PIECES = ["pawn", "rook", "bishop", "knight", "queen", "king"];
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

// State
let sequence = [];
let turn = 0;
let responses = [];
let pending = [false, false, false, false];
let intervalId = null;

// DOM
const gridEl = document.getElementById("grid");
const turnLabel = document.getElementById("turn-label");
const resultEl = document.getElementById("result");
const letterBox = document.getElementById("letter-box");
const btns = [
  document.getElementById("pos-btn"),
  document.getElementById("col-btn"),
  document.getElementById("shape-btn"),
  document.getElementById("sound-btn")
];

// Utility
function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomStimulus() {
  return {
    position: Math.floor(Math.random() * 9),
    color: getRandom(COLORS),
    shape: getRandom(PIECES),
    letter: ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
  };
}

// Draw grid and highlight current stimulus
function drawGrid(stimulus) {
  gridEl.innerHTML = "";
  for (let i = 0; i < 9; i++) {
    const cell = document.createElement("div");
    cell.className = "grid-cell";
    if (stimulus.position === i) {
      cell.appendChild(drawPiece(stimulus.color, stimulus.shape));
    }
    gridEl.appendChild(cell);
  }
}

// Chess piece SVGs
function drawPiece(color, piece) {
  const size = 46;
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("width", size);
  svg.setAttribute("height", size);
  // All pieces are simple silhouettes, monochrome filled with color
  if (piece === "pawn") {
    svg.innerHTML = `<circle cx="23" cy="18" r="9" fill="${color}"/><rect x="16" y="27" width="14" height="12" rx="3" fill="${color}"/>`;
  }
  else if (piece === "rook") {
    svg.innerHTML = `<rect x="11" y="10" width="24" height="22" rx="2" fill="${color}"/><rect x="15" y="6" width="4" height="8" fill="${color}"/><rect x="27" y="6" width="4" height="8" fill="${color}"/><rect x="21" y="6" width="4" height="8" fill="${color}"/>`;
  }
  else if (piece === "bishop") {
    svg.innerHTML = `<ellipse cx="23" cy="18" rx="10" ry="16" fill="${color}"/><rect x="17" y="34" width="12" height="6" rx="3" fill="${color}"/><circle cx="23" cy="8" r="4" fill="${color}"/>`;
  }
  else if (piece === "knight") {
    svg.innerHTML = `<path d="M35 38 Q32 18 18 8 Q12 16 20 26 Q14 33 23 38 Z" fill="${color}"/><ellipse cx="20" cy="15" rx="2" ry="3" fill="#fff"/>`;
  }
  else if (piece === "queen") {
    svg.innerHTML = `<ellipse cx="23" cy="14" rx="12" ry="9" fill="${color}"/><rect x="13" y="22" width="20" height="12" rx="5" fill="${color}"/><circle cx="11" cy="10" r="3" fill="${color}"/><circle cx="23" cy="6" r="3" fill="${color}"/><circle cx="35" cy="10" r="3" fill="${color}"/>`;
  }
  else if (piece === "king") {
    svg.innerHTML = `<rect x="17" y="14" width="12" height="20" rx="4" fill="${color}"/><rect x="21" y="7" width="4" height="10" fill="${color}"/><rect x="19" y="10" width="8" height="4" fill="${color}"/>`;
  }
  return svg;
}

// Letter display and speech
function showAndSpeakLetter(letter) {
  letterBox.innerText = letter;
  // Speak
  if ('speechSynthesis' in window) {
    const utter = new SpeechSynthesisUtterance(letter);
    utter.lang = "en-US";
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  }
}

// Setup button handlers
btns.forEach((btn, i) => {
  btn.addEventListener("click", () => {
    pending[i] = true;
    btn.classList.add("clicked");
    setTimeout(() => btn.classList.remove("clicked"), 1000);
  });
});

function nextTurn() {
  if (turn > 0) {
    // Lock in previous responses
    responses.push([...pending]);
    pending = [false, false, false, false];
  }
  if (turn >= TURNS) {
    clearInterval(intervalId);
    finish();
    return;
  }
  turnLabel.textContent = `Turn: ${turn+1}/${TURNS+1}`;
  let stim = sequence[turn];
  drawGrid(stim);
  showAndSpeakLetter(stim.letter);
  turn++;
}

function finish() {
  // Lock in last responses (after turn TURNS)
  responses.push([...pending]);
  // Calculate score
  let score = 0;
  for (let i = N; i < sequence.length; i++) {
    const prev = sequence[i - N];
    const curr = sequence[i];
    const resp = responses[i - 1] || [false, false, false, false];
    const matches = [
      curr.position === prev.position,
      curr.color === prev.color,
      curr.shape === prev.shape,
      curr.letter === prev.letter
    ];
    for (let j = 0; j < 4; j++) {
      if (matches[j] && resp[j]) score++;
      if (!matches[j] && !resp[j]) score++;
    }
  }
  resultEl.innerHTML = `<h2>Your Score</h2><p>${score} / ${(sequence.length-N)*4}</p>`;
  letterBox.innerText = "";
}

function startGame() {
  // Initialize
  sequence = [randomStimulus()];
  for (let i = 1; i < TURNS + 1; i++) {
    sequence.push(randomStimulus());
  }
  turn = 0;
  responses = [];
  pending = [false, false, false, false];
  resultEl.innerHTML = "";
  letterBox.innerText = "";
  nextTurn();
  intervalId = setInterval(nextTurn, 2000);
}

// Start on load
window.onload = startGame;
