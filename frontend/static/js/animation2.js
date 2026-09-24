/* =========================================================
   AI PROCESSING OVERLAY — ANIMATION CONTROLLER

   Token-count animation removed.

   Stages:
   1. Receiving prompt
   2. Analyzing prompt
   3. Local optimization
   4. LLM optimization
   5. Benchmarking
   6. Completed

   No fake/live token count is displayed during animation.
   ========================================================= */

(function () {

  "use strict";

  /* =========================================================
     STAGE MESSAGES
     ========================================================= */

  const STAGE_MESSAGES = {

    1: [
      "Receiving prompt..."
    ],

    2: [
      "Analyzing prompt...",
      "Understanding intent...",
      "Extracting key instructions...",
      "Removing unnecessary words..."
    ],

    3: [
      "Removing filler words...",
      "Compressing instructions...",
      "Optimizing locally..."
    ],

    4: [
      "Sending to Gemini...",
      "Semantic optimization...",
      "Improving clarity...",
      "Reducing unnecessary wording..."
    ],

    5: [
      "Benchmarking results..."
    ],

    6: [
      "Optimization complete"
    ]

  };


  /* =========================================================
     PROGRESS CHECKPOINTS
     ========================================================= */

  const STAGE_PROGRESS = {

    1: 8,
    2: 32,
    3: 55,
    4: 82,
    5: 96,
    6: 100

  };


  /* =========================================================
     FINAL PROMPT TYPING SETTINGS
     ========================================================= */

  const TYPE_MIN_MS = 220;
  const TYPE_MAX_MS = 650;
  const TYPE_MS_PER_CHAR = 2.5;


  /* =========================================================
     STATE
     ========================================================= */

  let els = {};

  let currentStage = 0;

  let isCancelled = false;

  let onCancelCallback = null;

  let pendingRafIds = new Set();

  let pendingTimeoutIds = new Set();

  let listenersBound = false;


  /* =========================================================
     CACHE DOM ELEMENTS
     ========================================================= */

  function cacheElements() {

    els = {

      overlay:
        document.getElementById("aiOverlay"),

      panel:
        document.querySelector("#aiOverlay .ai-panel"),

      cancelBtn:
        document.getElementById("aiCancelBtn"),

      statusText:
        document.getElementById("aiStatusText"),

      progressFill:
        document.getElementById("aiProgressFill"),

      progressPercent:
        document.getElementById("aiProgressPercent"),

      stages:
        document.querySelectorAll("#aiOverlay .ai-stage"),

      promptPreview:
        document.getElementById("stage1PromptPreview"),

      particles:
        document.getElementById("stage1Particles"),

      scanText:
        document.getElementById("stage2Text"),

      neuralCore:
        document.getElementById("neuralCore"),

      benchOriginal:
        document.getElementById("benchOriginal"),

      benchOptimized:
        document.getElementById("benchOptimized"),

      benchSaved:
        document.getElementById("benchSaved"),

      benchTime:
        document.getElementById("benchTime"),

      benchCost:
        document.getElementById("benchCost"),

      finalPromptTyped:
        document.getElementById("finalPromptTyped")

    };

    bindStaticListeners();

  }


  /* =========================================================
     STATIC LISTENERS
     ========================================================= */

  function bindStaticListeners() {

    if (listenersBound) {
      return;
    }

    listenersBound = true;


    if (els.cancelBtn) {

      els.cancelBtn.addEventListener(
        "click",
        () => cancel()
      );

    }


    document.addEventListener(
      "keydown",
      (event) => {

        if (
          event.key === "Escape" &&
          els.overlay &&
          els.overlay.classList.contains("is-visible")
        ) {

          cancel();

        }

      }
    );

  }


  /* =========================================================
     CANCEL ERROR
     ========================================================= */

  function cancelError() {

    const error =
      new Error(
        "Optimization cancelled by user"
      );

    error.cancelled = true;

    return error;

  }


  /* =========================================================
     CANCELLABLE SLEEP
     ========================================================= */

  function sleep(ms) {

    return new Promise(
      (resolve, reject) => {

        if (isCancelled) {

          reject(cancelError());

          return;

        }


        const id =
          setTimeout(
            () => {

              pendingTimeoutIds.delete(id);

              if (isCancelled) {

                reject(cancelError());

              } else {

                resolve();

              }

            },
            ms
          );


        pendingTimeoutIds.add(id);

      }
    );

  }


  /* =========================================================
     CLEAR TIMERS
     ========================================================= */

  function clearPendingTimers() {

    pendingTimeoutIds.forEach(
      (id) => clearTimeout(id)
    );

    pendingTimeoutIds.clear();


    pendingRafIds.forEach(
      (id) => cancelAnimationFrame(id)
    );

    pendingRafIds.clear();

  }


  /* =========================================================
     SHOW STAGE
     ========================================================= */

  function showStage(stageNumber) {

    if (!els.stages) {
      return;
    }


    els.stages.forEach(
      (stageElement) => {

        const active =
          Number(stageElement.dataset.stage) ===
          stageNumber;

        stageElement.classList.toggle(
          "is-active",
          active
        );

      }
    );


    currentStage = stageNumber;

  }


  /* =========================================================
     UPDATE STATUS
     ========================================================= */

  function updateStatus(text) {

    if (els.statusText) {

      els.statusText.textContent =
        text;

    }

  }


  /* =========================================================
     UPDATE PROGRESS
     ========================================================= */

  function updateProgress(percent) {

    const clamped =
      Math.max(
        0,
        Math.min(100, percent)
      );


    if (els.progressFill) {

      els.progressFill.style.width =
        clamped + "%";

    }


    if (els.progressPercent) {

      els.progressPercent.textContent =
        Math.round(clamped) + "%";

    }

  }


  /* =========================================================
     STAGE 1 — PROMPT PREVIEW
     ========================================================= */

  function fillPromptPreview(promptText) {

    if (!els.promptPreview) {
      return;
    }


    const preview =
      (promptText || "").slice(0, 220);


    els.promptPreview.textContent =
      preview +
      (
        promptText &&
        promptText.length > 220
          ? "…"
          : ""
      );

  }


  /* =========================================================
     STAGE 1 — PARTICLES
     ========================================================= */

  function spawnParticles(count) {

    if (!els.particles) {
      return;
    }


    els.particles.innerHTML = "";


    for (let i = 0; i < count; i++) {

      const particle =
        document.createElement("span");


      particle.className =
        "ai-particle";


      particle.style.left =
        10 + Math.random() * 80 + "%";


      particle.style.setProperty(
        "--drift",
        (Math.random() * 30 - 15) + "px"
      );


      particle.style.animationDelay =
        Math.random() * 0.4 + "s";


      els.particles.appendChild(
        particle
      );

    }

  }


  /* =========================================================
     STAGE 2 — ANALYZING
     ========================================================= */

  async function runAnalyzingMessages() {

    const messages =
      STAGE_MESSAGES[2];


    for (
      let i = 0;
      i < messages.length;
      i++
    ) {

      updateStatus(
        messages[i]
      );


      if (els.scanText) {

        els.scanText.innerHTML =
          messages[i].replace(
            /(intent|instructions|filler|prompt)/i,
            '<span class="kw">$1</span>'
          );

      }


      updateProgress(
        lerp(
          STAGE_PROGRESS[1],
          STAGE_PROGRESS[2],
          (i + 1) / messages.length
        )
      );


      await sleep(340);

    }

  }


  /* =========================================================
     STAGE 3 — LOCAL OPTIMIZATION
     
     IMPORTANT:
     No token counter.
     No estimated token number.
     No "0 tokens".
     ========================================================= */

  async function runLocalOptimizationMessages() {

    const messages =
      STAGE_MESSAGES[3];


    for (
      let i = 0;
      i < messages.length;
      i++
    ) {

      updateStatus(
        messages[i]
      );


      updateProgress(
        lerp(
          STAGE_PROGRESS[2],
          STAGE_PROGRESS[3],
          (i + 1) / messages.length
        )
      );


      await sleep(420);

    }

  }


  /* =========================================================
     STAGE 4 — NEURAL CORE
     ========================================================= */

  function buildNeuralCore() {

    const core =
      els.neuralCore;


    if (
      !core ||
      core.dataset.built === "1"
    ) {

      return;

    }


    core.dataset.built =
      "1";


    const nodePositions = [

      [20, 30],
      [50, 15],
      [80, 32],
      [15, 70],
      [50, 85],
      [85, 68],
      [50, 50]

    ];


    nodePositions.forEach(
      ([x, y], index) => {

        const node =
          document.createElement("span");


        node.className =
          "ai-neural-node";


        node.style.left =
          x + "%";


        node.style.top =
          y + "%";


        node.style.animationDelay =
          index * 0.15 + "s";


        core.appendChild(
          node
        );

      }
    );


    const cx = 50;
    const cy = 50;


    nodePositions.forEach(
      ([x, y]) => {

        if (
          x === cx &&
          y === cy
        ) {

          return;

        }


        const dx =
          x - cx;

        const dy =
          y - cy;


        const length =
          Math.sqrt(
            dx * dx +
            dy * dy
          );


        const angle =
          Math.atan2(dy, dx) *
          (180 / Math.PI);


        const line =
          document.createElement("span");


        line.className =
          "ai-neural-line";


        line.style.left =
          cx + "%";


        line.style.top =
          cy + "%";


        line.style.width =
          length + "%";


        line.style.transform =
          `rotate(${angle}deg)`;


        core.appendChild(
          line
        );


        const stream =
          document.createElement("span");


        stream.className =
          "ai-neural-stream";


        stream.style.left =
          cx + "%";


        stream.style.top =
          cy + "%";


        stream.style.animationDelay =
          Math.random() * 1.2 + "s";


        stream.animate(

          [
            {
              left: cx + "%",
              top: cy + "%",
              opacity: 0
            },

            {
              opacity: 1,
              offset: 0.15
            },

            {
              left: x + "%",
              top: y + "%",
              opacity: 0
            }

          ],

          {
            duration: 1400,
            iterations: Infinity,
            delay: Math.random() * 1000
          }

        );


        core.appendChild(
          stream
        );

      }
    );

  }


  /* =========================================================
     STAGE 4 — LLM MESSAGES
     ========================================================= */

  async function runLLMOptimizationMessages() {

    buildNeuralCore();


    const messages =
      STAGE_MESSAGES[4];


    for (
      let i = 0;
      i < messages.length;
      i++
    ) {

      updateStatus(
        messages[i]
      );


      updateProgress(
        lerp(
          STAGE_PROGRESS[3],
          STAGE_PROGRESS[4],
          (i + 1) / messages.length
        )
      );


      await sleep(360);

    }

  }


  /* =========================================================
     LINEAR INTERPOLATION
     ========================================================= */

  function lerp(a, b, t) {

    return (
      a +
      (b - a) *
      Math.max(
        0,
        Math.min(1, t)
      )
    );

  }


  /* =========================================================
     TYPE FINAL OPTIMIZED PROMPT
     ========================================================= */

  function typeOptimizedPrompt(text) {

    return new Promise(
      (resolve, reject) => {

        if (!els.finalPromptTyped) {

          resolve();

          return;

        }


        if (isCancelled) {

          reject(
            cancelError()
          );

          return;

        }


        els.finalPromptTyped.innerHTML =
          "";


        const cursor =
          document.createElement("span");


        cursor.className =
          "typing-cursor";


        const safeText =
          text || "";


        const totalDuration =
          Math.min(
            TYPE_MAX_MS,
            Math.max(
              TYPE_MIN_MS,
              safeText.length *
              TYPE_MS_PER_CHAR
            )
          );


        const startTime =
          performance.now();


        function tick(now) {

          if (isCancelled) {

            pendingRafIds.delete(
              rafId
            );

            cursor.remove();

            reject(
              cancelError()
            );

            return;

          }


          const elapsed =
            now - startTime;


          const t =
            Math.min(
              1,
              elapsed /
              totalDuration
            );


          const chars =
            Math.round(
              safeText.length * t
            );


          els.finalPromptTyped.textContent =
            safeText.slice(
              0,
              chars
            );


          els.finalPromptTyped.appendChild(
            cursor
          );


          if (t < 1) {

            rafId =
              requestAnimationFrame(
                tick
              );

            pendingRafIds.add(
              rafId
            );

          } else {

            pendingRafIds.delete(
              rafId
            );

            cursor.remove();

            resolve();

          }

        }


        let rafId =
          requestAnimationFrame(
            tick
          );


        pendingRafIds.add(
          rafId
        );

      }
    );

  }


  /* =========================================================
     RESET
     ========================================================= */

  function reset() {

    clearPendingTimers();


    updateProgress(0);

    updateStatus("");


    showStage(1);


    if (els.finalPromptTyped) {

      els.finalPromptTyped.textContent =
        "";

    }


    if (els.benchOriginal) {

      els.benchOriginal.textContent =
        "0";

    }


    if (els.benchOptimized) {

      els.benchOptimized.textContent =
        "0";

    }


    if (els.benchSaved) {

      els.benchSaved.textContent =
        "0";

    }


    if (els.benchTime) {

      els.benchTime.textContent =
        "0.00s";

    }


    if (els.benchCost) {

      els.benchCost.textContent =
        "$0.00";

    }


    if (els.overlay) {

      els.overlay.classList.remove(
        "is-visible"
      );

    }

  }


  /* =========================================================
     CANCEL
     ========================================================= */

  function cancel() {

    if (isCancelled) {

      return;

    }


    isCancelled = true;


    clearPendingTimers();


    if (els.overlay) {

      els.overlay.classList.remove(
        "is-visible"
      );

    }


    if (
      typeof onCancelCallback ===
      "function"
    ) {

      try {

        onCancelCallback();

      } catch (error) {

        console.error(
          "AIOptimizerAnimation onCancel callback error:",
          error
        );

      }

    }


    document.dispatchEvent(
      new CustomEvent(
        "ai-optimizer-cancelled"
      )
    );

  }


  /* =========================================================
     START
     
     Stages 1 → 4.
     
     No token calculations.
     ========================================================= */

  async function start(
    promptText,
    estimatedTokens,
    options
  ) {

    options =
      options || {};


    cacheElements();


    if (!els.overlay) {

      console.warn(
        "AIOptimizerAnimation: #aiOverlay not found in DOM."
      );

      return;

    }


    isCancelled =
      false;


    onCancelCallback =
      options.onCancel ||
      null;


    reset();


    els.overlay.classList.add(
      "is-visible"
    );


    if (els.cancelBtn) {

      els.cancelBtn.disabled =
        false;

    }


    /* ---------- Stage 1 ---------- */

    showStage(1);

    updateStatus(
      STAGE_MESSAGES[1][0]
    );

    fillPromptPreview(
      promptText
    );

    spawnParticles(10);

    updateProgress(
      STAGE_PROGRESS[1]
    );


    await sleep(800);


    /* ---------- Stage 2 ---------- */

    showStage(2);

    await runAnalyzingMessages();


    /* ---------- Stage 3 ---------- */

    showStage(3);

    await runLocalOptimizationMessages();


    /* ---------- Stage 4 ---------- */

    showStage(4);

    await runLLMOptimizationMessages();

  }


  /* =========================================================
     FINISH
     
     Real benchmark values are shown only after
     backend response arrives.
     ========================================================= */

  async function finish(
    resultData,
    options
  ) {

    options =
      options || {};


    if (isCancelled) {

      throw cancelError();

    }


    const data =
      resultData || {};


    const originalTokens =
      Number(
        data.original_total_tokens ??
        data.original_tokens
      ) || 0;


    const optimizedTokens =
      Number(
        data.optimized_total_tokens ??
        data.optimized_tokens
      ) || 0;


    const tokensSaved =
      data.tokens_saved != null

        ? Number(
            data.tokens_saved
          )

        : Math.max(
            0,
            originalTokens -
            optimizedTokens
          );


    const processingTime =
      data.processing_time != null

        ? Number(
            data.processing_time
          )

        : 0;


    const costSaved =
      data.estimated_cost_saved != null

        ? data.estimated_cost_saved

        : "0.000000";


    const optimizedPromptText =
      data.optimized_prompt ||
      "";


    /* ---------- Disable cancel ---------- */

    if (els.cancelBtn) {

      els.cancelBtn.disabled =
        true;

    }


    /* =====================================================
       STAGE 5 — BENCHMARK
       ===================================================== */

    showStage(5);


    updateStatus(
      STAGE_MESSAGES[5][0]
    );


    updateProgress(
      STAGE_PROGRESS[5]
    );


    await Promise.all([

      animateCounter(
        els.benchOriginal,
        0,
        originalTokens,
        900
      ),

      animateCounter(
        els.benchOptimized,
        0,
        optimizedTokens,
        900
      )

    ]);


    await animateCounter(
      els.benchSaved,
      0,
      tokensSaved,
      700
    );


    /* ---------- Processing time ---------- */

    if (els.benchTime) {

      const target =
        processingTime;


      await animateValue(
        target,
        700
      );

    }


    /* ---------- Cost ---------- */

    if (els.benchCost) {

      els.benchCost.textContent =
        "$" +
        Number(
          costSaved
        ).toFixed(6);

    }


    updateProgress(100);


    await sleep(500);


    /* =====================================================
       STAGE 6 — COMPLETE
       ===================================================== */

    showStage(6);


    updateStatus(
      STAGE_MESSAGES[6][0]
    );


    await typeOptimizedPrompt(
      optimizedPromptText
    );


    /* ---------- Auto hide ---------- */

    if (
      options.autoHideMs !==
        undefined &&
      options.autoHideMs !==
        null
    ) {

      await sleep(
        options.autoHideMs
      );

      hide();

    }

  }


  /* =========================================================
     BENCHMARK COUNTER
     
     This is ONLY used in Stage 5 after the API
     has returned real benchmark data.
     ========================================================= */

  function animateCounter(
    element,
    from,
    to,
    duration
  ) {

    return new Promise(
      (resolve, reject) => {

        if (!element) {

          resolve();

          return;

        }


        if (isCancelled) {

          reject(
            cancelError()
          );

          return;

        }


        const startTime =
          performance.now();


        const difference =
          to - from;


        let rafId;


        function tick(now) {

          if (isCancelled) {

            pendingRafIds.delete(
              rafId
            );

            reject(
              cancelError()
            );

            return;

          }


          const elapsed =
            now - startTime;


          const t =
            Math.min(
              1,
              elapsed /
              duration
            );


          const eased =
            1 -
            Math.pow(
              1 - t,
              3
            );


          const value =
            Math.round(
              from +
              difference *
              eased
            );


          element.textContent =
            value.toLocaleString();


          if (t < 1) {

            rafId =
              requestAnimationFrame(
                tick
              );

            pendingRafIds.add(
              rafId
            );

          } else {

            pendingRafIds.delete(
              rafId
            );


            element.textContent =
              to.toLocaleString();


            resolve();

          }

        }


        rafId =
          requestAnimationFrame(
            tick
          );


        pendingRafIds.add(
          rafId
        );

      }
    );

  }


  /* =========================================================
     PROCESSING TIME ANIMATION
     ========================================================= */

  function animateValue(
    target,
    duration
  ) {

    return new Promise(
      (resolve, reject) => {

        if (!els.benchTime) {

          resolve();

          return;

        }


        const startTime =
          performance.now();


        let rafId;


        function tick(now) {

          if (isCancelled) {

            pendingRafIds.delete(
              rafId
            );

            reject(
              cancelError()
            );

            return;

          }


          const elapsed =
            now - startTime;


          const t =
            Math.min(
              1,
              elapsed /
              duration
            );


          els.benchTime.textContent =
            (
              target * t
            ).toFixed(2) +
            "s";


          if (t < 1) {

            rafId =
              requestAnimationFrame(
                tick
              );

            pendingRafIds.add(
              rafId
            );

          } else {

            pendingRafIds.delete(
              rafId
            );


            els.benchTime.textContent =
              target.toFixed(2) +
              "s";


            resolve();

          }

        }


        rafId =
          requestAnimationFrame(
            tick
          );


        pendingRafIds.add(
          rafId
        );

      }
    );

  }


  /* =========================================================
     HIDE
     ========================================================= */

  function hide() {

    if (els.overlay) {

      els.overlay.classList.remove(
        "is-visible"
      );

    }

  }


  /* =========================================================
     PUBLIC API
     ========================================================= */

  window.AIOptimizerAnimation = {

    start,

    showStage,

    updateStatus,

    updateProgress,

    typeOptimizedPrompt,

    finish,

    cancel,

    hide,

    reset

  };

})();