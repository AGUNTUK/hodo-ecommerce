// ============================================
// COUPON MANAGEMENT SYSTEM
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

// Toast notification
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

// Modal functions
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
// CRUD OPERATIONS
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

async function createCoupon(couponData) {
    try {
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
            .update({ is_active: !isActive })
            .eq('id', id);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Error toggling coupon:', error);
        return { success: false, error: error.message };
    }
}

// ============================================
// COUPON FORM
// ============================================

function couponFormHtml(coupon = null) {
    const isEdit = !!coupon;
    const c = coupon || {};

    const today = new Date().toISOString().split('T')[0];
    const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const startDate = c.start_date ? new Date(c.start_date).toISOString().split('T')[0] : today;
    const expiryDate = c.expiry_date ? new Date(c.expiry_date).toISOString().split('T')[0] : nextMonth;

    return `
    <form id="couponForm" class="coupon-form">
      <div class="form-section">
        <h4>Coupon Code</h4>
        <div class="form-grid">
          <label class="full-width required">
            Code
            <input type="text" id="couponCode" value="${c.code || ''}" 
                   placeholder="e.g., SUMMER20" required
                   style="text-transform: uppercase;"
                   ${isEdit ? 'readonly' : ''}>
          </label>
        </div>
      </div>

      <div class="form-section">
        <h4>Discount Details</h4>
        <div class="form-grid">
          <label class="required">
            Discount Type
            <select id="discountType" required>
              <option value="percentage" ${c.discount_type === 'percentage' ? 'selected' : ''}>Percentage (%)</option>
              <option value="fixed" ${c.discount_type === 'fixed' ? 'selected' : ''}>Fixed Amount (৳)</option>
            </select>
          </label>
          <label class="required">
            Discount Value
            <input type="number" id="discountValue" value="${c.discount_value || ''}" 
                   placeholder="e.g., 10 or 50" required min="0" step="0.01">
          </label>
          <label>
            Minimum Order Amount
            <input type="number" id="minOrder" value="${c.minimum_order_amount || ''}" 
                   placeholder="e.g., 500" min="0" step="1">
          </label>
          <label>
            Maximum Discount Cap
            <input type="number" id="maxDiscount" value="${c.maximum_discount_cap || ''}" 
                   placeholder="e.g., 1000" min="0" step="1">
          </label>
        </div>
      </div>

      <div class="form-section">
        <h4>Usage Limits</h4>
        <div class="form-grid">
          <label>
            Total Usage Limit
            <input type="number" id="usageLimit" value="${c.usage_limit || ''}" 
                   placeholder="Leave empty for unlimited" min="1">
          </label>
          <label>
            Per Customer Limit
            <input type="number" id="usagePerCustomer" value="${c.usage_per_customer || 1}" 
                   min="1" value="1">
          </label>
        </div>
      </div>

      <div class="form-section">
        <h4>Validity Period</h4>
        <div class="form-grid">
          <label class="required">
            Start Date
            <input type="date" id="startDate" value="${startDate}" required>
          </label>
          <label class="required">
            End Date
            <input type="date" id="expiryDate" value="${expiryDate}" required>
          </label>
        </div>
      </div>

      <div class="form-section">
        <h4>Status</h4>
        <label class="toggle-label">
          <input type="checkbox" id="isActive" ${c.is_active !== false ? 'checked' : ''}>
          <span>Active</span>
        </label>
      </div>

      <div class="form-actions">
        <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary" id="saveCouponBtn">
          ${isEdit ? 'Update Coupon' : 'Create Coupon'}
        </button>
      </div>
    </form>
  `;
}

function initCouponForm(couponId = null) {
    const form = qs('#couponForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const code = qs('#couponCode').value.toUpperCase().trim();
        const discountType = qs('#discountType').value;
        const discountValue = parseFloat(qs('#discountValue').value);
        const minOrder = parseFloat(qs('#minOrder').value) || 0;
        const maxDiscount = qs('#maxDiscount').value ? parseFloat(qs('#maxDiscount').value) : null;
        const usageLimit = qs('#usageLimit').value ? parseInt(qs('#usageLimit').value) : null;
        const usagePerCustomer = parseInt(qs('#usagePerCustomer').value) || 1;
        const startDate = new Date(qs('#startDate').value).toISOString();
        const expiryDate = new Date(qs('#expiryDate').value).toISOString();
        const isActive = qs('#isActive').checked;

        if (code.length < 3) {
            showToast('Coupon code must be at least 3 characters', 'error');
            return;
        }

        const couponData = {
            code,
            discount_type: discountType,
            discount_value: discountValue,
            minimum_order_amount: minOrder,
            maximum_discount_cap: maxDiscount,
            usage_limit: usageLimit,
            usage_per_customer: usagePerCustomer,
            start_date: startDate,
            expiry_date: expiryDate,
            is_active: isActive
        };

        const saveBtn = qs('#saveCouponBtn');
        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving...';

        try {
            let result;
            if (couponId) {
                result = await updateCoupon(couponId, couponData);
            } else {
                result = await createCoupon(couponData);
            }

            if (result.success) {
                showToast(couponId ? 'Coupon updated successfully' : 'Coupon created successfully');
                closeModal();
                loadCoupons();
            } else {
                showToast(result.error || 'Error saving coupon', 'error');
            }
        } catch (err) {
            showToast('Error: ' + err.message, 'error');
        } finally {
            saveBtn.disabled = false;
            saveBtn.textContent = couponId ? 'Update Coupon' : 'Create Coupon';
        }
    });
}

window.closeModal = function () {
    const overlay = qs('#modalOverlay');
    if (overlay) overlay.classList.remove('open');
};

// ============================================
// MODAL HANDLERS
// ============================================

window.openAddCoupon = function () {
    openModal('Add New Coupon', couponFormHtml(null), () => {
        initCouponForm();
    });
};

window.openEditCoupon = async function (couponId) {
    const coupons = await getCoupons();
    const coupon = coupons.find(c => c.id === couponId);

    if (!coupon) {
        showToast('Coupon not found', 'error');
        return;
    }

    openModal('Edit Coupon', couponFormHtml(coupon), () => {
        initCouponForm(couponId);
    });
};

window.confirmDeleteCoupon = async function (couponId) {
    const confirmed = confirm('Are you sure you want to delete this coupon? This action cannot be undone.');

    if (!confirmed) return;

    const result = await deleteCoupon(couponId);

    if (result.success) {
        showToast('Coupon deleted successfully');
        loadCoupons();
    } else {
        showToast(result.error || 'Error deleting coupon', 'error');
    }
};

window.toggleCoupon = async function (couponId, currentStatus) {
    const result = await toggleCouponStatus(couponId, currentStatus);

    if (result.success) {
        showToast(currentStatus ? 'Coupon deactivated' : 'Coupon activated');
        loadCoupons();
    } else {
        showToast(result.error || 'Error updating coupon', 'error');
    }
};

// ============================================
// RENDER COUPONS TABLE
// ============================================

function renderCouponsTable(coupons) {
    const tbody = qs('#couponsTable');
    if (!tbody) return;

    if (!coupons || coupons.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="no-data">No coupons found. Click "Add Coupon" to create one.</td></tr>';
        return;
    }

    tbody.innerHTML = coupons.map(coupon => {
        const typeLabel = coupon.discount_type === 'percentage'
            ? `${coupon.discount_value}%`
            : fmtCurrency(coupon.discount_value);

        const usageDisplay = coupon.usage_limit
            ? `${coupon.usage_count || 0} / ${coupon.usage_limit}`
            : (coupon.usage_count || 0);

        const isExpired = new Date(coupon.expiry_date) < new Date();
        const isActive = coupon.is_active && !isExpired;

        let statusBadge = '';
        if (isExpired) {
            statusBadge = '<span class="status-badge status-expired">Expired</span>';
        } else if (coupon.is_active) {
            statusBadge = '<span class="status-badge status-active">Active</span>';
        } else {
            statusBadge = '<span class="status-badge status-inactive">Inactive</span>';
        }

        return `
      <tr data-id="${coupon.id}">
        <td><code class="coupon-code">${coupon.code}</code></td>
        <td>${coupon.discount_type === 'percentage' ? 'Percentage (%)' : 'Fixed (৳)'}</td>
        <td>${typeLabel}</td>
        <td>${coupon.minimum_order_amount ? fmtCurrency(coupon.minimum_order_amount) : '-'}</td>
        <td>${usageDisplay}</td>
        <td>${formatDate(coupon.expiry_date)}</td>
        <td>${statusBadge}</td>
        <td class="actions-cell">
          <button class="action-btn edit-btn" onclick="openEditCoupon(${coupon.id})" title="Edit">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          <button class="action-btn toggle-btn ${coupon.is_active ? 'disable' : 'enable'}" 
                  onclick="toggleCoupon(${coupon.id}, ${coupon.is_active})" 
                  title="${coupon.is_active ? 'Deactivate' : 'Activate'}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              ${coupon.is_active
                ? '<circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>'
                : '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>'
            }
            </svg>
          </button>
          <button class="action-btn delete-btn" onclick="confirmDeleteCoupon(${coupon.id})" title="Delete">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        </td>
      </tr>
    `;
    }).join('');
}

// ============================================
// UPDATE STATS
// ============================================

function updateCouponStats(coupons) {
    const total = coupons.length;
    const now = new Date();
    const active = coupons.filter(c => c.is_active && new Date(c.expiry_date) >= now).length;
    const expired = coupons.filter(c => new Date(c.expiry_date) < now).length;

    qs('#totalCoupons').textContent = total;
    qs('#activeCoupons').textContent = active;
    qs('#expiredCoupons').textContent = expired;
}

// ============================================
// LOAD & FILTER
// ============================================

let allCoupons = [];

async function loadCoupons() {
    const tbody = qs('#couponsTable');
    if (tbody) tbody.innerHTML = '<tr><td colspan="8" class="loading">Loading coupons...</td></tr>';

    allCoupons = await getCoupons();

    // Apply filter
    const statusFilter = qs('#statusFilter')?.value || '';
    let filtered = allCoupons;

    if (statusFilter) {
        const now = new Date();
        filtered = allCoupons.filter(c => {
            if (statusFilter === 'active') return c.is_active && new Date(c.expiry_date) >= now;
            if (statusFilter === 'inactive') return !c.is_active;
            if (statusFilter === 'expired') return new Date(c.expiry_date) < now;
            return true;
        });
    }

    renderCouponsTable(filtered);
    updateCouponStats(allCoupons);
}

// ============================================
// INITIALIZATION
// ============================================

async function init() {
    // Add button
    qs('#addCouponBtn')?.addEventListener('click', openAddCoupon);

    // Filter
    qs('#statusFilter')?.addEventListener('change', loadCoupons);

    // Load coupons
    await loadCoupons();

    // Auto-refresh every 30 seconds
    setInterval(loadCoupons, 30000);
}

// Start
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Export
window.CouponManager = {
    loadCoupons,
    openAddCoupon,
    openEditCoupon,
    confirmDeleteCoupon,
    toggleCoupon
};
