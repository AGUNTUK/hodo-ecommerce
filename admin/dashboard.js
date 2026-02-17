document.addEventListener("DOMContentLoaded", async () => {
  // Initialize Feather Icons
  feather.replace();

  // Check for Supabase client
  if (!window.supabaseClient) {
    console.error("Supabase client not found. Make sure supabase-config.js is loaded.");
    return;
  }

  // Check for authentication module
  if (!window.HodoAuth) {
    console.error("Auth module not found. Make sure auth.js is loaded.");
    return;
  }

  // Protect admin routes - require admin login
  const isAuthorized = await window.HodoAuth.protectAdminRoute();
  if (!isAuthorized) {
    return; // Will redirect to login
  }

  // Update UI with user info
  const { user, role } = await window.HodoAuth.getCurrentUser();
  window.HodoAuth.updateUIForUser(user, role);

  const page = document.body.dataset.page;

  // Page-specific initializations
  switch (page) {
    case "dashboard":
      initDashboardPage();
      break;
    case "orders":
      initOrdersPage();
      break;
    case "products":
      initProductsPage();
      break;
  }
});

const BDT_FORMATTER = new Intl.NumberFormat("en-BD", {
  style: "currency",
  currency: "BDT",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Fetches core statistics for the dashboard overview.
 */
async function fetchDashboardStats() {
  const { data: orders, error: ordersError } = await supabaseClient
    .from('orders')
    .select('total_amount, status');

  const { data: customers, error: customersError } = await supabaseClient
    .from('profiles')
    .select('id', { count: 'exact' });

  if (ordersError || customersError) {
    console.error("Error fetching stats:", ordersError || customersError);
    return { totalSales: 0, totalOrders: 0, pendingOrders: 0, totalCustomers: 0 };
  }

  const totalSales = orders.reduce((sum, order) => sum + order.total_amount, 0);
  const pendingOrders = orders.filter(o => o.status === 'pending').length;

  return {
    totalSales,
    totalOrders: orders.length,
    pendingOrders,
    totalCustomers: customers.length,
  };
}

/**
 * Initializes the Dashboard Overview page
 */
async function initDashboardPage() {
  const stats = await fetchDashboardStats();

  document.getElementById("totalSales").textContent = BDT_FORMATTER.format(stats.totalSales);
  document.getElementById("totalOrders").textContent = stats.totalOrders;
  document.getElementById("pendingOrders").textContent = stats.pendingOrders;
  document.getElementById("totalCustomers").textContent = stats.totalCustomers;

  renderSalesChart();
  renderRecentOrders();
}

/**
 * Renders the sales chart on the dashboard.
 */
function renderSalesChart() {
  const ctx = document.getElementById('salesChart').getContext('2d');
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
      datasets: [{
        label: 'Sales',
        data: [12000, 19000, 15000, 25000, 22000, 30000, 28000], // Dummy data
        borderColor: '#FF0000',
        backgroundColor: 'rgba(255, 0, 0, 0.1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true
        }
      },
      plugins: {
        legend: {
          display: false
        }
      }
    }
  });
}

/**
 * Fetches and renders the 5 most recent orders.
 */
async function renderRecentOrders() {
  const listEl = document.getElementById('recentOrdersList');
  const { data, error } = await supabaseClient
    .from('orders')
    .select('id, customer_name, total_amount, status')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    listEl.innerHTML = `<p>Error loading orders.</p>`;
    return;
  }

  if (data.length === 0) {
    listEl.innerHTML = `<p>No recent orders found.</p>`;
    return;
  }

  listEl.innerHTML = data.map(order => `
    <div class="list-item">
      <div>
        <p style="font-weight: 500;">${order.customer_name}</p>
        <p style="font-size: 12px; color: #666;">Order #${order.id}</p>
      </div>
      <div style="text-align: right;">
        <p style="font-weight: 600;">${BDT_FORMATTER.format(order.total_amount)}</p>
        <p style="font-size: 12px; color: #666; text-transform: capitalize;">${order.status}</p>
      </div>
    </div>
  `).join('');
}

/**
 * Initializes the Orders Management page
 */
async function initOrdersPage() {
  const tableBody = document.getElementById('ordersTableBody');
  const { data, error } = await supabaseClient
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    tableBody.innerHTML = `<tr><td colspan="7" class="text-center">Error loading orders.</td></tr>`;
    return;
  }

  // This is a simplified table. You would add more details and actions.
  tableBody.innerHTML = data.map(order => `
    <tr>
      <td>#${order.id}</td>
      <td>${order.customer_name}</td>
      <td>${BDT_FORMATTER.format(order.total_amount)}</td>
      <td>Paid</td>
      <td><span class="status status-${order.status}">${order.status}</span></td>
      <td>${new Date(order.created_at).toLocaleDateString()}</td>
      <td><button class="btn-sm">View</button></td>
    </tr>
  `).join('');
}

/**
 * Initializes the Products Management page
 */
async function initProductsPage() {
  const tableBody = document.getElementById('productsTableBody');
  const addProductBtn = document.getElementById('addProductBtn');
  const modal = document.getElementById('addProductModal');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const addProductForm = document.getElementById('addProductForm');

  // Edit Modal Elements
  const editModal = document.getElementById('editProductModal');
  const closeEditModalBtn = document.getElementById('closeEditModalBtn');
  const editProductForm = document.getElementById('editProductForm');

  // Delete Confirm Modal Elements
  const deleteModal = document.getElementById('deleteConfirmModal');
  const closeDeleteModalBtn = document.getElementById('closeDeleteConfirmBtn');
  const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
  const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

  // Function to fetch and render products
  async function renderProducts() {
    tableBody.innerHTML = `<tr><td colspan="7" class="text-center">Loading products...</td></tr>`;
    const { data, error } = await supabaseClient
      .from('products')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      tableBody.innerHTML = `<tr><td colspan="7" class="text-center">Error loading products.</td></tr>`;
      console.error('Error fetching products:', error);
      return;
    }

    if (data.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="7" class="text-center">No products found. Add one!</td></tr>`;
      return;
    }

    tableBody.innerHTML = data.map(product => `
      <tr>
        <td>#${product.id}</td>
        <td>${product.name}</td>
        <td>${product.category}</td>
        <td>${BDT_FORMATTER.format(product.price)}</td>
        <td>${product.sizes.length > 0 ? product.sizes.join(', ') : 'N/A'}</td>
        <td><span class="status status-active">Active</span></td>
        <td>
          <button class="btn-sm btn-secondary edit-btn" data-product-id="${product.id}">Edit</button>
          <button class="btn-sm btn-danger delete-btn" data-product-id="${product.id}">Delete</button>
        </td>
      </tr>
    `).join('');
    feather.replace(); // Re-initialize icons if any are added dynamically
  }

  // Add Modal handling
  const showModal = () => modal.classList.add('show');
  const hideModal = () => modal.classList.remove('show');

  addProductBtn.addEventListener('click', showModal);
  closeModalBtn.addEventListener('click', hideModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      hideModal();
    }
  });

  // Add Form submission
  addProductForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(addProductForm);
    const productData = Object.fromEntries(formData.entries());

    // Format data for Supabase
    productData.sizes = productData.sizes.split(',').map(s => s.trim());
    productData.colors = productData.colors.split(',').map(c => c.trim());
    productData.price = parseFloat(productData.price);
    productData.rating = parseFloat(productData.rating);

    const { error } = await supabaseClient.from('products').insert([productData]);

    if (error) {
      alert('Error adding product: ' + error.message);
    } else {
      hideModal();
      addProductForm.reset();
      await renderProducts(); // Refresh the table
    }
  });

  // --- Edit Product Logic ---

  // Edit Modal handling
  const showEditModal = () => editModal.classList.add('show');
  const hideEditModal = () => editModal.classList.remove('show');

  closeEditModalBtn.addEventListener('click', hideEditModal);
  editModal.addEventListener('click', (e) => {
    if (e.target === editModal) {
      hideEditModal();
    }
  });

  // Event delegation for edit buttons
  tableBody.addEventListener('click', async (e) => { // Combined event listener for actions
    if (e.target.classList.contains('edit-btn')) {
      const productId = e.target.dataset.productId;
      
      const { data: product, error } = await supabaseClient
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (error) {
        alert('Error fetching product details: ' + error.message);
        return;
      }

      // Populate the edit form
      document.getElementById('editProductId').value = product.id;
      document.getElementById('editProductName').value = product.name;
      document.getElementById('editProductCategory').value = product.category;
      document.getElementById('editProductPrice').value = product.price;
      document.getElementById('editProductRating').value = product.rating;
      document.getElementById('editProductSizes').value = product.sizes.join(', ');
      document.getElementById('editProductColors').value = product.colors.join(', ');
      document.getElementById('editProductImage').value = product.image;
      document.getElementById('editProductDescription').value = product.description;

      showEditModal();
    }

    if (e.target.classList.contains('delete-btn')) {
      const productId = e.target.dataset.productId;
      confirmDeleteBtn.dataset.productId = productId; // Store id on the confirm button
      showDeleteModal();
    }
  });

  // Edit Form submission
  editProductForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(editProductForm);
    const productData = Object.fromEntries(formData.entries());
    const productId = productData.id;

    // Format data for Supabase
    productData.sizes = productData.sizes.split(',').map(s => s.trim());
    productData.colors = productData.colors.split(',').map(c => c.trim());
    productData.price = parseFloat(productData.price);
    productData.rating = parseFloat(productData.rating);

    const { error } = await supabaseClient.from('products').update(productData).eq('id', productId);

    if (error) {
      alert('Error updating product: ' + error.message);
    } else {
      hideEditModal();
      await renderProducts(); // Refresh the table
    }
  });

  // --- Delete Product Logic ---

  // Delete Modal handling
  const showDeleteModal = () => deleteModal.classList.add('show');
  const hideDeleteModal = () => deleteModal.classList.remove('show');

  closeDeleteModalBtn.addEventListener('click', hideDeleteModal);
  cancelDeleteBtn.addEventListener('click', hideDeleteModal);
  deleteModal.addEventListener('click', (e) => {
    if (e.target === deleteModal) {
      hideDeleteModal();
    }
  });

  confirmDeleteBtn.addEventListener('click', async () => {
    const productId = confirmDeleteBtn.dataset.productId;
    if (!productId) return;

    const { error } = await supabaseClient.from('products').delete().eq('id', productId);

    if (error) {
      alert('Error deleting product: ' + error.message);
    } else {
      hideDeleteModal();
      await renderProducts(); // Refresh the table
    }
  });

  // Initial load
  await renderProducts();
}