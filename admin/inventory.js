/**
 * Hodo Admin — Inventory Management System
 * =========================================
 * • Reads product stock from Supabase `products.stock`
 * • Rich adjustment modal: type (increase/decrease/set), quantity, reason
 * • Saves to Supabase with instant optimistic UI update
 * • Logs every adjustment to `inventory_adjustments` table
 * • Shows adjustment history panel per product
 * • Success / error toast notifications
 * • Zero full-page reloads
 */

(function () {
    "use strict";

    // ─── Supabase & helpers ────────────────────────────────────────────────────
    const supa = window.supabaseClient;
    const PRODUCTS_TABLE = (window.TABLES && window.TABLES.products) || "products";
    const LOG_TABLE = "inventory_adjustments";

    function qs(sel, root) { return (root || document).querySelector(sel); }
    function qsa(sel, root) { return Array.from((root || document).querySelectorAll(sel)); }

    // ─── Stock status helper ───────────────────────────────────────────────────
    function stockStatus(n) {
        const v = Number(n || 0);
        if (v <= 0) return { text: "Out of Stock", cls: "status-out", short: "Out" };
        if (v < 5) return { text: "Low Stock", cls: "status-low", short: "Low" };
        return { text: "In Stock", cls: "status-active", short: "In Stock" };
    }

    // ─── Toast ─────────────────────────────────────────────────────────────────
    let _toastTimer = null;
    function showToast(msg, isError = false) {
        let toast = qs("#invToast");
        if (!toast) {
            toast = document.createElement("div");
            toast.id = "invToast";
            toast.className = "inv-toast";
            document.body.appendChild(toast);
        }
        toast.className = "inv-toast" + (isError ? " inv-toast-error" : "");
        toast.innerHTML = isError
            ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg><span>${msg}</span>`
            : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg><span>${msg}</span>`;
        toast.classList.add("show");
        if (_toastTimer) clearTimeout(_toastTimer);
        _toastTimer = setTimeout(() => toast.classList.remove("show"), 3500);
    }

    // ─── Rich adjustment modal ─────────────────────────────────────────────────
    function openAdjustModal(product) {
        // Remove any existing overlay
        let overlay = qs("#invModalOverlay");
        if (overlay) overlay.remove();

        const currentStock = Number(product.stock || 0);
        const st = stockStatus(currentStock);

        overlay = document.createElement("div");
        overlay.id = "invModalOverlay";
        overlay.className = "inv-modal-overlay";

        overlay.innerHTML = `
      <div class="inv-modal" id="invModal" role="dialog" aria-modal="true" aria-labelledby="invModalTitle">
        <div class="inv-modal-header">
          <div class="inv-modal-title-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27,6.96 12,12.01 20.73,6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
            <h3 id="invModalTitle">Adjust Stock</h3>
          </div>
          <button class="inv-modal-close" id="invModalClose" aria-label="Close">&times;</button>
        </div>

        <div class="inv-modal-body">

          <!-- Product Info row -->
          <div class="inv-product-info">
            <div class="inv-info-block">
              <span class="inv-info-label">Product</span>
              <span class="inv-info-value" id="invProductName">${escHtml(product.name)}</span>
            </div>
            <div class="inv-info-block">
              <span class="inv-info-label">Current Stock</span>
              <span class="inv-info-value inv-stock-value" id="invCurrentStock">
                ${currentStock}
                <span class="inv-stock-badge ${st.cls}">${st.short}</span>
              </span>
            </div>
          </div>

          <!-- Adjustment controls -->
          <div class="inv-form">
            <div class="inv-field">
              <label for="invAdjType" class="inv-label">Adjustment Type <span class="inv-req">*</span></label>
              <select id="invAdjType" class="inv-select">
                <option value="increase">⬆ Increase Stock</option>
                <option value="decrease">⬇ Decrease Stock</option>
                <option value="set">✎ Set Exact Stock</option>
              </select>
            </div>

            <div class="inv-field">
              <label for="invAdjQty" class="inv-label" id="invQtyLabel">Quantity to Add <span class="inv-req">*</span></label>
              <input type="number" id="invAdjQty" class="inv-input" min="0" step="1" placeholder="Enter quantity…" autocomplete="off" />
              <div class="inv-field-preview" id="invFieldPreview"></div>
              <div class="inv-field-error" id="invQtyError"></div>
            </div>

            <div class="inv-field">
              <label for="invReason" class="inv-label">Reason <span class="inv-optional">Optional</span></label>
              <select id="invReason" class="inv-select">
                <option value="">— Select a reason —</option>
                <option value="New stock arrived">New stock arrived</option>
                <option value="Damaged items">Damaged items</option>
                <option value="Manual correction">Manual correction</option>
                <option value="Returned items">Returned items</option>
                <option value="Theft / Loss">Theft / Loss</option>
                <option value="Other">Other…</option>
              </select>
            </div>

            <div class="inv-field" id="invCustomReasonWrap" style="display:none">
              <label for="invCustomReason" class="inv-label">Specify Reason</label>
              <input type="text" id="invCustomReason" class="inv-input" placeholder="Describe the reason…" maxlength="255" />
            </div>
          </div>

          <!-- History section -->
          <div class="inv-history-wrap" id="invHistoryWrap">
            <div class="inv-history-header" id="invHistoryToggle">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>
              Adjustment History
              <svg class="inv-chevron" id="invChevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6,9 12,15 18,9"/></svg>
            </div>
            <div class="inv-history-body" id="invHistoryBody" style="display:none">
              <div class="inv-history-loading" id="invHistoryContent">
                <span class="inv-spinner"></span> Loading history…
              </div>
            </div>
          </div>

        </div><!-- /inv-modal-body -->

        <div class="inv-modal-footer">
          <button class="inv-btn inv-btn-cancel" id="invCancelBtn">Cancel</button>
          <button class="inv-btn inv-btn-confirm" id="invConfirmBtn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>
            Confirm Adjustment
          </button>
        </div>
      </div>
    `;

        document.body.appendChild(overlay);

        // Animate in
        requestAnimationFrame(() => overlay.classList.add("open"));

        // ─── History toggle ──────────────────────────────────────────────────────
        const historyToggle = qs("#invHistoryToggle");
        const historyBody = qs("#invHistoryBody");
        const historyContent = qs("#invHistoryContent");
        const chevron = qs("#invChevron");
        let historyLoaded = false;

        historyToggle.addEventListener("click", async () => {
            const isOpen = historyBody.style.display !== "none";
            historyBody.style.display = isOpen ? "none" : "block";
            chevron.style.transform = isOpen ? "" : "rotate(180deg)";
            if (!isOpen && !historyLoaded) {
                historyLoaded = true;
                await loadHistory(product.id, historyContent);
            }
        });

        // ─── Adjustment type change ──────────────────────────────────────────────
        const adjType = qs("#invAdjType");
        const adjQty = qs("#invAdjQty");
        const qtyLabel = qs("#invQtyLabel");
        const preview = qs("#invFieldPreview");
        const qtyError = qs("#invQtyError");
        const reasonSel = qs("#invReason");
        const customReasonWrap = qs("#invCustomReasonWrap");
        const customReason = qs("#invCustomReason");

        function updatePreview() {
            const type = adjType.value;
            const qty = parseInt(adjQty.value, 10);
            qtyError.textContent = "";

            if (type === "increase") {
                qtyLabel.innerHTML = `Quantity to Add <span class="inv-req">*</span>`;
                adjQty.min = "1";
            } else if (type === "decrease") {
                qtyLabel.innerHTML = `Quantity to Remove <span class="inv-req">*</span>`;
                adjQty.min = "1";
            } else {
                qtyLabel.innerHTML = `New Exact Stock <span class="inv-req">*</span>`;
                adjQty.min = "0";
            }

            if (isNaN(qty) || adjQty.value === "") {
                preview.textContent = "";
                return;
            }

            let newStock;
            if (type === "increase") newStock = currentStock + qty;
            else if (type === "decrease") newStock = currentStock - qty;
            else newStock = qty;

            const newSt = stockStatus(newStock);
            preview.innerHTML = `
        <span class="inv-preview-arrow">→</span>
        New stock: <strong>${Math.max(0, newStock)}</strong>
        <span class="inv-stock-badge ${newSt.cls}">${newSt.short}</span>
      `;
        }

        adjType.addEventListener("change", updatePreview);
        adjQty.addEventListener("input", updatePreview);
        updatePreview();

        // Custom reason
        reasonSel.addEventListener("change", () => {
            if (reasonSel.value === "Other") {
                customReasonWrap.style.display = "block";
                customReason.focus();
            } else {
                customReasonWrap.style.display = "none";
            }
        });

        // ─── Close ───────────────────────────────────────────────────────────────
        function closeModal() {
            overlay.classList.remove("open");
            setTimeout(() => overlay.remove(), 300);
        }
        qs("#invModalClose").addEventListener("click", closeModal);
        qs("#invCancelBtn").addEventListener("click", closeModal);
        overlay.addEventListener("click", (e) => {
            if (e.target === overlay) closeModal();
        });
        document.addEventListener("keydown", function onEsc(e) {
            if (e.key === "Escape") { closeModal(); document.removeEventListener("keydown", onEsc); }
        });

        // ─── Confirm ─────────────────────────────────────────────────────────────
        qs("#invConfirmBtn").addEventListener("click", async () => {
            // Validate
            const type = adjType.value;
            const qtyRaw = adjQty.value.trim();
            const qty = parseInt(qtyRaw, 10);

            qtyError.textContent = "";
            if (qtyRaw === "" || isNaN(qty) || qty < 0) {
                qtyError.textContent = "Please enter a valid quantity (≥ 0).";
                adjQty.focus();
                return;
            }
            if ((type === "increase" || type === "decrease") && qty < 1) {
                qtyError.textContent = "Quantity must be at least 1 for increase/decrease.";
                adjQty.focus();
                return;
            }

            let newStock;
            if (type === "increase") newStock = currentStock + qty;
            else if (type === "decrease") newStock = currentStock - qty;
            else newStock = qty;

            if (newStock < 0) {
                qtyError.textContent = `Cannot decrease by ${qty} — only ${currentStock} in stock. New stock would be negative.`;
                adjQty.focus();
                return;
            }

            // Reason
            const reason = reasonSel.value === "Other"
                ? (customReason.value.trim() || "Other")
                : (reasonSel.value || null);

            // Loading state
            const confirmBtn = qs("#invConfirmBtn");
            confirmBtn.disabled = true;
            confirmBtn.classList.add("inv-btn-loading");

            try {
                // 1. Update Supabase products.stock
                const { error: updateErr } = await supa
                    .from(PRODUCTS_TABLE)
                    .update({ stock: newStock })
                    .eq("id", product.id);

                if (updateErr) throw updateErr;

                // 2. Log the adjustment
                await supa.from(LOG_TABLE).insert({
                    product_id: product.id,
                    product_name: product.name,
                    adjustment_type: type,
                    quantity: qty,
                    previous_stock: currentStock,
                    new_stock: newStock,
                    reason: reason,
                    admin_user: "Admin",
                });

                // 3. Optimistic UI — update the row in the table instantly
                updateRowInTable(product.id, newStock);

                // 4. Success
                showToast("✅ Stock updated successfully");
                closeModal();

            } catch (err) {
                console.error("Inventory adjust error:", err);
                confirmBtn.disabled = false;
                confirmBtn.classList.remove("inv-btn-loading");
                qtyError.textContent = "Update failed: " + (err.message || "Unknown error.");
            }
        });

        // Focus qty input
        setTimeout(() => adjQty.focus(), 200);
    }

    // ─── Load history for a product ──────────────────────────────────────────
    async function loadHistory(productId, container) {
        try {
            const { data, error } = await supa
                .from(LOG_TABLE)
                .select("*")
                .eq("product_id", productId)
                .order("created_at", { ascending: false })
                .limit(20);

            if (error) throw error;

            if (!data || !data.length) {
                container.innerHTML = `<div class="inv-history-empty">No adjustments recorded yet.</div>`;
                return;
            }

            const rows = data.map((row) => {
                const dt = row.created_at ? new Date(row.created_at).toLocaleString("en-BD") : "—";
                const typeLabel = {
                    increase: "⬆ Increased",
                    decrease: "⬇ Decreased",
                    set: "✎ Set to",
                }[row.adjustment_type] || row.adjustment_type;
                const typeClass = {
                    increase: "inv-hist-increase",
                    decrease: "inv-hist-decrease",
                    set: "inv-hist-set",
                }[row.adjustment_type] || "";

                return `
          <div class="inv-hist-row">
            <div class="inv-hist-left">
              <span class="inv-hist-type ${typeClass}">${typeLabel}</span>
              <span class="inv-hist-qty">${row.adjustment_type === "set" ? row.new_stock : row.quantity}</span>
              ${row.reason ? `<span class="inv-hist-reason">${escHtml(row.reason)}</span>` : ""}
            </div>
            <div class="inv-hist-right">
              <span class="inv-hist-change">${row.previous_stock} → ${row.new_stock}</span>
              <span class="inv-hist-time">${dt}</span>
            </div>
          </div>
        `;
            }).join("");

            container.innerHTML = rows;
        } catch (err) {
            container.innerHTML = `<div class="inv-history-empty" style="color:var(--danger)">Could not load history: ${err.message}</div>`;
        }
    }

    // ─── Optimistic UI update ─────────────────────────────────────────────────
    function updateRowInTable(productId, newStock) {
        const rows = qsa("#inventoryTable tr[data-pid]");
        rows.forEach((tr) => {
            if (String(tr.dataset.pid) === String(productId)) {
                const st = stockStatus(newStock);
                const stockCell = tr.querySelector(".inv-stock-cell");
                const statusCell = tr.querySelector(".inv-status-cell");
                if (stockCell) {
                    stockCell.textContent = newStock;
                    stockCell.classList.add("inv-stock-pulse");
                    setTimeout(() => stockCell.classList.remove("inv-stock-pulse"), 600);
                }
                if (statusCell) {
                    statusCell.innerHTML = `<span class="status-badge ${st.cls}">${st.text}</span>`;
                }
            }
        });
    }

    // ─── Escape HTML ──────────────────────────────────────────────────────────
    function escHtml(str) {
        return String(str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }

    // ─── Load Inventory Table ─────────────────────────────────────────────────
    async function loadInventory() {
        const tbody = qs("#inventoryTable");
        if (!tbody) return;

        const filter = qs("#inventoryFilter")?.value || "";
        tbody.innerHTML = `<tr><td colspan="6" class="no-data"><span class="inv-spinner"></span> Loading…</td></tr>`;

        if (!supa) {
            tbody.innerHTML = `<tr><td colspan="6" class="no-data">Supabase not available.</td></tr>`;
            return;
        }

        const { data, error } = await supa
            .from(PRODUCTS_TABLE)
            .select("id, name, category, stock, sku, sizes, colors, created_at")
            .order("name", { ascending: true });

        tbody.innerHTML = "";

        if (error || !data || !data.length) {
            const tr = document.createElement("tr");
            tr.innerHTML = `<td colspan="6" class="no-data">No inventory data found.</td>`;
            tbody.appendChild(tr);
            return;
        }

        // Build one row per product (stock is product-level, not per-variant)
        const rows = data.map((p) => ({
            pid: p.id,
            product: p.name,
            sku: p.sku || `P${p.id}`,
            variant: (p.sizes || []).join("/") || "—",
            stock: Number(p.stock || 0),
            _raw: p,
        }));

        // Filter
        const filtered = filter
            ? rows.filter((r) => {
                const st = stockStatus(r.stock).short.toLowerCase();
                if (filter === "low") return st === "low";
                if (filter === "out") return st === "out";
                if (filter === "normal") return st === "in stock";
                return true;
            })
            : rows;

        if (!filtered.length) {
            tbody.innerHTML = `<tr><td colspan="6" class="no-data">No items match the selected filter.</td></tr>`;
            return;
        }

        filtered.forEach((r) => {
            const st = stockStatus(r.stock);
            const tr = document.createElement("tr");
            tr.dataset.pid = r.pid;
            tr.innerHTML = `
        <td>${escHtml(r.product)}</td>
        <td><code class="inv-sku">${escHtml(r.sku)}</code></td>
        <td>${escHtml(r.variant)}</td>
        <td class="inv-stock-cell">${r.stock}</td>
        <td class="inv-status-cell"><span class="status-badge ${st.cls}">${st.text}</span></td>
        <td>
          <div class="action-btns">
            <button class="btn btn-secondary" data-act="adjust" data-pid="${r.pid}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;margin-right:4px"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Adjust
            </button>
            <button class="btn btn-secondary inv-btn-history" data-act="history" data-pid="${r.pid}" title="View history">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>
            </button>
          </div>
        </td>
      `;
            tbody.appendChild(tr);
        });

        // Store raw data map for modal lookup
        window.__invProductMap = {};
        data.forEach((p) => { window.__invProductMap[p.id] = p; });

        // Bind clicks
        tbody.addEventListener("click", (e) => {
            const btn = e.target.closest("button[data-act]");
            if (!btn) return;
            const act = btn.dataset.act;
            const pid = Number(btn.dataset.pid);
            const product = window.__invProductMap && window.__invProductMap[pid];
            if (!product) return;

            if (act === "adjust") {
                openAdjustModal(product);
            } else if (act === "history") {
                openHistoryModal(product);
            }
        });
    }

    // ─── Standalone history modal (via row button) ────────────────────────────
    function openHistoryModal(product) {
        let overlay = qs("#invHistoryModalOverlay");
        if (overlay) overlay.remove();

        overlay = document.createElement("div");
        overlay.id = "invHistoryModalOverlay";
        overlay.className = "inv-modal-overlay";

        overlay.innerHTML = `
      <div class="inv-modal inv-modal-sm" role="dialog" aria-modal="true">
        <div class="inv-modal-header">
          <div class="inv-modal-title-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>
            <h3>History — ${escHtml(product.name)}</h3>
          </div>
          <button class="inv-modal-close" aria-label="Close">&times;</button>
        </div>
        <div class="inv-modal-body">
          <div class="inv-history-body" style="display:block">
            <div class="inv-history-loading" id="invHistModalContent"><span class="inv-spinner"></span> Loading…</div>
          </div>
        </div>
        <div class="inv-modal-footer">
          <button class="inv-btn inv-btn-cancel inv-hist-close-btn">Close</button>
        </div>
      </div>
    `;

        document.body.appendChild(overlay);
        requestAnimationFrame(() => overlay.classList.add("open"));

        const close = () => {
            overlay.classList.remove("open");
            setTimeout(() => overlay.remove(), 300);
        };
        overlay.querySelector(".inv-modal-close").addEventListener("click", close);
        overlay.querySelector(".inv-hist-close-btn").addEventListener("click", close);
        overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });

        loadHistory(product.id, qs("#invHistModalContent"));
    }

    // ─── Bind inventory filter ─────────────────────────────────────────────────
    function bindFilter() {
        const filterSel = qs("#inventoryFilter");
        if (filterSel) {
            filterSel.addEventListener("change", loadInventory);
        }
    }

    // ─── Sidebar toggle ───────────────────────────────────────────────────────
    function initSidebar() {
        const menuToggle = qs("#menuToggle");
        const sidebar = qs("#sidebar");
        const sidebarClose = qs("#sidebarClose");
        if (menuToggle && sidebar) menuToggle.addEventListener("click", () => sidebar.classList.toggle("open"));
        if (sidebarClose && sidebar) sidebarClose.addEventListener("click", () => sidebar.classList.remove("open"));
    }

    // ─── Boot ─────────────────────────────────────────────────────────────────
    function boot() {
        injectStyles();
        initSidebar();
        bindFilter();
        loadInventory();
    }

    // ─── Inject inventory-specific styles ─────────────────────────────────────
    function injectStyles() {
        if (qs("#invStyles")) return;
        const style = document.createElement("style");
        style.id = "invStyles";
        style.textContent = `
      /* ── TOAST ─────────────────────────────────── */
      .inv-toast {
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        display: flex;
        align-items: center;
        gap: .625rem;
        background: #111318;
        color: #fff;
        padding: .875rem 1.5rem;
        border-radius: 18px;
        font-size: .9rem;
        font-weight: 500;
        box-shadow: 0 8px 32px rgba(0,0,0,.3);
        transform: translateY(120%);
        opacity: 0;
        transition: all .35s cubic-bezier(.2,.8,.2,1);
        z-index: 99999;
        pointer-events: none;
        font-family: "Space Grotesk", sans-serif;
      }
      .inv-toast.show { transform: translateY(0); opacity: 1; }
      .inv-toast svg  { width: 18px; height: 18px; color: #10b981; flex-shrink: 0; }
      .inv-toast-error svg { color: #ef4444; }

      /* ── MODAL OVERLAY ──────────────────────────── */
      .inv-modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,.45);
        backdrop-filter: blur(4px);
        -webkit-backdrop-filter: blur(4px);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity .25s ease;
        padding: 1rem;
      }
      .inv-modal-overlay.open { opacity: 1; }
      .inv-modal-overlay.open .inv-modal { transform: translateY(0) scale(1); }

      /* ── MODAL ──────────────────────────────────── */
      .inv-modal {
        background: #eef1f5;
        border-radius: 24px;
        box-shadow: 11px 11px 22px #d4d9df, -11px -11px 22px #fff;
        width: 100%;
        max-width: 540px;
        max-height: 90vh;
        overflow-y: auto;
        transform: translateY(24px) scale(.97);
        transition: transform .3s cubic-bezier(.2,.8,.2,1);
        font-family: "Space Grotesk", sans-serif;
      }
      .inv-modal-sm { max-width: 440px; }

      /* ── MODAL HEADER ───────────────────────────── */
      .inv-modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1.25rem 1.5rem;
        border-bottom: 1px solid rgba(0,0,0,.08);
        background: rgba(0,0,0,.015);
        border-radius: 24px 24px 0 0;
      }
      .inv-modal-title-wrap {
        display: flex;
        align-items: center;
        gap: .625rem;
      }
      .inv-modal-title-wrap svg {
        width: 20px;
        height: 20px;
        color: #6f7580;
        flex-shrink: 0;
      }
      .inv-modal-title-wrap h3 {
        font-family: "Rajdhani", sans-serif;
        font-size: 1.15rem;
        font-weight: 700;
        color: #111318;
        margin: 0;
      }
      .inv-modal-close {
        background: none;
        border: none;
        font-size: 1.5rem;
        color: #6f7580;
        cursor: pointer;
        padding: .25rem .5rem;
        border-radius: 8px;
        line-height: 1;
        transition: all .2s;
      }
      .inv-modal-close:hover { background: rgba(0,0,0,.06); color: #111318; }

      /* ── MODAL BODY ─────────────────────────────── */
      .inv-modal-body { padding: 1.5rem; }

      /* ── PRODUCT INFO ───────────────────────────── */
      .inv-product-info {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
        background: #fff;
        border: 1px solid rgba(0,0,0,.08);
        border-radius: 18px;
        padding: 1rem 1.25rem;
        margin-bottom: 1.25rem;
        box-shadow: 7px 7px 14px #d1d6dc, -7px -7px 14px #fff;
      }
      .inv-info-label {
        display: block;
        font-size: .72rem;
        text-transform: uppercase;
        letter-spacing: .06em;
        color: #6f7580;
        margin-bottom: .25rem;
        font-weight: 600;
      }
      .inv-info-value {
        font-size: 1rem;
        font-weight: 600;
        color: #111318;
        font-family: "Rajdhani", sans-serif;
      }
      .inv-stock-value {
        display: flex;
        align-items: center;
        gap: .5rem;
        font-size: 1.25rem;
      }
      .inv-stock-badge {
        display: inline-block;
        padding: .15rem .6rem;
        border-radius: 999px;
        font-size: .7rem;
        font-weight: 600;
        font-family: "Space Grotesk", sans-serif;
        text-transform: capitalize;
      }

      /* ── FORM ───────────────────────────────────── */
      .inv-form { display: flex; flex-direction: column; gap: 1rem; }
      .inv-field { display: flex; flex-direction: column; gap: .375rem; }
      .inv-label {
        font-size: .8rem;
        font-weight: 600;
        color: #4f5664;
        letter-spacing: .02em;
      }
      .inv-req { color: #ef4444; font-size: .7rem; }
      .inv-optional { color: #6f7580; font-weight: 400; font-size: .72rem; }
      .inv-select,
      .inv-input {
        background: #fff;
        border: 1px solid rgba(0,0,0,.08);
        border-radius: 18px;
        padding: .75rem 1rem;
        font-size: .875rem;
        color: #111318;
        font-family: "Space Grotesk", sans-serif;
        transition: all .2s cubic-bezier(.2,.8,.2,1);
        box-shadow: inset 6px 6px 12px #d4d9df, inset -6px -6px 12px #fff;
        width: 100%;
        appearance: auto;
      }
      .inv-select:focus,
      .inv-input:focus {
        outline: none;
        border-color: #ff0000;
        box-shadow: inset 6px 6px 12px #d4d9df, inset -6px -6px 12px #fff, 0 0 0 3px rgba(255,0,0,.08);
      }
      .inv-field-preview {
        font-size: .8rem;
        color: #4f5664;
        min-height: 1.2em;
        display: flex;
        align-items: center;
        gap: .375rem;
      }
      .inv-preview-arrow { color: #6f7580; }
      .inv-field-error { font-size: .78rem; color: #ef4444; min-height: 1em; }

      /* ── HISTORY PANEL ──────────────────────────── */
      .inv-history-wrap {
        margin-top: 1.25rem;
        border: 1px solid rgba(0,0,0,.08);
        border-radius: 18px;
        overflow: hidden;
        background: #fff;
        box-shadow: 7px 7px 14px #d1d6dc, -7px -7px 14px #fff;
      }
      .inv-history-header {
        display: flex;
        align-items: center;
        gap: .5rem;
        padding: .875rem 1.25rem;
        font-size: .875rem;
        font-weight: 600;
        color: #4f5664;
        cursor: pointer;
        user-select: none;
        transition: background .15s;
      }
      .inv-history-header:hover { background: rgba(0,0,0,.03); }
      .inv-history-header svg { width: 16px; height: 16px; flex-shrink: 0; }
      .inv-chevron { margin-left: auto; transition: transform .25s; }
      .inv-history-body { border-top: 1px solid rgba(0,0,0,.06); padding: .75rem 1.25rem; max-height: 220px; overflow-y: auto; }
      .inv-history-loading { display: flex; align-items: center; gap: .5rem; color: #6f7580; font-size: .875rem; padding: .5rem 0; }
      .inv-history-empty { color: #6f7580; font-size: .875rem; padding: .5rem 0; font-style: italic; }
      .inv-hist-row {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        padding: .625rem 0;
        border-bottom: 1px solid rgba(0,0,0,.05);
        gap: 1rem;
      }
      .inv-hist-row:last-child { border-bottom: none; }
      .inv-hist-left { display: flex; flex-wrap: wrap; align-items: center; gap: .375rem; }
      .inv-hist-right { text-align: right; flex-shrink: 0; }
      .inv-hist-type { font-size: .78rem; font-weight: 600; }
      .inv-hist-increase { color: #10b981; }
      .inv-hist-decrease { color: #ef4444; }
      .inv-hist-set      { color: #3b82f6; }
      .inv-hist-qty { font-size: .875rem; font-weight: 700; color: #111318; font-family: "Rajdhani", sans-serif; }
      .inv-hist-reason { font-size: .75rem; color: #6f7580; background: rgba(0,0,0,.05); padding:.1rem .5rem; border-radius: 999px; }
      .inv-hist-change { font-size: .82rem; color: #4f5664; display: block; font-family: "Rajdhani", sans-serif; font-weight: 600; }
      .inv-hist-time { font-size: .72rem; color: #9aa0aa; display: block; margin-top: .1rem; }

      /* ── MODAL FOOTER ───────────────────────────── */
      .inv-modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: .75rem;
        padding: 1rem 1.5rem;
        border-top: 1px solid rgba(0,0,0,.08);
        background: rgba(0,0,0,.015);
        border-radius: 0 0 24px 24px;
      }
      .inv-btn {
        display: inline-flex;
        align-items: center;
        gap: .5rem;
        padding: .625rem 1.25rem;
        border-radius: 18px;
        font-size: .875rem;
        font-weight: 600;
        cursor: pointer;
        border: none;
        font-family: "Rajdhani", "Space Grotesk", sans-serif;
        transition: all .22s cubic-bezier(.2,.8,.2,1);
      }
      .inv-btn svg { width: 16px; height: 16px; }
      .inv-btn-cancel {
        background: #eef1f5;
        color: #4f5664;
        border: 1px solid rgba(0,0,0,.08);
        box-shadow: 7px 7px 14px #d1d6dc, -7px -7px 14px #fff;
      }
      .inv-btn-cancel:hover { background: rgba(0,0,0,.05); }
      .inv-btn-confirm {
        background: linear-gradient(135deg, #ff3b3b, #ff0000);
        color: white;
        box-shadow: 7px 7px 14px #d1d6dc, -7px -7px 14px #fff;
      }
      .inv-btn-confirm:hover { background: linear-gradient(135deg, #ff0000, #ff3b3b); transform: translateY(-1px); }
      .inv-btn-confirm:disabled { opacity: .65; transform: none; cursor: default; }
      .inv-btn-loading { position: relative; pointer-events: none; }
      .inv-btn-loading::after {
        content: "";
        display: inline-block;
        width: 13px;
        height: 13px;
        border: 2px solid rgba(255,255,255,.4);
        border-top-color: white;
        border-radius: 50%;
        animation: invSpin .65s linear infinite;
        margin-left: .4rem;
        vertical-align: middle;
      }
      @keyframes invSpin { to { transform: rotate(360deg); } }

      /* ── TABLE EXTRAS ───────────────────────────── */
      .inv-sku {
        font-size: .78rem;
        background: rgba(0,0,0,.05);
        padding: .1rem .45rem;
        border-radius: 6px;
        font-family: monospace;
        color: #4f5664;
      }
      .inv-btn-history {
        padding: .5rem .75rem;
      }
      @keyframes invPulse {
        0%   { background: rgba(16,185,129,.18); }
        100% { background: transparent; }
      }
      .inv-stock-pulse { animation: invPulse .6s ease-out; }

      /* ── SPINNER ────────────────────────────────── */
      .inv-spinner {
        display: inline-block;
        width: 14px;
        height: 14px;
        border: 2px solid rgba(0,0,0,.15);
        border-top-color: #ff0000;
        border-radius: 50%;
        animation: invSpin .65s linear infinite;
        vertical-align: middle;
      }

      @media (max-width: 480px) {
        .inv-product-info { grid-template-columns: 1fr; }
        .inv-modal-footer { flex-direction: column; }
        .inv-btn { width: 100%; justify-content: center; }
        .inv-toast { bottom: 1rem; right: 1rem; left: 1rem; }
      }
    `;
        document.head.appendChild(style);
    }

    // ─── Init ──────────────────────────────────────────────────────────────────
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", boot);
    } else {
        boot();
    }

})();
