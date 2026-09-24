    console.log("Prompting JS Loaded");

    // =====================================================
    // USER
    // =====================================================

    const username = localStorage.getItem("username");

    const usernameEl = document.getElementById("username");
    const welcomeUserEl = document.getElementById("welcomeUser");

    if (usernameEl) {
        usernameEl.innerText = username || "";
    }

    if (welcomeUserEl) {
        welcomeUserEl.innerText = username || "";
    }


    // =====================================================
    // CHARACTER COUNT
    // =====================================================

    function updateCharCount(textareaId, countId) {

        const textarea = document.getElementById(textareaId);
        const countEl = document.getElementById(countId);

        if (!textarea || !countEl) {
            return;
        }

        const len = textarea.value.length;

        countEl.textContent =
            `${len} character${len === 1 ? "" : "s"}`;
    }


    // =====================================================
    // ORIGINAL PROMPT CHARACTER COUNT
    // =====================================================

    const promptTextareaEl =
        document.getElementById("prompt");

    if (promptTextareaEl) {

        updateCharCount(
            "prompt",
            "promptCharCount"
        );

        promptTextareaEl.addEventListener(
            "input",
            () => {

                updateCharCount(
                    "prompt",
                    "promptCharCount"
                );

            }
        );
    }


    // =====================================================
    // OPTIMIZED PROMPT CHARACTER COUNT
    // =====================================================

    updateCharCount(
        "optimizedPrompt",
        "optimizedPromptCharCount"
    );


    // =====================================================
    // OPTIMIZE BUTTON
    // =====================================================

    const optimizeBtn =
        document.getElementById("optimizeBtn");

    if (optimizeBtn) {

        optimizeBtn.addEventListener(
            "click",
            async () => {

                // =================================================
                // GET INPUTS
                // =================================================

                const prompt =
                    document.getElementById("prompt")
                        .value
                        .trim();

                const aiModel =
                    document.getElementById("model")
                        .value;

                const optimizationElement =
                    document.querySelector(
                        'input[name="optimization"]:checked'
                    );

                const optimizationLevel =
                    optimizationElement
                        ? optimizationElement.value
                        : "balanced";

                const accessToken =
                    localStorage.getItem("access");


                // =================================================
                // VALIDATION
                // =================================================

                if (!prompt) {

                    alert(
                        "Please enter a prompt."
                    );

                    return;
                }


                if (!aiModel) {

                    alert(
                        "Please select an AI model."
                    );

                    return;
                }


                if (!accessToken) {

                    alert(
                        "Authentication token not found."
                    );

                    return;
                }


                // =================================================
                // DISABLE BUTTON
                // =================================================

                optimizeBtn.disabled = true;


                // =================================================
                // START ANIMATION
                // =================================================

                const estimatedTokens =
                    Math.max(
                        20,
                        Math.round(
                            prompt.split(/\s+/).length * 1.3
                        )
                    );

                const animationPromise =
                    window.AIOptimizerAnimation
                        ? window.AIOptimizerAnimation.start(
                            prompt,
                            estimatedTokens
                        )
                        : Promise.resolve();


                // =================================================
                // PROMPTING API
                // =================================================

                const fetchPromise =
                    fetch(
                        "http://127.0.0.1:8000/api/prompting/",
                        {
                            method: "POST",

                            headers: {

                                "Content-Type":
                                    "application/json",

                                "Authorization":
                                    `Bearer ${accessToken}`
                            },

                            body: JSON.stringify({

                                prompt: prompt,

                                ai_model: aiModel,

                                optimization_level:
                                    optimizationLevel

                            })
                        }
                    );


                // =================================================
                // API RESPONSE
                // =================================================

                try {

                    const [
                        ,
                        response
                    ] = await Promise.all([
                        animationPromise,
                        fetchPromise
                    ]);


                    // =================================================
                    // PARSE RESPONSE
                    // =================================================

                    const result =
                        await response.json();

                    console.log(
                        "Prompting API Response:",
                        result
                    );


                    // =================================================
                    // HTTP ERROR
                    // =================================================

                    if (!response.ok) {

                        if (
                            window.AIOptimizerAnimation
                        ) {

                            window.AIOptimizerAnimation.hide();
                        }

                        alert(
                            result.message ||
                            "Prompt optimization failed."
                        );

                        return;
                    }


                    // =================================================
                    // API SUCCESS
                    // =================================================

                    if (result.success) {


                        // =============================================
                        // FINISH ANIMATION
                        // =============================================

                        if (
                            window.AIOptimizerAnimation
                        ) {

                            await window.AIOptimizerAnimation
                                .finish(result);
                        }


                        // =============================================
                        // SHOW OPTIMIZED PROMPT IMMEDIATELY
                        // =============================================

                        const optimizedPrompt =
                            document.getElementById(
                                "optimizedPrompt"
                            );

                        if (optimizedPrompt) {

                            optimizedPrompt.value =
                                result.optimized_prompt;

                            updateCharCount(
                                "optimizedPrompt",
                                "optimizedPromptCharCount"
                            );
                        }


                        // =============================================
                        // RESET CALCULATION VALUES
                        // =============================================
                        //
                        // The optimized prompt is available now.
                        //
                        // Token calculation, semantic accuracy,
                        // optimization score, quality rating, etc.
                        // are calculated in the background.
                        //
                        // =============================================

                        setElement(
                            "originalTotalTokens",
                            "Calculating..."
                        );

                        setElement(
                            "optimizedTotalTokens",
                            "Calculating..."
                        );

                        setElement(
                            "originalInputTokens",
                            "Calculating..."
                        );

                        setElement(
                            "originalOutputTokens",
                            "Calculating..."
                        );

                        setElement(
                            "optimizedInputTokens",
                            "Calculating..."
                        );

                        setElement(
                            "optimizedOutputTokens",
                            "Calculating..."
                        );

                        setElement(
                            "savedTokens",
                            "Calculating..."
                        );

                        setElement(
                            "savedCost",
                            "Calculating..."
                        );

                        setElement(
                            "processingTime",
                            "Processing..."
                        );


                        // =============================================
                        // HIDE ANIMATION
                        // =============================================

                        if (
                            window.AIOptimizerAnimation
                        ) {

                            setTimeout(
                                () => {

                                    window.AIOptimizerAnimation
                                        .hide();

                                },
                                800
                            );
                        }


                        // =============================================
                        // CONSOLE
                        // =============================================

                        console.log(
                            "Optimized prompt returned."
                        );

                        console.log(
                            "Background calculations are running."
                        );

                    }
                    else {

                        if (
                            window.AIOptimizerAnimation
                        ) {

                            window.AIOptimizerAnimation.hide();
                        }

                        alert(
                            result.message ||
                            "Optimization failed."
                        );
                    }

                }
                catch (error) {

                    console.error(
                        "Prompting API Error:",
                        error
                    );


                    if (
                        window.AIOptimizerAnimation
                    ) {

                        window.AIOptimizerAnimation.hide();
                    }


                    alert(
                        "Something went wrong."
                    );

                }
                finally {

                    // =============================================
                    // ENABLE BUTTON
                    // =============================================

                    optimizeBtn.disabled = false;
                }

            }
        );
    }


    // =====================================================
    // HELPER
    // =====================================================

    function setElement(
        elementId,
        value
    ) {

        const element =
            document.getElementById(elementId);

        if (!element) {
            return;
        }

        element.textContent = value;
    }


    // =====================================================
    // CLEAR BUTTON
    // =====================================================

    const clearBtn =
        document.getElementById("clearBtn");

    if (clearBtn) {

        clearBtn.addEventListener(
            "click",
            () => {

                const prompt =
                    document.getElementById("prompt");

                const optimizedPrompt =
                    document.getElementById(
                        "optimizedPrompt"
                    );


                if (prompt) {
                    prompt.value = "";
                }


                if (optimizedPrompt) {
                    optimizedPrompt.value = "";
                }


                updateCharCount(
                    "prompt",
                    "promptCharCount"
                );

                updateCharCount(
                    "optimizedPrompt",
                    "optimizedPromptCharCount"
                );


                // =============================================
                // RESET STATISTICS
                // =============================================

                setElement(
                    "originalTotalTokens",
                    "-"
                );

                setElement(
                    "optimizedTotalTokens",
                    "-"
                );

                setElement(
                    "originalInputTokens",
                    "-"
                );

                setElement(
                    "originalOutputTokens",
                    "-"
                );

                setElement(
                    "optimizedInputTokens",
                    "-"
                );

                setElement(
                    "optimizedOutputTokens",
                    "-"
                );

                setElement(
                    "savedTokens",
                    "-"
                );

                setElement(
                    "savedCost",
                    "-"
                );

                setElement(
                    "processingTime",
                    "-"
                );

            }
        );
    }


    // =====================================================
    // COPY BUTTON
    // =====================================================

    const copyBtn =
        document.getElementById("copyBtn");

    if (copyBtn) {

        copyBtn.addEventListener(
            "click",
            async () => {

                const optimizedPrompt =
                    document.getElementById(
                        "optimizedPrompt"
                    );


                if (!optimizedPrompt) {
                    return;
                }


                const text =
                    optimizedPrompt.value;


                if (!text) {
                    return;
                }


                try {

                    await navigator.clipboard
                        .writeText(text);

                    console.log(
                        "Optimized prompt copied."
                    );

                }
                catch (error) {

                    console.error(
                        "Copy failed:",
                        error
                    );

                }

            }
        );
    }


    // =====================================================
    // DOWNLOAD BUTTON
    // =====================================================

    const downloadBtn =
        document.getElementById(
            "downloadBtn"
        );

    if (downloadBtn) {

        downloadBtn.addEventListener(
            "click",
            () => {

                const optimizedPrompt =
                    document.getElementById(
                        "optimizedPrompt"
                    );


                if (!optimizedPrompt) {
                    return;
                }


                const text =
                    optimizedPrompt.value;


                if (!text) {
                    return;
                }


                const blob =
                    new Blob(
                        [text],
                        {
                            type:
                                "text/plain"
                        }
                    );


                const url =
                    URL.createObjectURL(blob);


                const a =
                    document.createElement(
                        "a"
                    );


                a.href = url;

                a.download =
                    "optimized-prompt.txt";

                a.click();


                URL.revokeObjectURL(url);

            }
        );
    }


    // =====================================================
    // LOGOUT
    // =====================================================

    const logoutBtn =
        document.getElementById(
            "logoutBtn"
        );

    if (logoutBtn) {

        logoutBtn.addEventListener(
            "click",
            logout
        );

        console.log(
            "Logout button:",
            logoutBtn
        );
    }


    function logout() {

        console.log(
            "Logout clicked"
        );


        localStorage.removeItem(
            "access"
        );

        localStorage.removeItem(
            "refresh"
        );

        localStorage.removeItem(
            "username"
        );

        localStorage.removeItem(
            "email"
        );


        window.location.href =
            "/login/";
    }