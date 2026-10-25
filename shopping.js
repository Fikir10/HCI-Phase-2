
/* Shopping List - Raiya */

(() => {
    let adding = false;

    const escapeHTML = value =>
        String(value).replace(/[&<>"']/g, char => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[char]);

    function render(root) {
        const items = Data.shop();
        const purchased = items.filter(item => item.purchased);
        const remaining = items.filter(item => !item.purchased);

        root.innerHTML = `
            <header class="list-header">
                <div>
                    <h1>Shopping List</h1>
                    <p>${remaining.length} items remaining</p>
                </div>

                <button class="list-add" type="button">
                    + Add Item
                </button>
            </header>

            <div class="list-content">

                ${adding ? `
                    <form id="list-form" class="list-form">
                        <h2>Add Shopping Item</h2>

                        <label for="list-name">Item Name</label>
                        <input
                            id="list-name"
                            name="name"
                            type="text"
                            placeholder="e.g. Bananas"
                            maxlength="50"
                            required
                        >

                        <label for="list-qty">Quantity</label>
                        <input
                            id="list-qty"
                            name="qty"
                            type="number"
                            min="0.01"
                            max="999"
                            step="any"
                            value="1"
                            required
                        >

                        <label for="list-unit">Unit</label>
                        <select id="list-unit" name="unit" required>
                            <option value="Ct">Count</option>
                            <option value="Lb">Pounds</option>
                            <option value="Oz">Ounces</option>
                            <option value="Gal">Gallons</option>
                            <option value="Slices">Slices</option>
                            <option value="Loaf">Loaf</option>
                        </select>

                        <label for="list-cat">Category</label>
                        <select id="list-cat" name="cat" required>
                            <option value="fridge">Fridge</option>
                            <option value="pantry">Pantry</option>
                            <option value="freezer">Freezer</option>
                        </select>

                        <div class="list-actions">
                            <button
                                type="button"
                                id="list-cancel"
                                class="list-cancel"
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                class="list-save"
                            >
                                Save Item
                            </button>
                        </div>
                    </form>
                ` : ""}

                <div class="list-section">
                    <h2>Items to Buy</h2>
                    <span>${remaining.length}</span>
                </div>

                <div class="list-items">
                    ${remaining.length === 0
                        ? `<p class="list-empty">
                            No items left to buy!
                           </p>`
                        : remaining.map(item => `
                            <div class="list-row">
                                <label class="list-check">
                                    <input
                                        type="checkbox"
                                        data-id="${escapeHTML(item.id)}"
                                    >

                                    <span class="list-name">
                                        ${escapeHTML(item.name)}
                                    </span>
                                </label>

                                <span class="list-amount">
                                    ${item.qty} ${escapeHTML(item.unit)}
                                </span>

                                <button
                                    class="list-remove"
                                    type="button"
                                    data-id="${escapeHTML(item.id)}"
                                    aria-label="Remove ${escapeHTML(item.name)}"
                                >
                                    ×
                                </button>
                            </div>
                        `).join("")
                    }
                </div>

                ${purchased.length > 0 ? `
                    <div class="list-section">
                        <h2>Purchased</h2>
                        <span>${purchased.length}</span>
                    </div>

                    <div class="list-items">
                        ${purchased.map(item => `
                            <div class="list-row list-purchased">
                                <label class="list-check">
                                    <input
                                        type="checkbox"
                                        data-id="${escapeHTML(item.id)}"
                                        checked
                                    >

                                    <span class="list-name list-done">
                                        ${escapeHTML(item.name)}
                                    </span>
                                </label>

                                <span class="list-amount">
                                    ${item.qty} ${escapeHTML(item.unit)}
                                </span>

                                <button
                                    class="list-remove"
                                    type="button"
                                    data-id="${escapeHTML(item.id)}"
                                    aria-label="Remove ${escapeHTML(item.name)}"
                                >
                                    ×
                                </button>
                            </div>
                        `).join("")}
                    </div>
                ` : ""}

            </div>

            <footer class="list-footer">
                <button
                    id="list-transfer"
                    type="button"
                    ${purchased.length === 0 ? "disabled" : ""}
                >
                    Add Purchased to Inventory (${purchased.length})
                </button>
            </footer>
        `;

        root.querySelector(".list-add").onclick = () => {
            adding = !adding;
            render(root);
        };

        const form = root.querySelector("#list-form");

        if (form) {
            root.querySelector("#list-cancel").onclick = () => {
                adding = false;
                render(root);
            };

            form.onsubmit = event => {
                event.preventDefault();

                const name = form.elements.namedItem("name").value.trim();
                const qty = Number(form.elements.namedItem("qty").value);
                const unit = form.elements.namedItem("unit").value;
                const cat = form.elements.namedItem("cat").value;

                if (
                    !name ||
                    !Number.isFinite(qty) ||
                    qty <= 0 ||
                    qty > 999
                ) {
                    App.toast("Please enter a valid name and quantity.");
                    return;
                }

                Data.addShop({
                    name: name,
                    qty: qty,
                    unit: unit,
                    cat: cat
                });

                adding = false;
                render(root);

                App.toast("Item added to shopping list!");
            };
        }

        root.querySelectorAll(".list-check input").forEach(box => {
            box.onchange = () => {
                const id = box.dataset.id;

                Data.togglePurchased(id);

                render(root);
            };
        });

        root.querySelectorAll(".list-remove").forEach(button => {
            button.onclick = () => {
                const id = button.dataset.id;

                Data.removeShop(id);

                render(root);

                App.toast("Item removed from shopping list.");
            };
        });

        root.querySelector("#list-transfer").onclick = () => {
            const bought = Data.shop().filter(item => item.purchased);

            if (bought.length === 0) {
                return;
            }

            bought.forEach(item => {
                const existing = Data.inv().find(inv =>
                    inv.name.toLowerCase() === item.name.toLowerCase() &&
                    inv.unit === item.unit &&
                    inv.cat === item.cat
                );

                if (existing) {
                    Data.adjust(existing.id, Number(item.qty));
                } else {
                    Data.addItem({
                        name: item.name,
                        qty: Number(item.qty),
                        unit: item.unit,
                        cat: item.cat,
                        lowAt: 0,
                        exp: null
                    });
                }

                Data.removeShop(item.id);
            });

            render(root);

            App.toast("Purchased items added to inventory!");
        };
    }

    App.screens.list = { render };
})();
