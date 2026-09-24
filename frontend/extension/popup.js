// =========================================
// API CONFIGURATION
// =========================================

const API_BASE_URL = "http://127.0.0.1:8000/api";


// =========================================
// DOM ELEMENTS
// =========================================

// Login
const loginSection = document.getElementById("loginSection");
const optimizerSection = document.getElementById("optimizerSection");

const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");

const loginBtn = document.getElementById("loginBtn");
const loginMessage = document.getElementById("loginMessage");


// User
const loggedInUser = document.getElementById("loggedInUser");
const logoutBtn = document.getElementById("logoutBtn");


// Mode
const fastModeBtn = document.getElementById("fastModeBtn");
const analyzeModeBtn = document.getElementById("analyzeModeBtn");


// Prompt
const promptInput = document.getElementById("prompt");


// Settings
const aiModel = document.getElementById("aiModel");
const optimizationLevel = document.getElementById("optimizationLevel");

const optimizationLevelGroup =
    document.getElementById("optimizationLevelGroup");


// Action
const optimizeBtn = document.getElementById("optimizeBtn");
const optimizeMessage = document.getElementById("optimizeMessage");


// Fast result
const fastResult = document.getElementById("fastResult");
const fastOptimizedPrompt =
    document.getElementById("fastOptimizedPrompt");

const fastStatus = document.getElementById("fastStatus");


// Analysis result
const analysisResult = document.getElementById("analysisResult");

const originalTokens =
    document.getElementById("originalTokens");

const optimizedTokens =
    document.getElementById("optimizedTokens");

const tokensSaved =
    document.getElementById("tokensSaved");

const reductionPercent =
    document.getElementById("reductionPercent");

const semanticAccuracy =
    document.getElementById("semanticAccuracy");

const qualityRating =
    document.getElementById("qualityRating");

const optimizationScore =
    document.getElementById("optimizationScore");

const costSaved =
    document.getElementById("costSaved");

const optimizedPrompt =
    document.getElementById("optimizedPrompt");

const originalPrompt =
    document.getElementById("originalPrompt");


// =========================================
// CURRENT MODE
// =========================================

let currentMode = "fast";


// =========================================
// PAGE LOAD
// =========================================

document.addEventListener("DOMContentLoaded", async () => {

    const data = await chrome.storage.local.get([
        "accessToken",
        "refreshToken",
        "username"
    ]);

    if (data.accessToken) {

        loggedInUser.textContent =
            data.username || "User";

        showOptimizer();

    } else {

        showLogin();

    }

    // Load the latest prompt detected from ChatGPT
    await loadDetectedPrompt();

});


// =========================================
// LOGIN
// =========================================

loginBtn.addEventListener("click", login);


// Allow Enter key
passwordInput.addEventListener("keydown", (event) => {

    if (event.key === "Enter") {
        login();
    }

});


async function login() {

    const username =
        usernameInput.value.trim();

    const password =
        passwordInput.value;

    if (!username || !password) {

        showLoginMessage(
            "Please enter username and password.",
            true
        );

        return;
    }


    loginBtn.disabled = true;
    loginBtn.textContent = "Logging in...";

    showLoginMessage("", false);


    try {

        const response = await fetch(
            `${API_BASE_URL}/login/`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    username: username,
                    password: password
                })
            }
        );


        const data = await response.json();


        if (!response.ok) {

            let message =
                data.message ||
                "Login failed.";

            if (typeof data === "object") {

                if (data.detail) {
                    message = data.detail;
                }

                if (data.non_field_errors) {
                    message =
                        data.non_field_errors[0];
                }
            }

            throw new Error(message);
        }


        // =====================================
        // SAVE JWT
        // =====================================

        await chrome.storage.local.set({

            accessToken: data.access,

            refreshToken: data.refresh,

            username:
                data.username || username

        });


        loggedInUser.textContent =
            data.username || username;


        passwordInput.value = "";

        showOptimizer();

        // Load ChatGPT prompt after login
        await loadDetectedPrompt();


    } catch (error) {

        console.error(
            "Login Error:",
            error
        );

        showLoginMessage(
            error.message ||
            "Unable to login.",
            true
        );

    } finally {

        loginBtn.disabled = false;

        loginBtn.textContent = "Login";

    }

}


// =========================================
// CHATGPT PROMPT DETECTION
// =========================================

// Load the prompt detected by content.js
async function loadDetectedPrompt() {

    try {

        const data =
            await chrome.storage.local.get([
                "detectedPrompt",
                "detectedSource"
            ]);


        if (
            data.detectedPrompt &&
            data.detectedSource === "chatgpt"
        ) {

            promptInput.value =
                data.detectedPrompt;

            showOptimizeMessage(
                "Prompt detected from ChatGPT.",
                false
            );

        }

    } catch (error) {

        console.error(
            "Prompt Detection Error:",
            error
        );

    }

}


// Receive a prompt while the popup is open
chrome.runtime.onMessage.addListener(
    (message) => {

        if (
            message &&
            message.type === "PROMPT_DETECTED" &&
            message.prompt
        ) {

            promptInput.value =
                message.prompt;

            showOptimizeMessage(
                "Prompt detected from ChatGPT.",
                false
            );

        }

    }
);


// =========================================
// MODE SELECTION
// =========================================

fastModeBtn.addEventListener(
    "click",
    () => setMode("fast")
);


analyzeModeBtn.addEventListener(
    "click",
    () => setMode("analyze")
);


function setMode(mode) {

    currentMode = mode;


    // =====================================
    // FAST MODE
    // =====================================

    if (mode === "fast") {

        fastModeBtn.classList.add("active");

        analyzeModeBtn.classList.remove("active");

        optimizeBtn.textContent =
            "Fast Optimize";


        optimizationLevelGroup.classList.remove(
            "hidden"
        );


        // Results
        analysisResult.classList.add(
            "hidden"
        );

        return;
    }


    // =====================================
    // ANALYZE MODE
    // =====================================

    fastModeBtn.classList.remove("active");

    analyzeModeBtn.classList.add("active");

    optimizeBtn.textContent =
        "Analyze & Optimize";


    optimizationLevelGroup.classList.remove(
        "hidden"
    );


    fastResult.classList.add(
        "hidden"
    );

}


// =========================================
// OPTIMIZE BUTTON
// =========================================

optimizeBtn.addEventListener(
    "click",
    optimizePrompt
);


async function optimizePrompt() {

    const prompt =
        promptInput.value.trim();

    const model =
        aiModel.value;

    const level =
        optimizationLevel.value;


    // =====================================
    // VALIDATION
    // =====================================

    if (!prompt) {

        showOptimizeMessage(
            "Please enter a prompt.",
            true
        );

        promptInput.focus();

        return;
    }


    if (prompt.length < 5) {

        showOptimizeMessage(
            "Prompt must contain at least 5 characters.",
            true
        );

        return;
    }


    // =====================================
    // UI STATE
    // =====================================

    optimizeBtn.disabled = true;

    optimizeBtn.textContent =
        currentMode === "fast"
            ? "Optimizing..."
            : "Analyzing...";


    showOptimizeMessage(
        "Processing your prompt...",
        false
    );


    fastResult.classList.add(
        "hidden"
    );

    analysisResult.classList.add(
        "hidden"
    );


    try {

        // =================================
        // GET ACCESS TOKEN
        // =================================

        const storage =
            await chrome.storage.local.get([
                "accessToken"
            ]);


        if (!storage.accessToken) {

            showLogin();

            throw new Error(
                "Session expired. Please login again."
            );
        }


        // =================================
        // SELECT API
        // =================================

        let endpoint;


        if (currentMode === "fast") {

            endpoint =
                `${API_BASE_URL}/prompting/`;

        } else {

            endpoint =
                `${API_BASE_URL}/optimize/`;

        }


        // =================================
        // API REQUEST
        // =================================

        const response = await fetch(
            endpoint,
            {
                method: "POST",

                headers: {

                    "Content-Type":
                        "application/json",

                    "Authorization":
                        `Bearer ${storage.accessToken}`
                },

                body: JSON.stringify({

                    prompt: prompt,

                    ai_model: model,

                    optimization_level: level

                })
            }
        );


        // =================================
        // HANDLE TOKEN EXPIRY
        // =================================

        if (response.status === 401) {

            await chrome.storage.local.remove([
                "accessToken",
                "refreshToken",
                "username"
            ]);

            showLogin();

            throw new Error(
                "Session expired. Please login again."
            );
        }


        const data =
            await response.json();


        // =================================
        // API ERROR
        // =================================

        if (!response.ok) {

            let message =
                data.message ||
                data.detail ||
                "Optimization failed.";

            throw new Error(message);
        }


        // =================================
        // SUCCESS
        // =================================

        if (!data.success) {

            throw new Error(
                data.message ||
                "Optimization failed."
            );
        }


        if (currentMode === "fast") {

            displayFastResult(data);

        } else {

            displayAnalysisResult(data);

        }


        showOptimizeMessage(
            "Optimization completed successfully.",
            false
        );


    } catch (error) {

        console.error(
            "Optimization Error:",
            error
        );

        showOptimizeMessage(
            error.message ||
            "Something went wrong.",
            true
        );

    } finally {

        optimizeBtn.disabled = false;

        optimizeBtn.textContent =
            currentMode === "fast"
                ? "Fast Optimize"
                : "Analyze & Optimize";

    }

}


// =========================================
// FAST RESULT
// =========================================

function displayFastResult(data) {

    fastResult.classList.remove(
        "hidden"
    );

    const optimized =
        data.optimized_prompt ||
        "No optimized prompt returned.";

    fastOptimizedPrompt.textContent =
        optimized;

    fastStatus.textContent =
        data.status ||
        "Processing";


    // Send optimized prompt back to ChatGPT
    chrome.tabs.query(
        {
            active: true,
            currentWindow: true
        },
        (tabs) => {

            if (!tabs || !tabs[0]) {
                return;
            }

            chrome.tabs.sendMessage(
                tabs[0].id,
                {
                    type: "INSERT_OPTIMIZED_PROMPT",
                    prompt: optimized
                }
            ).catch((error) => {

                console.log(
                    "Could not send optimized prompt to ChatGPT:",
                    error
                );

            });

        }
    );
}

// =========================================
// ANALYSIS RESULT
// =========================================

function displayAnalysisResult(data) {

    analysisResult.classList.remove(
        "hidden"
    );


    // =====================================
    // TOKEN VALUES
    // =====================================

    const original =
        Number(
            data.original_tokens || 0
        );


    const optimized =
        Number(
            data.optimized_tokens || 0
        );


    const saved =
        Number(
            data.tokens_saved || 0
        );


    // =====================================
    // REDUCTION %
    // =====================================

    let reduction = 0;


    if (original > 0) {

        reduction =
            ((original - optimized) /
                original) * 100;

    }


    // =====================================
    // DISPLAY
    // =====================================

    originalTokens.textContent =
        formatNumber(original);


    optimizedTokens.textContent =
        formatNumber(optimized);


    tokensSaved.textContent =
        formatNumber(saved);


    reductionPercent.textContent =
        `${reduction.toFixed(2)}%`;


    semanticAccuracy.textContent =
        formatValue(
            data.semantic_accuracy
        );


    qualityRating.textContent =
        formatValue(
            data.quality_rating
        );


    optimizationScore.textContent =
        formatValue(
            data.optimization_score
        );


    costSaved.textContent =
        formatCost(
            data.estimated_cost_saved
        );


    optimizedPrompt.textContent =
        data.optimized_prompt ||
        "No optimized prompt returned.";


    originalPrompt.textContent =
        data.original_prompt ||
        "No original prompt returned.";

}


// =========================================
// FORMAT NUMBER
// =========================================

function formatNumber(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return "-";

    }

    return Number(value).toLocaleString();

}


// =========================================
// FORMAT VALUE
// =========================================

function formatValue(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return "-";

    }

    return value;

}


// =========================================
// FORMAT COST
// =========================================

function formatCost(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return "-";

    }

    const number =
        Number(value);

    if (Number.isNaN(number)) {
        return value;
    }

    return `$${number.toFixed(6)}`;

}


// =========================================
// LOGOUT
// =========================================

logoutBtn.addEventListener(
    "click",
    async () => {

        await chrome.storage.local.remove([
            "accessToken",
            "refreshToken",
            "username"
        ]);

        promptInput.value = "";

        showLogin();

    }
);


// =========================================
// SHOW LOGIN
// =========================================

function showLogin() {

    loginSection.classList.remove(
        "hidden"
    );

    optimizerSection.classList.add(
        "hidden"
    );

    usernameInput.focus();

}


// =========================================
// SHOW OPTIMIZER
// =========================================

function showOptimizer() {

    loginSection.classList.add(
        "hidden"
    );

    optimizerSection.classList.remove(
        "hidden"
    );

    setMode(currentMode);

}


// =========================================
// LOGIN MESSAGE
// =========================================

function showLoginMessage(
    message,
    isError
) {

    loginMessage.textContent =
        message;


    loginMessage.style.color =
        isError
            ? "#dc2626"
            : "#16a34a";

}


// =========================================
// OPTIMIZATION MESSAGE
// =========================================

function showOptimizeMessage(
    message,
    isError
) {

    optimizeMessage.textContent =
        message;


    optimizeMessage.style.color =
        isError
            ? "#dc2626"
            : "#16a34a";

}