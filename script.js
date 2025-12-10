// Initialize Icons globally (called after DOM content is loaded)
document.addEventListener("DOMContentLoaded", () => {
  if (typeof lucide !== "undefined" && lucide.createIcons) {
    lucide.createIcons();
  }
  loadMenuDataAndRender();
});

// Нова променлива за URL на JSON датотеката
const JSON_URL = "menuData.json";

/**
 * Асинхроно вчитува податоци од JSON датотека и потоа го рендерира менито.
 */
async function loadMenuDataAndRender() {
  const container = document.getElementById("menuContainer");
  if (!container) return;

  try {
    const response = await fetch(JSON_URL);

    if (!response.ok) {
      throw new Error(`HTTP грешка! Статус: ${response.status}`);
    }

    const data = await response.json();

    // ВАЖНО: Присвојување на вчитаните податоци на глобалната променлива
    // Ја користиме структурата 'menuData' од вашиот JSON
    menuData = data.menuData;

    renderMenu();
  } catch (error) {
    console.error("Грешка при вчитување на податоците за менито:", error);
    container.innerHTML =
      "<p style='text-align:center; color: var(--primary); font-weight:bold; padding: 3rem;'>Грешка при вчитување на менито. Проверете дали 'menuData.json' постои.</p>";
  }
}

// Global State
let cart = [];
const SIZE_LABELS = ["Средна (30cm)", "Фамилијарна (40cm)", "Џамбо (50cm)"];

/**
 * Renders the entire menu dynamically based on menuData.
 */
function renderMenu() {
  const container = document.getElementById("menuContainer");
  if (!container) return;

  // Iterate through each category
  for (const [key, section] of Object.entries(menuData)) {
    const sectionEl = document.createElement("div");
    sectionEl.innerHTML = `<h2 class="section-title">${section.title}</h2>`;

    const grid = document.createElement("div");
    grid.className = "menu-grid";

    section.items.forEach((item) => {
      const hasSizes = item.prices !== undefined;
      const card = document.createElement("div");
      card.className = "card";
      card.dataset.itemId = item.id;
      card.dataset.category = key;

      // Badge logic
      let badgeHTML = "";
      if (item.tag) {
        const specialClass = item.isSpecial ? "special" : "";
        badgeHTML = `<div class="badge ${specialClass}">${item.tag}</div>`;
      }

      let priceHTML, selectorHTML;

      if (hasSizes) {
        // Initial price is always the smallest size (index 0)
        priceHTML = `<div class="price-tag" id="price-${item.id}">${item.prices[0]} <span class="price-unit">ден</span></div>`;

        // Size selector HTML
        selectorHTML = `
                    <div class="size-selector" data-selected-size="0" id="selector-${item.id}">
                        <div class="size-option active" onclick="changeSize(${item.id}, 0, this)">30cm</div>
                        <div class="size-option" onclick="changeSize(${item.id}, 1, this)">40cm</div>
                        <div class="size-option" onclick="changeSize(${item.id}, 2, this)">50cm</div>
                    </div>
                `;
      } else {
        // Single price item
        priceHTML = `<div class="price-tag">${item.singlePrice} <span class="price-unit">ден</span></div>`;
        selectorHTML = `<div style="height: 10px;"></div>`; // Spacer for single items
      }

      card.innerHTML = `
              <div style="text-align: center;">
                <img width="230" height="200" src="${
                  item && item.imageURL && item.imageURL !== ""
                    ? item.imageURL
                    : "../images/woocommerce-placeholder-1.webp"
                }"
                class="card-img-top" alt="${item.name}">
              </div>
              ${badgeHTML}
                <div class="item-header">
                    <div>
                        <span class="item-number">#${item.id}</span>
                        <span class="item-name">${item.name}</span>
                    </div>
                </div>
                ${selectorHTML}
                ${priceHTML}
                <button class="add-btn" onclick="addToCart(${
                  item.id
                }, '${key}')">
                    <i data-lucide="plus" width="16"></i> Додади
                </button>
            `;
      grid.appendChild(card);
    });

    sectionEl.appendChild(grid);
    container.appendChild(sectionEl);
  }
  // Re-initialize lucide icons for newly created elements
  if (typeof lucide !== "undefined" && lucide.createIcons) {
    lucide.createIcons();
  }
}

/**
 * Updates the displayed price and active size selection for a pizza.
 * @param {number} itemId - The ID of the menu item.
 * @param {number} sizeIndex - The index of the selected size (0, 1, or 2).
 * @param {HTMLElement} element - The clicked size option element.
 */
function changeSize(itemId, sizeIndex, element) {
  // 1. Update visual selection
  const parent = element.parentElement;
  Array.from(parent.children).forEach((child) =>
    child.classList.remove("active")
  );
  element.classList.add("active");

  // 2. Find item and price
  let item;
  // Helper function to find item across all categories
  for (const cat in menuData) {
    const found = menuData[cat].items.find((i) => i.id === itemId);
    if (found) item = found;
  }

  if (item && item.prices) {
    // 3. Update price display
    document.getElementById(
      `price-${itemId}`
    ).innerHTML = `${item.prices[sizeIndex]} <span class="price-unit">ден</span>`;

    // 4. Store current selected size index on the selector's parent element
    parent.dataset.selectedSize = sizeIndex;
  }
}

/**
 * Adds an item to the shopping cart based on its current size selection.
 * @param {number} itemId - The ID of the menu item.
 * @param {string} categoryKey - The key of the category (e.g., 'classics').
 */
function addToCart(itemId, categoryKey) {
  const item = menuData[categoryKey].items.find((i) => i.id === itemId);
  let price, sizeName, selectedSizeIndex;

  if (!item) return;

  if (item.prices) {
    // Find the active size from the selector in the DOM
    const selectorEl = document.getElementById(`selector-${itemId}`);
    selectedSizeIndex = parseInt(selectorEl.dataset.selectedSize || 0);

    price = item.prices[selectedSizeIndex];
    sizeName = SIZE_LABELS[selectedSizeIndex];
  } else {
    // Single price item
    price = item.singlePrice;
    sizeName = "Порција/Парче";
  }

  cart.push({
    name: item.name,
    size: sizeName,
    price: price,
    id: Date.now() + Math.random(), // unique id for cart item
  });

  updateCartUI();
  toggleCart(true); // Open cart on add
}

/**
 * Removes an item from the cart by its unique cart ID.
 * @param {number} cartId - The unique ID of the cart item.
 */
function removeFromCart(cartId) {
  cart = cart.filter((item) => item.id !== cartId);
  updateCartUI();
}

/**
 * Updates the cart count, item list, and total price in the modal UI.
 */
function updateCartUI() {
  const countEl = document.getElementById("cartCount");
  const itemsEl = document.getElementById("cartItems");
  const totalEl = document.getElementById("cartTotal");

  countEl.innerText = cart.length;

  let total = 0;
  let html = "";

  if (cart.length === 0) {
    html =
      '<p style="text-align: center; color: var(--gray); margin-top: 2rem;">Вашата кошничка е празна.</p>';
  } else {
    cart.forEach((item) => {
      total += item.price;
      html += `
                <div class="cart-item">
                    <div class="cart-item-info">
                        <h4>${item.name}</h4>
                        <span>${item.size}</span>
                    </div>
                    <div style="display:flex; align-items:center;">
                        <span style="font-weight:bold;">${item.price} ден</span>
                        <button class="remove-item" onclick="removeFromCart(${item.id})">
                            <i data-lucide="trash-2" width="16"></i>
                        </button>
                    </div>
                </div>
            `;
    });
  }

  itemsEl.innerHTML = html;
  totalEl.innerText = `${total} ден`;

  // Re-initialize lucide icons for newly created cart items
  if (typeof lucide !== "undefined" && lucide.createIcons) {
    lucide.createIcons();
  }
}

/**
 * Toggles the visibility of the shopping cart modal.
 * @param {boolean} [forceOpen] - If true, forces the cart open.
 */
function toggleCart(forceOpen = false) {
  const overlay = document.getElementById("cartOverlay");
  if (!overlay) return;

  if (forceOpen) {
    overlay.classList.add("open");
  } else {
    overlay.classList.toggle("open");
  }
}

/**
 * Generates a WhatsApp message and opens the link for ordering.
 */
function checkout() {
  if (cart.length === 0) return;

  let message = "Здраво Amici Pizza, сакам да нарачам:\n\n";
  let total = 0;

  cart.forEach((item) => {
    message += `- ${item.name} (${item.size}) - ${item.price} ден\n`;
    total += item.price;
  });

  message += `\nВкупно: ${total} ден\n\nМојата адреса за достава е: [Внесете ја Вашата Адреса]`;

  const encodedMessage = encodeURIComponent(message);
  // Use the phone number from the menu (070 945 499)
  window.open(`https://wa.me/38970945499?text=${encodedMessage}`, "_blank");
}
