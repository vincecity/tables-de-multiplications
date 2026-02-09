const form = document.querySelector("#answer-form");
const answerInput = document.querySelector("#answer");
const questionText = document.querySelector("#question");
const feedback = document.querySelector("#feedback");
const correctCount = document.querySelector("#correct-count");
const totalCount = document.querySelector("#total-count");
const accuracy = document.querySelector("#accuracy");
const submitButton = form.querySelector('button[type="submit"]');
const tableOptions = document.querySelector("#table-options");
const selectAllButton = document.querySelector("#select-all");
const clearAllButton = document.querySelector("#clear-all");

const TABLE_MIN = 1;
const TABLE_MAX = 12;

const score = {
  total: 0,
  correct: 0,
};

let current = {
  a: 1,
  b: 1,
};

let waitingNext = false;
let selectedTables = new Set();
let nextQuestionTimer = null;

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomTable() {
  const options = Array.from(selectedTables);
  return options[randomBetween(0, options.length - 1)];
}

function buildTableSelector() {
  const fragment = document.createDocumentFragment();

  for (let value = TABLE_MIN; value <= TABLE_MAX; value += 1) {
    const label = document.createElement("label");
    label.className = "table-chip";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = String(value);
    checkbox.checked = true;

    const text = document.createElement("span");
    text.textContent = String(value);

    label.append(checkbox, text);
    fragment.appendChild(label);
  }

  tableOptions.appendChild(fragment);
  updateSelectedTables();
}

function updateSelectedTables() {
  const checkedBoxes = tableOptions.querySelectorAll('input[type="checkbox"]:checked');
  selectedTables = new Set(Array.from(checkedBoxes, (checkbox) => Number(checkbox.value)));
}

function stopPendingQuestion() {
  if (nextQuestionTimer !== null) {
    clearTimeout(nextQuestionTimer);
    nextQuestionTimer = null;
  }

  waitingNext = false;
}

function applyAllSelections(checked) {
  const checkboxes = tableOptions.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach((checkbox) => {
    checkbox.checked = checked;
  });

  handleTableChange();
}

function setQuestion() {
  if (selectedTables.size === 0) {
    return;
  }

  const previous = `${current.a}x${current.b}`;
  let nextA = randomTable();
  let nextB = randomBetween(TABLE_MIN, TABLE_MAX);
  let attempts = 0;

  while (`${nextA}x${nextB}` === previous && attempts < 20) {
    nextA = randomTable();
    nextB = randomBetween(TABLE_MIN, TABLE_MAX);
    attempts += 1;
  }

  current = { a: nextA, b: nextB };
  questionText.textContent = `${current.a} × ${current.b} = ?`;
  answerInput.value = "";
  answerInput.focus();
}

function setFeedback(message, state) {
  feedback.textContent = message;
  feedback.dataset.state = state;
}

function refreshStats() {
  correctCount.textContent = String(score.correct);
  totalCount.textContent = String(score.total);
  const ratio = score.total === 0 ? 0 : Math.round((score.correct / score.total) * 100);
  accuracy.textContent = `${ratio}%`;
}

function handleTableChange() {
  stopPendingQuestion();
  updateSelectedTables();

  if (selectedTables.size === 0) {
    questionText.textContent = "Choisis au moins une table.";
    answerInput.value = "";
    answerInput.disabled = true;
    submitButton.disabled = true;
    setFeedback("Sélectionne au moins une table pour commencer.", "error");
    return;
  }

  answerInput.disabled = false;
  submitButton.disabled = false;
  setFeedback("Sélection mise à jour.", "neutral");
  setQuestion();
}

tableOptions.addEventListener("change", handleTableChange);
selectAllButton.addEventListener("click", () => applyAllSelections(true));
clearAllButton.addEventListener("click", () => applyAllSelections(false));

form.addEventListener("submit", (event) => {
  event.preventDefault();

  if (waitingNext) {
    return;
  }

  if (selectedTables.size === 0) {
    handleTableChange();
    return;
  }

  const rawValue = answerInput.value.trim();
  if (rawValue === "") {
    setFeedback("Entre un nombre entier.", "neutral");
    return;
  }

  const userAnswer = Number(rawValue);
  if (!Number.isInteger(userAnswer)) {
    setFeedback("Entre un nombre entier.", "neutral");
    return;
  }

  const expected = current.a * current.b;
  score.total += 1;

  if (userAnswer === expected) {
    score.correct += 1;
    setFeedback(`Bravo, c'est correct : ${current.a} × ${current.b} = ${expected}.`, "success");
  } else {
    setFeedback(`Raté. La bonne réponse était ${expected}.`, "error");
  }

  refreshStats();
  waitingNext = true;

  nextQuestionTimer = setTimeout(() => {
    nextQuestionTimer = null;
    waitingNext = false;
    setFeedback("", "neutral");
    setQuestion();
  }, 1400);
});

buildTableSelector();
setQuestion();
refreshStats();
