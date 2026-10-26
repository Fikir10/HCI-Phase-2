/* Meal Suggestions screen. */
(() => {
    // Hardcoded recipes matching items in data.js
    const RECIPES = [
        {
            id: "r1"
            name: "Classic Chiecken Pasta",
            time: "20 min", 
            tags: ["dinner"],
            instructions: "Boil spaghetti until tender. Heat olive oil, cook sliced chicken breast, and stir in pasta sauce. Toss pasta with sauce and chicken.",
            ingredients: [
                { name: "Spaghetti", qty: 1, unit: "Lb", cat: "pantry" },
                { name: "Pasta Sauce", qty: 1, unit: "Ct", cat: "pantry" },
                { name: "Chicken Breast", qty: 1, unit: "Lb", cat: "fridge" },
                { name: "Olive Oil", qty: 2, unit: "Oz", cat: "pantry" }
            ]
        },
        {
            id: "r2",
            name: "Grilled Cheese Sandwich",
            time: "8 min",
            tags: ["quick", "beginner"],
            instructions: "Spread butter on bread slices. Place cheddar cheese between slices and toast on a skillet until golden brown and melted.",
            ingredients: [
                { name: "Wheat Bread", qty: 2, unit: "Slices", cat: "pantry" },
                { name: "Cheddar Cheese", qty: 0.25, unit: "Lb", cat: "fridge" },
                { name: "Butter", qty: 1, unit: "Ct", cat: "fridge" }
            ]
        },
        {
            id: "r3",
            name: "Spinach & Turkey Scramble",
            time: "10 min",
            tags: ["quick"],
            instructions: "Sauté baby spinach and deli turkey in butter. Whisk eggs with a splash of milk, pour into skillet, and gently scramble.",
            ingredients: [
                { name: "Eggs", qty: 2, unit: "Ct", cat: "fridge" }, // Starts at 0 in data.js (demonstrates missing ingredient)
                { name: "Baby Spinach", qty: 2, unit: "Oz", cat: "fridge" },
                { name: "Deli Turkey", qty: 2, unit: "Oz", cat: "fridge" },
                { name: "Butter", qty: 1, unit: "Ct", cat: "fridge" }
            ]
        },
        {
            id: "r4",
            name: "Cheesy Bean & Rice Bowl",
            time: "6 min",
            tags: ["quick", "beginner", "microwave"],
            instructions: "Combine canned beans and cooked rice in a bowl. Microwave for 2 minutes, then top with shredded cheddar cheese until melted.",
            ingredients: [
                { name: "Rice", qty: 0.5, unit: "Lb", cat: "pantry" },
                { name: "Canned Beans", qty: 1, unit: "Ct", cat: "pantry" },
                { name: "Cheddar Cheese", qty: 0.2, unit: "Lb", cat: "fridge" }
            ]
        },
        {
            id: "r5",
            name: "Berry Oatmeal Breakfast",
            time: "5 min",
            tags: ["quick", "beginner"],
            instructions: "Cook oatmeal in whole milk on stovetop or microwave. Stir in frozen berries and honey or sugar to taste.",
            ingredients: [
                { name: "Oatmeal", qty: 4, unit: "Oz", cat: "pantry" },
                { name: "Whole Milk", qty: 0.1, unit: "Gal", cat: "fridge" },
                { name: "Frozen Berries", qty: 0.5, unit: "Lb", cat: "freezer" }
            ]
        }
    ];

    let activeFilter = "all";
    let expandedRecipeId = null;

    function evaluateRecipe(recipe) {
        const inv = Data.inv();
        const missing = [];
        const inStock = [];

        recipe.ingredients.forEach(req => {
        const found = inv.find(i => i.name.toLowerCase() === req.name.toLowerCase());
        if (!found || found.qty < req.qty) {
            missing.push({
            name: req.name,
            neededQty: req.qty,
            unit: req.unit,
            cat: req.cat,
            available: found ? found.qty : 0
            });
        } else {
            inStock.push(req);
        }
        });

        return {
            canMake: missing.length === 0,
            missing,
            inStock
        };
    }
    function addMissingToShopping(recipeId) {
        const recipe = RECIPES.find(r => r.id === recipeId);
        const { missing } = evaluateRecipe(recipe);

        if (missing.length === 0) {
        App.toast("All ingredients are in stock!");
        return;
        }

        let addedCount = 0;
        missing.forEach(item => {
      const alreadyInShop = Data.shop().find(
        s => s.name.toLowerCase() === item.name.toLowerCase() && !s.purchased
        );
        if (!alreadyInShop) {
            Data.addShop({
            name: item.name,
            qty: item.neededQty,
            unit: item.unit,
            cat: item.cat
            });
            addedCount++;
        }
        });

        if (addedCount > 0) {
            App.toast(`Added ${addedCount} missing item${addedCount > 1 ? "s" : ""} to Shopping List!`);
        } else {
            App.toast("Missing items are already on your Shopping List.");
        }

        render(document.getElementById("panel-meals"));
    }

    function cookRecipe(recipeId) {
        const recipe = RECIPES.find(r => r.id === recipeId);
        const { canMake } = evaluateRecipe(recipe);

        if (!canMake) {
            App.toast("Cannot cook: missing required ingredients.");
            return;
        }

        recipe.ingredients.forEach(req => {
            const invItem = Data.inv().find(i => i.name.toLowerCase() === req.name.toLowerCase());
            if (invItem) {
                Data.adjust(invItem.id, -req.qty);
            }
        });

        App.toast(`Cooked ${recipe.name}! Ingredients deducted.`);
        render(document.getElementById("panel-meals"));
    }

    function render(root) {
        const evaluated = RECIPES.map(r => ({
            ...r,
            eval: evaluateRecipe(r)
        }));

        const filtered = evaluated.filter(r => {
            if (activeFilter === "ready") return r.eval.canMake;
            if (activeFilter === "quick") return r.tags.includes("quick");
            if (activeFilter === "beginner") return r.tags.includes("beginner");
            return true;
        });

        root.innerHTML = `
        <header class="meals-header">
            <h1 class="ttl">Meal Suggestions</h1>
            <p class="meals-subtitle muted">Recipes matching current pantry & fridge stock</p>
        </header>

        <div class="meals-filters" role="tablist" aria-label="Recipe Filters">
            <button class="meals-chip ${activeFilter === 'all' ? 'on' : ''}" data-filter="all">All (${evaluated.length})</button>
            <button class="meals-chip ${activeFilter === 'ready' ? 'on' : ''}" data-filter="ready">Ready to Cook</button>
            <button class="meals-chip ${activeFilter === 'quick' ? 'on' : ''}" data-filter="quick">&lt; 15 min</button>
            <button class="meals-chip ${activeFilter === 'beginner' ? 'on' : ''}" data-filter="beginner">Beginner</button>
        </div>

        <div class="meals-content">
            ${filtered.length === 0 ? `<p class="meals-empty">No recipes match this filter.</p>` : ""}

            ${filtered.map(r => {
            const isExpanded = expandedRecipeId === r.id;
            const badgeText = r.eval.canMake ? "✓ In Stock" : `${r.eval.missing.length} Missing`;
            const badgeClass = r.eval.canMake ? "ready" : "missing";

            return `
                <div class="meals-card" data-id="${r.id}">
                <div class="meals-card-top" data-toggle="${r.id}">
                    <div class="meals-card-info">
                    <h2 class="meals-title">${r.name}</h2>
                    <div class="meals-meta">⏱ ${r.time} · ${r.ingredients.length} Ingredients</div>
                    </div>
                    <span class="meals-badge ${badgeClass}">${badgeText}</span>
                </div>

                ${isExpanded ? `
                    <div class="meals-details">
                    <p class="meals-instructions">${r.instructions}</p>
                    <h3 class="meals-ing-title">Required Ingredients:</h3>
                    <div class="meals-ing-list">
                        ${r.ingredients.map(ing => {
                        const isMissing = r.eval.missing.some(m => m.name.toLowerCase() === ing.name.toLowerCase());
                        return `
                            <div class="meals-ing-row">
                            <span>${ing.name} (${ing.qty} ${ing.unit})</span>
                            <span class="meals-ing-status ${isMissing ? 'need' : 'have'}">
                                ${isMissing ? 'Missing' : 'In Stock'}
                            </span>
                            </div>
                        `;
                        }).join("")}
                    </div>

                    <div class="meals-actions">
                        ${!r.eval.canMake ? `
                        <button class="meals-btn meals-btn-shop" data-action="shop" data-id="${r.id}">
                            + Add Missing to List
                        </button>
                        ` : `
                        <button class="meals-btn meals-btn-cook" data-action="cook" data-id="${r.id}">
                            Cook This Meal
                        </button>
                        `}
                    </div>
                    </div>
                ` : ""}
                </div>
            `;
            }).join("")}
        </div>
        `;

        root.querySelectorAll(".meals-chip").forEach(btn => {
            btn.onclick = () => {
                activeFilter = btn.dataset.filter;
                render(root);
            };
        });

        root.querySelectorAll("[data-toggle]").forEach(cardTop => {
            cardTop.onclick = () => {
                const id = cardTop.dataset.toggle;
                expandedRecipeId = expandedRecipeId === id ? null : id;
                render(root);
            };
        });

        root.querySelectorAll("[data-action]").forEach(btn => {
            btn.onclick = e => {
                e.stopPropagation();
                const action = btn.dataset.action;
                const id = btn.dataset.id;
                if (action === "shop") addMissingToShopping(id);
                if (action === "cook") cookRecipe(id);
            };
        });
    }
    App.screens.meals = { render };
})();