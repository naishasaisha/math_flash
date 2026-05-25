const scoreEl = document.querySelector("#score");
const streakEl = document.querySelector("#streak");
const timeEl = document.querySelector("#time");
const equationEl = document.querySelector("#equation");
const feedbackEl = document.querySelector("#feedback");
const roundLabelEl = document.querySelector("#roundLabel");
const yesButton = document.querySelector("#yesButton");
const noButton = document.querySelector("#noButton");
const resultEl = document.querySelector("#result");
const finalScoreEl = document.querySelector("#finalScore");
const playAgainButton = document.querySelector("#playAgain");
const burstCanvas = document.querySelector("#burst");
const burstContext = burstCanvas.getContext("2d");

const operators = ["+", "-", "×", "÷"];
const roundSeconds = 60;

let state = {
  score: 0,
  streak: 0,
  round: 1,
  time: roundSeconds,
  current: null,
  locked: false,
  timerId: null,
  particles: [],
  animationId: null,
};

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffleOffset() {
  const offsets = [-10, -8, -6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6, 8, 10];
  return offsets[randomInt(0, offsets.length - 1)];
}

function makeDivisionQuestion() {
  const answer = randomInt(2, 12);
  const right = randomInt(2, 12);
  return {
    left: answer * right,
    right,
    answer,
  };
}

function makeQuestion() {
  const operator = operators[randomInt(0, operators.length - 1)];
  let left = randomInt(2, 24);
  let right = randomInt(2, 18);
  let answer;

  if (operator === "+") {
    answer = left + right;
  }

  if (operator === "-") {
    left = randomInt(8, 30);
    right = randomInt(2, left - 1);
    answer = left - right;
  }

  if (operator === "×") {
    left = randomInt(2, 12);
    right = randomInt(2, 12);
    answer = left * right;
  }

  if (operator === "÷") {
    const division = makeDivisionQuestion();
    left = division.left;
    right = division.right;
    answer = division.answer;
  }

  const isCorrect = Math.random() >= 0.5;
  const shownAnswer = isCorrect ? answer : answer + shuffleOffset();

  return {
    text: `${left} ${operator} ${right} = ${shownAnswer}`,
    isCorrect,
    answer,
  };
}

function renderScore() {
  scoreEl.textContent = state.score;
  streakEl.textContent = state.streak;
  timeEl.textContent = state.time;
  roundLabelEl.textContent = `Question ${state.round}`;
}

function nextQuestion() {
  state.current = makeQuestion();
  state.locked = false;
  equationEl.textContent = state.current.text;
  feedbackEl.textContent = "Choose one";
  feedbackEl.className = "feedback";
  document.body.classList.remove("answered-good", "answered-bad");
  equationEl.classList.remove("pop");
  requestAnimationFrame(() => equationEl.classList.add("pop"));
  renderScore();
}

function answer(userSaysCorrect) {
  if (state.locked || state.time <= 0) {
    return;
  }

  state.locked = true;
  const gotIt = userSaysCorrect === state.current.isCorrect;

  if (gotIt) {
    state.streak += 1;
    state.score += 10 + Math.min(state.streak - 1, 5) * 2;
    feedbackEl.textContent = "Correct";
    feedbackEl.classList.add("good");
    document.body.classList.add("answered-good");
    popBurst(true);
  } else {
    state.streak = 0;
    state.score = Math.max(0, state.score - 4);
    feedbackEl.textContent = state.current.isCorrect ? "It was correct" : "It was wrong";
    feedbackEl.classList.add("bad");
    document.body.classList.add("answered-bad");
    popBurst(false);
  }

  renderScore();
  state.round += 1;
  window.setTimeout(nextQuestion, 650);
}

function startTimer() {
  window.clearInterval(state.timerId);
  state.timerId = window.setInterval(() => {
    state.time -= 1;
    renderScore();

    if (state.time <= 0) {
      endGame();
    }
  }, 1000);
}

function endGame() {
  window.clearInterval(state.timerId);
  state.locked = true;
  finalScoreEl.textContent = `You scored ${state.score} across ${state.round - 1} questions.`;
  resultEl.hidden = false;
  playAgainButton.focus();
}

function restartGame() {
  state.score = 0;
  state.streak = 0;
  state.round = 1;
  state.time = roundSeconds;
  state.locked = false;
  resultEl.hidden = true;
  nextQuestion();
  startTimer();
}

function fitCanvas() {
  const rect = burstCanvas.getBoundingClientRect();
  const density = window.devicePixelRatio || 1;
  burstCanvas.width = rect.width * density;
  burstCanvas.height = rect.height * density;
  burstContext.setTransform(density, 0, 0, density, 0, 0);
}

function popBurst(success) {
  const rect = burstCanvas.getBoundingClientRect();
  const colors = success
    ? ["#138a58", "#55a8d8", "#f3b632"]
    : ["#c43b3b", "#f3b632", "#7763d6"];
  const middleX = rect.width / 2;
  const middleY = rect.height / 2;

  for (let index = 0; index < 28; index += 1) {
    const angle = Math.random() * Math.PI * 2;
    const speed = randomInt(3, 8);
    state.particles.push({
      x: middleX,
      y: middleY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: randomInt(4, 9),
      life: 36,
      color: colors[randomInt(0, colors.length - 1)],
    });
  }
}

function animateBurst() {
  const rect = burstCanvas.getBoundingClientRect();
  burstContext.clearRect(0, 0, rect.width, rect.height);

  state.particles = state.particles
    .map((particle) => ({
      ...particle,
      x: particle.x + particle.vx,
      y: particle.y + particle.vy,
      vy: particle.vy + 0.12,
      life: particle.life - 1,
    }))
    .filter((particle) => particle.life > 0);

  state.particles.forEach((particle) => {
    burstContext.globalAlpha = Math.max(0, particle.life / 36);
    burstContext.fillStyle = particle.color;
    burstContext.fillRect(particle.x, particle.y, particle.size, particle.size);
  });

  burstContext.globalAlpha = 1;
  state.animationId = requestAnimationFrame(animateBurst);
}

yesButton.addEventListener("click", () => answer(true));
noButton.addEventListener("click", () => answer(false));
playAgainButton.addEventListener("click", restartGame);

window.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft" || event.key.toLowerCase() === "y") {
    answer(true);
  }

  if (event.key === "ArrowRight" || event.key.toLowerCase() === "n") {
    answer(false);
  }

  if (event.key === "Enter" && !resultEl.hidden) {
    restartGame();
  }
});

window.addEventListener("resize", fitCanvas);

fitCanvas();
animateBurst();
restartGame();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch((error) => {
      console.log("Service worker registration failed:", error);
    });
  });
}
