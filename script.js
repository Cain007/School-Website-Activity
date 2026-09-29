// ==========================================================
// SHAK-MAT ACADEMY — SCRIPT
// Handles: active nav highlighting, scroll-reveal animations,
// the puzzle modal (open/close, focus, keyboard), rendering the
// chessboard, and the click-to-move puzzle logic.
// ==========================================================

// ---------- ACTIVE NAV LINK ON SCROLL ----------

// Grab every section that has an id, and every nav link that points to one.
const sections = document.querySelectorAll("main section[id]");
const navLinks = document.querySelectorAll(".nav-links a");

// IntersectionObserver watches sections and tells us when one becomes
// the main thing visible in the viewport, without us checking scroll
// position manually on every scroll event.
const navObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const sectionId = entry.target.getAttribute("id");

        // Remove "active" from every link, then add it back to the
        // one that matches the section currently in view.
        navLinks.forEach((link) => {
          link.classList.remove("active");
          if (link.getAttribute("href") === `#${sectionId}`) {
            link.classList.add("active");
          }
        });
      }
    });
  },
  {
    // Counts a section as "active" once it crosses the middle of the screen.
    rootMargin: "-50% 0px -50% 0px",
  }
);

sections.forEach((section) => navObserver.observe(section));


// ---------- MOBILE NAV TOGGLE (hamburger menu) ----------

const navToggle = document.getElementById("nav-toggle");
const navLinksList = document.getElementById("nav-links");

navToggle.addEventListener("click", () => {
  const isOpen = navLinksList.classList.toggle("open");
  navToggle.classList.toggle("open", isOpen);
  navToggle.setAttribute("aria-expanded", String(isOpen));
  navToggle.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
});

// Tapping a link closes the mobile menu, so it doesn't stay open after
// the page scrolls to the new section.
navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    navLinksList.classList.remove("open");
    navToggle.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Open menu");
  });
});


// ---------- SCROLL-REVEAL ANIMATION ----------

// Every section except the hero (which is already visible on load) softly
// fades and rises into place the first time it's scrolled into view.
const revealSections = document.querySelectorAll("main section:not(#home)");
revealSections.forEach((section) => section.classList.add("reveal"));

const revealObserver = new IntersectionObserver(
  (entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("revealed");
        // Once revealed, a section stays revealed — no need to keep watching it.
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15 }
);

revealSections.forEach((section) => revealObserver.observe(section));


// ---------- PUZZLE MODAL OPEN / CLOSE ----------

const puzzleModal = document.getElementById("puzzle-modal");
const openButtons = [
  document.getElementById("hero-puzzle-btn"),
  document.getElementById("main-puzzle-btn"),
];
const closeButton = document.getElementById("puzzle-close-btn");

// Remembers which button opened the modal, so we can return focus to it
// when the modal closes — helpful for anyone navigating by keyboard.
let lastFocusedTrigger = null;

function openPuzzleModal(event) {
  lastFocusedTrigger = event.currentTarget;
  puzzleModal.classList.remove("hidden");
  closeButton.focus();
}

function closePuzzleModal() {
  puzzleModal.classList.add("hidden");
  deselectSquare();
  if (lastFocusedTrigger) lastFocusedTrigger.focus();
}

// Either button opens the puzzle.
openButtons.forEach((btn) => {
  if (btn) {
    btn.addEventListener("click", openPuzzleModal);
  }
});

// The × button closes it.
closeButton.addEventListener("click", closePuzzleModal);

// Clicking the dark backdrop (outside the panel) also closes it.
puzzleModal.addEventListener("click", (event) => {
  if (event.target === puzzleModal) {
    closePuzzleModal();
  }
});

// Pressing Escape closes it too, for keyboard users.
document.addEventListener("keydown", (event) => {
  const isOpen = !puzzleModal.classList.contains("hidden");
  if (event.key === "Escape" && isOpen) {
    closePuzzleModal();
  }
});


// ---------- PUZZLE POSITION & BOARD RENDERING ----------

// Converts "d8" into { row, col } — row 0 is rank 8, row 7 is rank 1.
function squareToRowCol(square) {
  const files = "abcdefgh";
  const file = square[0];
  const rank = Number(square[1]);
  return { row: 8 - rank, col: files.indexOf(file) };
}

// Builds an 8x8 position array from a simple { square: "pieceCode" } object,
// e.g. { a8: "bK", a7: "bP", c1: "wR" }. This lets each puzzle below list
// only the squares that actually have something on them, instead of typing
// out 64 cells by hand every time.
function buildPosition(pieces) {
  const board = Array.from({ length: 8 }, () => Array(8).fill(null));
  for (const square in pieces) {
    const { row, col } = squareToRowCol(square);
    board[row][col] = pieces[square];
  }
  return board;
}

// Each puzzle has a starting position, the one correct move that solves it,
// and its own hint. All 20 are checkmate-in-one positions: the black king is
// boxed in by its own pawns along the back rank, and a white rook or queen
// swings onto the open rank to deliver mate — the challenge is spotting
// which square to land on, and ignoring the pieces that are just decoys.
const puzzles = [
  {
    // Classic back-rank mate: the rook lifts straight up its own file.
    position: buildPosition({
      g8: "bK", f7: "bP", g7: "bP", h7: "bP",
      d1: "wR", g1: "wK",
    }),
    solution: { from: "d1", to: "d8" },
    hint: "One piece already controls the entire open file in front of it.",
  },
  {
    // Supported queen mate: the queen captures the blocking pawn, backed
    // up by the white king so the black king can't take it back.
    position: buildPosition({
      h8: "bK", g7: "bP", h7: "bP",
      a1: "wQ", g6: "wK",
    }),
    solution: { from: "a1", to: "g7" },
    hint: "The queen's own diagonal runs straight toward the king — and a friendly king backs it up.",
  },
  {
    position: buildPosition({
      a8: "bK", a7: "bP", b7: "bP",
      c1: "wR", e1: "wK",
    }),
    solution: { from: "c1", to: "c8" },
    hint: "The rook doesn't need the a-file — any open file that reaches the back rank works.",
  },
  {
    position: buildPosition({
      h8: "bK", g7: "bP", h7: "bP",
      e1: "wR", b1: "wK",
    }),
    solution: { from: "e1", to: "e8" },
    hint: "You don't have to land on the king's own file to deliver a back-rank mate.",
  },
  {
    position: buildPosition({
      b8: "bK", a7: "bP", b7: "bP", c7: "bP",
      f1: "wR", d1: "wK",
    }),
    solution: { from: "f1", to: "f8" },
    hint: "Three pawns look safe until you remember they can't move sideways to help.",
  },
  {
    position: buildPosition({
      g8: "bK", f7: "bP", g7: "bP", h7: "bP",
      c1: "wQ", a1: "wK",
    }),
    solution: { from: "c1", to: "c8" },
    hint: "The queen can finish the job from a file the rook never needed.",
  },
  {
    position: buildPosition({
      d8: "bK", c7: "bP", d7: "bP", e7: "bP",
      a1: "wR", h1: "wK",
    }),
    solution: { from: "a1", to: "a8" },
    hint: "An open rank is a highway — you can enter it from either end.",
  },
  {
    position: buildPosition({
      e8: "bK", d7: "bP", e7: "bP", f7: "bP",
      h1: "wQ", a2: "wK",
    }),
    solution: { from: "h1", to: "h8" },
    hint: "The rank stays wide open once the king has nowhere else to go.",
  },
  {
    position: buildPosition({
      c8: "bK", b7: "bP", c7: "bP", d7: "bP",
      h1: "wR", a1: "wK",
    }),
    solution: { from: "h1", to: "h8" },
    hint: "Sometimes the far side of the board is the fastest way in.",
  },
  {
    position: buildPosition({
      f8: "bK", e7: "bP", f7: "bP", g7: "bP",
      a1: "wQ", h2: "wK",
    }),
    solution: { from: "a1", to: "a8" },
    hint: "The queen's whole rank opens up the moment she lands on it.",
  },
  {
    // A bishop sits on the board but isn't part of the solution.
    position: buildPosition({
      a8: "bK", a7: "bP", b7: "bP",
      d1: "wQ", f3: "wB", g1: "wK",
    }),
    solution: { from: "d1", to: "d8" },
    hint: "Not every piece on the board needs to move — find the one that does.",
  },
  {
    // A knight sits idle nearby, just to make the board busier.
    position: buildPosition({
      h8: "bK", g7: "bP", h7: "bP",
      b1: "wR", c3: "wN", f1: "wK",
    }),
    solution: { from: "b1", to: "b8" },
    hint: "A knight looks tempting, but this mate doesn't need one.",
  },
  {
    // A stray black pawn on the far side of the board changes nothing.
    position: buildPosition({
      g8: "bK", f7: "bP", g7: "bP", h7: "bP", a6: "bP",
      e1: "wQ", c1: "wK",
    }),
    solution: { from: "e1", to: "e8" },
    hint: "Ignore the pawn on the far side of the board — it isn't part of this puzzle.",
  },
  {
    position: buildPosition({
      b8: "bK", a7: "bP", b7: "bP", c7: "bP",
      g1: "wR", c4: "wB", e2: "wK",
    }),
    solution: { from: "g1", to: "g8" },
    hint: "The bishop is just watching this one — the rook does the work.",
  },
  {
    position: buildPosition({
      e8: "bK", d7: "bP", e7: "bP", f7: "bP",
      b1: "wQ", g2: "wK",
    }),
    solution: { from: "b1", to: "b8" },
    hint: "Look for the file that runs all the way from your side of the board to theirs.",
  },
  {
    position: buildPosition({
      f8: "bK", e7: "bP", f7: "bP", g7: "bP", h6: "bP",
      a1: "wR", h1: "wK",
    }),
    solution: { from: "a1", to: "a8" },
    hint: "Don't be distracted by pawns that have nothing to do with the mating net.",
  },
  {
    position: buildPosition({
      c8: "bK", b7: "bP", c7: "bP", d7: "bP",
      g1: "wQ", a2: "wK",
    }),
    solution: { from: "g1", to: "g8" },
    hint: "The queen doesn't need to start anywhere near the king — just on the right line.",
  },
  {
    position: buildPosition({
      a8: "bK", a7: "bP", b7: "bP",
      f1: "wR", d4: "wN", c2: "wK",
    }),
    solution: { from: "f1", to: "f8" },
    hint: "Check every open file — more than one of them leads home.",
  },
  {
    position: buildPosition({
      h8: "bK", g7: "bP", h7: "bP", a5: "bP",
      d1: "wQ", b2: "wK",
    }),
    solution: { from: "d1", to: "d8" },
    hint: "That far pawn is a spectator — focus on the open rank.",
  },
  {
    position: buildPosition({
      g8: "bK", f7: "bP", g7: "bP", h7: "bP", b6: "bP",
      a1: "wR", c1: "wB", e2: "wK",
    }),
    solution: { from: "a1", to: "a8" },
    hint: "This is the same idea as puzzle one — just a longer road to the same door.",
  },
];

let currentPuzzleIndex = 0;

// Unicode chess characters for each piece code.
const pieceSymbols = {
  wK: "♔", wQ: "♕", wR: "♖", wB: "♗", wN: "♘", wP: "♙",
  bK: "♚", bQ: "♛", bR: "♜", bB: "♝", bN: "♞", bP: "♟",
};

const boardElement = document.getElementById("chessboard");

// Converts a row/column pair (0-7, 0-7) into standard chess notation,
// e.g. row 0, col 3 -> "d8".
function squareName(row, col) {
  const files = "abcdefgh";
  const rank = 8 - row;
  return `${files[col]}${rank}`;
}

// Human-readable piece names for accessible labels.
const pieceNames = {
  K: "king", Q: "queen", R: "rook", B: "bishop", N: "knight", P: "pawn",
};

// Draws the board as 64 small divs inside #chessboard, based on a
// position array shaped like each puzzle's position above.
function renderBoard(position) {
  boardElement.innerHTML = ""; // clear anything drawn before

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const square = document.createElement("div");
      const isLightSquare = (row + col) % 2 === 0;
      const name = squareName(row, col);

      square.classList.add("square", isLightSquare ? "square-light" : "square-dark");
      square.dataset.square = name;
      square.dataset.row = row;
      square.dataset.col = col;

      // Make squares reachable by keyboard (Tab) and screen-reader friendly.
      square.tabIndex = 0;
      square.setAttribute("role", "button");

      const piece = position[row][col];
      let label = `Square ${name}, empty`;
      if (piece) {
        square.textContent = pieceSymbols[piece];
        square.classList.add(piece.startsWith("w") ? "piece-white" : "piece-black");
        const color = piece.startsWith("w") ? "white" : "black";
        label = `Square ${name}, ${color} ${pieceNames[piece[1]]}`;
      }
      square.setAttribute("aria-label", label);

      boardElement.appendChild(square);
    }
  }
}

// ---------- PUZZLE INTERACTION (click piece, click destination) ----------

// We play out moves on a working copy of the position, so Reset can always
// restore the current puzzle's starting position.
function clonePosition(position) {
  return position.map((row) => row.slice());
}

let currentPosition = clonePosition(puzzles[currentPuzzleIndex].position);
let selectedSquare = null; // e.g. "d1", or null when nothing is selected
let puzzleSolved = false;

const statusElement = document.getElementById("puzzle-status");
const resetButton = document.getElementById("reset-btn");
const hintButton = document.getElementById("hint-btn");
const newPuzzleButton = document.getElementById("new-puzzle-btn");

// Updates the status line, and colors it for success/error feedback.
function setStatus(text, type = "neutral") {
  statusElement.textContent = text;
  statusElement.classList.remove("status-success", "status-error");
  if (type === "success") statusElement.classList.add("status-success");
  if (type === "error") statusElement.classList.add("status-error");
}

function selectSquare(name, element) {
  selectedSquare = name;
  element.classList.add("selected");
  setStatus("Now click the destination square.");
}

function deselectSquare() {
  const highlighted = boardElement.querySelector(".square.selected");
  if (highlighted) highlighted.classList.remove("selected");
  selectedSquare = null;
}

// Actually moves a piece in our data, then redraws the board from it.
function movePiece(from, to) {
  const { row: fromRow, col: fromCol } = squareToRowCol(from);
  const { row: toRow, col: toCol } = squareToRowCol(to);
  currentPosition[toRow][toCol] = currentPosition[fromRow][fromCol];
  currentPosition[fromRow][fromCol] = null;
  renderBoard(currentPosition);
}

// A move is correct only if it matches the current puzzle's own solution.
function attemptMove(from, to) {
  const { from: correctFrom, to: correctTo } = puzzles[currentPuzzleIndex].solution;
  const isCorrectMove = from === correctFrom && to === correctTo;
  deselectSquare();

  if (isCorrectMove) {
    movePiece(from, to);
    puzzleSolved = true;
    setStatus("Excellent! Correct move — checkmate!", "success");
    boardElement.classList.add("solved");
  } else {
    setStatus("Not quite. Try again.", "error");
  }
}

// One handler for both mouse clicks and keyboard activation, so the puzzle
// works the same way no matter how a square is chosen.
function handleSquareInteraction(squareEl) {
  if (puzzleSolved || !squareEl) return;

  const row = Number(squareEl.dataset.row);
  const col = Number(squareEl.dataset.col);
  const clickedName = squareEl.dataset.square;
  const piece = currentPosition[row][col];

  // Case 1: nothing selected yet — only a white piece can be picked up.
  if (selectedSquare === null) {
    if (piece && piece.startsWith("w")) {
      selectSquare(clickedName, squareEl);
    } else {
      setStatus("Select a white piece to move.");
    }
    return;
  }

  // Case 2: clicking the already-selected square cancels the selection.
  if (clickedName === selectedSquare) {
    deselectSquare();
    setStatus("Select a piece to begin.");
    return;
  }

  // Case 3: clicking a different white piece switches the selection to it.
  if (piece && piece.startsWith("w")) {
    deselectSquare();
    selectSquare(clickedName, squareEl);
    return;
  }

  // Case 4: any other click is an attempted move to that square.
  attemptMove(selectedSquare, clickedName);
}

boardElement.addEventListener("click", (event) => {
  handleSquareInteraction(event.target.closest(".square"));
});

// Enter or Space activates a focused square, matching native button behavior.
boardElement.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;
  const squareEl = event.target.closest(".square");
  if (!squareEl) return;
  event.preventDefault(); // stop the page from scrolling on Space
  handleSquareInteraction(squareEl);
});

// Puts the current puzzle back to its starting position.
function resetToCurrentPuzzle() {
  currentPosition = clonePosition(puzzles[currentPuzzleIndex].position);
  selectedSquare = null;
  puzzleSolved = false;
  boardElement.classList.remove("solved");
  renderBoard(currentPosition);
  setStatus("Select a piece to begin.");
}

resetButton.addEventListener("click", resetToCurrentPuzzle);

// A gentle nudge without giving the move away outright.
hintButton.addEventListener("click", () => {
  if (puzzleSolved) return;
  setStatus(`Hint: ${puzzles[currentPuzzleIndex].hint}`);
});

// Moves on to the next puzzle in the list, wrapping back to the first
// once you've been through them all. Only available once the current
// puzzle is actually solved — no skipping ahead.
newPuzzleButton.addEventListener("click", () => {
  if (!puzzleSolved) {
    setStatus("Solve this puzzle first — or click Reset to start it over.", "error");
    return;
  }
  currentPuzzleIndex = (currentPuzzleIndex + 1) % puzzles.length;
  resetToCurrentPuzzle();
});

// Draw the puzzle position as soon as the page loads.
renderBoard(currentPosition);
