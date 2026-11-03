/* Shopping List */

(() => {
    let adding = false;

    //Pre-made quick shopping list templates for instant loading 
    const SHOPPING_TEMPLATES = [
        {
            id: "t1",
            name: "Weekly Staples",
            items: [
                { name: "Whole Milk", qty: 1, unit: "Gal", cat: "fridge" },
                { name: "Eggs", qty: 12, unit: "Ct", cat: "fridge" },
                { name: "Wheat Bread", qty: 1, unit: "Loaf", cat: "pantry" }
            ]
        },
        {
            id: "t2",
            name: "Taco Night",
            items: [
                { name: "Canned Beans", qty: 2, unit: "Ct", cat: "pantry" },
                { name: "Cheddar Cheese", qty: 0.25, unit: "Lb", cat: "fridge" }
            ]
        },
        {
            id: "t3",
            name: "Breakfast Essentials",
            items: [
                { name: "Rolled Oats", qty: 1, unit: "Ct", cat: "pantry" },
                { name: "Greek Yogurt", qty: 2, unit: "Ct", cat: "fridge" },
                { name: "Berries", qty: 1, unit: "Ct", cat: "fridge" }
            ]
        },
        {
            id: "t4",
            name: "Baking Supplies",
            items: [
                { name: "All-Purpose Flour", qty: 1, unit: "Lb", cat: "pantry" },
                { name: "Granulated Sugar", qty: 1, unit: "Lb", cat: "pantry" },
                { name: "Unsalted Butter", qty: 1, unit: "Ct", cat: "fridge" }
            ]    
        }
    ];

    const escapeHTML = value =>
        String(value).replace(/[&<>"']/g, char => ({
            "&": "&amp",
            "<": "&lt",
            ">": "&gt",
            '"': "&quot;",
            "'": "&#39;"
        })[char]);

    /*  Quick Lists / Templates Overlay */   

    function openTemplateScreen(listRoot) {
        const overlay = document.getElementById("add");

        overlay.innerHTML = `
            <header class="meals-form-header">
                <button type="button" class="meals-form-back" aria-label="Back">‹</button>
                <h1 class="ttl">Load Quick List</h1>
            </header>

            <div class="meals-form-body" style="display: flex; flex-direction: column; gap: 12px; padding-top: 12px;">
                <p style="color: var(--muted); font-size: var(--fs-sm);">Select a pre-made shopping list to instantly add its items to your active list:</p>
                
                ${SHOPPING_TEMPLATES.map(tpl => `
                    <div class="meals-card" style="cursor: pointer;" data-template-id="${tpl.id}">
                        <div class="meals-card-top" style="align-items: center; display: flex; justify-content: space-between;">
                            <div style="flex: 1; min-width: 0; padding-right: 12px;">
                                <h2 class="meals-title">${escapeHTML(tpl.name)}</h2>
                                <div class="meals-meta" style="margin-top: 4px; color: var(--muted); font-size: var(--fs-sm);">
                                    ${tpl.items.map(i => `${i.qty} ${i.unit} ${i.name}`).join(", ")}
                                </div>
                            </div>
                            <button type="button" class="meals-btn meals-btn-cook" style="flex: none; min-height: 40px; padding: 0 16px;">Load</button>
                        </div>
                    </div>
                `).join("")}
            </div>
        `;

        overlay.hidden = false;

        // Back button to close template overlay
        overlay.querySelector(".meals-form-back").onclick = () => App.closeAdd();

        // Template selection handlers
        overlay.querySelectorAll("[data-template-id]").forEach(card => {
            card.onclick = () => {
                const tplId = card.dataset.templateId;
                const template = SHOPPING_TEMPLATES.find(t => t.id === tplId);

                if (template) {
                    let addedCount = 0;
                    template.items.forEach(item => {
                        const existing = Data.shop().find(s => s.name.toLowerCase() === item.name.toLowerCase() && !s.purchased);
                        if (!existing) {
                            Data.addShop(item);
                            addedCount++;
                        }
                    });

                    App.closeAdd();
                    render(listRoot);
                    App.toast(`Loaded "${template.name}" (${addedCount} items added)`);
                }
            };
        });
    }

    /*  Main Shopping List Screen */

    function render(root) {
        const items = Data.shop();
        const purchased = items.filter(item => item.purchased);
        const remaining = items.filter(item => !item.purchased && !item.rolledOver);
        const rolledOver = items.filter(item => !item.purchased && item.rolledOver);

        const totalRemaining = remaining.length + rolledOver.length;

        root.innerHTML = `
            <header class="list-header">
                <div class="list-header-top">
                    <div>
                        <h1>Shopping List</h1>
                        <p>${totalRemaining} items remaining</p>
                    </div>
                </div>
                <div class="list-header-actions">
                    <button class="list-templates" type="button">Quick Lists</button>
                    <button class="list-add" type="button">+ Add Item</button>
                </div>
            </header>

            <div class="list-content">

                <!-- Inline Add Item Form -->
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
                                id="list-save"
                                class="list-save"
                            >
                                Save Item
                            </button>
                        </div>
                    </form>
                ` : ""}

                <!-- Items to Buy Section -->
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

                <!-- Saved for Next Trip (Rolled Over) Section -->
                ${rolledOver.length > 0 ? `
                    <div class="list-section">
                        <h2 style="margin: 0;">Saved for Next Trip</h2>
                        <span>${rolledOver.length}</span>
                    </div>
                    <div class="list-items">
                        ${rolledOver.map(item => `
                            <div class="list-row list-rolled-over">
                                <label class="list-check">
                                    <input type="checkbox" data-id="${escapeHTML(item.id)}">
                                    <span class="list-name">${escapeHTML(item.name)}</span>
                                </label>
                                <span class="list-amount">${item.qty} ${escapeHTML(item.unit)}</span>
                                <button class="list-remove" type="button" data-id="${escapeHTML(item.id)}">×</button>
                            </div>
                        `).join("")}
                    </div>
                ` : ""}

                <!-- Purchased Items Section -->
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

            <!-- Footer Action Bar -->
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

        // Event Handlers
        root.querySelector(".list-templates").onclick = () => {
            openTemplateScreen(root);
        };

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

        // Toggle checkbox status
        root.querySelectorAll(".list-check input").forEach(box => {
            box.onchange = () => {
                const id = box.dataset.id;

                Data.togglePurchased(id);

                render(root);
            };
        });

        // Remove item from shopping list
        root.querySelectorAll(".list-remove").forEach(button => {
            button.onclick = () => {
                const id = button.dataset.id;

                Data.removeShop(id);

                render(root);

                App.toast("Item removed from shopping list.");
            };
        });

        // Transfer purchased items to inventory & rollover unbought items
        root.querySelector("#list-transfer").onclick = () => {
            const items = Data.shop();
            const bought = items.filter(item => item.purchased);
            const unbought = items.filter(item => !item.purchased);

            if (bought.length === 0) return;

            // Transfer bought items to Inventory
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

            // Rollover unpurchased items for the next trip
            if (unbought.length > 0) {
                unbought.forEach(item => {
                    item.rolledOver = true; 
                });
                App.toast(`Moved ${bought.length} items to Stock & rolled over ${unbought.length} items for next trip!`);
            } else {
                App.toast("Purchased items added to inventory!");
            }

            render(root);
        };
    }

    App.screens.list = { render };
})();