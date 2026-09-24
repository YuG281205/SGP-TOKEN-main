document.addEventListener("DOMContentLoaded", () => {
    const username = localStorage.getItem("username");

    if (username) {
        document.getElementById("username").textContent = username;
    }
    checkAuthentication();

    loadPromptAnalysis();

});


// Prompts longer than this (in characters) get collapsed by default.
const PROMPT_PREVIEW_LIMIT = 220;

// Holds the untouched full text for every collapsible prompt box,
// keyed by box id. Kept in memory instead of a data-* attribute so
// long prompts (and prompts containing quote characters) never get
// truncated or mangled by HTML attribute serialization.
const promptTextStore = {};


async function loadPromptAnalysis() {

    const token = localStorage.getItem("access");

    try {

        const response = await fetch(
            "/api/prompt_analysis/",
            {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        renderPromptAnalysis(data.prompts);

    }

    catch (error) {

        console.error(error);

    }

}


// Escapes text before it goes into innerHTML, since prompt content
// is user-generated and shouldn't be trusted as raw HTML.
function escapeHtml(str) {

    const div = document.createElement("div");
    div.textContent = str ?? "";
    return div.innerHTML;

}


// Builds a prompt box with a truncated preview + "Show full prompt"
// toggle when the text is long enough to need it. Short prompts
// render as-is with no button, so space is only spent when needed.
// The FULL raw text is saved into promptTextStore[boxId] and set as
// the paragraph's textContent directly when expanded — never routed
// through an HTML attribute, so it can never get cut off partway.
function buildPromptBox(label, text, boxId) {

    const fullText = text ?? "";
    const isLong = fullText.length > PROMPT_PREVIEW_LIMIT;

    if (!isLong) {

        return `
            <div class="prompt-box">
                <h4>${label}</h4>
                <p>${escapeHtml(fullText)}</p>
            </div>
        `;

    }

    promptTextStore[boxId] = fullText;

    const previewText = fullText.slice(0, PROMPT_PREVIEW_LIMIT).trim() + "…";

    return `
        <div class="prompt-box is-collapsed" id="${boxId}">
            <h4>${label}</h4>
            <p class="prompt-text">${escapeHtml(previewText)}</p>
            <button type="button" class="toggle-prompt-btn" data-target="${boxId}">
                Show full prompt
                <i class="fa-solid fa-chevron-down"></i>
            </button>
        </div>
    `;

}


// Builds the plain-text report used for the per-card download.
function buildDownloadText(prompt) {

    return [
        `AI Token Optimizer — Prompt Analysis`,
        `Model: ${prompt.ai_model}`,
        `Date: ${prompt.created_at}`,
        ``,
        `--- Original Prompt ---`,
        prompt.original_prompt,
        ``,
        `--- Optimized Prompt ---`,
        prompt.optimized_prompt,
        ``,
        `--- Metrics ---`,
        `Semantic Accuracy: ${prompt.semantic_accuracy}%`,
        `Optimization Score: ${prompt.optimization_score}`,
        `Quality Rating: ${prompt.quality_rating}`,
        `Original Tokens: ${prompt.original_tokens}`,
        `Optimized Tokens: ${prompt.optimized_tokens}`,
        `Tokens Saved: ${prompt.tokens_saved}`,
        `Estimated Cost Saved: $${prompt.estimated_cost_saved}`,
        `Processing Time: ${prompt.processing_time} sec`
    ].join("\n");

}


// Triggers a browser download of the given text as a .txt file.
function downloadTextFile(filename, text) {

    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();

    URL.revokeObjectURL(url);

}


function renderPromptAnalysis(prompts) {

    const container = document.getElementById("promptAnalysisContainer");

    // Reset the text store on every re-render so stale entries from
    // a previous load never leak into a new set of cards.
    Object.keys(promptTextStore).forEach(key => delete promptTextStore[key]);

    if (!prompts.length) {

        container.innerHTML = `
            <div class="empty-state">
                No prompt analysis available.
            </div>
        `;

        return;

    }

    container.innerHTML = "";

    prompts.forEach((prompt, index) => {

        const originalBoxId = `originalPrompt-${index}`;
        const optimizedBoxId = `optimizedPrompt-${index}`;

        container.innerHTML += `

        <div class="analysis-card">

            <div class="analysis-header">

                <div class="analysis-header-left">
                    <h3>${escapeHtml(prompt.ai_model)}</h3>
                    <span>${escapeHtml(prompt.created_at)}</span>
                </div>

                <button type="button" class="download-analysis-btn" data-index="${index}">
                    <i class="fa-solid fa-download"></i>
                    Download
                </button>

            </div>

            ${buildPromptBox("Original Prompt", prompt.original_prompt, originalBoxId)}

            ${buildPromptBox("Optimized Prompt", prompt.optimized_prompt, optimizedBoxId)}

            <div class="metrics-grid">

                <div class="metric">
                    <h5>Semantic Accuracy</h5>
                    <span>${prompt.semantic_accuracy}%</span>
                </div>

                <div class="metric">
                    <h5>Optimization Score</h5>
                    <span>${prompt.optimization_score}</span>
                </div>

                <div class="metric">
                    <h5>Quality Rating</h5>
                    <span>${prompt.quality_rating}</span>
                </div>

                <div class="metric">
                    <h5>Original Tokens</h5>
                    <span>${prompt.original_tokens}</span>
                </div>

                <div class="metric">
                    <h5>Optimized Tokens</h5>
                    <span>${prompt.optimized_tokens}</span>
                </div>

                <div class="metric">
                    <h5>Tokens Saved</h5>
                    <span>${prompt.tokens_saved}</span>
                </div>

                <div class="metric">
                    <h5>Cost Saved</h5>
                    <span>$${prompt.estimated_cost_saved}</span>
                </div>

                <div class="metric">
                    <h5>Processing Time</h5>
                    <span>${prompt.processing_time} sec</span>
                </div>

            </div>

        </div>

        `;

    });

    attachToggleHandlers();

    attachDownloadHandlers(prompts);

}


// Delegated-style binding on the freshly rendered toggle buttons.
// Swaps the paragraph's text between the stored full text and its
// preview, using textContent (never innerHTML) so no length or
// special-character bugs can creep back in.
function attachToggleHandlers() {

    const buttons = document.querySelectorAll(".toggle-prompt-btn");

    buttons.forEach(btn => {

        btn.addEventListener("click", () => {

            const targetId = btn.getAttribute("data-target");
            const box = document.getElementById(targetId);

            if (!box) return;

            const textEl = box.querySelector(".prompt-text");
            const isCollapsed = box.classList.contains("is-collapsed");

            if (isCollapsed) {

                textEl.textContent = promptTextStore[targetId] ?? textEl.textContent;
                box.classList.remove("is-collapsed");
                box.classList.add("is-expanded");

                btn.innerHTML = `Show less <i class="fa-solid fa-chevron-up"></i>`;

            } else {

                const fullText = promptTextStore[targetId] ?? "";
                const previewText = fullText.slice(0, PROMPT_PREVIEW_LIMIT).trim() + "…";

                textEl.textContent = previewText;
                box.classList.remove("is-expanded");
                box.classList.add("is-collapsed");

                btn.innerHTML = `Show full prompt <i class="fa-solid fa-chevron-down"></i>`;

            }

        });

    });

}


// Binds each card's Download button to export that card's full
// prompt + metrics as a .txt file.
function attachDownloadHandlers(prompts) {

    const buttons = document.querySelectorAll(".download-analysis-btn");

    buttons.forEach(btn => {

        btn.addEventListener("click", () => {

            const index = Number(btn.getAttribute("data-index"));
            const prompt = prompts[index];

            if (!prompt) return;

            const text = buildDownloadText(prompt);

            const safeModel = (prompt.ai_model || "prompt")
                .toString()
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/(^-|-$)/g, "");

            const filename = `prompt-analysis-${safeModel}-${index + 1}.txt`;

            downloadTextFile(filename, text);

        });

    });

}


function checkAuthentication() {

    const token = localStorage.getItem("access");

    if (!token) {

        window.location.href = "/login/";

    }

}


// =====================================================
// LOGOUT
// =====================================================

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
    logoutBtn.addEventListener("click", logout);
}

function logout() {

    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("username");
    localStorage.removeItem("email");

    window.location.href = "/login/";

}