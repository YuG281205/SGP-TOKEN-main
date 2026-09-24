// =========================================================
// CUSTOM MODEL DROPDOWN
// =========================================================
// Replaces the native <select id="model"> with a custom
// dropdown. The option list is moved to <body> and uses
// position: fixed so it is not clipped by parent elements.
// =========================================================

(function () {

    const wrapper = document.getElementById("modelCustomSelect");

    if (!wrapper) {
        return;
    }


    // =====================================================
    // ELEMENTS
    // =====================================================

    const trigger = document.getElementById("modelTrigger");

    const triggerLabel =
        document.getElementById("modelTriggerLabel");

    const list =
        document.getElementById("modelList");

    const hiddenSelect =
        document.getElementById("model");


    if (!trigger || !triggerLabel || !list || !hiddenSelect) {
        return;
    }


    const options =
        Array.from(
            list.querySelectorAll(".custom-select-option")
        );


    // =====================================================
    // MOVE DROPDOWN TO BODY
    // =====================================================

    document.body.appendChild(list);

    list.classList.add(
        "custom-select-list--portaled"
    );


    // =====================================================
    // POSITION DROPDOWN
    // =====================================================

    function positionList() {

        const rect =
            trigger.getBoundingClientRect();


        list.style.position = "fixed";

        list.style.left =
            rect.left + "px";

        list.style.top =
            rect.bottom + 6 + "px";

        list.style.width =
            rect.width + "px";
    }


    // =====================================================
    // CLOSE DROPDOWN
    // =====================================================

    function closeList() {

        list.classList.remove("is-open");

        trigger.classList.remove("is-open");

        wrapper.classList.remove("is-open");

        trigger.setAttribute(
            "aria-expanded",
            "false"
        );


        window.removeEventListener(
            "scroll",
            positionList,
            true
        );


        window.removeEventListener(
            "resize",
            positionList
        );
    }


    // =====================================================
    // OPEN DROPDOWN
    // =====================================================

    function openList() {

        positionList();

        list.classList.add("is-open");

        trigger.classList.add("is-open");

        wrapper.classList.add("is-open");

        trigger.setAttribute(
            "aria-expanded",
            "true"
        );


        window.addEventListener(
            "scroll",
            positionList,
            true
        );


        window.addEventListener(
            "resize",
            positionList
        );
    }


    // =====================================================
    // SELECT OPTION
    // =====================================================

    function selectOption(option) {

        options.forEach((currentOption) => {

            currentOption.classList.remove(
                "is-selected"
            );

            currentOption.setAttribute(
                "aria-selected",
                "false"
            );
        });


        option.classList.add(
            "is-selected"
        );

        option.setAttribute(
            "aria-selected",
            "true"
        );


        const value =
            option.dataset.value;


        const label =
            option.textContent.trim();


        triggerLabel.textContent =
            label;


        triggerLabel.classList.toggle(
            "is-placeholder",
            value === ""
        );


        // Update hidden native select

        hiddenSelect.value =
            value;


        // Notify prompting_panel.js

        hiddenSelect.dispatchEvent(
            new Event(
                "change",
                {
                    bubbles: true
                }
            )
        );


        closeList();

        trigger.focus();
    }


    // =====================================================
    // TRIGGER CLICK
    // =====================================================

    trigger.addEventListener(
        "click",
        function (event) {

            event.stopPropagation();


            if (
                list.classList.contains("is-open")
            ) {

                closeList();

            } else {

                openList();
            }
        }
    );


    // =====================================================
    // OPTION CLICK
    // =====================================================

    options.forEach((option) => {

        option.addEventListener(
            "click",
            function (event) {

                event.stopPropagation();

                selectOption(option);
            }
        );
    });


    // =====================================================
    // CLOSE WHEN CLICKING OUTSIDE
    // =====================================================

    document.addEventListener(
        "click",
        function (event) {

            if (
                !wrapper.contains(event.target) &&
                !list.contains(event.target)
            ) {

                closeList();
            }
        }
    );


    // =====================================================
    // KEYBOARD SUPPORT
    // =====================================================

    trigger.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key === "ArrowDown" ||
                event.key === "Enter" ||
                event.key === " "
            ) {

                event.preventDefault();

                if (
                    !list.classList.contains(
                        "is-open"
                    )
                ) {

                    openList();
                }

            } else if (
                event.key === "Escape"
            ) {

                closeList();
            }
        }
    );


    // =====================================================
    // ESCAPE FROM LIST
    // =====================================================

    list.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key === "Escape"
            ) {

                closeList();

                trigger.focus();
            }
        }
    );


})();