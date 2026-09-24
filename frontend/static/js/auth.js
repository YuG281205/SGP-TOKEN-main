(function () {
    const body = document.body;
    const redirectUrl = body.dataset.redirect || "/login/";
    let seconds = parseInt(body.dataset.seconds || "10", 10);

    const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches;

    // Build the token ring (16 chips arranged via CSS custom property --i)
    const ring = document.getElementById("tokenRing");
    if (ring) {
        const CHIP_COUNT = 16;
        for (let i = 0; i < CHIP_COUNT; i++) {
            const chip = document.createElement("span");
            chip.className = "chip";
            chip.style.setProperty("--i", i);
            ring.appendChild(chip);
        }
    }

    // Countdown + redirect
    const countdownEl = document.getElementById("countdown");

    function tick() {
        if (!countdownEl) return;
        countdownEl.textContent = seconds;

        if (!prefersReducedMotion) {
            countdownEl.classList.remove("tick");
            // force reflow so the animation can restart every second
            void countdownEl.offsetWidth;
            countdownEl.classList.add("tick");
        }

        if (seconds <= 0) {
            window.location.href = redirectUrl;
            return;
        }
        seconds--;
    }

    window.addEventListener("load", function () {
        tick();
        setInterval(tick, 1000);
    });
})();