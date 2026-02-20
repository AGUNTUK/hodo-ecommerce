const PRODUCTS = [
  {
    id: 1,
    name: "Apex Structured Shirt",
    category: "Shirts",
    price: 129,
    rating: 4.8,
    sizes: ["S", "M", "L", "XL"],
    colors: ["Black", "White", "Red"],
    image:
      "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=900&q=80",
    description: "Engineered cotton shirt with a tailored silhouette and low-profile seam lines.",
  },
  {
    id: 2,
    name: "Vector Utility Jacket",
    category: "Jackets",
    price: 219,
    rating: 4.9,
    sizes: ["M", "L", "XL"],
    colors: ["Black", "Gray", "Navy"],
    image:
      "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=900&q=80",
    description:
      "Water-resistant shell jacket with minimalist hardware and modern structured collar.",
  },
  {
    id: 3,
    name: "Monolith Tapered Pants",
    category: "Pants",
    price: 149,
    rating: 4.7,
    sizes: ["S", "M", "L", "XL"],
    colors: ["Black", "Gray", "Olive"],
    image:
      "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=900&q=80",
    description: "Tapered technical trousers with subtle pleat detail and soft stretch movement.",
  },
  {
    id: 4,
    name: "Orbit Leather Belt",
    category: "Accessories",
    price: 79,
    rating: 4.6,
    sizes: ["M", "L", "XL"],
    colors: ["Black", "Brown", "Red"],
    image:
      "https://images.unsplash.com/photo-1560343776-97e7d202ff0e?auto=format&fit=crop&w=900&q=80",
    description: "Premium leather belt with matte black buckle and understated angular profile.",
  },
  {
    id: 5,
    name: "Noir Compression Tee",
    category: "Shirts",
    price: 89,
    rating: 4.5,
    sizes: ["S", "M", "L", "XL"],
    colors: ["Black", "White", "Gray"],
    image:
      "https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=900&q=80",
    description: "Soft compression knit tee designed for layering and sharp monochrome styling.",
  },
  {
    id: 6,
    name: "Titan Bomber Jacket",
    category: "Jackets",
    price: 249,
    rating: 4.9,
    sizes: ["M", "L", "XL"],
    colors: ["Black", "Navy", "Red"],
    image:
      "https://images.unsplash.com/photo-1614251055880-ee96e4803393?auto=format&fit=crop&w=900&q=80",
    description:
      "Insulated bomber with tonal ribbing, clean paneling, and a precision cropped fit.",
  },
  {
    id: 7,
    name: "Axis Pleated Trouser",
    category: "Pants",
    price: 159,
    rating: 4.7,
    sizes: ["S", "M", "L", "XL"],
    colors: ["Gray", "Navy", "Black"],
    image:
      "https://images.unsplash.com/photo-1593032465171-8bd65299489c?auto=format&fit=crop&w=900&q=80",
    description:
      "Pleated trouser with architectural drape and refined ankle taper for modern outfits.",
  },
  {
    id: 8,
    name: "Core Minimal Watch",
    category: "Accessories",
    price: 189,
    rating: 4.8,
    sizes: ["M", "L"],
    colors: ["Black", "Silver", "Red"],
    image:
      "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=900&q=80",
    description: "Clean-faced analog watch with metal casing, matte strap, and subtle red accents.",
  },
];

const COLOR_HEX = {
  Black: "#121212",
  White: "#f6f7fb",
  Red: "#ff0000",
  Gray: "#6d7380",
  Navy: "#182746",
  Olive: "#4f5941",
  Brown: "#6e4a33",
  Silver: "#9aa0aa",
};

const STORAGE_KEYS = {
  cart: "hodo_cart_v1",
  profile: "hodo_profile_v1",
};

const STAR_ICON =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.1 6.4 20.2l1.1-6.2L3 9.6l6.2-.9z"></path></svg>';
const HEART_ICON =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.3 4.9 13.8a4.9 4.9 0 1 1 6.9-7l.2.2.2-.2a4.9 4.9 0 0 1 6.9 7z"></path></svg>';
const BDT_NUMBER_FORMATTER = new Intl.NumberFormat("en-BD", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatPrice(price) {
  return `BDT ${BDT_NUMBER_FORMATTER.format(Number(price) || 0)}`;
}

function normalize(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function resolveColor(name) {
  return COLOR_HEX[name] || "#121212";
}

function safeParse(value, fallback) {
  try {
    const parsed = JSON.parse(value);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function getCart() {
  const raw = localStorage.getItem(STORAGE_KEYS.cart);
  const parsed = safeParse(raw, []);
  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed
    .map((item) => ({
      productId: Number(item.productId),
      size: String(item.size || ""),
      color: String(item.color || ""),
      quantity: Math.max(1, Number(item.quantity) || 1),
    }))
    .filter((item) => Number.isFinite(item.productId) && item.size && item.color);
}

function saveCart(cart) {
  localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify(cart));
}

function getProfile() {
  const raw = localStorage.getItem(STORAGE_KEYS.profile);
  const parsed = safeParse(raw, {});
  return {
    name: String(parsed.name || ""),
    email: String(parsed.email || ""),
    phone: String(parsed.phone || ""),
    address: String(parsed.address || ""),
  };
}

function saveProfile(profile) {
  localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(profile));
}

function findProduct(productId) {
  return PRODUCTS.find((item) => item.id === productId);
}

function addToCart(productId, size, color, quantity = 1) {
  const cart = getCart();
  const existing = cart.find(
    (item) => item.productId === productId && item.size === size && item.color === color
  );

  if (existing) {
    existing.quantity += Math.max(1, quantity);
  } else {
    cart.push({
      productId,
      size,
      color,
      quantity: Math.max(1, quantity),
    });
  }

  saveCart(cart);
  return cart;
}

function updateCartItemQuantity(index, nextQuantity) {
  const cart = getCart();
  if (!cart[index]) {
    return cart;
  }

  if (nextQuantity <= 0) {
    cart.splice(index, 1);
  } else {
    cart[index].quantity = nextQuantity;
  }

  saveCart(cart);
  return cart;
}

function removeCartItem(index) {
  const cart = getCart();
  if (!cart[index]) {
    return cart;
  }
  cart.splice(index, 1);
  saveCart(cart);
  return cart;
}

function getCartTotals(cart) {
  return cart.reduce(
    (acc, entry) => {
      const product = findProduct(entry.productId);
      if (!product) {
        return acc;
      }
      acc.items += entry.quantity;
      acc.subtotal += product.price * entry.quantity;
      return acc;
    },
    { items: 0, subtotal: 0 }
  );
}

function productCardMarkup(product) {
  return `
    <article class="product-card surface" data-product-id="${product.id}">
      <button class="wishlist-btn soft-button" type="button" aria-label="Save ${product.name}">
        ${HEART_ICON}
      </button>
      <div class="product-image-wrap surface-inset">
        <img src="${product.image}" alt="${product.name}">
      </div>
      <div class="product-body">
        <p class="product-category">${product.category}</p>
        <h3>${product.name}</h3>
        <div class="product-row">
          <p class="price-tag">${formatPrice(product.price)}</p>
          <p class="rating-chip">${STAR_ICON}<span>${product.rating.toFixed(1)}</span></p>
        </div>
        <a class="card-link" href="product.html?id=${product.id}">View Product</a>
      </div>
    </article>
  `;
}

function cartItemMarkup(entry, index) {
  const product = findProduct(entry.productId);
  if (!product) {
    return "";
  }

  const lineTotal = product.price * entry.quantity;
  return `
    <article class="cart-item surface" data-cart-index="${index}">
      <div class="cart-item-image surface-inset">
        <img src="${product.image}" alt="${product.name}">
      </div>
      <div class="cart-item-body">
        <p class="product-category">${product.category}</p>
        <h3>${product.name}</h3>
        <p class="cart-variant">${entry.size} / ${entry.color}</p>
        <div class="cart-item-row">
          <p class="price-tag">${formatPrice(lineTotal)}</p>
          <div class="qty-controls">
            <button class="qty-btn soft-button" type="button" data-action="decrease" aria-label="Decrease quantity">-</button>
            <span class="qty-count">${entry.quantity}</span>
            <button class="qty-btn soft-button" type="button" data-action="increase" aria-label="Increase quantity">+</button>
          </div>
        </div>
      </div>
      <button class="remove-link" type="button" data-action="remove">Remove</button>
    </article>
  `;
}

function bindWishlistButtons(scope = document) {
  scope.querySelectorAll(".wishlist-btn").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      button.classList.toggle("active");
    });
  });
}

function bindGlobalSearch() {
  document.querySelectorAll(".global-search-form").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const input = form.querySelector("input[name='q']");
      const query = input ? input.value.trim() : "";
      const params = new URLSearchParams();

      if (query) {
        params.set("q", query);
      }

      const suffix = params.toString();
      window.location.href = suffix ? `shop.html?${suffix}` : "shop.html";
    });
  });
}

function setActiveNavLinks() {
  const page = document.body.dataset.page;
  if (!page) {
    return;
  }

  document.querySelectorAll("[data-page-link]").forEach((link) => {
    const matchesPage = link.dataset.pageLink === page;
    link.classList.toggle("active", matchesPage);
  });
}

function initHomePage() {
  const featuredGrid = document.getElementById("featuredGrid");
  if (!featuredGrid) {
    return;
  }

  featuredGrid.innerHTML = PRODUCTS.slice(0, 4).map(productCardMarkup).join("");
  bindWishlistButtons(featuredGrid);

  document.querySelectorAll(".category-card").forEach((button) => {
    button.addEventListener("click", () => {
      const category = button.dataset.category;
      if (!category) {
        return;
      }
      const params = new URLSearchParams();
      params.set("category", category);
      window.location.href = `shop.html?${params.toString()}`;
    });
  });
}

function initShopPage() {
  const shopGrid = document.getElementById("shopGrid");
  const resultCount = document.getElementById("shopResultCount");
  const shopSearch = document.getElementById("shopSearch");
  if (!shopGrid || !resultCount || !shopSearch) {
    return;
  }

  const state = {
    search: "",
    category: "All",
    size: "All",
    color: "All",
  };

  const params = new URLSearchParams(window.location.search);
  const initialQuery = params.get("q");
  const initialCategory = params.get("category");

  if (initialQuery) {
    state.search = normalize(initialQuery);
    shopSearch.value = initialQuery;
    const globalSearchInput = document.querySelector(".global-search-form input[name='q']");
    if (globalSearchInput) {
      globalSearchInput.value = initialQuery;
    }
  }

  if (initialCategory) {
    state.category = initialCategory;
  }

  function syncActivePills() {
    document.querySelectorAll(".filter-pill").forEach((pill) => {
      const group = pill.dataset.group;
      const value = pill.dataset.value;
      const isActive = group && value && state[group] === value;
      pill.classList.toggle("active", Boolean(isActive));
    });
  }

  function passesFilters(product) {
    const haystack = normalize(`${product.name} ${product.category} ${product.description}`);
    if (state.search && !haystack.includes(state.search)) {
      return false;
    }

    if (state.category !== "All" && product.category !== state.category) {
      return false;
    }

    if (state.size !== "All" && !product.sizes.includes(state.size)) {
      return false;
    }

    if (state.color !== "All" && !product.colors.includes(state.color)) {
      return false;
    }

    return true;
  }

  function renderProducts() {
    const filtered = PRODUCTS.filter(passesFilters);
    resultCount.textContent = `${filtered.length} products available`;

    if (filtered.length === 0) {
      shopGrid.innerHTML = '<div class="empty-state">No products match the selected filters.</div>';
      return;
    }

    shopGrid.innerHTML = filtered.map(productCardMarkup).join("");
    bindWishlistButtons(shopGrid);
  }

  shopSearch.addEventListener("input", () => {
    state.search = normalize(shopSearch.value);
    renderProducts();
  });

  document.querySelectorAll(".filter-pill").forEach((pill) => {
    pill.addEventListener("click", () => {
      const group = pill.dataset.group;
      const value = pill.dataset.value;
      if (!group || !value) {
        return;
      }
      state[group] = value;
      syncActivePills();
      renderProducts();
    });
  });

  syncActivePills();
  renderProducts();
}

function initProductPage() {
  const detailImage = document.getElementById("detailImage");
  const detailTitle = document.getElementById("detailTitle");
  const detailPrice = document.getElementById("detailPrice");
  const detailRating = document.getElementById("detailRating");
  const detailDescription = document.getElementById("detailDescription");
  const sizeOptions = document.getElementById("sizeOptions");
  const colorOptions = document.getElementById("colorOptions");
  const statusLine = document.getElementById("productStatus");
  const addToCartBtn = document.getElementById("addToCartBtn");
  const buyNowBtn = document.getElementById("buyNowBtn");
  const relatedGrid = document.getElementById("relatedGrid");
  const detailMedia = document.getElementById("detailMedia");

  if (
    !detailImage ||
    !detailTitle ||
    !detailPrice ||
    !detailRating ||
    !detailDescription ||
    !sizeOptions ||
    !colorOptions ||
    !statusLine ||
    !addToCartBtn ||
    !buyNowBtn ||
    !relatedGrid ||
    !detailMedia
  ) {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const targetId = Number(params.get("id")) || PRODUCTS[0].id;
  const product = findProduct(targetId) || PRODUCTS[0];
  let selectedSize = product.sizes[0];
  let selectedColor = product.colors[0];

  detailImage.src = product.image;
  detailImage.alt = product.name;
  detailTitle.textContent = product.name;
  detailPrice.textContent = formatPrice(product.price);
  detailRating.innerHTML = `${STAR_ICON}<span>${product.rating.toFixed(1)} / 5.0</span>`;
  detailDescription.textContent = product.description;

  function paintMediaAccent() {
    const hex = resolveColor(selectedColor);
    detailMedia.style.setProperty("--media-accent", `${hex}2e`);
  }

  function renderSizes() {
    sizeOptions.innerHTML = product.sizes
      .map(
        (size) => `
          <button
            class="option-pill ${selectedSize === size ? "active" : ""}"
            type="button"
            data-size="${size}">
            ${size}
          </button>
        `
      )
      .join("");
  }

  function renderColors() {
    colorOptions.innerHTML = product.colors
      .map(
        (color) => `
          <button
            class="color-swatch ${selectedColor === color ? "active" : ""}"
            type="button"
            data-color="${color}"
            aria-label="Select ${color}"
            style="--swatch: ${resolveColor(color)}">
          </button>
        `
      )
      .join("");
    paintMediaAccent();
  }

  function setStatus(text) {
    statusLine.textContent = text;
  }

  sizeOptions.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-size]");
    if (!button) {
      return;
    }
    selectedSize = button.dataset.size || selectedSize;
    renderSizes();
  });

  colorOptions.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-color]");
    if (!button) {
      return;
    }
    selectedColor = button.dataset.color || selectedColor;
    renderColors();
  });

  addToCartBtn.addEventListener("click", () => {
    addToCart(product.id, selectedSize, selectedColor, 1);
    setStatus(`${product.name} (${selectedSize}, ${selectedColor}) added to cart.`);
  });

  buyNowBtn.addEventListener("click", () => {
    addToCart(product.id, selectedSize, selectedColor, 1);
    window.location.href = "cart.html";
  });

  const relatedProducts = PRODUCTS.filter(
    (item) => item.id !== product.id && item.category === product.category
  )
    .concat(PRODUCTS.filter((item) => item.id !== product.id && item.category !== product.category))
    .slice(0, 3);

  relatedGrid.innerHTML = relatedProducts.map(productCardMarkup).join("");
  bindWishlistButtons(relatedGrid);
  renderSizes();
  renderColors();
}

function initCartPage() {
  const cartList = document.getElementById("cartList");
  const cartItemCount = document.getElementById("cartItemCount");
  const cartSubtotal = document.getElementById("cartSubtotal");
  const cartTotal = document.getElementById("cartTotal");
  const checkoutBtn = document.getElementById("checkoutBtn");
  const cartStatus = document.getElementById("cartStatus");

  if (!cartList || !cartItemCount || !cartSubtotal || !cartTotal || !checkoutBtn || !cartStatus) {
    return;
  }

  function renderCart() {
    const cleanCart = getCart().filter((item) => Boolean(findProduct(item.productId)));
    saveCart(cleanCart);

    if (cleanCart.length === 0) {
      cartList.innerHTML = `
        <div class="empty-state cart-empty">
          <p>Your cart is empty. Start with the latest Hodo essentials.</p>
          <a class="btn btn-soft" href="shop.html">Go to Shop</a>
        </div>
      `;
    } else {
      cartList.innerHTML = cleanCart.map(cartItemMarkup).join("");
    }

    const totals = getCartTotals(cleanCart);
    cartItemCount.textContent = `${totals.items}`;
    cartSubtotal.textContent = formatPrice(totals.subtotal);
    cartTotal.textContent = formatPrice(totals.subtotal);
  }

  cartList.addEventListener("click", (event) => {
    const actionButton = event.target.closest("button[data-action]");
    if (!actionButton) {
      return;
    }

    const cartItem = actionButton.closest(".cart-item");
    if (!cartItem) {
      return;
    }

    const index = Number(cartItem.dataset.cartIndex);
    if (!Number.isFinite(index)) {
      return;
    }

    const currentCart = getCart();
    const entry = currentCart[index];
    if (!entry) {
      return;
    }

    const action = actionButton.dataset.action;
    if (action === "increase") {
      updateCartItemQuantity(index, entry.quantity + 1);
      cartStatus.textContent = "Quantity updated.";
    } else if (action === "decrease") {
      updateCartItemQuantity(index, entry.quantity - 1);
      cartStatus.textContent = "Quantity updated.";
    } else if (action === "remove") {
      removeCartItem(index);
      cartStatus.textContent = "Item removed from cart.";
    }

    renderCart();
  });

  checkoutBtn.addEventListener("click", () => {
    const cart = getCart();
    if (cart.length === 0) {
      cartStatus.textContent = "Your cart is empty.";
      return;
    }

    cartStatus.textContent = "Checkout is ready to connect to payment.";
  });

  renderCart();
}

function initProfilePage() {
  const profileForm = document.getElementById("profileForm");
  const profileName = document.getElementById("profileName");
  const profileEmail = document.getElementById("profileEmail");
  const profilePhone = document.getElementById("profilePhone");
  const profileAddress = document.getElementById("profileAddress");
  const profileStatus = document.getElementById("profileStatus");

  if (
    !profileForm ||
    !profileName ||
    !profileEmail ||
    !profilePhone ||
    !profileAddress ||
    !profileStatus
  ) {
    return;
  }

  const profile = getProfile();
  profileName.value = profile.name;
  profileEmail.value = profile.email;
  profilePhone.value = profile.phone;
  profileAddress.value = profile.address;

  profileForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const nextProfile = {
      name: profileName.value.trim(),
      email: profileEmail.value.trim(),
      phone: profilePhone.value.trim(),
      address: profileAddress.value.trim(),
    };
    saveProfile(nextProfile);
    profileStatus.textContent = "Profile saved successfully.";
  });
}

document.addEventListener("DOMContentLoaded", () => {
  bindGlobalSearch();
  setActiveNavLinks();
  initHomePage();
  initShopPage();
  initProductPage();
  initCartPage();
  initProfilePage();
});
