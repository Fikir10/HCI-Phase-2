/* Add Item screen (Fikir). */
/* Adding an item that already exists (same unit & item) restocks it instead
   of creating a duplicate */

(()=>{
    /* Amount step per unit & defaults as (amount, low at) */
    const STEP = { Ct: 1, Slices: 1, Loaf: 1, Gal: 0.5, Lb: 0.5, Oz: 4 };

    const DEFAULTS = {
        Ct: [2, 1],
        Slices: [8, 2],
        Loaf: [2, 1],
        Gal: [1, 0.5],
        Lb: [2, 0.5],
        Oz: [16, 8]
    };
 
    const UNITS = [
        ["Ct", "Count"],
        ["Oz", "Ounces"],
        ["Lb", "Pounds"],
        ["Gal", "Gallons"],
        ["Loaf", "Loaves"],
        ["Slices", "Slices"]
    ];

    const round = value => Number(value.toFixed(2));
 
    const field = (root, id) => root.querySelector(`#${id}`);
 
    function showError(root, message) {
        field(root, "add-err").textContent = message;
    }
 
    function stepperHTML(id, value, label) {
        return `
            <span class="add-stepper">
                <button
                    type="button"
                    data-target="${id}"
                    data-step="-1"
                    aria-label="Decrease ${label}"
                >−</button>
 
                <input
                    id="${id}"
                    type="number"
                    inputmode="decimal"
                    min="0"
                    value="${value}"
                    aria-label="${label}"
                >
 
                <button
                    type="button"
                    data-target="${id}"
                    data-step="1"
                    aria-label="Increase ${label}"
                >+</button>
            </span>
        `;
    }
 
    function saveItem(root, location) {
        const name = field(root, "add-name").value.trim();
        const unit = field(root, "add-unit").value;
        const qty = round(Number(field(root, "add-qty").value) || 0);
 
        if (!name) {
            showError(root, "Please enter an item name.");
            field(root, "add-name").focus();
            return;
        }
 
        if (qty <= 0) {
            showError(root, "Amount must be more than 0.");
            return;
        }
 
        const existing = Data.inv().find(item =>
            item.name.toLowerCase() === name.toLowerCase() &&
            item.unit === unit
        );
 
        let id;
 
        if (existing) {
            Data.adjust(existing.id, qty);
            id = existing.id;
        } else {
            id = Data.addItem({
                name: name,
                cat: location,
                qty: qty,
                unit: unit,
                lowAt: round(Number(field(root, "add-low").value) || 0),
                exp: field(root, "add-exp").value || null
            });
        }
 
        App.closeAdd();
        App.screens.inventory.reveal(id);
        App.go("inventory");
 
        App.toast(existing ? `Added ${qty} ${unit} to ${existing.name}` : `Added ${name}`);
    }
 
    function bindEvents(root) {
        let location = "fridge";
 
        field(root, "add-back").onclick = () => App.closeAdd();
 
        root.querySelectorAll(".add-segment button").forEach(button => {
            button.onclick = () => {
                location = button.dataset.location;
 
                root.querySelectorAll(".add-segment button").forEach(other => {
                    other.classList.toggle("on", other === button);
                });
            };
        });
 
        field(root, "add-unit").onchange = event => {
            const [amount, lowAt] = DEFAULTS[event.target.value];
 
            field(root, "add-qty").value = amount;
            field(root, "add-low").value = lowAt;
        };
 
        root.querySelectorAll(".add-stepper button").forEach(button => {
            button.onclick = () => {
                const input = field(root, button.dataset.target);
                const step = STEP[field(root, "add-unit").value];
                const next = (Number(input.value) || 0) + Number(button.dataset.step) * step;
 
                input.value = Math.min(999, Math.max(0, round(next)));
            };
        });
 
        field(root, "add-save").onclick = () => saveItem(root, location);
 
        setTimeout(() => field(root, "add-name").focus(), 50);
    }
 
    function render(root) {
        root.innerHTML = `
            <header class="add-header">
                <button id="add-back" type="button" aria-label="Back">‹</button>
                <h1 class="ttl">Add Item</h1>
            </header>
 
            <div class="add-row">
                <label for="add-name">Name</label>
                <input
                    id="add-name"
                    maxlength="24"
                    placeholder="e.g., Cheddar Cheese"
                    autocomplete="off"
                >
            </div>
 
            <div class="add-row">
                <label>Where</label>
                <span class="add-segment">
                    <button type="button" data-location="fridge" class="on">Fridge</button>
                    <button type="button" data-location="pantry">Pantry</button>
                    <button type="button" data-location="freezer">Freezer</button>
                </span>
            </div>
 
            <div class="add-row">
                <label for="add-unit">Unit</label>
                <select id="add-unit">
                    ${UNITS.map(unit => `<option value="${unit[0]}">${unit[1]}</option>`).join("")}
                </select>
            </div>
 
            <div class="add-row">
                <label for="add-qty">Amount</label>
                ${stepperHTML("add-qty", 2, "amount")}
            </div>
 
            <div class="add-row">
                <label for="add-exp">Expires</label>
                <input id="add-exp" type="date">
            </div>
 
            <div class="add-row">
                <label for="add-low">Low at</label>
                ${stepperHTML("add-low", 1, "low level")}
            </div>
 
            <p id="add-err" role="alert"></p>
 
            <button id="add-save" type="button">Save to Inventory</button>
        `;
 
        bindEvents(root);
    }
 
    App.screens.add = { render };
})();    