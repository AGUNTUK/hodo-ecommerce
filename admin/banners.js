// ============================================
// Banner Management System
// ============================================

const supa = window.supabaseClient;
const BANNER_POSITIONS = [
  { value: 'homepage_hero', label: 'Homepage Hero' },
  { value: 'homepage_secondary', label: 'Homepage Secondary' },
  { value: 'category_banner', label: 'Category Page Banner' },
  { value: 'promotional', label: 'Promotional Section' }
];

// Toast notification system
function showToast(message, type = 'success') {
  const existing = document.querySelector('.toast-notification');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `toast-notification toast-${type}`;
  toast.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      ${type === 'success'
      ? '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>'
      : '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>'}
    </svg>
    <span>${message}</span>
  `;
  document.body.appendChild(toast);

  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Format date for display
function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

// Check if banner is currently active based on schedule
function isBannerActive(banner) {
  const now = new Date();
  if (!banner.is_active) return false;
  if (banner.start_date && new Date(banner.start_date) > now) return false;
  if (banner.end_date && new Date(banner.end_date) < now) return false;
  return true;
}

// Get position label from value
function getPositionLabel(value) {
  const pos = BANNER_POSITIONS.find(p => p.value === value);
  return pos ? pos.label : value;
}

// Render banner form
function bannerFormHtml(banner = null) {
  const isEdit = !!banner;
  const b = banner || {};

  const positionOptions = BANNER_POSITIONS.map(pos =>
    `<option value="${pos.value}" ${b.position === pos.value ? 'selected' : ''}>${pos.label}</option>`
  ).join('');

  const startDate = b.start_date ? new Date(b.start_date).toISOString().slice(0, 16) : '';
  const endDate = b.end_date ? new Date(b.end_date).toISOString().slice(0, 16) : '';

  return `
    <form class="banner-form" id="bannerForm">
      <div class="form-section">
        <h4>Banner Media</h4>
        <div class="media-upload-area" id="mediaUploadArea">
          ${b.image ? `
            <div class="media-preview">
              ${b.media_type === 'video'
        ? `<video src="${b.image}" controls></video>`
        : `<img src="${b.image}" alt="Preview"/>`
      }
              <button type="button" class="remove-media" onclick="removeBannerMedia()">×</button>
            </div>
          ` : `
            <div class="upload-placeholder">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
              <p>Drag & drop image or video here</p>
              <span>or</span>
              <label class="btn btn-secondary">
                Browse Files
                <input type="file" id="bannerMediaInput" accept="image/*,video/*" hidden/>
              </label>
            </div>
          `}
          <input type="hidden" id="b_image" value="${b.image || ''}"/>
          <input type="hidden" id="b_media_type" value="${b.media_type || 'image'}"/>
        </div>
        <div class="media-type-toggle">
          <label class="toggle-label">
            <input type="radio" name="mediaType" value="image" ${b.media_type !== 'video' ? 'checked' : ''}/>
            <span>Image</span>
          </label>
          <label class="toggle-label">
            <input type="radio" name="mediaType" value="video" ${b.media_type === 'video' ? 'checked' : ''}/>
            <span>Video</span>
          </label>
        </div>
      </div>

      <div class="form-section">
        <h4>Banner Content</h4>
        <div class="form-grid">
          <label class="required">Banner Title<input type="text" id="b_title" value="${b.title || ''}" required/></label>
          <label>Banner Subtitle<input type="text" id="b_subtitle" value="${b.subtitle || ''}"/></label>
          <label>Eyebrow Text<input type="text" id="b_eyebrow" value="${b.eyebrow || ''}" placeholder="e.g., New Collection 2026"/></label>
          <label>Description<textarea id="b_description" rows="3">${b.description || ''}</textarea></label>
        </div>
      </div>

      <div class="form-section">
        <h4>Button Settings</h4>
        <div class="form-grid">
          <label>Button Text<input type="text" id="b_btn_text" value="${b.button_text || ''}" placeholder="e.g., Shop Now"/></label>
          <label>Button Link<input type="text" id="b_btn_link" value="${b.button_link || ''}" placeholder="https://... or /shop.html"/></label>
          <label>Secondary Button Text<input type="text" id="b_btn_text_2" value="${b.secondary_button_text || ''}"/></label>
          <label>Secondary Button Link<input type="text" id="b_btn_link_2" value="${b.secondary_button_link || ''}"/></label>
        </div>
      </div>

      <div class="form-section">
        <h4>Display Settings</h4>
        <div class="form-grid">
          <label class="required">Banner Position<select id="b_position">${positionOptions}</select></label>
          <label>Display Order<input type="number" id="b_order" value="${b.order || 1}" min="1"/></label>
          <label>Status<select id="b_active"><option value="true" ${b.is_active ? 'selected' : ''}>Active</option><option value="false" ${!b.is_active ? 'selected' : ''}>Inactive</option></select></label>
        </div>
      </div>

      <div class="form-section">
        <h4>Schedule (Optional)</h4>
        <p class="section-hint">Leave dates empty for always-on banners</p>
        <div class="form-grid">
          <label>Start Date<input type="datetime-local" id="b_start_date" value="${startDate}"/></label>
          <label>End Date<input type="datetime-local" id="b_end_date" value="${endDate}"/></label>
        </div>
      </div>

      <div class="form-actions">
        <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary" id="saveBannerBtn">
          ${isEdit ? 'Update Banner' : 'Create Banner'}
        </button>
      </div>
    </form>
  `;
}

// Handle media upload
async function handleBannerMediaUpload(file) {
  const bucketName = 'banner-media';
  const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;

  const { data, error } = await supa.storage
    .from(bucketName)
    .upload(fileName, file);

  if (error) {
    showToast('Failed to upload media: ' + error.message, 'error');
    return null;
  }

  const { data: urlData } = supa.storage
    .from(bucketName)
    .getPublicUrl(fileName);

  return urlData.publicUrl;
}

// Initialize banner form handlers
function initBannerForm(bannerId = null) {
  const form = document.getElementById('bannerForm');
  const mediaInput = document.getElementById('bannerMediaInput');

  if (mediaInput) {
    mediaInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const isVideo = file.type.startsWith('video/');
      const mediaType = isVideo ? 'video' : 'image';

      // Show loading state
      const uploadArea = document.getElementById('mediaUploadArea');
      uploadArea.innerHTML = '<div class="upload-loading">Uploading...</div>';

      const url = await handleBannerMediaUpload(file);

      if (url) {
        document.getElementById('b_image').value = url;
        document.getElementById('b_media_type').value = mediaType;

        const preview = isVideo
          ? `<video src="${url}" controls></video>`
          : `<img src="${url}" alt="Preview"/>`;

        uploadArea.innerHTML = `
          <div class="media-preview">
            ${preview}
            <button type="button" class="remove-media" onclick="removeBannerMedia()">×</button>
          </div>
        `;
      } else {
        uploadArea.innerHTML = `
          <div class="upload-placeholder error">
            <p>Upload failed. Please try again.</p>
            <label class="btn btn-secondary">Browse Files<input type="file" id="bannerMediaInput" accept="image/*,video/*" hidden/></label>
          </div>
        `;
      }
    });
  }

  // Handle media type toggle
  document.querySelectorAll('input[name="mediaType"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      document.getElementById('b_media_type').value = e.target.value;
    });
  });

  // Form submission
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const payload = {
        title: document.getElementById('b_title').value.trim(),
        subtitle: document.getElementById('b_subtitle').value.trim() || null,
        eyebrow: document.getElementById('b_eyebrow').value.trim() || null,
        description: document.getElementById('b_description').value.trim() || null,
        button_text: document.getElementById('b_btn_text').value.trim() || null,
        button_link: document.getElementById('b_btn_link').value.trim() || null,
        secondary_button_text: document.getElementById('b_btn_text_2').value.trim() || null,
        secondary_button_link: document.getElementById('b_btn_link_2').value.trim() || null,
        image: document.getElementById('b_image').value.trim() || null,
        media_type: document.getElementById('b_media_type').value || 'image',
        position: document.getElementById('b_position').value,
        order: parseInt(document.getElementById('b_order').value) || 1,
        is_active: document.getElementById('b_active').value === 'true',
        start_date: document.getElementById('b_start_date').value ? new Date(document.getElementById('b_start_date').value).toISOString() : null,
        end_date: document.getElementById('b_end_date').value ? new Date(document.getElementById('b_end_date').value).toISOString() : null
      };

      const saveBtn = document.getElementById('saveBannerBtn');
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving...';

      try {
        if (bannerId) {
          await supa.from('hero_slides').update(payload).eq('id', bannerId);
          showToast('Banner updated successfully');
        } else {
          await supa.from('hero_slides').insert(payload);
          showToast('Banner created successfully');
        }

        closeModal();
        loadBanners();
      } catch (err) {
        showToast('Error saving banner: ' + err.message, 'error');
      } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = bannerId ? 'Update Banner' : 'Create Banner';
      }
    });
  }
}

// Remove banner media
window.removeBannerMedia = function () {
  const uploadArea = document.getElementById('mediaUploadArea');
  document.getElementById('b_image').value = '';
  document.getElementById('b_media_type').value = 'image';

  uploadArea.innerHTML = `
    <div class="upload-placeholder">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <polyline points="21 15 16 10 5 21"/>
      </svg>
      <p>Drag & drop image or video here</p>
      <span>or</span>
      <label class="btn btn-secondary">
        Browse Files
        <input type="file" id="bannerMediaInput" accept="image/*,video/*" hidden/>
      </label>
    </div>
  `;

  initBannerForm();
};

// Close modal
window.closeModal = function () {
  const overlay = document.getElementById('modalOverlay');
  if (overlay) overlay.classList.remove('open');
};

// Open add banner modal
window.openAddBanner = function () {
  openModal('Add New Banner', bannerFormHtml(null), () => {
    initBannerForm();
  });
};

// Open edit banner modal
window.openEditBanner = async function (bannerId) {
  const { data, error } = await supa
    .from('hero_slides')
    .select('*')
    .eq('id', bannerId)
    .single();

  if (error || !data) {
    showToast('Banner not found', 'error');
    return;
  }

  openModal('Edit Banner', bannerFormHtml(data), () => {
    initBannerForm(bannerId);
  });
};

// Delete banner with confirmation
window.deleteBanner = async function (bannerId) {
  const confirmed = confirm('Are you sure you want to delete this banner? This action cannot be undone.');

  if (!confirmed) return;

  try {
    await supa.from('hero_slides').delete().eq('id', bannerId);
    showToast('Banner deleted successfully');
    loadBanners();
  } catch (err) {
    showToast('Error deleting banner: ' + err.message, 'error');
  }
};

// Toggle banner status
window.toggleBannerStatus = async function (bannerId, currentStatus) {
  try {
    await supa
      .from('hero_slides')
      .update({ is_active: !currentStatus })
      .eq('id', bannerId);

    showToast(`Banner ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
    loadBanners();
  } catch (err) {
    showToast('Error updating banner status: ' + err.message, 'error');
  }
};

// Load and render banners
window.BannerManager = {
  loadBanners: async function () {
    const grid = document.getElementById('bannersGrid');
    if (!grid) return;

    grid.innerHTML = '<div class="loading-state">Loading banners...</div>';

    try {
      const { data, error } = await supa
        .from('hero_slides')
        .select('*')
        .order('position', { ascending: true })
        .order('order', { ascending: true });

      if (error) throw error;

      if (!data || data.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
              <h3>No Banners Yet</h3>
              <p>Create your first banner to get started</p>
              <button class="btn btn-primary" onclick="openAddBanner()">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Add Banner
              </button>
            </div>
          `;
        return;
      }

      // Group banners by position
      const grouped = {};
      data.forEach(banner => {
        if (!grouped[banner.position]) {
          grouped[banner.position] = [];
        }
        grouped[banner.position].push(banner);
      });

      grid.innerHTML = '';

      // Render each position group
      Object.entries(grouped).forEach(([position, banners]) => {
        const section = document.createElement('div');
        section.className = 'banner-section';
        section.innerHTML = `
            <div class="section-header">
              <h3>${getPositionLabel(position)}</h3>
              <span class="banner-count">${banners.length} banner${banners.length !== 1 ? 's' : ''}</span>
            </div>
            <div class="banner-grid" id="banners-${position.replace('_', '-')}">
              ${banners.map(banner => renderBannerCard(banner)).join('')}
            </div>
          `;
        grid.appendChild(section);
      });

      // Add event listeners
      document.querySelectorAll('.banner-card').forEach(card => {
        card.addEventListener('click', handleBannerAction);
      });

    } catch (err) {
      console.error('Error loading banners:', err);
      grid.innerHTML = `
          <div class="error-state">
            <p>Error loading banners: ${err.message}</p>
            <button class="btn btn-secondary" onclick="BannerManager.loadBanners()">Retry</button>
          </div>
        `;
    }
  }
};

// Alias for backward compatibility
async function loadBanners() {
  window.BannerManager.loadBanners();
}

// Render a single banner card
function renderBannerCard(banner) {
  const isActive = isBannerActive(banner);
  const statusClass = isActive ? 'active' : 'inactive';
  const statusText = isActive ? 'Active' : 'Inactive';

  const startDate = banner.start_date ? formatDate(banner.start_date) : null;
  const endDate = banner.end_date ? formatDate(banner.end_date) : null;
  const hasSchedule = startDate || endDate;

  return `
    <div class="banner-card" data-id="${banner.id}">
      <div class="banner-preview">
        ${banner.media_type === 'video'
      ? `<video src="${banner.image}" muted loop onmouseover="this.play()" onmouseout="this.pause()"></video>`
      : `<img src="${banner.image}" alt="${banner.title}"/>`
    }
        <span class="status-badge status-${statusClass}">${statusText}</span>
      </div>
      <div class="banner-details">
        <h4>${banner.title}</h4>
        ${banner.subtitle ? `<p class="subtitle">${banner.subtitle}</p>` : ''}
        <div class="banner-meta">
          <span class="meta-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="4" y1="9" x2="20" y2="9"/>
              <line x1="4" y1="15" x2="20" y2="15"/>
              <line x1="10" y1="3" x2="8" y2="21"/>
              <line x1="16" y1="3" x2="14" y2="21"/>
            </svg>
            Order: ${banner.order}
          </span>
          ${hasSchedule ? `
            <span class="meta-item schedule">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              ${startDate ? `From ${startDate}` : ''}${startDate && endDate ? '<br>' : ''}${endDate ? `Until ${endDate}` : ''}
            </span>
          ` : ''}
        </div>
      </div>
      <div class="banner-actions">
        <button class="btn btn-icon toggle-status" data-action="toggle" data-id="${banner.id}" title="${isActive ? 'Deactivate' : 'Activate'}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            ${isActive
      ? '<rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="9" x2="15" y2="15"/><line x1="15" y1="9" x2="9" y2="15"/>'
      : '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>'
    }
          </svg>
        </button>
        <button class="btn btn-icon edit" data-action="edit" data-id="${banner.id}" title="Edit">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <button class="btn btn-icon delete" data-action="delete" data-id="${banner.id}" title="Delete">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
        </button>
      </div>
    </div>
  `;
}

// Handle banner card actions
function handleBannerAction(e) {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;

  const action = btn.dataset.action;
  const id = parseInt(btn.dataset.id);

  switch (action) {
    case 'toggle':
      const card = btn.closest('.banner-card');
      const isActive = card.querySelector('.status-badge').textContent === 'Active';
      toggleBannerStatus(id, isActive);
      break;
    case 'edit':
      openEditBanner(id);
      break;
    case 'delete':
      deleteBanner(id);
      break;
  }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  // Set up add banner button
  const addBtn = document.getElementById('addBannerBtn');
  if (addBtn) {
    addBtn.addEventListener('click', openAddBanner);
  }

  // Load banners
  loadBanners();
});

// Export for use in other scripts
window.BannerManager = {
  loadBanners,
  openAddBanner,
  openEditBanner,
  deleteBanner,
  toggleBannerStatus
};
