console.log("SGP Token Optimizer background service worker started.");

// Extension installation event
chrome.runtime.onInstalled.addListener(() => {
    console.log("SGP Token Optimizer installed successfully.");
});