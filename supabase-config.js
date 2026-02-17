const SUPABASE_URL = 'https://vmiwgktrxljoswnvndho.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtaXdna3RyeGxqb3N3bnZuZGhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzMzU4MDEsImV4cCI6MjA4NjkxMTgwMX0.XZvI7TlGwUMKmBnExX8W6nJWP3VMLd3gicTxiIA6yaY';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const TABLES = {
  products: 'products',
  cart: 'cart',
  profiles: 'profiles',
  orders: 'orders',
  wishlist: 'wishlist',
  order_items: 'order_items'
};

window.supabaseClient = supabaseClient;
window.TABLES = TABLES;

if (!window.__currentUser) {
  window.__currentUser = null;
}

supabaseClient.auth.getSession().then(({ data }) => {
  window.__currentUser = data?.session?.user || null;
});

if (supabaseClient.auth && typeof supabaseClient.auth.user !== 'function') {
  supabaseClient.auth.user = function () {
    return window.__currentUser;
  };
}

if (supabaseClient.auth && typeof supabaseClient.auth.onAuthStateChange === 'function') {
  supabaseClient.auth.onAuthStateChange((_event, session) => {
    window.__currentUser = session?.user || null;
  });
}
