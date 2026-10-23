const MAX_ID = 5;
let id = 1;
let furthestId = 1;
let globalScores = [];

const previousButton = document.getElementById("previous-button");
const nextButton = document.getElementById("next-button");
const saveButton = document.getElementById("save-button");
previousButton.addEventListener("click", goToPrevious);
nextButton.addEventListener("click", goToNext);
saveButton.addEventListener("click", downloadCSV(globalScores));

const form = document.getElementById('questionForm');

form.addEventListener("submit", function(event) {
    event.preventDefault();

    saveCurrentScores();
});

function saveCurrentScores() {
    const formData = new FormData(form);

    globalScores[id - 1] = {
        artifacts: formData.get("artifacts"),
        extracellular: formData.get("extracellular"),
        cytoplasmic: formData.get("cytoplasmic"),
        nuclear: formData.get("nuclear"),
        cellularity: formData.get("cellularity")
    };
}

function goToNext() {
    if (id < MAX_ID) {
        saveCurrentScores();
        id++;
        updateQuestion();
    }
}

function goToPrevious() {
    saveCurrentScores();

    if (id > 1) {
        id--;
        updateQuestion();
    }
}

function updateQuestion() {
    document.getElementById("question-title").textContent = `Question ${id}`;
    document.getElementById("question-image").src = `images/img_${id}.jpeg`;
    restoreScores();
}

function restoreScores() {
    const scores = globalScores[id - 1];

    form.reset();

    if (!scores) return;

    for (const [name, value] of Object.entries(scores)) {
        if (value === null) continue;

        const radio = form.querySelector(
            `input[name="${name}"][value="${value}"]`
        );

        if (radio) radio.checked = true;
    }
}

function downloadCSV(scores) {
  const headers = [
    "image_id", "artifacts", "extracellular",
    "cytoplasmic", "nuclear", "cellularity"
  ];

  const rows = scores.map(s =>
    headers.map(h => s[h] ?? "").join(",")
  );

  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "pathology_scores.csv";
  a.click();

  URL.revokeObjectURL(url);
}