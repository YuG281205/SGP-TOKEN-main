// =========================================
// SGP TOKEN OPTIMIZER
// CHATGPT CONTENT SCRIPT
// =========================================

(function () {

    "use strict";


    let lastPrompt = "";


    // =========================================
    // CHECK ELEMENT VISIBILITY
    // =========================================

    function isVisible(element) {

        if (!element) {
            return false;
        }

        const style =
            window.getComputedStyle(element);

        const rect =
            element.getBoundingClientRect();

        return (
            style.display !== "none" &&
            style.visibility !== "hidden" &&
            rect.width > 0 &&
            rect.height > 0
        );

    }


    // =========================================
    // FIND CHATGPT PROMPT BOX
    // =========================================

    function findPromptBox() {

        const elements =
            document.querySelectorAll(
                'textarea, div[contenteditable="true"]'
            );


        const visibleElements =
            Array.from(elements)
                .filter(isVisible);


        // Prefer contenteditable
        const contentEditable =
            visibleElements.find(
                element =>
                    element.getAttribute(
                        "contenteditable"
                    ) === "true"
            );


        if (contentEditable) {
            return contentEditable;
        }


        // Fallback to textarea
        return visibleElements[
            visibleElements.length - 1
        ] || null;

    }


    // =========================================
    // GET PROMPT TEXT
    // =========================================

    function getPromptText(element) {

        if (!element) {
            return "";
        }


        if (
            element.tagName.toLowerCase() ===
            "textarea"
        ) {

            return element.value.trim();

        }


        return element.innerText.trim();

    }


    // =========================================
    // SAVE DETECTED PROMPT
    // =========================================

    function savePrompt(element) {

        const prompt =
            getPromptText(element);


        if (!prompt) {
            return;
        }


        if (prompt === lastPrompt) {
            return;
        }


        lastPrompt = prompt;


        chrome.storage.local.set({

            detectedPrompt: prompt,

            detectedAt: Date.now(),

            detectedSource: "chatgpt"

        });


        chrome.runtime.sendMessage({

            type: "PROMPT_DETECTED",

            prompt: prompt

        }).catch(() => {

            // Popup is probably closed

        });

    }


    // =========================================
    // ATTACH INPUT LISTENER
    // =========================================

    function attachListener(element) {

        if (!element) {
            return;
        }


        if (
            element.dataset
                .sgpListenerAttached === "true"
        ) {

            return;
        }


        element.dataset
            .sgpListenerAttached = "true";


        element.addEventListener(
            "input",
            () => {

                savePrompt(element);

            }
        );

    }


    // =========================================
    // DETECT CHATGPT TEXTBOX
    // =========================================

    function detectPromptBox() {

        const promptBox =
            findPromptBox();


        if (promptBox) {

            attachListener(promptBox);

        }

    }


    // =========================================
    // INSERT OPTIMIZED PROMPT
    // =========================================

    function insertOptimizedPrompt(prompt) {

        if (!prompt) {
            return;
        }


        const promptBox =
            findPromptBox();


        if (!promptBox) {

            console.log(
                "SGP Token Optimizer: ChatGPT textbox not found."
            );

            return;

        }


        // =====================================
        // TEXTAREA
        // =====================================

        if (
            promptBox.tagName.toLowerCase() ===
            "textarea"
        ) {

            const setter =
                Object.getOwnPropertyDescriptor(
                    HTMLTextAreaElement.prototype,
                    "value"
                ).set;


            setter.call(
                promptBox,
                prompt
            );


            promptBox.dispatchEvent(
                new Event(
                    "input",
                    {
                        bubbles: true
                    }
                )
            );

            promptBox.dispatchEvent(
                new Event(
                    "change",
                    {
                        bubbles: true
                    }
                )
            );

        }


        // =====================================
        // CONTENTEDITABLE
        // =====================================

        else {

            promptBox.focus();


            // Clear existing content
            promptBox.innerHTML = "";


            // Insert optimized prompt
            const textNode =
                document.createTextNode(
                    prompt
                );


            promptBox.appendChild(
                textNode
            );


            // Notify React / ChatGPT
            promptBox.dispatchEvent(
                new InputEvent(
                    "input",
                    {
                        bubbles: true,
                        inputType: "insertText",
                        data: prompt
                    }
                )
            );

        }


        // Keep cursor/focus in textbox
        promptBox.focus();


        console.log(
            "SGP Token Optimizer: Optimized prompt inserted into ChatGPT."
        );

    }


    // =========================================
    // RECEIVE MESSAGE FROM POPUP
    // =========================================

    chrome.runtime.onMessage.addListener(
        (message) => {

            if (
                message &&
                message.type ===
                    "INSERT_OPTIMIZED_PROMPT"
            ) {

                insertOptimizedPrompt(
                    message.prompt
                );

            }

        }
    );


    // =========================================
    // INITIAL DETECTION
    // =========================================

    detectPromptBox();


    // =========================================
    // CHATGPT DYNAMIC DOM
    // =========================================

    const observer =
        new MutationObserver(() => {

            detectPromptBox();

        });


    observer.observe(
        document.body,
        {
            childList: true,
            subtree: true
        }
    );


    // =========================================
    // FALLBACK CHECK
    // =========================================

    setInterval(
        detectPromptBox,
        2000
    );


})();