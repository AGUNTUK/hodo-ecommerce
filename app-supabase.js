// Hodo E-commerce App with Supabase Backend
// This file replaces localStorage with Supabase API calls

// ============================================
// CONFIGURATION
// ============================================

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

const STAR_ICON =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.1 6.4 20.2l1.1-6.2L3 9.6l6.2-.9z"></path></svg>';
const HEART_ICON =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.3 4.9 13.8a4.9 4.9 0 1 1 6.9-7l.2.2.2-.2a4.9 4.9 0 0 1 6.9 7z"></path></svg>';

const BDT_NUMBER_FORMATTER = new Intl.NumberFormat("en-BD", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

// ============================================
// UTILITY FUNCTIONS
// ============================================

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

function getSessionId() {
  let sessionId = localStorage.getItem("hodo_session_id");
  if (!sessionId) {
    sessionId = "session_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
    localStorage.setItem("hodo_session_id", sessionId);
  }
  return sessionId;
}

function showError(message, elementId = null) {
  console.error(message);
  if (elementId) {
    const element = document.getElementById(elementId);
    if (element) {
      element.textContent = message;
      element.classList.add("error");
    }
  }
}

function showSuccess(message, elementId = null) {
  if (elementId) {
    const element = document.getElementById(elementId);
    if (element) {
      element.textContent = message;
      element.classList.remove("error");
    }
  }
}

// ============================================
// DEMO PRODUCTS (Fallback when Supabase is empty)
// ============================================

const DEMO_PRODUCTS = [
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
  {
    id: 9,
    name: "Urban Polo Shirt",
    category: "Shirts",
    price: 99,
    rating: 4.6,
    sizes: ["S", "M", "L", "XL"],
    colors: ["Navy", "White", "Black"],
    image:
      "https://images.unsplash.com/photo-1625910513413-5fc45e60e5e2?auto=format&fit=crop&w=900&q=80",
    description:
      "Classic polo with modern fit, breathable cotton pique fabric for everyday comfort.",
  },
  {
    id: 10,
    name: "Denim Trucker Jacket",
    category: "Jackets",
    price: 189,
    rating: 4.8,
    sizes: ["S", "M", "L", "XL"],
    colors: ["Navy", "Black", "Gray"],
    image:
      "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=900&q=80",
    description: "Authentic denim jacket with vintage wash, perfect for layering in any season.",
  },
  {
    id: 11,
    name: "Slim Fit Chinos",
    category: "Pants",
    price: 119,
    rating: 4.5,
    sizes: ["S", "M", "L", "XL"],
    colors: ["Olive", "Navy", "Brown"],
    image:
      "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=900&q=80",
    description:
      "Versatile slim-fit chinos with stretch comfort, ideal for casual and smart-casual looks.",
  },
  {
    id: 12,
    name: "Canvas Sneakers",
    category: "Footwear",
    price: 149,
    rating: 4.7,
    sizes: ["M", "L", "XL"],
    colors: ["White", "Black", "Navy"],
    image:
      "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=900&q=80",
    description: "Lightweight canvas sneakers with cushioned insole for all-day comfort.",
  },
  {
    id: 13,
    name: "Casual Linen Shirt",
    category: "Shirts",
    price: 109,
    rating: 4.4,
    sizes: ["S", "M", "L", "XL"],
    colors: ["White", "Olive", "Navy"],
    image:
      "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=900&q=80",
    description:
      "Breathable linen shirt perfect for warm weather, relaxed fit for casual elegance.",
  },
  {
    id: 14,
    name: "Leather Chelsea Boots",
    category: "Footwear",
    price: 279,
    rating: 4.9,
    sizes: ["M", "L", "XL"],
    colors: ["Brown", "Black"],
    image:
      "https://images.unsplash.com/photo-1638247025967-b4e38f787b76?auto=format&fit=crop&w=900&q=80",
    description:
      "Classic Chelsea boots in premium leather, timeless style for the modern gentleman.",
  },
  {
    id: 15,
    name: "Wool Blend Sweater",
    category: "Sweaters",
    price: 169,
    rating: 4.6,
    sizes: ["S", "M", "L", "XL"],
    colors: ["Gray", "Navy", "Olive"],
    image:
      "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=900&q=80",
    description:
      "Soft wool blend sweater with ribbed cuffs, perfect for layering in cooler weather.",
  },
  {
    id: 16,
    name: "Cargo Joggers",
    category: "Pants",
    price: 129,
    rating: 4.5,
    sizes: ["S", "M", "L", "XL"],
    colors: ["Black", "Olive", "Gray"],
    image:
      "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=900&q=80",
    description: "Modern cargo joggers with utility pockets and elastic cuffs for casual comfort.",
  },
  {
    id: 17,
    name: "Leather Messenger Bag",
    category: "Accessories",
    price: 249,
    rating: 4.8,
    sizes: ["M", "L"],
    colors: ["Brown", "Black"],
    image:
      "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=900&q=80",
    description: "Handcrafted leather messenger bag with multiple compartments for everyday carry.",
  },
  {
    id: 18,
    name: "Graphic Print Hoodie",
    category: "Sweaters",
    price: 139,
    rating: 4.4,
    sizes: ["S", "M", "L", "XL"],
    colors: ["Black", "Gray", "Navy"],
    image:
      "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=900&q=80",
    description: "Premium cotton hoodie with unique graphic print, cozy fit for casual days.",
  },
  {
    id: 19,
    name: "Suede Loafers",
    category: "Footwear",
    price: 199,
    rating: 4.7,
    sizes: ["M", "L", "XL"],
    colors: ["Brown", "Navy", "Gray"],
    image:
      "https://images.unsplash.com/photo-1614252369475-531eba835eb1?auto=format&fit=crop&w=900&q=80",
    description:
      "Elegant suede loafers with cushioned footbed, perfect for smart-casual occasions.",
  },
  {
    id: 20,
    name: "Quilted Vest",
    category: "Jackets",
    price: 159,
    rating: 4.5,
    sizes: ["S", "M", "L", "XL"],
    colors: ["Navy", "Black", "Olive"],
    image:
      "https://images.unsplash.com/photo-1544923246-77307dd628b0?auto=format&fit=crop&w=900&q=80",
    description: "Lightweight quilted vest for layering, provides warmth without bulk.",
  },
  {
    id: 21,
    name: "Oxford Button-Down",
    category: "Shirts",
    price: 119,
    rating: 4.7,
    sizes: ["S", "M", "L", "XL"],
    colors: ["White", "Navy", "Gray"],
    image:
      "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=900&q=80",
    description: "Classic Oxford button-down in premium cotton, versatile for any occasion.",
  },
  {
    id: 22,
    name: "Aviator Sunglasses",
    category: "Accessories",
    price: 129,
    rating: 4.6,
    sizes: ["M", "L"],
    colors: ["Black", "Silver", "Brown"],
    image:
      "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=900&q=80",
    description: "Timeless aviator sunglasses with UV protection, a must-have accessory.",
  },
  {
    id: 23,
    name: "Relaxed Fit Jeans",
    category: "Pants",
    price: 139,
    rating: 4.5,
    sizes: ["S", "M", "L", "XL"],
    colors: ["Navy", "Black", "Gray"],
    image:
      "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=900&q=80",
    description: "Comfortable relaxed-fit jeans with classic five-pocket styling.",
  },
  {
    id: 24,
    name: "Cashmere Beanie",
    category: "Accessories",
    price: 69,
    rating: 4.8,
    sizes: ["M", "L"],
    colors: ["Gray", "Navy", "Black"],
    image:
      "https://images.unsplash.com/photo-1576871337622-98d48d1cf531?auto=format&fit=crop&w=900&q=80",
    description: "Luxuriously soft cashmere beanie for cold weather comfort and style.",
  },
];

// ============================================
// DEMO HERO SLIDES
// ============================================

const DEMO_HERO_SLIDES = [
  {
    id: 1,
    eyebrow: "New Collection 2026",
    title: "Elevate Your <span>Style</span>",
    description:
      "Premium menswear crafted for the modern gentleman. Discover timeless pieces designed for distinction.",
    button_text: "Shop Now",
    button_link: "#shopGrid",
    secondary_button_text: "Contact Us",
    secondary_button_link: "#contact-panel",
    image:
      "https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=600&q=80",
    order: 1,
    is_active: true,
  },
  {
    id: 2,
    eyebrow: "Summer Essentials",
    title: "Sharp Looks for <span>Hot Days</span>",
    description:
      "Lightweight fabrics meet bold designs. Stay cool while looking your absolute best this season.",
    button_text: "Explore Summer",
    button_link: "shop.html?category=Shirts",
    secondary_button_text: "View Lookbook",
    secondary_button_link: "#",
    image:
      "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=600&q=80",
    order: 2,
    is_active: true,
  },
  {
    id: 3,
    eyebrow: "Limited Edition",
    title: "Exclusive <span>Jackets</span> Are Here",
    description:
      "Handcrafted jackets with premium materials. Limited stock available - don't miss out on these statement pieces.",
    button_text: "Shop Jackets",
    button_link: "shop.html?category=Jackets",
    secondary_button_text: "Learn More",
    secondary_button_link: "#",
    image:
      "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=600&q=80",
    order: 3,
    is_active: true,
  },
];

// ============================================
// PRODUCTS API
// ============================================

let productsCache = null;
let productSubscribers = [];
let productsRealtimeInitialized = false;

async function fetchProducts() {
  // If Supabase is not available, return demo products immediately
  if (!window.supabaseClient || !window.TABLES) {
    console.log("Supabase not available, using demo products");
    productsCache = DEMO_PRODUCTS;
    return DEMO_PRODUCTS;
  }

  try {
    console.log("Fetching products from Supabase...");
    const { data, error } = await supabaseClient
      .from(TABLES.products)
      .select("*")
      .order("id", { ascending: true });

    if (error) {
      console.error("Supabase query error:", error);
      throw error;
    }

    // If no products in database, return demo products
    if (!data || data.length === 0) {
      console.log("No products in database, using demo products");
      productsCache = DEMO_PRODUCTS;
      return DEMO_PRODUCTS;
    }

    console.log(`Found ${data.length} products in database`);
    // Update cache and notify subscribers with the latest products
    productsCache = data;
    if (Array.isArray(productSubscribers) && productSubscribers.length > 0) {
      productSubscribers.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error("Error in products subscriber:", error);
        }
      });
    }
    return data;
  } catch (error) {
    console.error("Error fetching products, using demo products:", error);
    // Return demo products on error
    productsCache = DEMO_PRODUCTS;
    return DEMO_PRODUCTS;
  }
}

async function getLiveProducts() {
  if (!productsCache) {
    const products = await fetchProducts();
    productsCache = products;
  }
  return productsCache;
}

function subscribeToProducts(callback) {
  if (typeof callback !== "function") {
    return () => { };
  }

  productSubscribers.push(callback);

  // Immediately emit current cache if available
  if (productsCache) {
    try {
      callback(productsCache);
    } catch (error) {
      console.error("Error in initial products subscriber call:", error);
    }
  }

  // Unsubscribe function
  return () => {
    productSubscribers = productSubscribers.filter((cb) => cb !== callback);
  };
}

function initProductsRealtime() {
  if (!window.supabaseClient || !window.TABLES || productsRealtimeInitialized) {
    return;
  }

  productsRealtimeInitialized = true;

  const channel = supabaseClient
    .channel("products-realtime")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: TABLES.products },
      async () => {
        try {
          const latest = await fetchProducts();
          productsCache = latest;
          if (Array.isArray(productSubscribers) && productSubscribers.length > 0) {
            productSubscribers.forEach((callback) => {
              try {
                callback(latest);
              } catch (error) {
                console.error("Error in products subscriber:", error);
              }
            });
          }
        } catch (error) {
          console.error("Error refreshing products after change:", error);
        }
      }
    )
    .subscribe();

  window.__productsChannel = channel;
}

async function fetchProductById(productId) {
  // If Supabase is not available, return from demo products immediately
  if (!window.supabaseClient || !window.TABLES) {
    console.log("Supabase not available, using demo product");
    return DEMO_PRODUCTS.find((p) => p.id === productId) || null;
  }

  try {
    const { data, error } = await supabaseClient
      .from(TABLES.products)
      .select("*")
      .eq("id", productId)
      .single();

    if (error) throw error;

    // If not found in database, check demo products
    if (!data) {
      return DEMO_PRODUCTS.find((p) => p.id === productId) || null;
    }

    return data;
  } catch (error) {
    console.error("Error fetching product, using demo product:", error);
    // Return from demo products on error
    return DEMO_PRODUCTS.find((p) => p.id === productId) || null;
  }
}

// ============================================
// CART API
// ============================================

async function getCart() {
  try {
    const user = supabaseClient.auth.user();
    const sessionId = getSessionId();

    let query = supabaseClient.from(TABLES.cart).select(`
      id,
      product_id,
      size,
      color,
      quantity,
      products (
        id,
        name,
        category,
        price,
        image
      )
    `);

    if (user) {
      query = query.eq("user_id", user.id);
    } else {
      query = query.eq("session_id", sessionId).is("user_id", null);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching cart:", error);
    return [];
  }
}

async function addToCart(productId, size, color, quantity = 1) {
  try {
    const user = supabaseClient.auth.user();
    const sessionId = getSessionId();

    const cartItem = {
      product_id: productId,
      size,
      color,
      quantity: Math.max(1, quantity),
    };

    if (user) {
      cartItem.user_id = user.id;
    } else {
      cartItem.session_id = sessionId;
    }

    // Check if item already exists
    const existingItems = await getCart();
    const existing = existingItems.find(
      (item) => item.product_id === productId && item.size === size && item.color === color
    );

    if (existing) {
      // Update quantity
      const { error } = await supabaseClient
        .from(TABLES.cart)
        .update({ quantity: existing.quantity + quantity })
        .eq("id", existing.id);

      if (error) throw error;
    } else {
      // Insert new item
      const { error } = await supabaseClient.from(TABLES.cart).insert(cartItem);

      if (error) throw error;
    }

    return await getCart();
  } catch (error) {
    console.error("Error adding to cart:", error);
    return [];
  }
}

async function updateCartItemQuantity(cartId, nextQuantity) {
  try {
    if (nextQuantity <= 0) {
      const { error } = await supabaseClient.from(TABLES.cart).delete().eq("id", cartId);

      if (error) throw error;
    } else {
      const { error } = await supabaseClient
        .from(TABLES.cart)
        .update({ quantity: nextQuantity })
        .eq("id", cartId);

      if (error) throw error;
    }

    return await getCart();
  } catch (error) {
    console.error("Error updating cart:", error);
    return [];
  }
}

async function removeCartItem(cartId) {
  try {
    const { error } = await supabaseClient.from(TABLES.cart).delete().eq("id", cartId);

    if (error) throw error;
    return await getCart();
  } catch (error) {
    console.error("Error removing from cart:", error);
    return [];
  }
}

async function getCartTotals(cartItems) {
  return cartItems.reduce(
    (acc, item) => {
      const product = item.products;
      if (!product) return acc;
      acc.items += item.quantity;
      acc.subtotal += product.price * item.quantity;
      return acc;
    },
    { items: 0, subtotal: 0 }
  );
}

// ============================================
// COUPON VALIDATION & APPLICATION
// ============================================

let appliedCoupon = null;

async function validateCouponForCheckout(code, cartItems) {
  try {
    // Get coupon by code
    const { data: coupon, error: couponError } = await supabaseClient
      .from(TABLES.coupons || 'coupons')
      .select('*')
      .eq('code', code.toUpperCase())
      .single();

    if (couponError && couponError.code !== 'PGRST116') {
      throw couponError;
    }

    if (!coupon) {
      return { valid: false, error: 'Invalid coupon code' };
    }

    // Check if coupon is active
    if (!coupon.is_active) {
      return { valid: false, error: 'This coupon is currently inactive' };
    }

    // Check if coupon has expired
    const now = new Date();
    const expiryDate = new Date(coupon.expiry_date);
    const startDate = new Date(coupon.start_date);

    if (now < startDate) {
      return { valid: false, error: 'This coupon is not yet active' };
    }

    if (now > expiryDate) {
      return { valid: false, error: 'This coupon has expired' };
    }

    // Calculate cart subtotal
    const subtotal = cartItems.reduce((sum, item) => {
      const product = item.products;
      if (!product) return sum;
      return sum + (product.price * item.quantity);
    }, 0);

    // Check minimum order amount
    if (coupon.minimum_order_amount && subtotal < coupon.minimum_order_amount) {
      return {
        valid: false,
        error: `Minimum order amount of ${formatPrice(coupon.minimum_order_amount)} not met`
      };
    }

    // Check usage limit
    if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
      return { valid: false, error: 'Coupon usage limit exceeded' };
    }

    // Check product/category eligibility
    if (coupon.applicable_type === 'products' && coupon.applicable_products?.length > 0) {
      const cartProductIds = cartItems.map(item => item.product_id);
      const eligibleProductIds = coupon.applicable_products;
      const hasEligibleProduct = cartProductIds.some(id => eligibleProductIds.includes(id));

      if (!hasEligibleProduct) {
        return { valid: false, error: 'This coupon is not applicable to your cart items' };
      }
    }

    if (coupon.applicable_type === 'categories' && coupon.applicable_categories?.length > 0) {
      const cartCategories = cartItems.map(item => item.products?.category).filter(Boolean);
      const eligibleCategories = coupon.applicable_categories;
      const hasEligibleCategory = cartCategories.some(cat => eligibleCategories.includes(cat));

      if (!hasEligibleCategory) {
        return { valid: false, error: 'This coupon is not applicable to your cart items' };
      }
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.discount_type === 'percentage') {
      discountAmount = (subtotal * coupon.discount_value) / 100;
      // Apply max discount cap if set
      if (coupon.maximum_discount_cap && discountAmount > coupon.maximum_discount_cap) {
        discountAmount = coupon.maximum_discount_cap;
      }
    } else {
      // Fixed amount
      discountAmount = coupon.discount_value;
    }

    // Don't allow discount to exceed subtotal
    if (discountAmount > subtotal) {
      discountAmount = subtotal;
    }

    return {
      valid: true,
      coupon,
      discountAmount,
      message: 'Coupon applied successfully! You saved ' + formatPrice(discountAmount)
    };

  } catch (error) {
    console.error('Error validating coupon:', error);
    return { valid: false, error: 'Error validating coupon' };
  }
}

function applyCouponToTotals(subtotal, discountAmount) {
  const shippingCost = subtotal >= 2000 ? 0 : 60;
  const discountedSubtotal = subtotal - discountAmount;
  const totalAmount = discountedSubtotal + shippingCost;

  return {
    subtotal,
    discountAmount,
    shippingCost,
    totalAmount
  };
}

function showCouponMessage(message, isError = false) {
  const promoInput = document.getElementById('promoCode');
  const statusEl = document.createElement('div');
  statusEl.className = `coupon-message ${isError ? 'error' : 'success'}`;
  statusEl.textContent = message;

  // Remove any existing message
  const existingMsg = promoInput?.parentElement?.querySelector('.coupon-message');
  if (existingMsg) existingMsg.remove();

  if (promoInput?.parentElement) {
    promoInput.parentElement.appendChild(statusEl);
    setTimeout(() => statusEl.remove(), 5000);
  }
}

async function recordCouponUsage(couponId, userId, sessionId, orderId) {
  try {
    // Update coupon usage count
    await supabaseClient
      .from(TABLES.coupons || 'coupons')
      .update({ usage_count: supabaseClient.raw('usage_count + 1') })
      .eq('id', couponId);

    // Record usage if user is logged in or has session
    if (userId || sessionId) {
      await supabaseClient
        .from(TABLES.coupon_usage || 'coupon_usage')
        .insert([{
          coupon_id: couponId,
          user_id: userId,
          session_id: sessionId,
          order_id: orderId
        }]);
    }

    return { success: true };
  } catch (error) {
    console.error('Error recording coupon usage:', error);
    return { success: false };
  }
}

// ============================================
// PROFILE API
// ============================================

async function getProfile() {
  try {
    const user = supabaseClient.auth.user();
    if (!user) {
      return { name: "", email: "", phone: "", address: "" };
    }

    const { data, error } = await supabaseClient
      .from(TABLES.profiles)
      .select("*")
      .eq("id", user.id)
      .single();

    if (error && error.code !== "PGRST116") throw error;

    return data || { name: "", email: user.email || "", phone: "", address: "" };
  } catch (error) {
    console.error("Error fetching profile:", error);
    return { name: "", email: "", phone: "", address: "" };
  }
}

async function saveProfile(profile) {
  try {
    const user = supabaseClient.auth.user();
    if (!user) {
      throw new Error("User not authenticated");
    }

    const profileData = {
      id: user.id,
      name: profile.name,
      email: profile.email,
      phone: profile.phone,
      address: profile.address,
    };

    const { error } = await supabaseClient.from(TABLES.profiles).upsert(profileData);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error saving profile:", error);
    return false;
  }
}

// ============================================
// WISHLIST API
// ============================================

async function getWishlist() {
  try {
    const user = supabaseClient.auth.user();
    if (!user) return [];

    const { data, error } = await supabaseClient
      .from(TABLES.wishlist)
      .select(
        `
        id,
        product_id,
        products (
          id,
          name,
          category,
          price,
          image,
          rating
        )
      `
      )
      .eq("user_id", user.id);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching wishlist:", error);
    return [];
  }
}

async function toggleWishlist(productId) {
  try {
    const user = supabaseClient.auth.user();
    if (!user) return false;

    const { data: existing } = await supabaseClient
      .from(TABLES.wishlist)
      .select("id")
      .eq("user_id", user.id)
      .eq("product_id", productId)
      .single();

    if (existing) {
      const { error } = await supabaseClient.from(TABLES.wishlist).delete().eq("id", existing.id);

      if (error) throw error;
      return false; // Removed from wishlist
    } else {
      const { error } = await supabaseClient
        .from(TABLES.wishlist)
        .insert({ user_id: user.id, product_id: productId });

      if (error) throw error;
      return true; // Added to wishlist
    }
  } catch (error) {
    console.error("Error toggling wishlist:", error);
    return false;
  }
}

// ============================================
// ORDERS API
// ============================================

async function createOrder(orderData) {
  try {
    const user = supabaseClient.auth.user();
    const sessionId = getSessionId();

    const order = {
      customer_name: orderData.name,
      customer_email: orderData.email,
      customer_phone: orderData.phone,
      customer_address: orderData.address,
      subtotal: orderData.subtotal || orderData.total,
      discount_amount: orderData.discount || 0,
      coupon_code: orderData.coupon_code || null,
      shipping_cost: orderData.shipping || 0,
      total_amount: orderData.total,
      status: "pending",
    };

    if (user) {
      order.user_id = user.id;
    } else {
      order.session_id = sessionId;
    }

    const { data: orderResult, error: orderError } = await supabaseClient
      .from(TABLES.orders)
      .insert(order)
      .select("id")
      .single();

    if (orderError) throw orderError;

    // Insert order items
    const orderItems = orderData.items.map((item) => ({
      order_id: orderResult.id,
      product_id: item.product_id,
      product_name: item.name,
      size: item.size,
      color: item.color,
      quantity: item.quantity,
      price: item.price,
    }));

    const { error: itemsError } = await supabaseClient.from(TABLES.order_items).insert(orderItems);

    if (itemsError) throw itemsError;

    // Clear cart after successful order
    await clearCart();

    return orderResult.id;
  } catch (error) {
    console.error("Error creating order:", error);
    return null;
  }
}

async function clearCart() {
  try {
    const user = supabaseClient.auth.user();
    const sessionId = getSessionId();

    let query = supabaseClient.from(TABLES.cart).delete();

    if (user) {
      query = query.eq("user_id", user.id);
    } else {
      query = query.eq("session_id", sessionId);
    }

    const { error } = await query;
    if (error) throw error;
  } catch (error) {
    console.error("Error clearing cart:", error);
  }
}

// ============================================
// AUTH FUNCTIONS
// ============================================

async function signIn(email, password) {
  try {
    const { error } = await supabaseClient.auth.signIn({ email, password });
    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error signing in:", error);
    return false;
  }
}

async function signUp(email, password) {
  try {
    const { error } = await supabaseClient.auth.signUp({ email, password });
    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error signing up:", error);
    return false;
  }
}

async function signOut() {
  try {
    const { error } = await supabaseClient.auth.signOut();
    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error signing out:", error);
    return false;
  }
}

// ============================================
// UI RENDERING FUNCTIONS
// ============================================

function productCardMarkup(product) {
  return `
    <article class="product-card surface" data-product-id="${product.id}">
      <button class="wishlist-btn soft-button" type="button" aria-label="Save ${product.name}" data-product-id="${product.id}">
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
          <p class="rating-chip">${STAR_ICON}<span>${Number(product.rating).toFixed(1)}</span></p>
        </div>
        <div class="card-actions">
          <a class="card-link" href="product.html?id=${product.id}">View Product</a>
          <button class="btn btn-primary add-to-cart-btn" type="button" data-product-id="${product.id}" data-product-name="${product.name}" data-sizes="${product.sizes.join(",")}" data-colors="${product.colors.join(",")}">
            Add to Cart
          </button>
        </div>
      </div>
    </article>
  `;
}

function cartItemMarkup(item, index) {
  const product = item.products;
  if (!product) return "";

  const lineTotal = product.price * item.quantity;
  return `
    <article class="cart-item surface" data-cart-id="${item.id}" data-cart-index="${index}">
      <div class="cart-item-image surface-inset">
        <img src="${product.image}" alt="${product.name}">
      </div>
      <div class="cart-item-body">
        <p class="product-category">${product.category}</p>
        <h3>${product.name}</h3>
        <p class="cart-variant">${item.size} / ${item.color}</p>
        <div class="cart-item-row">
          <p class="price-tag">${formatPrice(lineTotal)}</p>
          <div class="qty-controls">
            <button class="qty-btn soft-button" type="button" data-action="decrease" aria-label="Decrease quantity">-</button>
            <span class="qty-count">${item.quantity}</span>
            <button class="qty-btn soft-button" type="button" data-action="increase" aria-label="Increase quantity">+</button>
          </div>
        </div>
      </div>
      <button class="remove-link" type="button" data-action="remove">Remove</button>
    </article>
  `;
}

// ============================================
// EVENT BINDING FUNCTIONS
// ============================================

async function bindWishlistButtons(scope = document) {
  const wishlist = await getWishlist();
  const wishlistProductIds = wishlist.map((item) => item.product_id);

  scope.querySelectorAll(".wishlist-btn").forEach((button) => {
    const productId = parseInt(button.dataset.productId);

    // Set initial state
    if (wishlistProductIds.includes(productId)) {
      button.classList.add("active");
    }

    button.addEventListener("click", async (event) => {
      event.preventDefault();
      event.stopPropagation();

      const isAdded = await toggleWishlist(productId);
      button.classList.toggle("active", isAdded);
    });
  });
}

// Quick Add to Cart Modal
let quickAddModal = null;

function createQuickAddModal() {
  if (quickAddModal) return quickAddModal;

  const modal = document.createElement("div");
  modal.id = "quickAddModal";
  modal.className = "quick-add-modal";
  modal.innerHTML = `
    <div class="quick-add-overlay"></div>
    <div class="quick-add-content surface">
      <button class="quick-add-close" aria-label="Close">&times;</button>
      <h3 id="quickAddTitle">Add to Cart</h3>
      <div class="quick-add-preview">
        <img id="quickAddImage" src="" alt="Product">
        <p id="quickAddPrice" class="price-tag"></p>
      </div>
      <div class="quick-add-options">
        <div class="selector-block">
          <h4>Size</h4>
          <div class="option-row" id="quickAddSizes"></div>
        </div>
        <div class="selector-block">
          <h4>Color</h4>
          <div class="color-row" id="quickAddColors"></div>
        </div>
      </div>
      <button class="btn btn-primary" id="quickAddConfirm" type="button">Add to Cart</button>
      <p class="status-line" id="quickAddStatus"></p>
    </div>
  `;
  document.body.appendChild(modal);
  quickAddModal = modal;

  // Close handlers
  modal.querySelector(".quick-add-overlay").addEventListener("click", closeQuickAddModal);
  modal.querySelector(".quick-add-close").addEventListener("click", closeQuickAddModal);

  return modal;
}

function openQuickAddModal(product) {
  const modal = createQuickAddModal();

  document.getElementById("quickAddTitle").textContent = product.name;
  document.getElementById("quickAddImage").src = product.image;
  document.getElementById("quickAddPrice").textContent = formatPrice(product.price);
  document.getElementById("quickAddStatus").textContent = "";

  let selectedSize = product.sizes[0];
  let selectedColor = product.colors[0];

  // Render sizes
  const sizesContainer = document.getElementById("quickAddSizes");
  sizesContainer.innerHTML = product.sizes
    .map(
      (size) => `
    <button class="option-btn soft-button ${size === selectedSize ? "active" : ""}" type="button" data-size="${size}">${size}</button>
  `
    )
    .join("");

  sizesContainer.querySelectorAll(".option-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      selectedSize = btn.dataset.size;
      sizesContainer.querySelectorAll(".option-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });

  // Render colors
  const colorsContainer = document.getElementById("quickAddColors");
  colorsContainer.innerHTML = product.colors
    .map(
      (color) => `
    <button class="color-swatch soft-button ${color === selectedColor ? "active" : ""}" 
            type="button" data-color="${color}" 
            style="background: ${resolveColor(color)};" 
            aria-label="${color}"></button>
  `
    )
    .join("");

  colorsContainer.querySelectorAll(".color-swatch").forEach((btn) => {
    btn.addEventListener("click", () => {
      selectedColor = btn.dataset.color;
      colorsContainer
        .querySelectorAll(".color-swatch")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });

  // Confirm button
  const confirmBtn = document.getElementById("quickAddConfirm");
  const statusLine = document.getElementById("quickAddStatus");

  const handleConfirm = async () => {
    statusLine.textContent = "Adding...";
    const result = await addToCart(product.id, selectedSize, selectedColor, 1);

    if (result) {
      statusLine.textContent = `Added ${product.name} (${selectedSize}, ${selectedColor}) to cart!`;
      setTimeout(() => {
        closeQuickAddModal();
      }, 1500);
    } else {
      statusLine.textContent = "Failed to add. Please try again.";
    }
  };

  // Remove old listener and add new
  confirmBtn.replaceWith(confirmBtn.cloneNode(true));
  document.getElementById("quickAddConfirm").addEventListener("click", handleConfirm);

  // Show modal
  modal.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeQuickAddModal() {
  if (quickAddModal) {
    quickAddModal.classList.remove("active");
    document.body.style.overflow = "";
  }
}

async function bindAddToCartButtons(scope = document) {
  const products = await fetchProducts();

  scope.querySelectorAll(".add-to-cart-btn").forEach((button) => {
    button.addEventListener("click", async (event) => {
      event.preventDefault();
      event.stopPropagation();

      const productId = parseInt(button.dataset.productId);
      const product = products.find((p) => p.id === productId);

      if (product) {
        openQuickAddModal(product);
      }
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

// ============================================
// PAGE INITIALIZATION FUNCTIONS
// ============================================

async function initHomePage() {
  const featuredGrid = document.getElementById("featuredGrid");
  if (featuredGrid) {
    const renderFeatured = (products) => {
      featuredGrid.innerHTML = products.slice(0, 4).map(productCardMarkup).join("");
      bindWishlistButtons(featuredGrid);
      bindAddToCartButtons(featuredGrid);
    };

    const initialProducts = await getLiveProducts();
    renderFeatured(initialProducts);

    // Keep home hero in sync with product changes
    subscribeToProducts(renderFeatured);
  }

  // Load wishlist section if exists
  const wishlistGrid = document.getElementById("wishlistGrid");
  const emptyWishlist = document.getElementById("emptyWishlist");
  if (wishlistGrid) {
    try {
      const wishlist = await getWishlist();
      if (wishlist.length === 0) {
        if (emptyWishlist) emptyWishlist.style.display = "flex";
      } else {
        if (emptyWishlist) emptyWishlist.style.display = "none";
        const products = await Promise.all(
          wishlist.map((item) => fetchProductById(item.product_id))
        );
        const validProducts = products.filter((p) => p !== null);
        wishlistGrid.innerHTML = validProducts.map(productCardMarkup).join("");
        bindWishlistButtons(wishlistGrid);
        bindAddToCartButtons(wishlistGrid);
      }
    } catch (error) {
      console.error("Error loading wishlist:", error);
      if (emptyWishlist) emptyWishlist.style.display = "flex";
    }
  }

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      const href = this.getAttribute("href");
      if (href === "#") return;

      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    });
  });

  // Category card navigation
  document.querySelectorAll(".category-chip").forEach((link) => {
    link.addEventListener("click", (e) => {
      const href = link.getAttribute("href");
      if (href && href.startsWith("shop.html")) {
        // Let transitions.js handle navigation
        return;
      }
    });
  });
}

async function initShopPage() {
  // Initialize hero slider
  const heroSlidesContainer = document.getElementById("heroSlidesContainer");
  if (heroSlidesContainer) {
    const slides = await fetchHeroSlides();
    initHeroSlider(slides);
  }

  const shopGrid = document.getElementById("shopGrid");
  const resultCount = document.getElementById("shopResultCount");
  const shopSearch = document.getElementById("shopSearch");
  if (!shopGrid || !resultCount || !shopSearch) {
    console.error("Shop page elements not found");
    return;
  }

  console.log("Initializing shop page...");
  let products = await getLiveProducts();
  console.log("Products loaded:", products.length);

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
    console.log("Rendering products, total:", products.length);
    const filtered = products.filter(passesFilters);
    console.log("Filtered products:", filtered.length);
    resultCount.textContent = `${filtered.length} products available`;

    if (filtered.length === 0) {
      shopGrid.innerHTML = '<div class="empty-state">No products match the selected filters.</div>';
      return;
    }

    shopGrid.innerHTML = filtered.map(productCardMarkup).join("");
    bindWishlistButtons(shopGrid);
    bindAddToCartButtons(shopGrid);
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

  // Keep shop listing in sync with live product changes
  subscribeToProducts((latestProducts) => {
    products = latestProducts;
    renderProducts();
  });
}

async function initProductPage() {
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
  const targetId = Number(params.get("id")) || 1;

  let product = await fetchProductById(targetId);
  if (!product) {
    detailTitle.textContent = "Product not found";
    return;
  }

  const allProducts = await getLiveProducts();

  let selectedSize = product.sizes[0];
  let selectedColor = product.colors[0];

  detailImage.src = product.image;
  detailImage.alt = product.name;
  detailTitle.textContent = product.name;
  detailPrice.textContent = formatPrice(product.price);
  detailRating.innerHTML = `${STAR_ICON}<span>${Number(product.rating).toFixed(1)} / 5.0</span>`;
  detailDescription.textContent = product.description;

  function paintMediaAccent() {
    const hex = resolveColor(selectedColor);
    detailMedia.style.setProperty("--media-accent", `${hex}2e`);
  }

  function renderSizes() {
    sizeOptions.innerHTML = product.sizes
      .map(
        (size) => `
        <button class="option-btn soft-button ${size === selectedSize ? "active" : ""}" type="button" data-size="${size}">
          ${size}
        </button>
      `
      )
      .join("");

    sizeOptions.querySelectorAll(".option-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        selectedSize = btn.dataset.size;
        renderSizes();
      });
    });
  }

  function renderColors() {
    colorOptions.innerHTML = product.colors
      .map(
        (color) => `
        <button class="color-swatch soft-button ${color === selectedColor ? "active" : ""}" 
                type="button" 
                data-color="${color}" 
                style="background: ${resolveColor(color)};"
                aria-label="${color}">
        </button>
      `
      )
      .join("");

    colorOptions.querySelectorAll(".color-swatch").forEach((btn) => {
      btn.addEventListener("click", () => {
        selectedColor = btn.dataset.color;
        paintMediaAccent();
        renderColors();
      });
    });
  }

  async function handleAddToCart() {
    statusLine.textContent = "Adding to cart...";

    const result = await addToCart(product.id, selectedSize, selectedColor, 1);

    if (result) {
      statusLine.textContent = `Added ${product.name} (${selectedSize}, ${selectedColor}) to cart!`;
    } else {
      statusLine.textContent = "Failed to add to cart. Please try again.";
    }
  }

  addToCartBtn.addEventListener("click", handleAddToCart);

  buyNowBtn.addEventListener("click", async () => {
    await handleAddToCart();
    window.location.href = "cart.html";
  });

  function renderRelated() {
    const related = allProducts
      .filter((item) => item.category === product.category && item.id !== product.id)
      .slice(0, 4);

    if (related.length === 0) {
      relatedGrid.closest(".section-block").style.display = "none";
      return;
    }

    relatedGrid.innerHTML = related.map(productCardMarkup).join("");
    bindWishlistButtons(relatedGrid);
    bindAddToCartButtons(relatedGrid);
  }

  renderSizes();
  renderColors();
  paintMediaAccent();
  renderRelated();
}

async function initCartPage() {
  const cartList = document.getElementById("cartList");
  const cartItemCount = document.getElementById("cartItemCount");
  const cartSubtotal = document.getElementById("cartSubtotal");
  const cartTotal = document.getElementById("cartTotal");
  const checkoutBtn = document.getElementById("checkoutBtn");
  const cartStatus = document.getElementById("cartStatus");

  if (!cartList || !cartItemCount || !cartSubtotal || !cartTotal || !checkoutBtn || !cartStatus) {
    return;
  }

  async function renderCart() {
    const cartItems = await getCart();
    const totals = await getCartTotals(cartItems);

    cartItemCount.textContent = totals.items;
    cartSubtotal.textContent = formatPrice(totals.subtotal);
    cartTotal.textContent = formatPrice(totals.subtotal);

    if (cartItems.length === 0) {
      cartList.innerHTML = `
        <div class="empty-state">
          <p>Your cart is empty.</p>
          <a class="btn btn-primary" href="shop.html" style="margin-top: 1rem;">Start Shopping</a>
        </div>
      `;
      checkoutBtn.disabled = true;
      return;
    }

    cartList.innerHTML = cartItems.map((item, index) => cartItemMarkup(item, index)).join("");
    checkoutBtn.disabled = false;
    bindCartActions();
  }

  function bindCartActions() {
    cartList.querySelectorAll(".cart-item").forEach((item) => {
      const cartId = item.dataset.cartId;
      const qtySpan = item.querySelector(".qty-count");
      let currentQty = parseInt(qtySpan.textContent);

      item.querySelectorAll(".qty-btn").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const action = btn.dataset.action;
          let nextQty = currentQty;

          if (action === "increase") {
            nextQty++;
          } else if (action === "decrease") {
            nextQty--;
          }

          await updateCartItemQuantity(parseInt(cartId), nextQty);
          await renderCart();
        });
      });

      item.querySelector(".remove-link").addEventListener("click", async () => {
        await removeCartItem(parseInt(cartId));
        await renderCart();
      });
    });
  }

  checkoutBtn.addEventListener("click", async () => {
    const cartItems = await getCart();
    if (cartItems.length === 0) {
      cartStatus.textContent = "Your cart is empty.";
      return;
    }

    // Redirect to checkout page
    window.location.href = "checkout.html";
  });

  // Keep product detail in sync with live product changes
  subscribeToProducts((latestProducts) => {
    const updated = latestProducts.find((p) => p.id === product.id);

    // If product was deleted, disable actions and show message
    if (!updated) {
      statusLine.textContent = "This product is no longer available.";
      addToCartBtn.disabled = true;
      buyNowBtn.disabled = true;
      return;
    }

    // Update local reference and key fields (price, name, rating)
    product = updated;
    detailTitle.textContent = product.name;
    detailPrice.textContent = formatPrice(product.price);
    detailRating.innerHTML = `${STAR_ICON}<span>${Number(product.rating).toFixed(1)} / 5.0</span>`;
  });

  await renderCart();
}

async function initCheckoutPage() {
  const checkoutItems = document.getElementById("checkoutItems");
  const checkoutItemsMobile = document.getElementById("checkoutItemsMobile");
  const checkoutSubtotal = document.getElementById("checkoutSubtotal");
  const checkoutSubtotalMobile = document.getElementById("checkoutSubtotalMobile");
  const checkoutShipping = document.getElementById("checkoutShipping");
  const checkoutShippingMobile = document.getElementById("checkoutShippingMobile");
  const checkoutTotal = document.getElementById("checkoutTotal");
  const checkoutTotalMobile = document.getElementById("checkoutTotalMobile");
  const placeOrderBtn = document.getElementById("placeOrderBtn");
  const checkoutStatus = document.getElementById("checkoutStatus");
  const summaryToggle = document.getElementById("summaryToggle");
  const summaryContent = document.getElementById("summaryContent");

  // Coupon elements
  const promoCodeInput = document.getElementById("promoCode");
  const applyPromoBtn = document.getElementById("applyPromoBtn");
  const discountRow = document.getElementById("discountRow");
  const checkoutDiscount = document.getElementById("checkoutDiscount");

  // Coupon state
  let currentCoupon = null;
  let currentDiscount = 0;

  // Load saved coupon from sessionStorage
  const savedCoupon = sessionStorage.getItem('appliedCoupon');
  if (savedCoupon) {
    try {
      currentCoupon = JSON.parse(savedCoupon);
    } catch (e) {
      sessionStorage.removeItem('appliedCoupon');
    }
  }

  // Form fields
  const emailInput = document.getElementById("checkoutEmail");
  const nameInput = document.getElementById("checkoutName");
  const phoneInput = document.getElementById("checkoutPhone");
  const addressInput = document.getElementById("checkoutAddress");
  const cityInput = document.getElementById("checkoutCity");
  const postalInput = document.getElementById("checkoutPostal");
  const notesInput = document.getElementById("checkoutNotes");

  if (!checkoutItems || !placeOrderBtn) {
    return;
  }

  // Check if user is logged in and pre-fill info
  const {
    data: { session },
  } = await supabaseClient.auth.getSession();
  if (session) {
    const profile = await getProfile();
    if (emailInput) emailInput.value = profile.email || session.user.email || "";
    if (nameInput) nameInput.value = profile.name || "";
    if (phoneInput) phoneInput.value = profile.phone || "";
    if (addressInput) addressInput.value = profile.address || "";
  }

  // Mobile summary toggle
  if (summaryToggle && summaryContent) {
    summaryToggle.addEventListener("click", () => {
      summaryToggle.classList.toggle("active");
      summaryContent.classList.toggle("active");
      const span = summaryToggle.querySelector("span");
      if (span) {
        span.textContent = summaryContent.classList.contains("active")
          ? "Hide Order Summary"
          : "Show Order Summary";
      }
    });
  }

  // Render cart items
  async function renderCheckoutItems() {
    const cartItems = await getCart();

    if (cartItems.length === 0) {
      window.location.href = "cart.html";
      return;
    }

    const totals = getCartTotals(cartItems);

    // Calculate discount if coupon is applied
    if (currentCoupon) {
      // Recalculate discount based on current cart
      let discountAmount = 0;
      if (currentCoupon.coupon.discount_type === 'percentage') {
        discountAmount = (totals.subtotal * currentCoupon.coupon.discount_value) / 100;
        if (currentCoupon.coupon.maximum_discount_cap && discountAmount > currentCoupon.coupon.maximum_discount_cap) {
          discountAmount = currentCoupon.coupon.maximum_discount_cap;
        }
      } else {
        discountAmount = currentCoupon.coupon.discount_value;
      }
      if (discountAmount > totals.subtotal) discountAmount = totals.subtotal;
      currentDiscount = discountAmount;
    }

    const shippingCost = totals.subtotal >= 2000 ? 0 : 60; // Free shipping over BDT 2000
    const discountedSubtotal = totals.subtotal - currentDiscount;
    const totalAmount = discountedSubtotal + shippingCost;

    // Render items
    const itemsHtml = cartItems
      .map((item) => {
        const product = item.products;
        if (!product) return "";
        return `
        <div class="checkout-item">
          <div class="checkout-item-image">
            <img src="${product.image}" alt="${product.name}">
          </div>
          <div class="checkout-item-details">
            <p class="checkout-item-name">${product.name}</p>
            <p class="checkout-item-variant">${item.size} / ${item.color}</p>
            <p class="checkout-item-price">
              ${formatPrice(product.price)}
              <span class="checkout-item-qty">× ${item.quantity}</span>
            </p>
          </div>
        </div>
      `;
      })
      .join("");

    checkoutItems.innerHTML = itemsHtml;
    if (checkoutItemsMobile) checkoutItemsMobile.innerHTML = itemsHtml;

    // Update totals
    const subtotalText = formatPrice(totals.subtotal);
    const shippingText = shippingCost === 0 ? "Free" : formatPrice(shippingCost);
    const totalText = formatPrice(totalAmount);

    checkoutSubtotal.textContent = subtotalText;
    checkoutShipping.textContent = shippingText;
    checkoutTotal.textContent = totalText;

    // Show/hide discount row
    if (discountRow && checkoutDiscount) {
      if (currentDiscount > 0) {
        discountRow.style.display = 'flex';
        checkoutDiscount.textContent = '-' + formatPrice(currentDiscount);
      } else {
        discountRow.style.display = 'none';
      }
    }

    if (checkoutSubtotalMobile) checkoutSubtotalMobile.textContent = subtotalText;
    if (checkoutShippingMobile) checkoutShippingMobile.textContent = shippingText;
    if (checkoutTotalMobile) checkoutTotalMobile.textContent = totalText;

    // Update promo code input with applied coupon code
    if (promoCodeInput && currentCoupon) {
      promoCodeInput.value = currentCoupon.coupon.code;
    }
  }

  // Apply coupon button handler
  if (applyPromoBtn && promoCodeInput) {
    applyPromoBtn.addEventListener('click', async () => {
      const code = promoCodeInput.value.trim();
      if (!code) {
        showCouponMessage('Please enter a coupon code', true);
        return;
      }

      applyPromoBtn.disabled = true;
      applyPromoBtn.textContent = 'Applying...';

      try {
        const cartItems = await getCart();
        const result = await validateCouponForCheckout(code, cartItems);

        if (result.valid) {
          currentCoupon = result;
          currentDiscount = result.discountAmount;

          // Save to sessionStorage
          sessionStorage.setItem('appliedCoupon', JSON.stringify(result));

          showCouponMessage(result.message, false);
          await renderCheckoutItems();
        } else {
          showCouponMessage(result.error, true);
          currentCoupon = null;
          currentDiscount = 0;
          sessionStorage.removeItem('appliedCoupon');
        }
      } catch (error) {
        console.error('Coupon error:', error);
        showCouponMessage('Error applying coupon', true);
      } finally {
        applyPromoBtn.disabled = false;
        applyPromoBtn.textContent = 'Apply';
      }
    });

    // Also allow pressing Enter in the promo code input
    promoCodeInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        applyPromoBtn.click();
      }
    });
  }

  // Place order handler
  placeOrderBtn.addEventListener("click", async () => {
    // Validate form
    const email = emailInput?.value.trim();
    const name = nameInput?.value.trim();
    const phone = phoneInput?.value.trim();
    const address = addressInput?.value.trim();
    const city = cityInput?.value.trim();

    if (!email || !name || !phone || !address || !city) {
      checkoutStatus.textContent = "Please fill in all required fields.";
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      checkoutStatus.textContent = "Please enter a valid email address.";
      return;
    }

    // Phone validation (Bangladesh format)
    if (phone.length < 11) {
      checkoutStatus.textContent = "Please enter a valid phone number.";
      return;
    }

    checkoutStatus.textContent = "Processing your order...";
    placeOrderBtn.disabled = true;

    try {
      const cartItems = await getCart();
      const totals = getCartTotals(cartItems);
      const shippingCost = totals.subtotal >= 2000 ? 0 : 60;

      // Recalculate discount in case cart changed
      let discountAmount = 0;
      if (currentCoupon) {
        if (currentCoupon.coupon.discount_type === 'percentage') {
          discountAmount = (totals.subtotal * currentCoupon.coupon.discount_value) / 100;
          if (currentCoupon.coupon.maximum_discount_cap && discountAmount > currentCoupon.coupon.maximum_discount_cap) {
            discountAmount = currentCoupon.coupon.maximum_discount_cap;
          }
        } else {
          discountAmount = currentCoupon.coupon.discount_value;
        }
        if (discountAmount > totals.subtotal) discountAmount = totals.subtotal;
      }

      const discountedSubtotal = totals.subtotal - discountAmount;
      const totalAmount = discountedSubtotal + shippingCost;

      const fullAddress = `${address}, ${city}${postalInput?.value ? ", " + postalInput.value : ""}`;

      const orderData = {
        name,
        email,
        phone,
        address: fullAddress,
        total: totalAmount,
        subtotal: totals.subtotal,
        discount: discountAmount,
        coupon_code: currentCoupon ? currentCoupon.coupon.code : null,
        shipping: shippingCost,
        items: cartItems.map((item) => ({
          product_id: item.product_id,
          name: item.products.name,
          size: item.size,
          color: item.color,
          quantity: item.quantity,
          price: item.products.price,
        })),
      };

      const orderId = await createOrder(orderData);

      if (orderId) {
        // Record coupon usage if coupon was applied
        if (currentCoupon) {
          const { data: { session } } = await supabaseClient.auth.getSession();
          const userId = session?.user?.id || null;
          const sessionId = getSessionId();

          await recordCouponUsage(currentCoupon.coupon.id, userId, sessionId, orderId);

          // Clear saved coupon
          sessionStorage.removeItem('appliedCoupon');
        }

        checkoutStatus.textContent = `Order #${orderId} placed successfully! We'll contact you shortly.`;
        checkoutStatus.style.color = "#22c55e";

        // Redirect to success page or show confirmation
        setTimeout(() => {
          window.location.href = `profile.html?order=${orderId}`;
        }, 2000);
      } else {
        checkoutStatus.textContent = "Failed to place order. Please try again.";
        placeOrderBtn.disabled = false;
      }
    } catch (error) {
      console.error("Order error:", error);
      checkoutStatus.textContent = "An error occurred. Please try again.";
      placeOrderBtn.disabled = false;
    }
  });

  await renderCheckoutItems();
}

async function initWishlistPage() {
  const wishlistGrid = document.getElementById("wishlistGrid");
  const wishlistStatus = document.getElementById("wishlistStatus");

  if (!wishlistGrid) {
    return;
  }

  async function renderWishlist() {
    const wishlist = await getWishlist();

    if (wishlist.length === 0) {
      wishlistGrid.innerHTML = `
        <div class="empty-state">
          <p>Your wishlist is empty.</p>
          <a class="btn btn-primary" href="shop.html" style="margin-top: 1rem;">Start Shopping</a>
        </div>
      `;
      return;
    }

    // Transform wishlist items to product format
    const products = wishlist.map((item) => ({
      ...item.products,
      wishlist_id: item.id,
    }));

    wishlistGrid.innerHTML = products.map(productCardMarkup).join("");
    bindWishlistButtons(wishlistGrid);
    bindAddToCartButtons(wishlistGrid);
  }

  await renderWishlist();
}

async function initProfilePage() {
  const profileForm = document.getElementById("profileForm");
  const profileStatus = document.getElementById("profileStatus");

  if (!profileForm || !profileStatus) {
    return;
  }

  // Check if user is logged in
  const {
    data: { session },
  } = await supabaseClient.auth.getSession();
  if (!session) {
    window.location.href = "login.html";
    return;
  }

  const profile = await getProfile();

  const nameInput = profileForm.querySelector("#profileName");
  const emailInput = profileForm.querySelector("#profileEmail");
  const phoneInput = profileForm.querySelector("#profilePhone");
  const addressInput = profileForm.querySelector("#profileAddress");

  if (nameInput) nameInput.value = profile.name || "";
  if (emailInput) emailInput.value = profile.email || "";
  if (phoneInput) phoneInput.value = profile.phone || "";
  if (addressInput) addressInput.value = profile.address || "";

  profileForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    profileStatus.textContent = "Saving...";

    const updatedProfile = {
      name: nameInput ? nameInput.value : "",
      email: emailInput ? emailInput.value : "",
      phone: phoneInput ? phoneInput.value : "",
      address: addressInput ? addressInput.value : "",
    };

    const success = await saveProfile(updatedProfile);

    if (success) {
      profileStatus.textContent = "Profile saved successfully!";
    } else {
      profileStatus.textContent = "Failed to save profile. Please sign in first.";
    }
  });

  // Add logout button handler
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn && window.HodoAuth) {
    logoutBtn.addEventListener("click", async () => {
      await window.HodoAuth.handleLogout();
    });
  }

  // Show admin panel shortcut only for admin users
  if (window.HodoAuth && window.HodoAuth.getCurrentUser) {
    try {
      const { role } = await window.HodoAuth.getCurrentUser();
      if (role === "admin") {
        const profileSide = document.querySelector(".profile-side");
        if (profileSide && !document.getElementById("adminPanelBtn")) {
          const adminSection = document.createElement("section");
          adminSection.className = "profile-stat surface";

          const heading = document.createElement("h3");
          heading.textContent = "Admin Panel";

          const description = document.createElement("p");
          description.textContent = "Quick access to manage products, orders, and more.";

          const button = document.createElement("a");
          button.id = "adminPanelBtn";
          button.href = "../admin/index.html";
          button.className = "btn btn-primary";
          button.textContent = "Go To Admin Panel";

          adminSection.appendChild(heading);
          adminSection.appendChild(description);
          adminSection.appendChild(button);

          profileSide.appendChild(adminSection);
        }
      }
    } catch (error) {
      console.error("Failed to determine user role for admin shortcut:", error);
    }
  }
}

// ============================================
// HERO SLIDER
// ============================================

let heroSliderInterval = null;
let currentHeroSlide = 0;
let heroSlides = [];

async function fetchHeroSlides() {
  // If Supabase is not available, return demo slides
  if (!window.supabaseClient || !window.TABLES) {
    console.log("Using demo hero slides");
    return DEMO_HERO_SLIDES;
  }

  try {
    const { data, error } = await supabaseClient
      .from("hero_slides")
      .select("*")
      .eq("is_active", true)
      .order("order", { ascending: true });

    if (error) throw error;

    if (!data || data.length === 0) {
      return DEMO_HERO_SLIDES;
    }

    return data;
  } catch (error) {
    console.error("Error fetching hero slides:", error);
    return DEMO_HERO_SLIDES;
  }
}

function renderHeroSlide(slide) {
  return `
    <div class="hero-slide">
      <div class="hero-content">
        <p class="eyebrow">${slide.eyebrow || "New Collection"}</p>
        <h1>${slide.title || "Welcome to Hodo"}</h1>
        <p>${slide.description || ""}</p>
        <div class="hero-actions">
          ${slide.button_text ? `<a href="${slide.button_link || "#"}" class="btn btn-primary">${slide.button_text}</a>` : ""}
          ${slide.secondary_button_text ? `<a href="${slide.secondary_button_link || "#"}" class="btn btn-soft">${slide.secondary_button_text}</a>` : ""}
        </div>
      </div>
      <div class="hero-model">
        <img src="${slide.image}" alt="${slide.eyebrow || "Hodo Collection"}">
      </div>
    </div>
  `;
}

function initHeroSlider(slides) {
  const container = document.getElementById("heroSlidesContainer");
  const dotsContainer = document.getElementById("heroSliderDots");
  const prevBtn = document.getElementById("heroPrevBtn");
  const nextBtn = document.getElementById("heroNextBtn");

  if (!container || !slides.length) return;

  heroSlides = slides;
  currentHeroSlide = 0;

  // Render slides
  container.innerHTML = slides.map(renderHeroSlide).join("");

  // Render dots
  dotsContainer.innerHTML = slides
    .map(
      (_, i) =>
        `<button class="hero-slider-dot ${i === 0 ? "active" : ""}" data-index="${i}" aria-label="Go to slide ${i + 1}"></button>`
    )
    .join("");

  // Show first slide
  showHeroSlide(0);

  // Start auto-slide
  startHeroSliderAutoplay();

  // Event listeners
  prevBtn?.addEventListener("click", () => {
    goToPrevSlide();
    resetHeroSliderAutoplay();
  });

  nextBtn?.addEventListener("click", () => {
    goToNextSlide();
    resetHeroSliderAutoplay();
  });

  dotsContainer.querySelectorAll(".hero-slider-dot").forEach((dot) => {
    dot.addEventListener("click", () => {
      showHeroSlide(parseInt(dot.dataset.index));
      resetHeroSliderAutoplay();
    });
  });

  // Pause on hover
  container.addEventListener("mouseenter", stopHeroSliderAutoplay);
  container.addEventListener("mouseleave", startHeroSliderAutoplay);
}

function showHeroSlide(index) {
  const slides = document.querySelectorAll(".hero-slide");
  const dots = document.querySelectorAll(".hero-slider-dot");

  slides.forEach((slide, i) => {
    slide.classList.toggle("active", i === index);
  });

  dots.forEach((dot, i) => {
    dot.classList.toggle("active", i === index);
  });

  currentHeroSlide = index;
}

function goToNextSlide() {
  const nextIndex = (currentHeroSlide + 1) % heroSlides.length;
  showHeroSlide(nextIndex);
}

function goToPrevSlide() {
  const prevIndex = (currentHeroSlide - 1 + heroSlides.length) % heroSlides.length;
  showHeroSlide(prevIndex);
}

function startHeroSliderAutoplay() {
  if (heroSliderInterval) return;
  heroSliderInterval = setInterval(goToNextSlide, 5000);
}

function stopHeroSliderAutoplay() {
  if (heroSliderInterval) {
    clearInterval(heroSliderInterval);
    heroSliderInterval = null;
  }
}

function resetHeroSliderAutoplay() {
  stopHeroSliderAutoplay();
  startHeroSliderAutoplay();
}

// ============================================
// APP INITIALIZATION
// ============================================

async function initApp() {
  // Check if Supabase is ready (but don't require it)
  const supabaseReady = window.supabaseClient && window.TABLES;

  if (!supabaseReady) {
    console.warn("Supabase not initialized. Using demo data mode.");
  }

  // Initialize real-time product synchronization so admin changes
  // instantly propagate to all storefront pages without manual refresh.
  if (supabaseReady) {
    initProductsRealtime();
  }

  setActiveNavLinks();
  bindGlobalSearch();

  const page = document.body.dataset.page;

  // Protect authenticated routes
  const protectedPages = ["cart", "checkout", "profile", "wishlist"];
  if (protectedPages.includes(page) && window.HodoAuth) {
    const isAuthorized = await window.HodoAuth.protectCustomerRoute();
    if (!isAuthorized) {
      return; // protectCustomerRoute handles redirect
    }
  }

  switch (page) {
    case "home":
      await initHomePage();
      break;
    case "shop":
      await initShopPage();
      break;
    case "product":
      await initProductPage();
      break;
    case "cart":
      await initCartPage();
      break;
    case "checkout":
      await initCheckoutPage();
      break;
    case "wishlist":
      await initWishlistPage();
      break;
    case "profile":
      await initProfilePage();
      break;
  }
}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", initApp);

// Listen for auth state changes
if (window.supabaseClient) {
  supabaseClient.auth.onAuthStateChange((event, session) => {
    console.log("Auth state changed:", event);
    // Re-initialize app on auth change
    if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
      initApp();
    }
  });
}
