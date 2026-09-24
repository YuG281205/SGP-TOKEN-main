// AI Token Optimizer — custom cursor + token reel
// Runs on both the login and signup pages. Skips itself on touch devices.

(function () {
  const isTouch = window.matchMedia("(hover: none), (pointer: coarse)").matches;
  if (isTouch) return;

  const dot = document.createElement("div");
  dot.className = "cursor-dot";
  const ring = document.createElement("div");
  ring.className = "cursor-ring";
  document.body.appendChild(dot);
  document.body.appendChild(ring);

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let ringX = mouseX;
  let ringY = mouseY;

  window.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    dot.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;
  });

  function loop() {
    ringX += (mouseX - ringX) * 0.18;
    ringY += (mouseY - ringY) * 0.18;
    ring.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  const hoverTargets = "a, button, input, textarea, select, .token-chip, .custom-select-trigger, .custom-select-option";
  document.addEventListener("mouseover", (e) => {
    if (e.target.closest(hoverTargets)) ring.classList.add("hover");
  });
  document.addEventListener("mouseout", (e) => {
    if (e.target.closest(hoverTargets)) ring.classList.remove("hover");
  });
  document.addEventListener("mousedown", () => ring.classList.add("down"));
  document.addEventListener("mouseup", () => ring.classList.remove("down"));

  // hide the native/custom cursor gracefully when it leaves the window
  document.addEventListener("mouseleave", () => {
    dot.style.opacity = "0";
    ring.style.opacity = "0";
  });
  document.addEventListener("mouseenter", () => {
    dot.style.opacity = "1";
    ring.style.opacity = "0.55";
  });
})();

// ---------------------------------------------------------------
// Token reel: two lanes of chips drifting past each other, with a
// handful "compressing" (turning teal) to represent prompt
// optimization — the core idea of the product.
// ---------------------------------------------------------------
(function () {
  const lane1 = document.querySelector(".reel-lane.lane-1");
  const lane2 = document.querySelector(".reel-lane.lane-2");
  const readout = document.querySelector(".reel-readout strong");
  if (!lane1 || !lane2) return;

  const words = [
    "The", "quick", "system", "prompt", "should", "return", "concise",
    "structured", "JSON", "with", "minimal", "redundant", "context", "tokens",
    "while", "preserving", "meaning", "and", "instruction", "fidelity"
  ];

  function buildLane(lane, compressEvery) {
    let html = "";
    for (let i = 0; i < 24; i++) {
      const word = words[i % words.length];
      const compressed = compressEvery && i % compressEvery === 0;
      html += `<span class="token-chip${compressed ? " compressed" : ""}">${word}</span>`;
    }
    lane.innerHTML = html + html; // duplicate for seamless loop
  }

  buildLane(lane1, 5);
  buildLane(lane2, 4);

  if (readout) {
    let saved = 0;
    setInterval(() => {
      saved = (saved + Math.floor(Math.random() * 40) + 10) % 9000;
      readout.textContent = saved.toLocaleString() + " tokens saved";
    }, 1400);
  }
})();