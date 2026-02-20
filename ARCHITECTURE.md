# Hodo E-commerce Architecture

## Overview

This document describes the clean, organized structure of the Hodo e-commerce platform after reorganization.

## Page Structure

All customer-facing pages are in the `pages/` directory:

- **`pages/index.html`** - Homepage with featured products and wishlist
- **`pages/shop.html`** - Product catalog with filters
- **`pages/product.html`** - Individual product detail page
- **`pages/cart.html`** - Shopping cart (requires authentication)
- **`pages/checkout.html`** - Checkout flow (requires authentication)
- **`pages/wishlist.html`** - Saved products (requires authentication)
- **`pages/profile.html`** - User profile management (requires authentication)
- **`pages/login.html`** - User login
- **`pages/signup.html`** - User registration

## JavaScript Architecture

### Core Modules (Load Order)

1. **`supabase-config.js`** - Initializes Supabase client and exposes `window.supabaseClient` and `window.TABLES`
2. **`transitions.js`** - Handles smooth page transitions between routes
3. **`auth.js`** - Authentication logic (login, signup, logout, route protection)
4. **`app-supabase.js`** - Main application logic

### Script Loading Pattern

All pages follow this consistent pattern:

```html
<script src="../transitions.js"></script>
<script src="../auth.js"></script>  <!-- Only on auth/protected pages -->
<script src="../app-supabase.js"></script>
```

**No inline scripts** - All page-specific logic is handled by `app-supabase.js` based on the `data-page` attribute.

### Page Initialization

Each page has a `data-page` attribute on `<body>`:

- `data-page="home"` → Calls `initHomePage()`
- `data-page="shop"` → Calls `initShopPage()`
- `data-page="product"` → Calls `initProductPage()`
- `data-page="cart"` → Calls `initCartPage()` (with auth check)
- `data-page="checkout"` → Calls `initCheckoutPage()` (with auth check)
- `data-page="wishlist"` → Calls `initWishlistPage()` (with auth check)
- `data-page="profile"` → Calls `initProfilePage()` (with auth check)
- `data-page="auth"` → Handled by `auth.js`

### Route Protection

Protected pages (`cart`, `checkout`, `wishlist`, `profile`) automatically check authentication via `HodoAuth.protectCustomerRoute()` in `initApp()`.

## URL Structure

### Local Development
- Direct file access: `pages/index.html`, `pages/shop.html`, etc.
- Or use a local server: `http://localhost:8000/pages/index.html`

### Production (Vercel)
Clean URLs via `vercel.json` rewrites:
- `/` → `/pages/index.html`
- `/shop` → `/pages/shop.html`
- `/cart` → `/pages/cart.html`
- `/profile` → `/pages/profile.html`
- etc.

## Key Features

### Consistent Navigation
- All pages share the same header/footer structure
- Navigation links use `data-page-link` attribute for active state
- Smooth transitions between pages via `transitions.js`

### Authentication Flow
- Login/Signup pages handled by `auth.js`
- Protected routes automatically redirect to login if not authenticated
- User session managed by Supabase Auth

### Data Management
- Products: Fetched from Supabase `products` table
- Cart: Stored in Supabase `cart` table (linked to user or session)
- Wishlist: Stored in Supabase `wishlist` table
- Profile: Stored in Supabase `profiles` table
- Orders: Created in Supabase `orders` and `order_items` tables

## Admin Dashboard

Admin pages are in the `admin/` directory and use separate styling (`admin/styles.css`) and logic (`admin/dashboard.js`).

## Design Consistency

- All pages use `styles.css` for consistent neumorphic design
- Responsive breakpoints handled in CSS
- Smooth animations and transitions throughout
- Mobile-first approach with bottom navigation on small screens
