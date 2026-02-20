// ============================================
// COUPON MANAGEMENT SYSTEM FOR ADMIN
// ============================================

const supa = window.supabaseClient;
const T = window.TABLES || {};

// Utility functions
function qs(s, r = document) {
    return r.querySelector(s);
}

function qsa(s, r = document) {
    return Array.from(r.querySelectorAll(s));
}

function fmtCurrency(n) {
    const v = Number(n || 0);
    return "৳" + v.toLocaleString("en-BD", { maximumFractionDigits: 2 });
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-BD', { year: 'numeric', month: 'short', day: 'numeric' });
}

function setText(id, v) {
    const el = typeof id === "string" ? qs(id) : id;
    if (el) el.textContent = v;
}

function showToast(message, type = 'success') {
    const existing = qs('.toast-notification');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;
    toast.innerHTML = `
    <span>${message}</span>
    <button onclick="this.parentElement.remove()">&times;</button>
  `;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

function openModal(title, bodyHtml, onMount) {
    const overlay = qs("#modalOverlay");
    const modal = qs("#modal");
    const modalTitle = qs("#modalTitle");
    const modalBody = qs("#modalBody");
    const closeBtn = qs("#modalClose");

    if (!overlay || !modal || !modalTitle || !modalBody) return;

    modalTitle.textContent = title;
    modalBody.innerHTML = bodyHtml;
    overlay.classList.add("open");

    if (typeof onMount === "function") {
        setTimeout(() => onMount(modalBody), 0);
    }

    const close = () => overlay.classList.remove("open");
    overlay.addEventListener("click", (e) => {
        if (e.target === overlay) close();
    });
    if (closeBtn) closeBtn.onclick = close;
}

// ============================================
// COUPON CRUD OPERATIONS
// ============================================

async function getCoupons() {
    try {
        const { data, error } = await supa
            .from(T.coupons || 'coupons')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching coupons:', error);
        return [];
    }
}

async function getCouponById(id) {
    try {
        const { data, error } = await supa
            .from(T.coupons || 'coupons')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error fetching coupon:', error);
        return null;
    }
}

async function getCouponByCode(code) {
    try {
        const { data, error } = await supa
            .from(T.coupons || 'coupons')
            .select('*')
            .eq('code', code.toUpperCase())
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data || null;
    } catch (error) {
        console.error('Error fetching coupon by code:', error);
        return null;
    }
}

async function createCoupon(couponData) {
    try {
        // Check if coupon code already exists
        const existing = await getCouponByCode(couponData.code);
        if (existing) {
            throw new Error('Coupon code already exists');
        }

        const { data, error } = await supa
            .from(T.coupons || 'coupons')
            .insert([couponData])
            .select()
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error creating coupon:', error);
        return { success: false, error: error.message };
    }
}

async function updateCoupon(id, couponData) {
    try {
        const { data, error } = await supa
            .from(T.coupons || 'coupons')
            .update(couponData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error updating coupon:', error);
        return { success: false, error: error.message };
    }
}

async function deleteCoupon(id) {
    try {
        const { error } = await supa
            .from(T.coupons || 'coupons')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Error deleting coupon:', error);
        return { success: false, error: error.message };
    }
}

async function toggleCouponStatus(id, isActive) {
    try {
        const { error } = await supa
            .from(T.coupons || 'coupons')
            .update({ is_active: isActive })
            .eq('id', id);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Error toggling coupon status:', error);
        return { success: false, error: error.message };
    }
}

async function incrementCouponUsage(id) {
    try {
        const { error } = await supa
            .from(T.coupons || 'coupons')
            .update({ usage_count: supa.raw('usage_count + 1') })
            .eq('id', id);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Error incrementing coupon usage:', error);
        return { success: false, error: error.message };
    }
}

// ============================================
// VALIDATE COUPON FOR CHECKOUT
// ============================================

async function validateCoupon(code, cartItems, userId = null, sessionId = null) {
    try {
        // Get coupon by code
        const coupon = await getCouponByCode(code);

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
                error: `Minimum order amount of ${fmtCurrency(coupon.minimum_order_amount)} not met`
            };
        }

        // Check usage limit
        if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
            return { valid: false, error: 'Coupon usage limit exceeded' };
        }

        // Check per-customer usage limit
        if (userId && coupon.usage_per_customer) {
            const { data: usage } = await supa
                .from(T.coupon_usage || 'coupon_usage')
                .select('*')
                .eq('coupon_id', coupon.id)
                .eq('user_id', userId)
                .single();

            if (usage && usage.usage_count >= coupon.usage_per_customer) {
                return { valid: false, error: 'You have already used this coupon' };
            }
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
            message: 'Coupon applied successfully'
        };

    } catch (error) {
        console.error('Error validating coupon:', error);
        return { valid: false, error: 'Error validating coupon' };
    }
}

async function applyCouponUsage(couponId, userId, sessionId, orderId) {
    try {
        // Increment usage count
        await supa
            .from(T.coupons || 'coupons')
            .update({ usage_count: coupon.usage_count + 1 })
            .eq('id', couponId);

        // Record usage
        const { error } = await supa
            .from(T.coupon_usage || 'coupon_usage')
            .insert([{
                coupon_id: couponId,
                user_id: userId,
                session_id: sessionId,
                order_id: orderId
            }]);

        // Ignore duplicate key errors
        if (error && error.code !== '23505') throw error;

        return { success: true };
    } catch (error) {
        console.error('Error applying coupon usage:', error);
        return { success: false };
    }
}

// ============================================
// UI RENDERING
// ============================================

function renderCouponsTable(coupons) {
    const tbody = qs('#discountsTable');
    if (!tbody) return;

    if (!coupons || coupons.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="no-data">No coupons found</td></tr>';
        return;
    }

    tbody.innerHTML = coupons.map(coupon => {
        const typeLabel = coupon.discount_type === 'percentage'
            ? `${coupon.discount_value}%`
            : fmtCurrency(coupon.discount_value);

        const usageDisplay = coupon.usage_limit
            ? `${coupon.usage_count || 0} / ${coupon.usage_limit}`
            : (coupon.usage_count || 0);

        const statusBadge = coupon.is_active
            ? '<span class="status-badge status-active">Active</span>'
            : '<span class="status-badge status-inactive">Inactive</span>';

        const isExpired = new Date(coupon.expiry_date) < new Date();
        const expiryDisplay = isExpired
            ? `<span class="text-expired">${formatDate(coupon.expiry_date)}</span>`
            : formatDate(coupon.expiry_date);

        return `
      <tr data-id="${coupon.id}">
        <td><code class="coupon-code">${coupon.code}</code></td>
        <td>${coupon.discount_type === 'percentage' ? 'Percentage (%)' : 'Fixed (৳)'}</td>
        <td>${typeLabel}</td>
        <td>${coupon.minimum_order_amount ? fmtCurrency(coupon.minimum_order_amount) : '-'}</td>
        <td>${usageDisplay}</td>
        <td>${expiryDisplay}</td>
        <td>${statusBadge}</td>
        <td class="actions-cell">
          <button class="action-btn edit-btn" data-id="${coupon.id}" title="Edit">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          <button class="action-btn toggle-btn ${coupon.is_active ? 'disable' : 'enable'}" 
                  data-id="${coupon.id}" 
                  data-status="${coupon.is_active}" 
                  title="${coupon.is_active ? 'Disable' : 'Enable'}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              ${coupon.is_active
                ? '<circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>'
                : '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>'
            }
            </svg>
          </button>
          <button class="action-btn delete-btn" data-id="${coupon.id}" title="Delete">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        </td>
      </tr>
    `;
    }).join('');

    // Attach event listeners
    attachTableEventListeners();
}

function attachTableEventListeners() {
    // Edit button
    qsa('.edit-btn').forEach(btn => {
        btn.addEventListener('click', () => openEditCouponModal(btn.dataset.id));
    });

    // Toggle button
    qsa('.toggle-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = parseInt(btn.dataset.id);
            const isActive = btn.dataset.status === 'true';
            await toggleCouponStatus(id, !isActive);
            await loadCoupons();
        });
    });

    // Delete button
    qsa('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => confirmDeleteCoupon(btn.dataset.id));
    });
}

// ============================================
// MODAL FORMS
// ============================================

async function openAddCouponModal() {
    // Load products for selection
    let productsHtml = '';
    let categoriesHtml = '';

    try {
        const { data: products } = await supa.from(T.products || 'products').select('id, name, category');
        if (products) {
            productsHtml = products.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
            const categories = [...new Set(products.map(p => p.category))];
            categoriesHtml = categories.map(c => `<option value="${c}">${c}</option>`).join('');
        }
    } catch (e) {
        console.error('Error loading products:', e);
    }

    const today = new Date().toISOString().split('T')[0];
    const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const formHtml = `
    <form id="addCouponForm" class="coupon-form">
      <div class="form-group">
        <label for="couponCode">Coupon Code *</label>
        <input type="text" id="couponCode" name="code" required 
               placeholder="e.g., SUMMER20" 
               style="text-transform: uppercase;"
               autocomplete="off">
        <small>Unique code (uppercase letters & numbers)</small>
      </div>
      
      <div class="form-group">
        <label for="couponDescription">Description</label>
        <input type="text" id="couponDescription" name="description" 
               placeholder="Optional description">
      </div>
      
      <div class="form-row">
        <div class="form-group">
          <label for="discountType">Discount Type *</label>
          <select id="discountType" name="discount_type" required>
            <option value="percentage">Percentage (%)</option>
            <option value="fixed">Fixed Amount (৳)</option>
          </select>
        </div>
        
        <div class="form-group">
          <label for="discountValue">Discount Value *</label>
          <input type="number" id="discountValue" name="discount_value" required 
                 min="0" step="0.01" placeholder="10">
        </div>
      </div>
      
      <div class="form-row">
        <div class="form-group">
          <label for="minOrderAmount">Minimum Order Amount</label>
          <input type="number" id="minOrderAmount" name="minimum_order_amount" 
                 min="0" step="1" placeholder="0">
        </div>
        
        <div class="form-group" id="maxDiscountGroup">
          <label for="maxDiscountCap">Maximum Discount Cap</label>
          <input type="number" id="maxDiscountCap" name="maximum_discount_cap" 
                 min="0" step="1" placeholder="For % only">
        </div>
      </div>
      
      <div class="form-group">
        <label for="applicableType">Applicable To</label>
        <select id="applicableType" name="applicable_type">
          <option value="all">All Products</option>
          <option value="products">Selected Products</option>
          <option value="categories">Selected Categories</option>
        </select>
      </div>
      
      <div class="form-group" id="productsSelection" style="display: none;">
        <label for="applicableProducts">Select Products</label>
        <select id="applicableProducts" name="applicable_products" multiple size="5">
          ${productsHtml}
        </select>
        <small>Hold Ctrl/Cmd to select multiple</small>
      </div>
      
      <div class="form-group" id="categoriesSelection" style="display: none;">
        <label for="applicableCategories">Select Categories</label>
        <select id="applicableCategories" name="applicable_categories" multiple size="5">
          ${categoriesHtml}
        </select>
        <small>Hold Ctrl/Cmd to select multiple</small>
      </div>
      
      <div class="form-row">
        <div class="form-group">
          <label for="usageLimit">Usage Limit (Total)</label>
          <input type="number" id="usageLimit" name="usage_limit" 
                 min="1" placeholder="Unlimited">
        </div>
        
        <div class="form-group">
          <label for="usagePerCustomer">Usage Per Customer</label>
          <input type="number" id="usagePerCustomer" name="usage_per_customer" 
                 min="1" value="1" placeholder="1">
        </div>
      </div>
      
      <div class="form-row">
        <div class="form-group">
          <label for="startDate">Start Date *</label>
          <input type="date" id="startDate" name="start_date" required value="${today}">
        </div>
        
        <div class="form-group">
          <label for="expiryDate">Expiry Date *</label>
          <input type="date" id="expiryDate" name="expiry_date" required value="${nextMonth}">
        </div>
      </div>
      
      <div class="form-group">
        <label class="checkbox-label">
          <input type="checkbox" name="is_active" checked>
          <span>Active</span>
        </label>
      </div>
      
      <div class="form-actions">
        <button type="button" class="btn btn-secondary" id="cancelCouponBtn">Cancel</button>
        <button type="submit" class="btn btn-primary">Create Coupon</button>
      </div>
    </form>
  `;

    openModal('Add New Coupon', formHtml, (modalBody) => {
        // Handle discount type change
        const discountType = modalBody.querySelector('#discountType');
        const maxDiscountGroup = modalBody.querySelector('#maxDiscountGroup');
        if (discountType && maxDiscountGroup) {
            discountType.addEventListener('change', () => {
                maxDiscountGroup.style.display = discountType.value === 'percentage' ? 'block' : 'none';
            });
        }

        // Handle applicable type change
        const applicableType = modalBody.querySelector('#applicableType');
        const productsSelection = modalBody.querySelector('#productsSelection');
        const categoriesSelection = modalBody.querySelector('#categoriesSelection');

        if (applicableType) {
            applicableType.addEventListener('change', () => {
                productsSelection.style.display = applicableType.value === 'products' ? 'block' : 'none';
                categoriesSelection.style.display = applicableType.value === 'categories' ? 'block' : 'none';
            });
        }

        // Handle form submission
        const form = modalBody.querySelector('#addCouponForm');
        const cancelBtn = modalBody.querySelector('#cancelCouponBtn');

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                qs('#modalOverlay').classList.remove('open');
            });
        }

        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await handleAddCoupon(form);
            });
        }
    });
}

async function openEditCouponModal(id) {
    const coupon = await getCouponById(id);
    if (!coupon) {
        showToast('Coupon not found', 'error');
        return;
    }

    // Load products for selection
    let productsHtml = '';
    let categoriesHtml = '';

    try {
        const { data: products } = await supa.from(T.products || 'products').select('id, name, category');
        if (products) {
            productsHtml = products.map(p => {
                const selected = coupon.applicable_products?.includes(p.id) ? 'selected' : '';
                return `<option value="${p.id}" ${selected}>${p.name}</option>`;
            }).join('');
            const categories = [...new Set(products.map(p => p.category))];
            categoriesHtml = categories.map(c => {
                const selected = coupon.applicable_categories?.includes(c) ? 'selected' : '';
                return `<option value="${c}" ${selected}>${c}</option>`;
            }).join('');
        }
    } catch (e) {
        console.error('Error loading products:', e);
    }

    const formHtml = `
    <form id="editCouponForm" class="coupon-form">
      <input type="hidden" name="id" value="${coupon.id}">
      
      <div class="form-group">
        <label for="couponCode">Coupon Code *</label>
        <input type="text" id="couponCode" name="code" required 
               value="${coupon.code}" 
               style="text-transform: uppercase;"
               autocomplete="off" readonly>
        <small>Code cannot be changed after creation</small>
      </div>
      
      <div class="form-group">
        <label for="couponDescription">Description</label>
        <input type="text" id="couponDescription" name="description" 
               value="${coupon.description || ''}" 
               placeholder="Optional description">
      </div>
      
      <div class="form-row">
        <div class="form-group">
          <label for="discountType">Discount Type *</label>
          <select id="discountType" name="discount_type" required>
            <option value="percentage" ${coupon.discount_type === 'percentage' ? 'selected' : ''}>Percentage (%)</option>
            <option value="fixed" ${coupon.discount_type === 'fixed' ? 'selected' : ''}>Fixed Amount (৳)</option>
          </select>
        </div>
        
        <div class="form-group">
          <label for="discountValue">Discount Value *</label>
          <input type="number" id="discountValue" name="discount_value" required 
                 min="0" step="0.01" value="${coupon.discount_value}">
        </div>
      </div>
      
      <div class="form-row">
        <div class="form-group">
          <label for="minOrderAmount">Minimum Order Amount</label>
          <input type="number" id="minOrderAmount" name="minimum_order_amount" 
                 min="0" step="1" value="${coupon.minimum_order_amount || 0}">
        </div>
        
        <div class="form-group" id="maxDiscountGroup" style="display: ${coupon.discount_type === 'percentage' ? 'block' : 'none'}">
          <label for="maxDiscountCap">Maximum Discount Cap</label>
          <input type="number" id="maxDiscountCap" name="maximum_discount_cap" 
                 min="0" step="1" value="${coupon.maximum_discount_cap || ''}">
        </div>
      </div>
      
      <div class="form-group">
        <label for="applicableType">Applicable To</label>
        <select id="applicableType" name="applicable_type">
          <option value="all" ${coupon.applicable_type === 'all' ? 'selected' : ''}>All Products</option>
          <option value="products" ${coupon.applicable_type === 'products' ? 'selected' : ''}>Selected Products</option>
          <option value="categories" ${coupon.applicable_type === 'categories' ? 'selected' : ''}>Selected Categories</option>
        </select>
      </div>
      
      <div class="form-group" id="productsSelection" style="display: ${coupon.applicable_type === 'products' ? 'block' : 'none'}">
        <label for="applicableProducts">Select Products</label>
        <select id="applicableProducts" name="applicable_products" multiple size="5">
          ${productsHtml}
        </select>
        <small>Hold Ctrl/Cmd to select multiple</small>
      </div>
      
      <div class="form-group" id="categoriesSelection" style="display: ${coupon.applicable_type === 'categories' ? 'block' : 'none'}">
        <label for="applicableCategories">Select Categories</label>
        <select id="applicableCategories" name="applicable_categories" multiple size="5">
          ${categoriesHtml}
        </select>
        <small>Hold Ctrl/Cmd to select multiple</small>
      </div>
      
      <div class="form-row">
        <div class="form-group">
          <label for="usageLimit">Usage Limit (Total)</label>
          <input type="number" id="usageLimit" name="usage_limit" 
                 min="1" value="${coupon.usage_limit || ''}" placeholder="Unlimited">
        </div>
        
        <div class="form-group">
          <label for="usagePerCustomer">Usage Per Customer</label>
          <input type="number" id="usagePerCustomer" name="usage_per_customer" 
                 min="1" value="${coupon.usage_per_customer || 1}">
        </div>
      </div>
      
      <div class="form-row">
        <div class="form-group">
          <label for="startDate">Start Date *</label>
          <input type="date" id="startDate" name="start_date" required 
                 value="${coupon.start_date.split('T')[0]}">
        </div>
        
        <div class="form-group">
          <label for="expiryDate">Expiry Date *</label>
          <input type="date" id="expiryDate" name="expiry_date" required 
                 value="${coupon.expiry_date.split('T')[0]}">
        </div>
      </div>
      
      <div class="form-group">
        <label class="checkbox-label">
          <input type="checkbox" name="is_active" ${coupon.is_active ? 'checked' : ''}>
          <span>Active</span>
        </label>
      </div>
      
      <div class="form-actions">
        <button type="button" class="btn btn-secondary" id="cancelCouponBtn">Cancel</button>
        <button type="submit" class="btn btn-primary">Save Changes</button>
      </div>
    </form>
  `;

    openModal('Edit Coupon', formHtml, (modalBody) => {
        // Handle discount type change
        const discountType = modalBody.querySelector('#discountType');
        const maxDiscountGroup = modalBody.querySelector('#maxDiscountGroup');
        if (discountType && maxDiscountGroup) {
            discountType.addEventListener('change', () => {
                maxDiscountGroup.style.display = discountType.value === 'percentage' ? 'block' : 'none';
            });
        }

        // Handle applicable type change
        const applicableType = modalBody.querySelector('#applicableType');
        const productsSelection = modalBody.querySelector('#productsSelection');
        const categoriesSelection = modalBody.querySelector('#categoriesSelection');

        if (applicableType) {
            applicableType.addEventListener('change', () => {
                productsSelection.style.display = applicableType.value === 'products' ? 'block' : 'none';
                categoriesSelection.style.display = applicableType.value === 'categories' ? 'block' : 'none';
            });
        }

        // Handle form submission
        const form = modalBody.querySelector('#editCouponForm');
        const cancelBtn = modalBody.querySelector('#cancelCouponBtn');

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                qs('#modalOverlay').classList.remove('open');
            });
        }

        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await handleEditCoupon(form);
            });
        }
    });
}

function confirmDeleteCoupon(id) {
    const confirmHtml = `
    <div class="confirm-delete">
      <p>Are you sure you want to delete this coupon?</p>
      <p class="warning-text">This action cannot be undone. The coupon will be permanently removed.</p>
      <div class="form-actions">
        <button type="button" class="btn btn-secondary" id="cancelDeleteBtn">Cancel</button>
        <button type="button" class="btn btn-danger" id="confirmDeleteBtn">Delete</button>
      </div>
    </div>
  `;

    openModal('Delete Coupon', confirmHtml, (modalBody) => {
        modalBody.querySelector('#cancelDeleteBtn').addEventListener('click', () => {
            qs('#modalOverlay').classList.remove('open');
        });

        modalBody.querySelector('#confirmDeleteBtn').addEventListener('click', async () => {
            const result = await deleteCoupon(id);
            if (result.success) {
                showToast('Coupon deleted successfully');
                qs('#modalOverlay').classList.remove('open');
                await loadCoupons();
            } else {
                showToast(result.error || 'Error deleting coupon', 'error');
            }
        });
    });
}

// ============================================
// FORM HANDLERS
// ============================================

async function handleAddCoupon(form) {
    const formData = new FormData(form);

    // Sanitize coupon code
    let code = formData.get('code')?.toString().toUpperCase().replace(/[^A-Z0-9]/g, '') || '';
    if (code.length < 3) {
        showToast('Coupon code must be at least 3 characters', 'error');
        return;
    }

    const couponData = {
        code: code,
        description: formData.get('description') || null,
        discount_type: formData.get('discount_type'),
        discount_value: parseFloat(formData.get('discount_value')),
        minimum_order_amount: parseFloat(formData.get('minimum_order_amount')) || 0,
        maximum_discount_cap: formData.get('maximum_discount_cap') ? parseFloat(formData.get('maximum_discount_cap')) : null,
        applicable_type: formData.get('applicable_type') || 'all',
        applicable_products: formData.get('applicable_type') === 'products'
            ? Array.from(form.querySelectorAll('#applicableProducts option:checked')).map(o => parseInt(o.value))
            : null,
        applicable_categories: formData.get('applicable_type') === 'categories'
            ? Array.from(form.querySelectorAll('#applicableCategories option:checked')).map(o => o.value)
            : null,
        usage_limit: formData.get('usage_limit') ? parseInt(formData.get('usage_limit')) : null,
        usage_per_customer: parseInt(formData.get('usage_per_customer')) || 1,
        start_date: new Date(formData.get('start_date')).toISOString(),
        expiry_date: new Date(formData.get('expiry_date')).toISOString(),
        is_active: form.querySelector('input[name="is_active"]')?.checked || false
    };

    const result = await createCoupon(couponData);

    if (result.success) {
        showToast('Coupon created successfully');
        qs('#modalOverlay').classList.remove('open');
        await loadCoupons();
    } else {
        showToast(result.error || 'Error creating coupon', 'error');
    }
}

async function handleEditCoupon(form) {
    const formData = new FormData(form);
    const id = parseInt(formData.get('id'));

    const couponData = {
        description: formData.get('description') || null,
        discount_type: formData.get('discount_type'),
        discount_value: parseFloat(formData.get('discount_value')),
        minimum_order_amount: parseFloat(formData.get('minimum_order_amount')) || 0,
        maximum_discount_cap: formData.get('maximum_discount_cap') ? parseFloat(formData.get('maximum_discount_cap')) : null,
        applicable_type: formData.get('applicable_type') || 'all',
        applicable_products: formData.get('applicable_type') === 'products'
            ? Array.from(form.querySelectorAll('#applicableProducts option:checked')).map(o => parseInt(o.value))
            : null,
        applicable_categories: formData.get('applicable_type') === 'categories'
            ? Array.from(form.querySelectorAll('#applicableCategories option:checked')).map(o => o.value)
            : null,
        usage_limit: formData.get('usage_limit') ? parseInt(formData.get('usage_limit')) : null,
        usage_per_customer: parseInt(formData.get('usage_per_customer')) || 1,
        start_date: new Date(formData.get('start_date')).toISOString(),
        expiry_date: new Date(formData.get('expiry_date')).toISOString(),
        is_active: form.querySelector('input[name="is_active"]')?.checked || false
    };

    const result = await updateCoupon(id, couponData);

    if (result.success) {
        showToast('Coupon updated successfully');
        qs('#modalOverlay').classList.remove('open');
        await loadCoupons();
    } else {
        showToast(result.error || 'Error updating coupon', 'error');
    }
}

// ============================================
// INITIALIZATION
// ============================================

let couponsCache = [];

async function loadCoupons() {
    const loadingHtml = '<tr><td colspan="8" class="loading">Loading coupons...</td></tr>';
    const tbody = qs('#discountsTable');
    if (tbody) tbody.innerHTML = loadingHtml;

    couponsCache = await getCoupons();
    renderCouponsTable(couponsCache);
}

function initDiscountsPage() {
    // Add button
    const addBtn = qs('#addDiscountBtn');
    if (addBtn) {
        addBtn.addEventListener('click', openAddCouponModal);
    }

    // Load coupons
    loadCoupons();

    // Auto-refresh every 30 seconds for real-time updates
    setInterval(loadCoupons, 30000);
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDiscountsPage);
} else {
    initDiscountsPage();
}

// Export functions for external use
window.CouponManager = {
    getCoupons,
    getCouponById,
    getCouponByCode,
    createCoupon,
    updateCoupon,
    deleteCoupon,
    toggleCouponStatus,
    validateCoupon,
    loadCoupons
};
