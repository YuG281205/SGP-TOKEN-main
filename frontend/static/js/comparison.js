document.addEventListener("DOMContentLoaded", async function () {

    const token = localStorage.getItem("access");

    if (!token) {
        alert("Please login first.");
        window.location.href = "/login/";
        return;
    }

    const username = localStorage.getItem("username");

    if (username) {
        document.getElementById("username").innerText = username;
    }

    const groupsContainer = document.getElementById("comparisonGroups");

    let comparisonData = [];

    try {

        const response = await fetch("/api/comparison/", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
            }
        });

        const result = await response.json();

        console.log(result);

        if (!response.ok) {

            alert(result.message || "Unable to load comparison history.");

            return;
        }

        // Django returns "comparisons", not "data"
        comparisonData = result.comparisons || [];

        renderGroups(comparisonData);

    }

    catch (error) {

        console.error(error);

        groupsContainer.innerHTML = `
            <div class="comparison-empty">
                <i class="fa-solid fa-triangle-exclamation"></i>
                Unable to load data.
            </div>
        `;

    }

    // =======================================================

    function renderGroups(data) {

        groupsContainer.innerHTML = "";

        if (!data.length) {

            groupsContainer.innerHTML = `
                <div class="comparison-empty">
                    <i class="fa-solid fa-inbox"></i>
                    No Comparison History Found
                </div>
            `;

            return;
        }

        // Group entries that share the same history_id so they can be
        // laid out horizontally for direct comparison.
        const groups = new Map();

        data.forEach(item => {
            const key = item.history_id;
            if (!groups.has(key)) {
                groups.set(key, []);
            }
            groups.get(key).push(item);
        });

        // Newest history group first.
        const orderedKeys = Array.from(groups.keys()).sort((a, b) => {
            const dateA = new Date(groups.get(a)[0].created_at).getTime();
            const dateB = new Date(groups.get(b)[0].created_at).getTime();
            return dateB - dateA;
        });

        let cardCounter = 0;

        orderedKeys.forEach(historyId => {

            const items = groups.get(historyId);

            const groupEl = document.createElement("div");
            groupEl.className = "history-group";

            const latestDate = new Date(items[0].created_at).toLocaleString();

            groupEl.innerHTML = `
                <div class="history-group__header">
                    <h3>History ID: <span>${historyId}</span></h3>
                    <span class="history-group__date">${latestDate}</span>
                </div>
                <div class="history-group__cards"></div>
            `;

            const cardsEl = groupEl.querySelector(".history-group__cards");

            items.forEach(item => {

                cardCounter += 1;

                const logo = getLogoMeta(item.optimizer_name);
                const statusClass = "status-" + (item.status || "pending").toLowerCase();

                const cardEl = document.createElement("div");
                cardEl.className = "comparison-card";

                cardEl.innerHTML = `
                    <div class="comparison-card__badge">#${String(cardCounter).padStart(2, "0")}</div>

                    <div class="comparison-card__top">
                        <div class="optimizer-logo ${logo.cls}">${logo.html}</div>
                        <div class="comparison-card__name">
                            <h4>${item.optimizer_name || "Unknown"}</h4>
                            <span class="history-id">ID: ${historyId}</span>
                        </div>
                    </div>

                    <div class="comparison-card__stats">
                        <div class="stat">
                            <label>Tokens Saved</label>
                            <span class="accent">${formatNumber(item.tokens_saved)}</span>
                        </div>
                        <div class="stat">
                            <label>Semantic Accuracy</label>
                            <span>${item.semantic_accuracy}%</span>
                        </div>
                    </div>

                    <span class="status-pill ${statusClass}">${item.status}</span>

                    <button class="view-btn" data-id="${item.id}">View Details</button>
                `;

                cardsEl.appendChild(cardEl);

            });

            groupsContainer.appendChild(groupEl);

        });

        addViewButtonEvents(data);

    }

});


// =======================================================

function formatNumber(value) {

    const num = Number(value);

    return Number.isFinite(num)
        ? num.toLocaleString()
        : value;

}


// =======================================================
// Maps an optimizer name to the logo badge shown on each card.
// Known optimizers get their real logo image/glyph; anything
// unrecognized falls back to the first letter of its name.

function getLogoMeta(optimizerName) {

    const name = (optimizerName || "").toLowerCase();

    if (name.includes("aiven")) {
        return {
            cls: "logo-aiven",
            html: `<img src="/static/img/logos/aiven-logo.svg" alt="Aiven" class="optimizer-logo-img">`
        };
    }

    // "prompt_generator" is the free Prompt Generator optimizer
    // (replaces the old Promptnatus integration).
    if (name.includes("prompt_generator")) {
        return {
            cls: "logo-prompt-generator",
            html: `<img src="/static/img/logos/prompt-generator-logo.webp" alt="Prompt Generator" class="optimizer-logo-img">`
        };
    }

    if (name.includes("numstack")) {
        return {
            cls: "logo-numstack",
            html: `₿`
        };
    }

    if (name.includes("gemini")) {
        return { cls: "logo-gemini", html: "G" };
    }

    if (name.includes("ollama")) {
        return { cls: "logo-ollama", html: "O" };
    }

    return {
        cls: "logo-default",
        html: (optimizerName || "?").charAt(0).toUpperCase()
    };

}


// =======================================================

function addViewButtonEvents(data) {

    document.querySelectorAll(".view-btn").forEach(button => {

        button.addEventListener("click", function () {

            const id = Number(this.dataset.id);

            const item = data.find(x => x.id === id);

            if (!item) {

                alert("Comparison not found.");

                return;

            }

            document.getElementById("optimizerName").textContent =
                item.optimizer_name;

            document.getElementById("status").textContent =
                item.status;

            document.getElementById("originalPrompt").value =
                item.original_prompt || "";

            document.getElementById("optimizedPrompt").value =
                item.optimized_prompt || "";

            document.getElementById("optimizedInputTokens").textContent =
                formatNumber(item.optimized_input_tokens);

            document.getElementById("optimizedOutputTokens").textContent =
                formatNumber(item.optimized_output_tokens);

            document.getElementById("optimizedTotalTokens").textContent =
                formatNumber(item.optimized_total_tokens);

            document.getElementById("tokensSaved").textContent =
                formatNumber(item.tokens_saved);

            document.getElementById("semanticAccuracy").textContent =
                item.semantic_accuracy + "%";

            document.getElementById("optimizationScore").textContent =
                item.optimization_score + "%";

            document.getElementById("estimatedCostSaved").textContent =
                "$" + item.estimated_cost_saved;

            document.getElementById("processingTime").textContent =
                item.processing_time + " sec";

            document.getElementById("createdAt").textContent =
                new Date(item.created_at).toLocaleString();

            document.getElementById("historyId").textContent =
                item.history_id;

            // Optional image
            const image = document.getElementById("optimizedPromptImage");

            if (image) {

                if (item.optimized_prompt_image) {

                    image.src = item.optimized_prompt_image;
                    image.style.display = "block";

                } else {

                    image.style.display = "none";

                }

            }

            document.getElementById("comparisonModal").style.display = "flex";

        });

    });

}


// =======================================================

const modal = document.getElementById("comparisonModal");

const closeBtn = document.querySelector(".close");

if (closeBtn) {

    closeBtn.onclick = function () {

        modal.style.display = "none";

    };

}

window.addEventListener("click", function (event) {

    if (event.target === modal) {

        modal.style.display = "none";

    }

});

document.addEventListener("keydown", function (event) {

    if (event.key === "Escape") {

        modal.style.display = "none";

    }

});


// =======================================================

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