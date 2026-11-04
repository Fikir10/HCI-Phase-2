/* Meal Suggestions Screen */
(() => {
  // Hardcoded recipes matching items in data.js
  const RECIPES = [
    {
      id: "r1",
      name: "Classic Chicken Pasta",
      time: "20 min",
      tags: ["dinner"],
      instructions:
        "Boil spaghetti until tender. Heat olive oil, cook sliced chicken breast, and stir in pasta sauce. Toss pasta with sauce and chicken.",
      ingredients: [
        { name: "Spaghetti", qty: 1, unit: "Lb", cat: "pantry" },
        { name: "Pasta Sauce", qty: 1, unit: "Ct", cat: "pantry" },
        { name: "Chicken Breast", qty: 1, unit: "Lb", cat: "fridge" },
        { name: "Olive Oil", qty: 2, unit: "Oz", cat: "pantry" },
      ],
    },
    {
      id: "r2",
      name: "Grilled Cheese Sandwich",
      time: "8 min",
      tags: ["quick", "beginner"],
      instructions:
        "Spread butter on bread slices. Place cheddar cheese between slices and toast on a skillet until golden brown and melted.",
      ingredients: [
        { name: "Wheat Bread", qty: 2, unit: "Slices", cat: "pantry" },
        { name: "Cheddar Cheese", qty: 0.25, unit: "Lb", cat: "fridge" },
        { name: "Butter", qty: 1, unit: "Ct", cat: "fridge" },
      ],
    },
    {
      id: "r3",
      name: "Spinach & Turkey Scramble",
      time: "10 min",
      tags: ["quick"],
      instructions:
        "Sauté baby spinach and deli turkey in butter. Whisk eggs with a splash of milk, pour into skillet, and gently scramble.",
      ingredients: [
        { name: "Eggs", qty: 2, unit: "Ct", cat: "fridge" }, // Starts at 0 in data.js (demonstrates missing ingredient)
        { name: "Baby Spinach", qty: 2, unit: "Oz", cat: "fridge" },
        { name: "Deli Turkey", qty: 2, unit: "Oz", cat: "fridge" },
        { name: "Butter", qty: 1, unit: "Ct", cat: "fridge" },
      ],
    },
    {
      id: "r4",
      name: "Cheesy Bean & Rice Bowl",
      time: "6 min",
      tags: ["quick", "beginner", "microwave"],
      instructions:
        "Combine canned beans and cooked rice in a bowl. Microwave for 2 minutes, then top with shredded cheddar cheese until melted.",
      ingredients: [
        { name: "Rice", qty: 0.5, unit: "Lb", cat: "pantry" },
        { name: "Canned Beans", qty: 1, unit: "Ct", cat: "pantry" },
        { name: "Cheddar Cheese", qty: 0.2, unit: "Lb", cat: "fridge" },
      ],
    },
    {
      id: "r5",
      name: "Berry Oatmeal Breakfast",
      time: "5 min",
      tags: ["quick", "beginner"],
      instructions:
        "Cook oatmeal in whole milk on stovetop or microwave. Stir in frozen berries and honey or sugar to taste.",
      ingredients: [
        { name: "Oatmeal", qty: 4, unit: "Oz", cat: "pantry" },
        { name: "Whole Milk", qty: 0.1, unit: "Gal", cat: "fridge" },
        { name: "Frozen Berries", qty: 0.5, unit: "Lb", cat: "freezer" },
      ],
    },
  ];

    // New Recipe Form settings
  const UNITS = ["Ct", "Oz", "Lb", "Gal", "Loaf", "Slices"];
  const TIMES = [5, 10, 15, 20, 30, 45, 60];

  // Meal Suggestions state
  let activeFilter = "all";
  let expandedRecipeId = null;

  // Weekly Meal Planner state
  let showingPlanner = false;
  let weeklyPlan = {};

  const DAYS = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday"
  ];

  // Used by the New Recipe Form
  const escapeHTML = value =>
    String(value).replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);

  // Check whether recipe ingredients are in inventory
  function evaluateRecipe(recipe) {
    const inv = Data.inv();
    const missing = [];
    const inStock = [];

    recipe.ingredients.forEach(req => {
      const found = inv.find(
        i => i.name.toLowerCase() === req.name.toLowerCase()
      );

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
    const recipe = RECIPES.find((r) => r.id === recipeId);
    const { missing } = evaluateRecipe(recipe);

    if (missing.length === 0) {
      App.toast("All ingredients are in stock!");
      return;
    }

    let addedCount = 0;
    missing.forEach((item) => {
      const alreadyInShop = Data.shop().find(
        (s) => s.name.toLowerCase() === item.name.toLowerCase() && !s.purchased,
      );
      if (!alreadyInShop) {
        Data.addShop({
          name: item.name,
          qty: item.neededQty,
          unit: item.unit,
          cat: item.cat,
        });
        addedCount++;
      }
    });

    if (addedCount > 0) {
      App.toast(
        `Added ${addedCount} item${addedCount > 1 ? "s" : ""} to Shopping List!`,
      );
    } else {
      App.toast("Already on your Shopping List.");
    }

    render(document.getElementById("panel-meals"), true);
  }

  function cookRecipe(recipeId) {
    const recipe = RECIPES.find((r) => r.id === recipeId);
    const { canMake } = evaluateRecipe(recipe);

    if (!canMake) {
      App.toast("Can't cook yet: ingredients are missing.");
      return;
    }

    recipe.ingredients.forEach((req) => {
      const invItem = Data.inv().find(
        (i) => i.name.toLowerCase() === req.name.toLowerCase(),
      );
      if (invItem) {
        Data.adjust(invItem.id, -req.qty);
      }
    });

    App.toast(`Cooked ${recipe.name}. Inventory updated.`);
    render(document.getElementById("panel-meals"), true);
  }

  function renderPlanner(root) {
  root.innerHTML = `
    <header class="meals-header">
      <button class="meals-back">← Back to Meals</button>
      <h2 class="ttl">Weekly Meal Planner</h2>
      
    </header>

    <div class="meals-content">
      <div class="meals-card">
        <h2>Plan a Meal</h2>

        <label for="plan-day">Select Day</label>
        <select id="plan-day" class="meals-select">
          ${DAYS.map(day =>
            `<option value="${day}">${day}</option>`
          ).join("")}
        </select>

        <label for="plan-recipe">Select Recipe</label>
        <select id="plan-recipe" class="meals-select">
          ${RECIPES.map(recipe =>
            `<option value="${recipe.id}">${recipe.name}</option>`
          ).join("")}
        </select>

        <button class="meals-btn meals-btn-cook" id="plan-add">
          + Add to Meal Plan
        </button>
      </div>

      <h2>Your Weekly Plan</h2>

      ${DAYS.map(day => {
        const recipe = RECIPES.find(
          r => r.id === weeklyPlan[day]
        );

        return `
          <div class="meals-card">
            <strong>${day}</strong>
            <p>${recipe ? recipe.name : "No meal planned"}</p>

            ${recipe ? `
              <button class="meals-plan-remove" data-day="${day}">
                Remove
              </button>
            ` : ""}
          </div>
        `;
      }).join("")}
    </div>
  `;

  root.querySelector(".meals-back").onclick = () => {
    showingPlanner = false;
    render(root);
  };

  root.querySelector("#plan-add").onclick = () => {
    const day = root.querySelector("#plan-day").value;
    const recipeId = root.querySelector("#plan-recipe").value;

    weeklyPlan[day] = recipeId;

    App.toast("Meal added to your weekly plan!");
    renderPlanner(root);
  };

  root.querySelectorAll(".meals-plan-remove").forEach(btn => {
    btn.onclick = () => {
      delete weeklyPlan[btn.dataset.day];
      renderPlanner(root);
    };
  });
}

  function render(root, preserveScroll = false) {
    // Capture current scroll position if requested (fixed typo here)
   if (showingPlanner) {
        renderPlanner(root);
        return;
    }
   
    const oldContent = root.querySelector(".meals-content");
    const scrollPos = oldContent && preserveScroll ? oldContent.scrollTop : 0;

    const evaluated = RECIPES.map((r) => ({
      ...r,
      eval: evaluateRecipe(r),
    }));

    const filtered = evaluated.filter((r) => {
      if (activeFilter === "ready") return r.eval.canMake;
      if (activeFilter === "quick") return r.tags.includes("quick");
      if (activeFilter === "beginner") return r.tags.includes("beginner");
      return true;
    });


    root.innerHTML = `
      <header class="meals-header">
        <div>
          <h1 class="ttl">Meal Suggestions</h1>
      
        </div>

        <button class="meals-new" type="button" aria-label="New recipe">
          + Recipe
        </button>
      </header>

      <div class="meals-planner-bar">
        <button id="open-planner" class="meals-btn meals-btn-cook">
          Plan My Week
        </button>
      </div>

      <div class="meals-filters" role="group" aria-label="Recipe Filters">
        <button class="meals-chip ${activeFilter === "all" ? "on" : ""}" data-filter="all">
          All (${evaluated.length})
        </button>
        <button class="meals-chip ${activeFilter === "ready" ? "on" : ""}" data-filter="ready">
          Ready to Cook
        </button>
        <button class="meals-chip ${activeFilter === "quick" ? "on" : ""}" data-filter="quick">
          &lt; 15 min
        </button>
        <button class="meals-chip ${activeFilter === "beginner" ? "on" : ""}" data-filter="beginner">
          Beginner
        </button>
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
                                    <h2 class="meals-title">${escapeHTML(r.name)}</h2>
                                </div>
                                <div class="meals-card-bottom">
                                    <div class="meals-meta">${escapeHTML(r.time)} · ${r.ingredients.length} Ingredients</div>
                                    <span class="meals-badge ${badgeClass}">${badgeText}</span>
                                </div>
                            </div>

                            ${isExpanded ? `
                                <div class="meals-details">
                                    <p class="meals-instructions">${escapeHTML(r.instructions)}</p>
                                    <h3 class="meals-ing-title">Required Ingredients:</h3>
                                    <div class="meals-ing-list">
                                        ${r.ingredients.map(ing => {
                                            const isMissing = r.eval.missing.some(m => m.name.toLowerCase() === ing.name.toLowerCase());
                                            return `
                                                <div class="meals-ing-row">
                                                    <span>${escapeHTML(ing.name)} (${ing.qty} ${ing.unit})</span>
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

        // Restore scroll position if requested
        const newContent = root.querySelector(".meals-content");
        if (newContent && preserveScroll) {
            newContent.scrollTop = scrollPos;
        }

        // Event Listeners
        root.querySelector(".meals-new").onclick = () => openRecipeForm();
        root.querySelector("#open-planner").onclick = () => {
    showingPlanner = true;
    renderPlanner(root);
};

        root.querySelectorAll(".meals-chip").forEach(btn => {
            btn.onclick = () => {
                activeFilter = btn.dataset.filter;
                render(root, false); // Resets scroll back to top on filter change
            };
        });

        root.querySelectorAll("[data-toggle]").forEach(cardTop => {
            cardTop.onclick = () => {
                const id = cardTop.dataset.toggle;
                expandedRecipeId = expandedRecipeId === id ? null : id;
                render(root, true); // Keeps scroll position on card expansion
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

    /* New Recipe Form (Full-Screen Overlay) */

    // Generate HTML template for a single ingredient input line row
    function ingredientLineHTML() {
        return `
            <div class="meals-line">
                <input class="meals-line-name" list="meals-names" placeholder="Item" autocomplete="off" aria-label="Ingredient name">
                <input class="meals-line-qty" type="number" min="0.01" step="any" value="1" aria-label="Amount">
                <select class="meals-line-unit" aria-label="Unit">
                    ${UNITS.map(unit => `<option>${unit}</option>`).join("")}
                </select>
                <button type="button" class="meals-remove" aria-label="Remove ingredient">×</button>
            </div>
        `;
    }

    // Opens the full screen recipe creation workflow inside the #add overlay
    function openRecipeForm() {
        const overlay = document.getElementById("add");
        let level = "beginner";

        overlay.innerHTML = `
            <header class="meals-form-header">
                <button type="button" class="meals-form-back" aria-label="Back">‹</button>
                <h1 class="ttl">New Recipe</h1>
            </header>

            <div class="meals-form-body">
                <div class="meals-form-row">
                    <label for="meals-f-name">Name</label>
                    <input id="meals-f-name" maxlength="30" placeholder="e.g., Spinach Omelet" autocomplete="off">
                </div>

                <div class="meals-form-row">
                    <label for="meals-f-time">Time</label>
                    <select id="meals-f-time">
                        ${TIMES.map(t => `<option value="${t}"${t === 15 ? " selected" : ""}>${t} min</option>`).join("")}
                    </select>
                </div>

                <div class="meals-form-row">
                    <label>Level</label>
                    <span class="meals-form-seg">
                        <button type="button" data-level="beginner" class="on">Beginner</button>
                        <button type="button" data-level="any">Any</button>
                    </span>
                </div>

                <div class="meals-form-row meals-form-stack">
                    <label for="meals-f-steps">Steps</label>
                    <textarea id="meals-f-steps" rows="2" placeholder="Short cooking steps"></textarea>
                </div>

                <div class="meals-form-heading">Ingredients</div>
                <div class="meals-form-lines">${ingredientLineHTML()}</div>
                <button type="button" class="meals-form-add">+ Add Ingredient</button>

                <datalist id="meals-names">
                    ${Data.inv().map(item => `<option value="${escapeHTML(item.name)}"></option>`).join("")}
                </datalist>
            </div>

            <footer class="meals-form-footer">
                <p class="meals-form-error" role="alert"></p>
                <button type="button" class="meals-form-save">Save Recipe</button>
            </footer>
        `;

        overlay.hidden = false;

        const field = selector => overlay.querySelector(selector);
        const lines = field(".meals-form-lines");
        const showError = message => { field(".meals-form-error").textContent = message; };

        // Validates and saves the newly created recipe
        function saveRecipe() {
            const name = field("#meals-f-name").value.trim();
            const time = Number(field("#meals-f-time").value);

            const ingredients = [...overlay.querySelectorAll(".meals-line")].map(line => ({
                name: line.querySelector(".meals-line-name").value.trim(),
                qty: Number(line.querySelector(".meals-line-qty").value),
                unit: line.querySelector(".meals-line-unit").value
            }));

            if (!name) {
                showError("Please enter a recipe name.");
                field("#meals-f-name").focus();
                return;
            }

            if (ingredients.some(ing => !ing.name)) {
                showError("Fill in every ingredient name or remove the empty row.");
                return;
            }

            if (ingredients.some(ing => !(ing.qty > 0))) {
                showError("Amounts must be more than 0.");
                return;
            }

            /* Use the inventory location when the item exists, otherwise Pantry */
            ingredients.forEach(ing => {
                const match = Data.inv().find(item => item.name.toLowerCase() === ing.name.toLowerCase());
                ing.cat = match ? match.cat : "pantry";
            });

            const tags = [];
            if (time <= 15) { tags.push("quick"); }
            if (level === "beginner") { tags.push("beginner"); }
            if (tags.length === 0) { tags.push("dinner"); }

            RECIPES.unshift({
                id: "r_" + Date.now(),
                name: name,
                time: `${time} min`,
                tags: tags,
                instructions: field("#meals-f-steps").value.trim() || "No steps added.",
                ingredients: ingredients
            });

            activeFilter = "all";
            App.closeAdd();
            render(document.getElementById("panel-meals"));
            App.toast(`Added recipe "${name}"`);
        }

        // Form interactive bindings
        field(".meals-form-back").onclick = () => App.closeAdd();

        overlay.querySelectorAll(".meals-form-seg button").forEach(button => {
            button.onclick = () => {
                level = button.dataset.level;

                overlay.querySelectorAll(".meals-form-seg button").forEach(other => {
                    other.classList.toggle("on", other === button);
                });
            };
        });

        field(".meals-form-add").onclick = () => {
            lines.insertAdjacentHTML("beforeend", ingredientLineHTML());
            lines.lastElementChild.querySelector(".meals-line-name").focus();
        };

        lines.onclick = event => {
            if (!event.target.closest(".meals-remove")) {
                return;
            }

            if (lines.children.length === 1) {
                showError("A recipe needs at least one ingredient.");
                return;
            }

            event.target.closest(".meals-line").remove();
        };

        // Auto fill unti types if matching item already exists in inventory
        lines.onchange =  event => {
            if (!event.target.classList.contains("meals-line-name")) {
                return;
            }
            const match = Data.inv().find(item => item.name.toLowerCase() === event.target.value.trim().toLowerCase());

            if (match) {
                event.target.closest(".meals-line").querySelector(".meals-line-unit").value = match.unit;
            }
        }

        field(".meals-form-save").onclick = saveRecipe;

        setTimeout(() => field("#meals-f-name").focus(), 50);
    }

    App.screens.meals = { render };
})();
