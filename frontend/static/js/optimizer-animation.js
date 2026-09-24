/* =========================================================
   AI PROCESSING OVERLAY — ANIMATION CONTROLLER
   Vanilla JS. No dependencies.

   Public API (attached to window.AIOptimizerAnimation):
     start(promptText, estimatedTokens, options)
     showStage(stageNumber)
     updateStatus(text)
     updateProgress(percent)
     animateTokenCounter(el, from, to, duration)
     typeOptimizedPrompt(text)
     finish(resultData, options)   -> runs stage 5 + 6 with real numbers, then resolves
     cancel()                      -> aborts whatever is running and hides the overlay
     reset()

   Usage from dashboard.js:
     try {
       await AIOptimizerAnimation.start(promptText);
       const result = await fetchOptimizedPrompt(promptText); // your API call
       await AIOptimizerAnimation.finish(result);
     } catch (err) {
       if (err && err.cancelled) {
         // user hit the cancel button — abort your fetch/controller here if needed
       } else {
         throw err;
       }
     }
   ========================================================= */

(function () {
  "use strict";

  const STAGE_MESSAGES = {
    1: ["Receiving prompt..."],
    2: [
      "Analyzing prompt...",
      "Understanding intent...",
      "Extracting key instructions...",
      "Removing unnecessary words...",
    ],
    3: [
      "Removing filler words...",
      "Compressing instructions...",
      "Optimizing locally...",
    ],
    4: [
      "Sending to Gemini...",
      "Semantic optimization...",
      "Improving clarity...",
      "Reducing token usage...",
    ],
    5: ["Benchmarking results..."],
    6: ["Optimization complete"],
  };

  // Rough progress checkpoints per stage (animated toward, not jumped to)
  const STAGE_PROGRESS = { 1: 8, 2: 32, 3: 55, 4: 82, 5: 96, 6: 100 };

  // Typing speed cap for the final "typed" prompt reveal — this is what
  // used to be a per-character setTimeout loop. It's now a single
  // requestAnimationFrame tween with a hard ceiling, so long prompts
  // don't take forever to finish typing out.
  const TYPE_MIN_MS = 220;
  const TYPE_MAX_MS = 650;
  const TYPE_MS_PER_CHAR = 2.5;

  let els = {};
  let currentStage = 0;

  // --- cancellation state ---
  let isCancelled = false;
  let onCancelCallback = null;
  let pendingRafIds = new Set();
  let pendingTimeoutIds = new Set();
  let listenersBound = false;

  function cacheElements() {
    els = {
      overlay: document.getElementById("aiOverlay"),
      panel: document.querySelector("#aiOverlay .ai-panel"),
      cancelBtn: document.getElementById("aiCancelBtn"),
      statusText: document.getElementById("aiStatusText"),
      progressFill: document.getElementById("aiProgressFill"),
      progressPercent: document.getElementById("aiProgressPercent"),
      stages: document.querySelectorAll("#aiOverlay .ai-stage"),
      promptPreview: document.getElementById("stage1PromptPreview"),
      particles: document.getElementById("stage1Particles"),
      scanText: document.getElementById("stage2Text"),
      liveTokenCount: document.getElementById("liveTokenCount"),
      neuralCore: document.getElementById("neuralCore"),
      benchOriginal: document.getElementById("benchOriginal"),
      benchOptimized: document.getElementById("benchOptimized"),
      benchSaved: document.getElementById("benchSaved"),
      benchTime: document.getElementById("benchTime"),
      benchCost: document.getElementById("benchCost"),
      finalPromptTyped: document.getElementById("finalPromptTyped"),
    };
    bindStaticListeners();
  }

  function bindStaticListeners() {
    if (listenersBound) return;
    listenersBound = true;

    if (els.cancelBtn) {
      els.cancelBtn.addEventListener("click", () => cancel());
    }
    // Escape key also cancels while the overlay is open.
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && els.overlay && els.overlay.classList.contains("is-visible")) {
        cancel();
      }
    });
  }

  function cancelError() {
    const err = new Error("Optimization cancelled by user");
    err.cancelled = true;
    return err;
  }

  /* ---------- Cancellable timing primitives ---------- */

  function sleep(ms) {
    return new Promise((resolve, reject) => {
      if (isCancelled) return reject(cancelError());
      const id = setTimeout(() => {
        pendingTimeoutIds.delete(id);
        if (isCancelled) reject(cancelError());
        else resolve();
      }, ms);
      pendingTimeoutIds.add(id);
    });
  }

  function clearPendingTimers() {
    pendingTimeoutIds.forEach((id) => clearTimeout(id));
    pendingTimeoutIds.clear();
    pendingRafIds.forEach((id) => cancelAnimationFrame(id));
    pendingRafIds.clear();
  }

  /* ---------- Public: showStage ---------- */

  function showStage(stageNumber) {
    if (!els.stages) return;
    els.stages.forEach((stageEl) => {
      const isActive = Number(stageEl.dataset.stage) === stageNumber;
      stageEl.classList.toggle("is-active", isActive);
    });
    currentStage = stageNumber;
  }

  /* ---------- Public: updateStatus ---------- */

  function updateStatus(text) {
    if (els.statusText) {
      els.statusText.textContent = text;
    }
  }

  /* ---------- Public: updateProgress ---------- */

  function updateProgress(percent) {
    const clamped = Math.max(0, Math.min(100, percent));
    if (els.progressFill) {
      els.progressFill.style.width = clamped + "%";
    }
    if (els.progressPercent) {
      els.progressPercent.textContent = Math.round(clamped) + "%";
    }
  }

  /* ---------- Public: animateTokenCounter ---------- */

  function animateTokenCounter(el, from, to, duration) {
    return new Promise((resolve, reject) => {
      if (!el) return resolve();
      if (isCancelled) return reject(cancelError());
      duration = duration || 900;
      const startTime = performance.now();
      const diff = to - from;

      function tick(now) {
        if (isCancelled) {
          pendingRafIds.delete(rafId);
          return reject(cancelError());
        }
        const elapsed = now - startTime;
        const t = Math.min(1, elapsed / duration);
        const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
        const value = Math.round(from + diff * eased);
        el.textContent = value.toLocaleString();
        if (t < 1) {
          rafId = requestAnimationFrame(tick);
          pendingRafIds.add(rafId);
        } else {
          pendingRafIds.delete(rafId);
          el.textContent = to.toLocaleString();
          resolve();
        }
      }
      let rafId = requestAnimationFrame(tick);
      pendingRafIds.add(rafId);
    });
  }

  /* ---------- Public: typeOptimizedPrompt ----------
     Fast, duration-capped reveal instead of one setTimeout per
     character. A 2,000-character prompt used to take ~12s to type
     out; this now finishes in well under a second, and scales
     gently with length rather than linearly. */

  function typeOptimizedPrompt(text) {
    return new Promise((resolve, reject) => {
      if (!els.finalPromptTyped) return resolve();
      if (isCancelled) return reject(cancelError());

      els.finalPromptTyped.innerHTML = "";
      const cursor = document.createElement("span");
      cursor.className = "typing-cursor";

      const safeText = text || "";
      const totalDuration = Math.min(
        TYPE_MAX_MS,
        Math.max(TYPE_MIN_MS, safeText.length * TYPE_MS_PER_CHAR)
      );
      const startTime = performance.now();

      function tick(now) {
        if (isCancelled) {
          pendingRafIds.delete(rafId);
          cursor.remove();
          return reject(cancelError());
        }
        const elapsed = now - startTime;
        const t = Math.min(1, elapsed / totalDuration);
        const chars = Math.round(safeText.length * t);
        els.finalPromptTyped.textContent = safeText.slice(0, chars);
        els.finalPromptTyped.appendChild(cursor);
        if (t < 1) {
          rafId = requestAnimationFrame(tick);
          pendingRafIds.add(rafId);
        } else {
          pendingRafIds.delete(rafId);
          cursor.remove();
          resolve();
        }
      }
      let rafId = requestAnimationFrame(tick);
      pendingRafIds.add(rafId);
    });
  }

  /* ---------- Stage 1 helpers ---------- */

  function fillPromptPreview(promptText) {
    if (!els.promptPreview) return;
    const preview = (promptText || "").slice(0, 220);
    els.promptPreview.textContent = preview + (promptText && promptText.length > 220 ? "…" : "");
  }

  function spawnParticles(count) {
    if (!els.particles) return;
    els.particles.innerHTML = "";
    for (let i = 0; i < count; i++) {
      const p = document.createElement("span");
      p.className = "ai-particle";
      p.style.left = 10 + Math.random() * 80 + "%";
      p.style.setProperty("--drift", (Math.random() * 30 - 15) + "px");
      p.style.animationDelay = Math.random() * 0.4 + "s";
      els.particles.appendChild(p);
    }
  }

  /* ---------- Stage 2 helper: cycle analysis messages with keyword highlight ---------- */

  async function runAnalyzingMessages() {
    const messages = STAGE_MESSAGES[2];
    for (let i = 0; i < messages.length; i++) {
      updateStatus(messages[i]);
      if (els.scanText) {
        els.scanText.innerHTML = messages[i].replace(
          /(intent|instructions|filler|prompt)/i,
          '<span class="kw">$1</span>'
        );
      }
      updateProgress(lerp(STAGE_PROGRESS[1], STAGE_PROGRESS[2], (i + 1) / messages.length));
      await sleep(340);
    }
  }

  /* ---------- Stage 3 helper: live decreasing token count ---------- */

  async function runLocalOptimizationMessages(estimatedTokens) {
    const messages = STAGE_MESSAGES[3];
    const start = estimatedTokens || 240;
    const end = Math.round(start * 0.62);
    let step = 0;
    for (const msg of messages) {
      updateStatus(msg);
      step++;
      const from = step === 1 ? start : Math.round(lerp(start, end, (step - 1) / messages.length));
      const to = Math.round(lerp(start, end, step / messages.length));
      await animateTokenCounter(els.liveTokenCount, from, to, 380);
      updateProgress(lerp(STAGE_PROGRESS[2], STAGE_PROGRESS[3], step / messages.length));
      await sleep(160);
    }
  }

  /* ---------- Stage 4 helper: neural network nodes + streams ---------- */

  function buildNeuralCore() {
    const core = els.neuralCore;
    if (!core || core.dataset.built === "1") return;
    core.dataset.built = "1";

    const nodePositions = [
      [20, 30], [50, 15], [80, 32], [15, 70], [50, 85], [85, 68], [50, 50],
    ];

    nodePositions.forEach(([x, y], idx) => {
      const node = document.createElement("span");
      node.className = "ai-neural-node";
      node.style.left = x + "%";
      node.style.top = y + "%";
      node.style.animationDelay = idx * 0.15 + "s";
      core.appendChild(node);
    });

    // connecting lines from center node to each outer node
    const [cx, cy] = [50, 50];
    nodePositions.forEach(([x, y]) => {
      if (x === cx && y === cy) return;
      const dx = x - cx;
      const dy = y - cy;
      const length = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);

      const line = document.createElement("span");
      line.className = "ai-neural-line";
      line.style.left = cx + "%";
      line.style.top = cy + "%";
      line.style.width = length + "%";
      line.style.transform = `rotate(${angle}deg)`;
      core.appendChild(line);

      const stream = document.createElement("span");
      stream.className = "ai-neural-stream";
      stream.style.left = cx + "%";
      stream.style.top = cy + "%";
      stream.style.setProperty("--tx", (x - cx) + "%");
      stream.style.setProperty("--ty", (y - cy) + "%");
      stream.style.transform = `translate(0,0)`;
      stream.style.animationDelay = Math.random() * 1.2 + "s";
      // animate travel via WAAPI since distance/direction is dynamic per-node
      stream.animate(
        [
          { left: cx + "%", top: cy + "%", opacity: 0 },
          { opacity: 1, offset: 0.15 },
          { left: x + "%", top: y + "%", opacity: 0 },
        ],
        { duration: 1400, iterations: Infinity, delay: Math.random() * 1000 }
      );
      core.appendChild(stream);
    });
  }

  async function runLLMOptimizationMessages() {
    buildNeuralCore();
    const messages = STAGE_MESSAGES[4];
    for (let i = 0; i < messages.length; i++) {
      updateStatus(messages[i]);
      updateProgress(lerp(STAGE_PROGRESS[3], STAGE_PROGRESS[4], (i + 1) / messages.length));
      await sleep(360);
    }
  }

  function lerp(a, b, t) {
    return a + (b - a) * Math.max(0, Math.min(1, t));
  }

  /* ---------- Public: reset ---------- */

  function reset() {
    clearPendingTimers();
    updateProgress(0);
    updateStatus("");
    showStage(1);
    if (els.liveTokenCount) els.liveTokenCount.textContent = "0";
    if (els.finalPromptTyped) els.finalPromptTyped.textContent = "";
    if (els.benchOriginal) els.benchOriginal.textContent = "0";
    if (els.benchOptimized) els.benchOptimized.textContent = "0";
    if (els.benchSaved) els.benchSaved.textContent = "0";
    if (els.benchTime) els.benchTime.textContent = "0.00s";
    if (els.benchCost) els.benchCost.textContent = "$0.00";
    if (els.overlay) els.overlay.classList.remove("is-visible");
  }

  /* ---------- Public: cancel ----------
     Stops any in-flight stage immediately (kills pending timeouts
     and rAF loops), hides the overlay, and rejects whatever
     start()/finish() promise is currently pending so the caller
     (dashboard.js) knows to abort its fetch / cleanup, if it wants to. */

  function cancel() {
    if (isCancelled) return; // already cancelling
    isCancelled = true;
    clearPendingTimers();
    if (els.overlay) {
      els.overlay.classList.remove("is-visible");
    }
    if (typeof onCancelCallback === "function") {
      try {
        onCancelCallback();
      } catch (e) {
        console.error("AIOptimizerAnimation onCancel callback error:", e);
      }
    }
    document.dispatchEvent(new CustomEvent("ai-optimizer-cancelled"));
  }

  /* ---------- Public: start ----------
     Runs stages 1-4 with simulated timings/messages.
     Resolves once stage 4 finishes, so callers can then
     call finish(resultData) as soon as their API call resolves.
     Rejects with { cancelled: true } if the user hits Cancel. */

  async function start(promptText, estimatedTokens, options) {
    options = options || {};
    cacheElements();
    if (!els.overlay) {
      console.warn("AIOptimizerAnimation: #aiOverlay not found in DOM.");
      return;
    }

    isCancelled = false;
    onCancelCallback = options.onCancel || null;

    reset();
    els.overlay.classList.add("is-visible");
    if (els.cancelBtn) els.cancelBtn.disabled = false;

    // Stage 1 — Receiving prompt
    showStage(1);
    updateStatus(STAGE_MESSAGES[1][0]);
    fillPromptPreview(promptText);
    spawnParticles(10);
    updateProgress(STAGE_PROGRESS[1]);
    await sleep(800);

    // Stage 2 — Analyzing
    showStage(2);
    await runAnalyzingMessages();

    // Stage 3 — Local optimization
    showStage(3);
    await runLocalOptimizationMessages(estimatedTokens);

    // Stage 4 — LLM optimization
    showStage(4);
    await runLLMOptimizationMessages();
  }

  /* ---------- Public: finish ----------
     Call once the backend response is available. Renders the
     real benchmark numbers (stage 5) then types the optimized
     prompt (stage 6), and leaves the overlay open until hide()
     is called (or it auto-hides after autoHideMs if provided).
     Rejects with { cancelled: true } if the user hits Cancel
     partway through. */

  async function finish(resultData, options) {
    options = options || {};
    if (isCancelled) throw cancelError();

    const data = resultData || {};

    const originalTokens = Number(data.original_total_tokens ?? data.original_tokens) || 0;
    const optimizedTokens = Number(data.optimized_total_tokens ?? data.optimized_tokens) || 0;
    const tokensSaved = data.tokens_saved != null ? Number(data.tokens_saved) : Math.max(0, originalTokens - optimizedTokens);
    const processingTime = data.processing_time != null ? Number(data.processing_time) : 0;
    const costSaved = data.estimated_cost_saved != null ? data.estimated_cost_saved : "0.000000";
    const optimizedPromptText = data.optimized_prompt || "";

    // Once real results are in, cancelling no longer makes much sense —
    // hide the cancel button so users don't hit it mid-reveal.
    if (els.cancelBtn) els.cancelBtn.disabled = true;

    // Stage 5 — Benchmark
    showStage(5);
    updateStatus(STAGE_MESSAGES[5][0]);
    updateProgress(STAGE_PROGRESS[5]);

    await Promise.all([
      animateTokenCounter(els.benchOriginal, 0, originalTokens, 900),
      animateTokenCounter(els.benchOptimized, 0, optimizedTokens, 900),
    ]);
    await animateTokenCounter(els.benchSaved, 0, tokensSaved, 700);

    if (els.benchTime) {
      const target = processingTime;
      await new Promise((resolve, reject) => {
        const start2 = performance.now();
        function tick(now) {
          if (isCancelled) {
            pendingRafIds.delete(rafId);
            return reject(cancelError());
          }
          const elapsed = (now - start2) / 700;
          const t = Math.min(1, elapsed);
          els.benchTime.textContent = (target * t).toFixed(2) + "s";
          if (t < 1) {
            rafId = requestAnimationFrame(tick);
            pendingRafIds.add(rafId);
          } else {
            pendingRafIds.delete(rafId);
            resolve();
          }
        }
        let rafId = requestAnimationFrame(tick);
        pendingRafIds.add(rafId);
      });
    }
    if (els.benchCost) {
      els.benchCost.textContent = "$" + Number(costSaved).toFixed(6);
    }

    updateProgress(100);
    await sleep(500);

    // Stage 6 — Completed
    showStage(6);
    updateStatus(STAGE_MESSAGES[6][0]);
    await typeOptimizedPrompt(optimizedPromptText);

    if (options.autoHideMs !== undefined && options.autoHideMs !== null) {
      await sleep(options.autoHideMs);
      hide();
    }
  }

  function hide() {
    if (els.overlay) {
      els.overlay.classList.remove("is-visible");
    }
  }

  window.AIOptimizerAnimation = {
    start,
    showStage,
    updateStatus,
    updateProgress,
    animateTokenCounter,
    typeOptimizedPrompt,
    finish,
    cancel,
    hide,
    reset,
  };
})();