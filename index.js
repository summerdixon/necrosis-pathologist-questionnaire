const MAX_ID = 5;
let id = 1;
let furthestId = 1;
let globalScores = [];

const previousButton = document.getElementById("previous-button");
const nextButton = document.getElementById("next-button");
const saveButton = document.getElementById("save-button");
previousButton.addEventListener("click", goToPrevious);
nextButton.addEventListener("click", goToNext);
saveButton.addEventListener("click", downloadCSV);

const form = document.getElementById('question-form');

form.addEventListener("submit", function(event) {
    event.preventDefault();
    saveCurrentScores();
});

function switchDiv(divId) {
    const boxes = document.querySelectorAll('.content-box');
      boxes.forEach(box => box.classList.add('hidden'));

      const activeDiv = document.getElementById(divId);
      activeDiv.classList.remove('hidden');
}

function saveCurrentScores() {
    const formData = new FormData(form);

    globalScores[id - 1] = {
        artifacts: formData.get("artifacts"),
        nuclear: formData.get("nuclear"),
        cytoplasmic: formData.get("cytoplasmic"),
        extracellular: formData.get("extracellular"),
        ratio: formData.get("ratio"),
        diagnostic: formData.get("diagnostic"),
        comments: formData.get("comments")
    };

    writeJSON();
}

function goToNext() {
    if (id < MAX_ID) {
        saveCurrentScores();
        id++;
        updateQuestion();
    }
    if (id == 2) {
        const previousButton = document.getElementById('previous-button');
        previousButton.classList.remove('hidden');
    }
    if (id == MAX_ID) {
        const saveButton = document.getElementById('save-button');
        saveButton.classList.remove('hidden');
        const nextButton = document.getElementById('next-button');
        nextButton.classList.add('hidden');
    }
}

function goToPrevious() {
    if (id > 1) {
        saveCurrentScores();
        id--;
        updateQuestion();
    }
    if (id == 1) {
        const previousButton = document.getElementById('previous-button');
        previousButton.classList.add('hidden');
    }
    if (id == MAX_ID-1) {
        const saveButton = document.getElementById('save-button');
        saveButton.classList.add('hidden');
        const nextButton = document.getElementById('next-button');
        nextButton.classList.remove('hidden');
    }
}

function updateQuestion() {
    document.getElementById("question-title").textContent = `Image ${id}`;
    document.getElementById("question-image").src = `images/img_${id}.jpeg`;
    restoreScores();
}

function restoreScores() {
    const scores = globalScores[id - 1];
    form.reset();
    if (!scores) return;

    for (const [name, value] of Object.entries(scores)) {
        if (value === null) continue;

        if (name === "comments") {
            form.elements["comments"].value = value;
            continue;
        }

        const radio = form.querySelector(
            `input[name="${name}"][value="${value}"]`
        );

        if (radio) radio.checked = true;
    }
}

function allAnswered() {
    if (globalScores.length < MAX_ID) return false;
    for (let i = 0; i < MAX_ID; i++) {
        const s = globalScores[i];
        if (!s || !s.artifacts || !s.nuclear || !s.cytoplasmic ||
            !s.extracellular || !s.ratio || !s.diagnostic) return false;
    }
    return true;
}

function csvEscape(value) {
    const s = String(value ?? "");
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function downloadCSV() {
    saveCurrentScores();

    if (!allAnswered()) {
        alert("Please answer every question on every image before exporting.");
        return;
    }

    const headers = [
        "image_id", "artifacts", "nuclear", "cytoplasmic",
        "extracellular", "ratio", "diagnostic", "comments"
    ];

    const rows = [];
    globalScores.forEach((s, i) => {
        if (!s) return;
        const row = { image_id: i + 1, ...s };
        rows.push(headers.map(h => csvEscape(row[h])).join(","));
    });

    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "pathology_scores.csv";
    a.click();

    URL.revokeObjectURL(url);
}

let fileHandle = null;

document.getElementById("folder-button").addEventListener("click", pickFolder);

async function pickFolder() {
    try {
        const dirHandle = await window.showDirectoryPicker({ mode: "readwrite" });
        fileHandle = await dirHandle.getFileHandle("pathology_scores.json", { create: true });

        const text = await (await fileHandle.getFile()).text();
        if (text.trim()) {
            globalScores = JSON.parse(text);
            restoreScores();
        }
        await writeJSON();
        const proceedButton = document.getElementById('proceed-button');
        proceedButton.disabled = false;
    } catch (err) {
        console.error("Folder selection failed:", err);
    }
}

async function writeJSON() {
    if (!fileHandle) return;
    try {
        const writable = await fileHandle.createWritable();
        await writable.write(JSON.stringify(globalScores, null, 2));
        await writable.close();
    } catch (err) {
        console.error("Failed to write JSON:", err);
    }
}