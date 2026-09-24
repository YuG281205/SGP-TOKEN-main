console.log("Dashboard JS Loaded");

const username = localStorage.getItem("username");
document.getElementById("username").innerText = username;
document.getElementById("welcomeUser").innerText = username;

// =====================================================
// CHARACTER COUNT
// =====================================================

function updateCharCount(textareaId, countId) {
    const textarea = document.getElementById(textareaId);
    const countEl = document.getElementById(countId);
    if (!textarea || !countEl) return;

    const len = textarea.value.length;
    countEl.textContent = `${len} character${len === 1 ? "" : "s"}`;
}

const promptTextareaEl = document.getElementById("prompt");
if (promptTextareaEl) {
    updateCharCount("prompt", "promptCharCount");
    promptTextareaEl.addEventListener("input", () =>
        updateCharCount("prompt", "promptCharCount")
    );
}

// Initialize the optimized-prompt count on load too
updateCharCount("optimizedPrompt", "optimizedPromptCharCount");

const optimizeBtn = document.getElementById("optimizeBtn");

optimizeBtn.addEventListener("click", async () => {

    const prompt = document.getElementById("prompt").value.trim();

    const aiModel = document.getElementById("model").value;

    const optimizationLevel = document.querySelector(
        'input[name="optimization"]:checked'
    ).value;

    const accessToken = localStorage.getItem("access");

    if (!prompt) {
        alert("Please enter a prompt.");
        return;
    }

    if (!aiModel) {
        alert("Please select an AI model.");
        return;
    }

    // Rough client-side estimate just to drive the live counter in
    // Stage 3 before the real numbers come back from the API.
    const estimatedTokens = Math.max(20, Math.round(prompt.split(/\s+/).length * 1.3));

    optimizeBtn.disabled = true;

    // Kick off the visual sequence (stages 1-4) and the network
    // request at the same time, so the animation never feels like
    // it's just waiting on a spinner.
    const animationPromise = window.AIOptimizerAnimation
        ? window.AIOptimizerAnimation.start(prompt, estimatedTokens)
        : Promise.resolve();

    const fetchPromise = fetch(
        "http://127.0.0.1:8000/api/optimize/",
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`
            },

            body: JSON.stringify({

                prompt: prompt,

                ai_model: aiModel,

                optimization_level: optimizationLevel

            })
        }
    );

    try {

        // Wait for both the intro animation stages and the real
        // response, whichever takes longer, so Stage 4 never gets
        // cut short if the API responds instantly.
        const [, response] = await Promise.all([animationPromise, fetchPromise]);

        const result = await response.json();

        console.log(result);

        if (result.success) {

            if (window.AIOptimizerAnimation) {
                await window.AIOptimizerAnimation.finish(result);
            }

            document.getElementById("optimizedPrompt").value =
                result.optimized_prompt;
            updateCharCount("optimizedPrompt", "optimizedPromptCharCount");

            document.getElementById("originalTotalTokens").textContent =
                result.original_total_tokens;

            document.getElementById("optimizedTotalTokens").textContent =
                result.optimized_total_tokens;

            document.getElementById("originalInputTokens").textContent =
                result.original_input_tokens;

            document.getElementById("originalOutputTokens").textContent =
                result.original_output_tokens;

            document.getElementById("optimizedInputTokens").textContent =
                result.optimized_input_tokens;

            document.getElementById("optimizedOutputTokens").textContent =
                result.optimized_output_tokens;

            document.getElementById("savedTokens").textContent =
                result.tokens_saved;

            document.getElementById("savedCost").textContent =
                result.estimated_cost_saved;

            document.getElementById("processingTime").textContent =
                result.processing_time + " s";

            document.getElementById("statusBadge").textContent =
                result.status;

            // Give the user a moment to read the completed state,
            // then dismiss the overlay.
            if (window.AIOptimizerAnimation) {
                setTimeout(() => window.AIOptimizerAnimation.hide(), 1400);
            }
        }
        else {

            if (window.AIOptimizerAnimation) {
                window.AIOptimizerAnimation.hide();
            }

            alert(result.message);
        }

    }
    catch (error) {

        console.error(error);

        if (window.AIOptimizerAnimation) {
            window.AIOptimizerAnimation.hide();
        }

        alert("Something went wrong.");
    }
    finally {
        optimizeBtn.disabled = false;
    }

});

const clearBtn = document.getElementById("clearBtn");
if (clearBtn) {
    clearBtn.addEventListener("click", () => {
        document.getElementById("prompt").value = "";
        document.getElementById("optimizedPrompt").value = "";
        updateCharCount("prompt", "promptCharCount");
        updateCharCount("optimizedPrompt", "optimizedPromptCharCount");
    });
}

const copyBtn = document.getElementById("copyBtn");
if (copyBtn) {
    copyBtn.addEventListener("click", async () => {
        const text = document.getElementById("optimizedPrompt").value;
        if (!text) return;
        try {
            await navigator.clipboard.writeText(text);
        } catch (err) {
            console.error("Copy failed:", err);
        }
    });
}

const downloadBtn = document.getElementById("downloadBtn");
if (downloadBtn) {
    downloadBtn.addEventListener("click", () => {
        const text = document.getElementById("optimizedPrompt").value;
        if (!text) return;
        const blob = new Blob([text], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "optimized-prompt.txt";
        a.click();
        URL.revokeObjectURL(url);
    });
}

// =====================================================
// LOGOUT
// =====================================================

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
    logoutBtn.addEventListener("click", logout);
    console.log("Logout button:", logoutBtn);
}

function logout() {
    console.log("Logout clicked");
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("username");
    localStorage.removeItem("email");

    window.location.href = "/login/";
}