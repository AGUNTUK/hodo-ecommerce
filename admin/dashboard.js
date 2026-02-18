// ============================================
// HODO Admin Dashboard - Main JavaScript
// ============================================

// Initialize Charts
document.addEventListener('DOMContentLoaded', function() {
    initSalesChart();
    initCategoryChart();
    initSidebar();
    initNotifications();
    initSearch();
});

// Sales Overview Chart
function initSalesChart() {
    const ctx = document.getElementById('salesChart');
    if (!ctx) return;

    const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(231, 76, 60, 0.3)');
    gradient.addColorStop(1, 'rgba(231, 76, 60, 0)');

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Sales',
                data: [12500, 19200, 15300, 22100, 18400, 24600, 21300],
                borderColor: '#e74c3c',
                backgroundColor: gradient,
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#e74c3c',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7
            }, {
                label: 'Last Week',
                data: [10200, 15400, 12800, 18600, 14200, 20100, 17500],
                borderColor: '#a0aec0',
                backgroundColor: 'transparent',
                borderWidth: 2,
                borderDash: [5, 5],
                fill: false,
                tension: 0.4,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    align: 'end',
                    labels: {
                        usePointStyle: true,
                        padding: 20,
                        font: {
                            family: 'Inter',
                            size: 12
                        }
                    }
                },
                tooltip: {
                    backgroundColor: '#2d3748',
                    titleFont: {
                        family: 'Inter',
                        size: 14
                    },
                    bodyFont: {
                        family: 'Inter',
                        size: 13
                    },
                    padding: 12,
                    cornerRadius: 8,
                    displayColors: true,
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': $' + context.parsed.y.toLocaleString();
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: {
                            family: 'Inter',
                            size: 12
                        },
                        color: '#718096'
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(163, 177, 198, 0.2)',
                        drawBorder: false
                    },
                    ticks: {
                        font: {
                            family: 'Inter',
                            size: 12
                        },
                        color: '#718096',
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
}

// Category Revenue Chart
function initCategoryChart() {
    const ctx = document.getElementById('categoryChart');
    if (!ctx) return;

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ["Men's Clothing", "Women's Clothing", 'Accessories', 'Footwear', 'Sports'],
            datasets: [{
                data: [35, 28, 15, 12, 10],
                backgroundColor: [
                    '#e74c3c',
                    '#3498db',
                    '#27ae60',
                    '#f39c12',
                    '#9b59b6'
                ],
                borderWidth: 0,
                hoverOffset: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        padding: 15,
                        font: {
                            family: 'Inter',
                            size: 12
                        }
                    }
                },
                tooltip: {
                    backgroundColor: '#2d3748',
                    titleFont: {
                        family: 'Inter',
                        size: 14
                    },
                    bodyFont: {
                        family: 'Inter',
                        size: 13
                    },
                    padding: 12,
                    cornerRadius: 8,
                    callbacks: {
                        label: function(context) {
                            return context.label + ': ' + context.parsed + '%';
                        }
                    }
                }
            }
        }
    });
}

// Sidebar Navigation
function initSidebar() {
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            // Remove active class from all items
            navItems.forEach(nav => nav.classList.remove('active'));
            // Add active class to clicked item
            this.classList.add('active');
        });
    });

    // Mobile sidebar toggle
    const menuToggle = document.querySelector('.menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', function() {
            sidebar.classList.toggle('open');
        });
    }
}

// Notifications
function initNotifications() {
    const notificationBtn = document.querySelector('.notification-btn');
    
    if (notificationBtn) {
        notificationBtn.addEventListener('click', function() {
            // Show notification dropdown
            showNotificationDropdown();
        });
    }
}

function showNotificationDropdown() {
    // Create notification dropdown if it doesn't exist
    let dropdown = document.querySelector('.notification-dropdown');
    
    if (!dropdown) {
        dropdown = document.createElement('div');
        dropdown.className = 'notification-dropdown';
        dropdown.innerHTML = `
            <div class="dropdown-header">
                <h4>Notifications</h4>
                <button class="mark-read">Mark all as read</button>
            </div>
            <div class="dropdown-body">
                <div class="notification-item unread">
                    <div class="notification-icon order">
                        <i class="fas fa-shopping-bag"></i>
                    </div>
                    <div class="notification-content">
                        <p>New order received #ORD-2847</p>
                        <span class="notification-time">2 minutes ago</span>
                    </div>
                </div>
                <div class="notification-item unread">
                    <div class="notification-icon stock">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <div class="notification-content">
                        <p>Low stock alert: Classic White T-Shirt</p>
                        <span class="notification-time">15 minutes ago</span>
                    </div>
                </div>
                <div class="notification-item">
                    <div class="notification-icon review">
                        <i class="fas fa-star"></i>
                    </div>
                    <div class="notification-content">
                        <p>New review on Casual Blue Jeans</p>
                        <span class="notification-time">1 hour ago</span>
                    </div>
                </div>
                <div class="notification-item">
                    <div class="notification-icon payment">
                        <i class="fas fa-credit-card"></i>
                    </div>
                    <div class="notification-content">
                        <p>Payment received $567.80</p>
                        <span class="notification-time">3 hours ago</span>
                    </div>
                </div>
            </div>
            <div class="dropdown-footer">
                <a href="#">View all notifications</a>
            </div>
        `;
        
        // Add styles for dropdown
        dropdown.style.cssText = `
            position: fixed;
            top: 90px;
            right: 100px;
            width: 360px;
            background: #f0f4f8;
            border-radius: 16px;
            box-shadow: 12px 12px 24px rgba(163, 177, 198, 0.5), -12px -12px 24px rgba(255, 255, 255, 0.8);
            z-index: 1000;
            overflow: hidden;
            animation: fadeIn 0.3s ease;
        `;
        
        document.body.appendChild(dropdown);
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function closeDropdown(e) {
            if (!dropdown.contains(e.target) && !notificationBtn.contains(e.target)) {
                dropdown.remove();
                document.removeEventListener('click', closeDropdown);
            }
        });
    }
}

// Search Functionality
function initSearch() {
    const searchInput = document.querySelector('.search-bar input');
    
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            const query = e.target.value.toLowerCase();
            // Implement search logic here
            console.log('Searching for:', query);
        });

        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch(this.value);
            }
        });
    }
}

function performSearch(query) {
    // Implement actual search functionality
    console.log('Performing search:', query);
}

// Filter Buttons
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        this.parentElement.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        // Update chart data based on filter
        updateChartData(this.textContent.toLowerCase());
    });
});

function updateChartData(period) {
    // Update chart based on selected period
    console.log('Updating chart for period:', period);
}

// Tab Navigation
document.querySelectorAll('.tab-btn').forEach(tab => {
    tab.addEventListener('click', function() {
        this.parentElement.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        
        // Show corresponding tab content
        const tabId = this.dataset.tab;
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
            if (content.id === tabId) {
                content.classList.add('active');
            }
        });
    });
});

// Modal Functions
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Close modal on overlay click
document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', function(e) {
        if (e.target === this) {
            this.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
});

// Close modal on escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.active').forEach(modal => {
            modal.classList.remove('active');
        });
        document.body.style.overflow = '';
    }
});

// Toggle Switches
document.querySelectorAll('.toggle-switch input').forEach(toggle => {
    toggle.addEventListener('change', function() {
        const setting = this.dataset.setting;
        const value = this.checked;
        console.log(`Setting ${setting} changed to ${value}`);
        // Save setting to backend
    });
});

// Variant Selection
document.querySelectorAll('.variant-option').forEach(option => {
    option.addEventListener('click', function() {
        this.classList.toggle('selected');
        updateVariantTable();
    });
});

function updateVariantTable() {
    const selectedSizes = document.querySelectorAll('.size-option.selected');
    const selectedColors = document.querySelectorAll('.color-option.selected');
    
    console.log('Selected sizes:', Array.from(selectedSizes).map(s => s.textContent));
    console.log('Selected colors:', Array.from(selectedColors).map(c => c.dataset.color));
}

// Image Upload Preview
function previewImages(input) {
    const preview = document.querySelector('.image-preview-grid');
    if (!preview) return;
    
    preview.innerHTML = '';
    
    if (input.files) {
        Array.from(input.files).forEach(file => {
            const reader = new FileReader();
            reader.onload = function(e) {
                const div = document.createElement('div');
                div.className = 'image-preview';
                div.innerHTML = `
                    <img src="${e.target.result}" alt="Preview">
                    <button type="button" class="remove-image" onclick="removeImage(this)">
                        <i class="fas fa-times"></i>
                    </button>
                `;
                preview.appendChild(div);
            };
            reader.readAsDataURL(file);
        });
    }
}

function removeImage(btn) {
    btn.parentElement.remove();
}

// Status Update
function updateOrderStatus(orderId, newStatus) {
    console.log(`Updating order ${orderId} to status ${newStatus}`);
    // Show success notification
    showNotification('Order status updated successfully', 'success');
}

// Notification Toast
function showNotification(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    toast.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 24px;
        padding: 16px 24px;
        background: #f0f4f8;
        border-radius: 12px;
        box-shadow: 8px 8px 16px rgba(163, 177, 198, 0.5), -8px -8px 16px rgba(255, 255, 255, 0.8);
        display: flex;
        align-items: center;
        gap: 12px;
        z-index: 9999;
        animation: slideIn 0.3s ease;
    `;
    
    if (type === 'success') {
        toast.style.borderLeft = '4px solid #27ae60';
        toast.querySelector('i').style.color = '#27ae60';
    } else if (type === 'error') {
        toast.style.borderLeft = '4px solid #e74c3c';
        toast.querySelector('i').style.color = '#e74c3c';
    }
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Confirm Delete
function confirmDelete(itemType, itemId) {
    if (confirm(`Are you sure you want to delete this ${itemType}?`)) {
        console.log(`Deleting ${itemType} with ID ${itemId}`);
        showNotification(`${itemType} deleted successfully`, 'success');
    }
}

// Export Functions for Global Use
window.openModal = openModal;
window.closeModal = closeModal;
window.previewImages = previewImages;
window.removeImage = removeImage;
window.updateOrderStatus = updateOrderStatus;
window.confirmDelete = confirmDelete;
window.showNotification = showNotification;

// Add CSS animations dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
    }
    @keyframes fadeOut {
        from { opacity: 1; transform: translateY(0); }
        to { opacity: 0; transform: translateY(10px); }
    }
    @keyframes slideIn {
        from { opacity: 0; transform: translateX(20px); }
        to { opacity: 1; transform: translateX(0); }
    }
    .notification-dropdown .dropdown-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 20px;
        border-bottom: 1px solid #e4e9f0;
    }
    .notification-dropdown .dropdown-header h4 {
        font-size: 1rem;
        font-weight: 600;
        color: #2d3748;
    }
    .notification-dropdown .mark-read {
        background: none;
        border: none;
        color: #e74c3c;
        font-size: 0.85rem;
        cursor: pointer;
    }
    .notification-dropdown .dropdown-body {
        max-height: 320px;
        overflow-y: auto;
    }
    .notification-item {
        display: flex;
        gap: 12px;
        padding: 14px 20px;
        border-bottom: 1px solid #e4e9f0;
        transition: background 0.2s;
    }
    .notification-item:hover {
        background: #e4e9f0;
    }
    .notification-item.unread {
        background: rgba(231, 76, 60, 0.05);
    }
    .notification-icon {
        width: 40px;
        height: 40px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }
    .notification-icon.order { background: rgba(52, 152, 219, 0.15); color: #3498db; }
    .notification-icon.stock { background: rgba(243, 156, 18, 0.15); color: #f39c12; }
    .notification-icon.review { background: rgba(155, 89, 182, 0.15); color: #9b59b6; }
    .notification-icon.payment { background: rgba(39, 174, 96, 0.15); color: #27ae60; }
    .notification-content p {
        font-size: 0.9rem;
        color: #2d3748;
        margin-bottom: 2px;
    }
    .notification-time {
        font-size: 0.8rem;
        color: #a0aec0;
    }
    .dropdown-footer {
        padding: 14px 20px;
        text-align: center;
        border-top: 1px solid #e4e9f0;
    }
    .dropdown-footer a {
        color: #e74c3c;
        text-decoration: none;
        font-weight: 500;
        font-size: 0.9rem;
    }
`;
document.head.appendChild(style);
