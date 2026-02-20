# Hodo - Premium Menswear E-commerce Platform

A modern, full-featured e-commerce platform for premium menswear built with vanilla JavaScript, CSS, and Supabase backend.

![Hodo Logo](assets/hodo-logo.png)

## 🌟 Features

### Customer Features

- **Product Catalog** - Browse 24 premium men's casual products across 6 categories
- **Product Search** - Real-time search across product names, categories, and descriptions
- **Category Filters** - Filter products by category, size, and color
- **Product Details** - Detailed product pages with size/color selection
- **Shopping Cart** - Add to cart with quantity management
- **Quick Add Modal** - Add products to cart directly from product cards
- **Wishlist** - Save favorite items for later
- **Checkout** - Complete checkout flow with shipping and payment options
- **User Authentication** - Sign up, login, and profile management
- **Responsive Design** - Works seamlessly on desktop and mobile devices

### Admin Dashboard

- **Dashboard Overview** - Sales analytics and key metrics
- **Orders Management** - View and manage customer orders
- **Products Management** - Add, edit, and delete products
- **Inventory Management** - Track stock levels
- **Customers Management** - View customer profiles and history
- **Discounts/Coupons** - Create and manage promotional codes
- **Banners/Homepage** - Manage hero slides and homepage content
- **Reviews/Ratings** - Moderate customer reviews
- **Payments/Transactions** - Track payment history
- **Analytics/Reports** - Detailed sales and performance reports
- **Shipping/Delivery** - Manage shipping zones and rates
- **Staff/Admin Roles** - Manage team permissions
- **Settings** - Store configuration options

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+)
- **Backend**: Supabase (PostgreSQL, Authentication, RLS)
- **Hosting**: Vercel-ready configuration
- **Fonts**: Rajdhani, Space Grotesk (Google Fonts)
- **Icons**: Custom SVG icons

## 📁 Project Structure

```
hodo-ecommerce/
├── index.html              # Root redirect to pages/index.html
├── pages/                  # Customer-facing pages
│   ├── index.html          # Home page
│   ├── shop.html           # Product listing page
│   ├── product.html        # Product detail page
│   ├── cart.html           # Shopping cart page
│   ├── checkout.html       # Checkout page
│   ├── wishlist.html       # Wishlist page
│   ├── profile.html        # User profile page
│   ├── login.html          # Login page
│   └── signup.html         # Registration page
├── styles.css              # Main stylesheet
├── app-supabase.js         # Main application logic (products, cart, orders)
├── auth.js                 # Authentication handling
├── transitions.js          # Page transitions
├── supabase-config.js      # Supabase configuration
├── vercel.json             # Vercel deployment config (clean URLs)
├── admin/                  # Admin dashboard
│   ├── index.html          # Admin dashboard
│   ├── orders.html         # Orders management
│   ├── products.html       # Products management
│   ├── inventory.html      # Inventory management
│   ├── customers.html      # Customers management
│   ├── discounts.html      # Discounts management
│   ├── banners.html        # Banners management
│   ├── reviews.html        # Reviews management
│   ├── payments.html       # Payments management
│   ├── shipping.html       # Shipping management
│   ├── staff.html          # Staff management
│   ├── settings.html       # Settings page
│   ├── styles.css          # Admin styles
│   └── dashboard.js        # Admin logic
└── assets/
    └── hodo-logo.png       # Logo asset
```

### JavaScript Architecture

- **`supabase-config.js`** - Supabase client initialization
- **`transitions.js`** - Smooth page transitions between routes
- **`auth.js`** - User authentication (login, signup, logout, route protection)
- **`app-supabase.js`** - Main store logic:
  - Product fetching and display
  - Shopping cart management
  - Wishlist management
  - Profile management
  - Checkout flow
  - Page initialization based on `data-page` attribute

## 🚀 Getting Started

### Prerequisites

- A Supabase account (free tier available)
- Node.js (optional, for local development server)
- Git

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/AGUNTUK/hodo-ecommerce.git
   cd hodo-ecommerce
   ```

2. **Set up Supabase**
   - Create a new project at [supabase.com](https://supabase.com)
   - Go to SQL Editor and run the contents of `supabase-schema.sql`
   - Copy your project URL and anon key

3. **Configure Supabase**
   - Open `supabase-config.js`
   - Replace the placeholder values:

   ```javascript
   const SUPABASE_URL = "your-project-url";
   const SUPABASE_ANON_KEY = "your-anon-key";
   ```

4. **Run locally**
   - Use `npm run serve` (serves on port 5173), or
   - Open `pages/index.html` directly in browser, or
   - Use Python: `python -m http.server 8000` then visit `http://localhost:8000/pages/index.html`

5. **Deploy to Vercel**
   - Push to GitHub
   - Import project in Vercel
   - Deploy automatically

## 💳 Payment Methods

The checkout supports multiple payment options:

- **Cash on Delivery (COD)** - Pay when you receive
- **bKash** - Mobile wallet payment
- **Nagad** - Mobile wallet payment
- **Credit/Debit Card** - Visa, Mastercard

## 📦 Product Categories

| Category    | Description                               |
| ----------- | ----------------------------------------- |
| Shirts      | Casual and formal shirts, polos, tees     |
| Jackets     | Bomber, denim, utility jackets            |
| Pants       | Chinos, trousers, joggers, jeans          |
| Footwear    | Sneakers, boots, loafers                  |
| Sweaters    | Hoodies, pullovers, knitwear              |
| Accessories | Belts, watches, bags, sunglasses, beanies |

## 🔒 Security Features

- Row Level Security (RLS) on all database tables
- Secure authentication with Supabase Auth
- Session-based cart for guest users
- Input validation on all forms

## 🎨 Design Features

- Neumorphic UI design
- Smooth page transitions
- Responsive grid layouts
- Hero slider with autoplay
- Quick-add modal for cart
- Mobile-first approach

## 📊 Database Schema

### Tables

- `products` - Product catalog
- `profiles` - User profiles
- `cart` - Shopping cart items
- `orders` - Customer orders
- `order_items` - Order line items
- `wishlist` - Saved products
- `hero_slides` - Homepage banner slides

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 👨‍💻 Author

**Sohel Rana**

- Location: Mohammadpur, Dhaka, Bangladesh
- Phone: +8801956927088
- Facebook: [Hodo](https://www.facebook.com/p/Hodo-100063910240902/)

## 🙏 Acknowledgments

- Product images from [Unsplash](https://unsplash.com)
- Fonts from [Google Fonts](https://fonts.google.com)
- Backend by [Supabase](https://supabase.com)

---

Made with ❤️ by Sohel Rana

© 2026 Hodo. All rights reserved.
