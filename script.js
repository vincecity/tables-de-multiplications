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
const tablePickerToggle = document.querySelector("#toggle-table-picker");
const tablePickerContent = document.querySelector("#table-picker-content");
const hasCollapsiblePicker = Boolean(tablePickerToggle && tablePickerContent);
const unicornStage = document.querySelector(".unicorn-stage");

const TABLE_MIN = 1;
const TABLE_MAX = 12;
const TABLE_STORAGE_KEY = "tables-de-multiplications:selectedTables";
const TABLE_PICKER_COLLAPSED_KEY = "tables-de-multiplications:tablePickerCollapsed";

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

function loadSavedTables() {
  try {
    const raw = localStorage.getItem(TABLE_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return null;
    }

    const cleaned = parsed
      .map((value) => Number(value))
      .filter((value) => Number.isInteger(value) && value >= TABLE_MIN && value <= TABLE_MAX);

    return new Set(cleaned);
  } catch (error) {
    return null;
  }
}

function saveSelectedTables() {
  try {
    localStorage.setItem(TABLE_STORAGE_KEY, JSON.stringify(Array.from(selectedTables)));
  } catch (error) {
    // Ignore storage errors (private mode, quota, etc.) and keep app usable.
  }
}

function loadTablePickerExpanded() {
  try {
    const storedValue = localStorage.getItem(TABLE_PICKER_COLLAPSED_KEY);
    if (storedValue === "true") {
      return false;
    }

    if (storedValue === "false") {
      return true;
    }

    return !window.matchMedia("(max-width: 560px)").matches;
  } catch (error) {
    return true;
  }
}

function setTablePickerExpanded(isExpanded, store = true) {
  if (!hasCollapsiblePicker) {
    return;
  }

  tablePickerToggle.setAttribute("aria-expanded", String(isExpanded));
  tablePickerContent.hidden = !isExpanded;

  if (store) {
    try {
      localStorage.setItem(TABLE_PICKER_COLLAPSED_KEY, String(!isExpanded));
    } catch (error) {
      // Ignore storage errors and keep UI functional.
    }
  }
}

function buildTableSelector() {
  const fragment = document.createDocumentFragment();
  const savedTables = loadSavedTables();
  const hasSavedSelection = savedTables instanceof Set;

  for (let value = TABLE_MIN; value <= TABLE_MAX; value += 1) {
    const label = document.createElement("label");
    label.className = "table-chip";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = String(value);
    checkbox.checked = hasSavedSelection ? savedTables.has(value) : true;

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

  if (unicornStage) {
    if (state === "success") {
      unicornStage.dataset.mood = "happy";
    } else if (state === "error") {
      unicornStage.dataset.mood = "sad";
    } else {
      unicornStage.dataset.mood = "neutral";
    }
  }
}

function refreshStats() {
  correctCount.textContent = String(score.correct);
  totalCount.textContent = String(score.total);
  const ratio = score.total === 0 ? 0 : Math.round((score.correct / score.total) * 100);
  accuracy.textContent = `${ratio}%`;
}

function handleTableChange(announce = true) {
  stopPendingQuestion();
  updateSelectedTables();
  saveSelectedTables();

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
  if (announce) {
    setFeedback("Sélection mise à jour.", "neutral");
  } else {
    setFeedback("", "neutral");
  }
  setQuestion();
}

tableOptions.addEventListener("change", handleTableChange);
selectAllButton.addEventListener("click", () => applyAllSelections(true));
clearAllButton.addEventListener("click", () => applyAllSelections(false));
if (hasCollapsiblePicker) {
  tablePickerToggle.addEventListener("click", () => {
    const isExpanded = tablePickerToggle.getAttribute("aria-expanded") === "true";
    setTablePickerExpanded(!isExpanded);
  });
}

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
refreshStats();
handleTableChange(false);
setTablePickerExpanded(loadTablePickerExpanded(), false);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {
      // Silent failure: app should still work online without SW.
    });
  });
}
