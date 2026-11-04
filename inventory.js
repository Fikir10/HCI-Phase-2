/* Inventory Home Screen */
/* Count units (Ct, Slices, Loaf) use a one-tap -/+ stepper.
   Measured units (Gal, Oz, Lb) open a "how much did you use?" panel. */

(() => {
    const MEASURED_UNITS = ["Gal", "Oz", "Lb"];

    // Order priority for location storing
    const LOCATION_ORDER = {
        fridge: 0,
        pantry: 1,
        freezer: 2
    };

    // Internal state tracking
    const state = {
        sort: "attention",
        filter: "all",
        attentionOnly: false,
        query: "",
        highlightId: null
    };

    let panel = null;
    let sheetItemId = null;

    /*  Helper Functions */

    const escapeHTML = value =>
        String(value).replace(/[&<>"']/g, char => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[char]);

    const capitalize = text => text[0].toUpperCase() + text.slice(1);

    const round = value => Number(value.toFixed(2));

    // Calculate remaining days before item expires
    function daysLeft(item) {
        if (!item.exp) {
            return 999;
        }

        return (new Date(item.exp) - new Date(Data.TODAY)) / 86400000;
    }

    /* Low, out, or expiring within 3 days */
    function needsAttention(item) {
        return Data.status(item) !== "ok" || daysLeft(item) <= 3;
    }

    // Assign priority score for soring items needing attention
    function attentionScore(item) {
        const status = Data.status(item);

        if (status === "out") {
            return 0;
        }

        if (status === "low") {
            return 1;
        }

        return daysLeft(item) <= 3 ? 2 : 3;
    }

    // Formats ISO dat string to M/D format
    function formatDate(isoDate) {
        const [, month, day] = isoDate.split("-");

        return `${Number(month)}/${Number(day)}`;
    }

    /* Sorting */

    const SORTERS = {
        attention: (a, b) =>
            attentionScore(a) - attentionScore(b) ||
            daysLeft(a) - daysLeft(b) ||
            a.name.localeCompare(b.name),

        expiring: (a, b) =>
            daysLeft(a) - daysLeft(b) ||
            a.name.localeCompare(b.name),

        location: (a, b) =>
            LOCATION_ORDER[a.cat] - LOCATION_ORDER[b.cat] ||
            a.name.localeCompare(b.name),

        name: (a, b) => a.name.localeCompare(b.name)
    };

    /*  Rows (render & update) */

    // Generate HTML string for an individual inventory row
    function rowHTML(item) {
        const status = Data.status(item);
        const name = escapeHTML(item.name);
        const amount = `${round(item.qty)} ${escapeHTML(item.unit)}`;

        // // Choice between trigger button or +/- stepper control
        const control = MEASURED_UNITS.includes(item.unit)
            ? `
                <button
                    class="inv-amount"
                    type="button"
                    data-use
                    aria-label="${name}, ${amount}. Log how much you used"
                >${amount}</button>
            `
            : `
                <span class="inv-stepper">
                    <button
                        type="button"
                        data-step="-1"
                        aria-label="Use one ${name}"
                    >−</button>

                    <span class="inv-qty">${amount}</span>

                    <button
                        type="button"
                        data-step="1"
                        aria-label="Add one ${name}"
                    >+</button>
                </span>
            `;

        let slot = "";

        if (status !== "ok") {
            slot = `<span class="inv-badge ${status}">${status === "out" ? "Out" : "Low"}</span>`;
        } else if (state.sort === "expiring" && item.exp) {
            slot = `<span class="inv-date">${formatDate(item.exp)}</span>`;
        } else if (daysLeft(item) <= 3) {
            slot = `<span class="inv-badge soon">Soon</span>`;
        }

        return `
            <div
                class="inv-row${state.highlightId === item.id ? " inv-highlight" : ""}"
                data-id="${escapeHTML(item.id)}"
            >
                <span class="inv-name">${name}</span>
                ${control}
                <span class="inv-slot">${slot}</span>
            </div>
        `.trim();
    }

    // Replaces an updated item's row element directly in the DOM
    function replaceRow(id) {
        const row = panel.querySelector(`.inv-row[data-id="${id}"]`);

        if (row) {
            row.outerHTML = rowHTML(Data.get(id));
        }
    }

    // Update top summary count & 'attention' badge status
    function updateSummary() {
        const items = Data.inv();
        const attention = items.filter(needsAttention).length;
        const button = panel.querySelector(".inv-attention");

        panel.querySelector(".inv-count").textContent = `${items.length} Items`;

        button.textContent = `${attention} Need Attention`;
        button.classList.toggle("on", state.attentionOnly);
        button.setAttribute("aria-pressed", state.attentionOnly);
    }

    // Filter, sort, render the inventory list
    function renderList() {
        closeSheet();

        const query = state.query.trim().toLowerCase();

        const items = Data.inv()
            .filter(item => state.filter === "all" || item.cat === state.filter)
            .filter(item => !state.attentionOnly || needsAttention(item))
            .filter(item => item.name.toLowerCase().includes(query))
            .sort(SORTERS[state.sort]);

        let html = "";
        let lastLocation = null;

        items.forEach(item => {
            if (state.sort === "location" && item.cat !== lastLocation) {
                html += `<div class="inv-group">${capitalize(item.cat)}</div>`;
                lastLocation = item.cat;
            }

            html += rowHTML(item);
        });

        const list = panel.querySelector(".inv-list");

        list.innerHTML = html || `<p class="inv-empty">No items match.</p>`;

        const highlighted = list.querySelector(".inv-highlight");

        if (highlighted) {
            list.scrollTop = highlighted.offsetTop - list.clientHeight / 2;
            state.highlightId = null;
        }

        updateSummary();
    }

    /* "How much did you use?" panel */

    function openSheet(id) {
        const item = Data.get(id);

        sheetItemId = id;

        panel.querySelector(".inv-sheet-name").textContent =
            `${item.name} · ${round(item.qty)} ${item.unit}`;

        panel.querySelector(".inv-sheet").hidden = false;
    }

    function closeSheet() {
        panel.querySelector(".inv-sheet").hidden = true;
        sheetItemId = null;
    }

    // Applies partial or full fraction usage to measured item quantities
    function applyUse(fraction) {
        const item = Data.get(sheetItemId);
        const remaining = fraction >= 1 ? 0 : round(item.qty * (1 - fraction));

        Data.adjust(item.id, remaining - item.qty);

        replaceRow(item.id);
        updateSummary();
        closeSheet();
    }

    /* Screen Creation */

    function buildScreen(root) {
        root.innerHTML = `
            <header class="inv-header">
                <div>
                    <h1 class="ttl">Kitchen Inventory</h1>
                    <div class="inv-summary">
                        <span class="inv-count muted"></span>
                        <button class="inv-attention" type="button" aria-pressed="false"></button>
                    </div>
                </div>

                <button class="inv-add" type="button" aria-label="Add item">+</button>
            </header>

            <input
                class="inv-search"
                type="search"
                placeholder="Search items"
                autocomplete="off"
                aria-label="Search items"
            >

            <div class="inv-controls">
                <select class="inv-sort" aria-label="Sort by">
                    <option value="attention">Needs attention</option>
                    <option value="expiring">Expiring soon</option>
                    <option value="location">By location</option>
                    <option value="name">A to Z</option>
                </select>

                <select class="inv-filter" aria-label="Filter by location">
                    <option value="all">All</option>
                    <option value="fridge">Fridge</option>
                    <option value="pantry">Pantry</option>
                    <option value="freezer">Freezer</option>
                </select>
            </div>

            <div class="inv-list"></div>

            <div class="inv-sheet" hidden>
                <div class="inv-sheet-title">
                    <b class="inv-sheet-name"></b><br>
                    <span class="muted">How much did you use?</span>
                </div>

                <div class="inv-sheet-options">
                    <button type="button" data-fraction="0.25">¼</button>
                    <button type="button" data-fraction="0.5">½</button>
                    <button type="button" data-fraction="0.75">¾</button>
                    <button type="button" data-fraction="1">All</button>
                </div>

                <button class="inv-sheet-cancel" type="button">Cancel</button>
            </div>
        `;

        root.querySelector(".inv-add").onclick = () => App.openAdd();

        root.querySelector(".inv-attention").onclick = () => {
            state.attentionOnly = !state.attentionOnly;
            renderList();
        };

        root.querySelector(".inv-search").oninput = event => {
            state.query = event.target.value;
            renderList();
        };

        root.querySelector(".inv-sort").onchange = event => {
            state.sort = event.target.value;
            renderList();
        };

        root.querySelector(".inv-filter").onchange = event => {
            state.filter = event.target.value;
            renderList();
        };

        // Stepper and click handling
        root.querySelector(".inv-list").onclick = event => {
            const button = event.target.closest("button");

            if (!button) {
                return;
            }

            const row = button.closest(".inv-row");

            if (button.dataset.use !== undefined) {
                openSheet(row.dataset.id);
                return;
            }

            Data.adjust(row.dataset.id, Number(button.dataset.step));

            replaceRow(row.dataset.id);
            updateSummary();
        };

        // Click handling
        root.querySelector(".inv-sheet").onclick = event => {
            const button = event.target.closest("button");

            if (!button) {
                return;
            }

            if (button.dataset.fraction) {
                applyUse(Number(button.dataset.fraction));
            } else {
                closeSheet();
            }
        };
    }

    function render(root) {
        panel = root;

        if (!root.dataset.built) {
            root.dataset.built = "true";
            buildScreen(root);
        }

        root.querySelector(".inv-search").value = state.query;
        root.querySelector(".inv-sort").value = state.sort;
        root.querySelector(".inv-filter").value = state.filter;

        renderList();
    }

    // Call before App.go("inventory") after adding an item to scroll to and highlight it
    function reveal(id) {
        state.query = "";
        state.filter = "all";
        state.attentionOnly = false;
        state.highlightId = id;
    }

    App.screens.inventory = { render, reveal };
})();
