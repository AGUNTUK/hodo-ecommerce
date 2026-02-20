# Hodo E-commerce - Supabase Backend Setup Guide

This guide explains how to set up Supabase as the backend for the Hodo e-commerce application.

## Prerequisites

1. A [Supabase](https://supabase.com) account
2. A new Supabase project created

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Fill in your project details:
   - Name: `hodo-ecommerce` (or your preferred name)
   - Database Password: (create a strong password)
   - Region: Choose the closest region to your users
4. Click "Create new project" and wait for it to be ready

## Step 2: Get Your Project Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (looks like `https://xxxxxx.supabase.co`)
   - **anon public key** (a long JWT token)

## Step 3: Configure the Application

1. Open `supabase-config.js` in your project
2. Replace the placeholder values with your actual credentials:

```javascript
const SUPABASE_URL = "https://your-project-id.supabase.co";
const SUPABASE_ANON_KEY = "your-anon-key-here";
```

## Step 4: Set Up the Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy the entire contents of `supabase-schema.sql` from this project
4. Paste it into the SQL Editor
5. Click "Run" to execute the SQL

This will create:

- `products` table - Stores product information
- `profiles` table - Stores user profile data
- `cart` table - Stores shopping cart items
- `orders` table - Stores order information
- `order_items` table - Stores items within orders
- `wishlist` table - Stores user wishlists
- Appropriate indexes and Row Level Security policies

## Step 5: Enable Authentication

1. In Supabase dashboard, go to **Authentication** → **Providers**
2. Enable the authentication providers you want:
   - **Email** (enabled by default)
   - **Google** (optional)
   - **Facebook** (optional)
   - Other providers as needed

## Step 6: Configure Storage (Optional for Product Images)

If you want to upload custom product images:

1. Go to **Storage** in Supabase dashboard
2. Create a new bucket called `products`
3. Set it to public if you want images to be publicly accessible
4. Update the image URLs in the products table to use your Supabase storage URLs

## Database Schema Overview

### Tables

| Table         | Description                                                       |
| ------------- | ----------------------------------------------------------------- |
| `products`    | Product catalog with name, price, category, sizes, colors, images |
| `profiles`    | User profile information linked to auth.users                     |
| `cart`        | Shopping cart items for authenticated and guest users             |
| `orders`      | Customer orders with status tracking                              |
| `order_items` | Individual items within orders                                    |
| `wishlist`    | User wishlist items                                               |

### Row Level Security (RLS)

The schema includes RLS policies for:

- **Products**: Readable by everyone, writable by admins only
- **Profiles**: Users can only view/edit their own profile
- **Cart**: Users can only access their own cart items
- **Orders**: Users can only view their own orders
- **Wishlist**: Users can only access their own wishlist

## API Functions Available

The `app-supabase.js` file provides these functions:

### Products

- `fetchProducts()` - Get all products
- `fetchProductById(id)` - Get a single product

### Cart

- `getCart()` - Get current user's cart
- `addToCart(productId, size, color, quantity)` - Add item to cart
- `updateCartItemQuantity(cartId, quantity)` - Update quantity
- `removeCartItem(cartId)` - Remove item from cart
- `clearCart()` - Clear all cart items

### Profile

- `getProfile()` - Get user profile
- `saveProfile(profile)` - Save user profile

### Wishlist

- `getWishlist()` - Get user's wishlist
- `toggleWishlist(productId)` - Add/remove from wishlist

### Orders

- `createOrder(orderData)` - Create a new order

### Authentication

- `signIn(email, password)` - Sign in user
- `signUp(email, password)` - Register new user
- `signOut()` - Sign out user

## Guest vs Authenticated Users

The application supports both guest and authenticated users:

- **Guest Users**: Cart is stored using a session ID in localStorage
- **Authenticated Users**: Cart and profile are linked to their user account

When a guest user signs in, their session cart can be merged with their account cart (this would require additional implementation).

## Environment Variables (Recommended for Production)

For production deployments, consider using environment variables:

```javascript
// In a .env file or your hosting platform's environment settings
VITE_SUPABASE_URL = your - project - url;
VITE_SUPABASE_ANON_KEY = your - anon - key;
```

Then update `supabase-config.js`:

```javascript
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
```

## Troubleshooting

### "Failed to fetch" errors

- Check that your Supabase URL is correct
- Verify your anon key is valid
- Check CORS settings in Supabase dashboard

### RLS Policy Errors

- Make sure RLS is enabled on all tables
- Verify the policies are correctly set up
- Check that you're authenticated for protected operations

### Products Not Loading

- Verify the products table has data (run the seed SQL)
- Check RLS policies allow public read access

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)

## Support

For issues specific to this implementation, please check:

1. Browser console for error messages
2. Supabase dashboard logs
3. Network tab for failed API requests
