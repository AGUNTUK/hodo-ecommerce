// Supabase Configuration
// Replace these values with your actual Supabase project credentials

// Project URL looks like: https://abcdefghijklmnop.supabase.co
// where 'abcdefghijklmnop' is your unique project reference ID
const SUPABASE_URL = 'https://vmiwgktrxljoswnvndho.supabase.co';

// Anon Key is a long JWT token that looks like:
// eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxMjU0MzYwMCwiZXhwIjoxOTI4MTE5NjAwfQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtaXdna3RyeGxqb3N3bnZuZGhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzMzU4MDEsImV4cCI6MjA4NjkxMTgwMX0.XZvI7TlGwUMKmBnExX8W6nJWP3VMLd3gicTxiIA6yaY';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Database table names
const TABLES = {
  products: 'products',
  cart: 'cart',
  profiles: 'profiles',
  orders: 'orders'
};

// Export for use in other modules
window.supabaseClient = supabase;
window.TABLES = TABLES;
