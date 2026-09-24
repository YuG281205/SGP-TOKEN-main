document.addEventListener("DOMContentLoaded", async function () {

    const token = localStorage.getItem("access");
    
    if (!token) {
        alert("Please login first.");
        window.location.href = "/login/";
        return;
    }

    // Populate the shared navbar's username, same as dashboard.js
    const username = localStorage.getItem("username");
    const usernameEl = document.getElementById("username");
    if (usernameEl && username) {
        usernameEl.innerText = username;
    }

    const tableBody = document.getElementById("historyBody");

    let historyData = [];

    try {

        const response = await fetch("/api/history/", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        });

        const result = await response.json();

        if (!response.ok) {
            alert(result.message || "Unable to fetch history.");
            return;
        }

        historyData = result.data;

        tableBody.innerHTML = "";

        if (historyData.length === 0) {

            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align:center;">
                        No Prompt History Found
                    </td>
                </tr>
            `;

            return;
        }

        historyData.forEach((item, index) => {

            tableBody.innerHTML += `

                <tr>

                    <td data-label="#">${index + 1}</td>

                    <td data-label="Date">
                        ${new Date(item.created_at).toLocaleDateString()}
                    </td>

                    <td data-label="Model">${item.ai_model}</td>

                    <td data-label="Tokens Saved">${formatNumber(item.tokens_saved)}</td>

                    <td data-label="Cost Saved">$${item.estimated_cost_saved}</td>

                    <td data-label="Status">
                        <span class="status-pill status-${(item.status || "").toLowerCase()}">
                            ${item.status}
                        </span>
                    </td>

                    <td data-label="Details">
                        <button
                            class="view-btn"
                            data-id="${item.id}"
                        >
                            View
                        </button>
                    </td>

                </tr>

            `;

        });

        addViewButtonEvents(historyData);

    }

    catch (error) {

        console.error(error);

        tableBody.innerHTML = `

            <tr>

                <td colspan="7" style="text-align:center;color:red;">

                    Unable to load history.

                </td>

            </tr>

        `;

    }

});

// =====================================================
// HELPERS
// =====================================================

function formatNumber(value) {
    const num = Number(value);
    return Number.isFinite(num) ? num.toLocaleString() : value;
}

// =====================================================
// VIEW BUTTON EVENTS
// =====================================================

function addViewButtonEvents(historyData) {

    const buttons = document.querySelectorAll(".view-btn");

    buttons.forEach(button => {

        button.addEventListener("click", function () {

            const id = Number(this.dataset.id);

            const item = historyData.find(record => record.id === id);

            if (!item) {
                alert("Record not found.");
                return;
            }

            // ===========================
            // PROMPTS
            // ===========================

            document.getElementById("originalPrompt").value =
                item.original_prompt || "";

            document.getElementById("optimizedPrompt").value =
                item.optimized_prompt || "";

            // ===========================
            // TOKEN DETAILS
            // ===========================

            document.getElementById("originalInputTokens").textContent =
                formatNumber(item.original_input_tokens);

            document.getElementById("originalOutputTokens").textContent =
                formatNumber(item.original_output_tokens);

            document.getElementById("originalTotalTokens").textContent =
                formatNumber(item.original_total_tokens);

            document.getElementById("optimizedInputTokens").textContent =
                formatNumber(item.optimized_input_tokens);

            document.getElementById("optimizedOutputTokens").textContent =
                formatNumber(item.optimized_output_tokens);

            document.getElementById("optimizedTotalTokens").textContent =
                formatNumber(item.optimized_total_tokens);

            document.getElementById("tokensSaved").textContent =
                formatNumber(item.tokens_saved);

            document.getElementById("costSaved").textContent =
                "$" + item.estimated_cost_saved;

            document.getElementById("processingTime").textContent =
                item.processing_time + " sec";

            // ===========================
            // OTHER DETAILS
            // ===========================

            document.getElementById("modelName").textContent =
                item.ai_model;

            document.getElementById("optimizationLevel").textContent =
                item.optimization_level;

            const statusEl = document.getElementById("status");
            statusEl.textContent = item.status;
            statusEl.className = "chip-value status-text status-" + (item.status || "").toLowerCase();

            document.getElementById("createdAt").textContent =
                new Date(item.created_at).toLocaleString();

            // ===========================
            // OPEN MODAL
            // ===========================

            document.getElementById("historyModal").style.display = "flex";

        });

    });

}


// =====================================================
// CLOSE MODAL
// =====================================================

const modal = document.getElementById("historyModal");

const closeBtn = document.querySelector(".close");

if (closeBtn) {

    closeBtn.onclick = function () {

        modal.style.display = "none";

    };

}

window.onclick = function (event) {

    if (event.target === modal) {

        modal.style.display = "none";

    }

};


// =====================================================
// OPTIONAL: ESC KEY CLOSES MODAL
// =====================================================

document.addEventListener("keydown", function (event) {

    if (event.key === "Escape") {

        document.getElementById("historyModal").style.display = "none";

    }

});


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