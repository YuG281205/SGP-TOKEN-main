// =========================================
// SGP TOKEN OPTIMIZER
// BACKGROUND SERVICE WORKER
// =========================================

const API_BASE_URL =
    "http://127.0.0.1:8000/api";


// =========================================
// MESSAGE LISTENER
// =========================================

chrome.runtime.onMessage.addListener(
    (message, sender, sendResponse) => {

        if (!message) {
            return;
        }


        // =====================================
        // AUTOMATIC OPTIMIZATION REQUEST
        // =====================================

        if (
            message.type ===
            "AUTO_OPTIMIZE_PROMPT"
        ) {

            autoOptimizePrompt(
                message.prompt,
                sender.tab
            );

        }

    }
);


// =========================================
// AUTO OPTIMIZE PROMPT
// =========================================

async function autoOptimizePrompt(
    prompt,
    tab
) {

    if (!prompt) {
        return;
    }


    console.log(
        "SGP Token Optimizer: Auto optimization started."
    );


    try {

        // =====================================
        // GET LOGIN TOKEN
        // =====================================

        const data =
            await chrome.storage.local.get([
                "accessToken"
            ]);


        const accessToken =
            data.accessToken;


        if (!accessToken) {

            console.log(
                "SGP Token Optimizer: User is not logged in."
            );

            sendMessageToChatGPT(
                tab,
                {
                    type:
                        "AUTO_OPTIMIZATION_FAILED"
                }
            );

            return;

        }


        // =====================================
        // CALL DJANGO API
        // =====================================

        const response =
            await fetch(
                `${API_BASE_URL}/prompting/`,
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

                        ai_model: "gemini",

                        optimization_level:
                            "balanced"

                    })
                }
            );


        // =====================================
        // CHECK RESPONSE
        // =====================================

        if (!response.ok) {

            console.error(
                "SGP Token Optimizer: API error:",
                response.status
            );

            sendMessageToChatGPT(
                tab,
                {
                    type:
                        "AUTO_OPTIMIZATION_FAILED"
                }
            );

            return;

        }


        const result =
            await response.json();


        console.log(
            "SGP Token Optimizer: API response:",
            result
        );


        // =====================================
        // GET OPTIMIZED PROMPT
        // =====================================

        const optimizedPrompt =
            result.optimized_prompt;


        if (!optimizedPrompt) {

            console.error(
                "SGP Token Optimizer: No optimized prompt returned."
            );

            sendMessageToChatGPT(
                tab,
                {
                    type:
                        "AUTO_OPTIMIZATION_FAILED"
                }
            );

            return;

        }


        // =====================================
        // SEND OPTIMIZED PROMPT TO CHATGPT
        // =====================================

        sendMessageToChatGPT(
            tab,
            {
                type:
                    "AUTO_OPTIMIZED_PROMPT",

                prompt:
                    optimizedPrompt
            }
        );


        console.log(
            "SGP Token Optimizer: Optimized prompt sent to ChatGPT."
        );


    } catch (error) {

        console.error(
            "SGP Token Optimizer: Auto optimization error:",
            error
        );


        sendMessageToChatGPT(
            tab,
            {
                type:
                    "AUTO_OPTIMIZATION_FAILED"
            }
        );

    }

}


// =========================================
// SEND MESSAGE TO CHATGPT CONTENT SCRIPT
// =========================================

function sendMessageToChatGPT(
    tab,
    message
) {

    if (!tab || !tab.id) {

        console.log(
            "SGP Token Optimizer: ChatGPT tab not found."
        );

        return;

    }


    chrome.tabs.sendMessage(
        tab.id,
        message
    ).catch((error) => {

        console.log(
            "SGP Token Optimizer: Could not send message to ChatGPT:",
            error
        );

    });

}