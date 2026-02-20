const supa = window.supabaseClient;
const T = window.TABLES || {};
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
function setText(id, v) {
  const el = typeof id === "string" ? qs(id) : id;
  if (el) el.textContent = v;
}
function showSection(name) {
  qsa(".content-section").forEach((el) => el.classList.remove("active"));
  const target = qs(`#section-${name}`);
  if (target) target.classList.add("active");
  setText("#pageTitle", name[0].toUpperCase() + name.slice(1));
  qsa(".nav-item").forEach((el) => {
    if (el.dataset.section === name) el.classList.add("active");
    else el.classList.remove("active");
  });
  try {
    history.replaceState(null, "", `#${name}`);
  } catch { }
}
function onNav() {
  qsa(".nav-item").forEach((el) => {
    el.addEventListener("click", (e) => {
      const href = el.getAttribute("href") || "";
      if (href.startsWith("#")) {
        e.preventDefault();
        const s = el.dataset.section;
        if (s) showSection(s);
      }
    });
  });
}
function onHeader() {
  const menuToggle = qs("#menuToggle");
  const sidebar = qs("#sidebar");
  const sidebarClose = qs("#sidebarClose");
  if (menuToggle && sidebar) {
    menuToggle.addEventListener("click", () => {
      sidebar.classList.toggle("open");
    });
  }
  if (sidebarClose && sidebar) {
    sidebarClose.addEventListener("click", () => sidebar.classList.remove("open"));
  }
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
  if (typeof onMount === "function") onMount(modalBody);
  const close = () => overlay.classList.remove("open");
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });
  if (closeBtn) closeBtn.onclick = close;
}
async function getCount(table) {
  const { count, error } = await supa.from(table).select("*", { count: "exact", head: true });
  if (error) return 0;
  return count || 0;
}
async function getOrders(limit) {
  let q = supa
    .from(T.orders || "orders")
    .select("*")
    .order("created_at", { ascending: false });
  if (limit) q = q.limit(limit);
  const { data, error } = await q;
  if (error) return [];
  return data || [];
}
async function computeDashboard() {
  const [orders, productsCount, customersCount] = await Promise.all([
    getOrders(),
    getCount(T.products || "products"),
    getCount(T.profiles || "profiles"),
  ]);
  const totalSales = orders.reduce((s, o) => s + Number(o.total_amount || 0), 0);
  setText("#totalSales", fmtCurrency(totalSales));
  setText("#totalRevenue", fmtCurrency(totalSales));
  setText("#totalOrders", String(orders.length));
  setText("#totalCustomers", String(customersCount));
  const recent = orders.slice(0, 5);
  const tbody = qs("#recentOrdersTable");
  if (tbody) {
    tbody.innerHTML = "";
    if (!recent.length) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 4;
      td.className = "no-data";
      td.textContent = "No orders yet";
      tr.appendChild(td);
      tbody.appendChild(tr);
    } else {
      recent.forEach((o) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>#${o.id}</td><td>${o.customer_name || "N/A"}</td><td>${fmtCurrency(
          o.total_amount
        )}</td><td>${o.status || ""}</td>`;
        tbody.appendChild(tr);
      });
    }
  }
  await loadBestSelling();
}
async function loadBestSelling() {
  const { data, error } = await supa
    .from(T.order_items || "order_items")
    .select("product_id, quantity")
    .limit(1000);
  if (error || !Array.isArray(data) || !data.length) {
    const grid = qs("#bestSellingProducts");
    if (grid) grid.innerHTML = `<div class="no-data">No products data</div>`;
    return;
  }
  const agg = {};
  data.forEach((row) => {
    const id = row.product_id;
    const q = Number(row.quantity || 0);
    if (!agg[id]) agg[id] = 0;
    agg[id] += q;
  });
  const ids = Object.keys(agg)
    .map((x) => Number(x))
    .filter(Boolean);
  if (!ids.length) {
    const grid = qs("#bestSellingProducts");
    if (grid) grid.innerHTML = `<div class="no-data">No products data</div>`;
    return;
  }
  const { data: products } = await supa
    .from(T.products || "products")
    .select("*")
    .in("id", ids);
  const ranked = ids
    .map((id) => ({ id, qty: agg[id], product: (products || []).find((p) => p.id === id) }))
    .filter((x) => x.product)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 6);
  const grid = qs("#bestSellingProducts");
  if (grid) {
    grid.innerHTML = "";
    ranked.forEach((x) => {
      const card = document.createElement("div");
      card.className = "product-item";
      card.innerHTML = `<img src="${x.product.image}" alt="${x.product.name}"/><div class="product-info"><div class="product-name">${x.product.name}</div><div class="product-metric">${x.qty} sold</div></div>`;
      grid.appendChild(card);
    });
  }
}
async function loadOrders() {
  const status = qs("#orderStatusFilter")?.value || "";
  let q = supa
    .from(T.orders || "orders")
    .select("*")
    .order("created_at", { ascending: false });
  if (status) q = q.eq("status", status);
  const { data, error } = await q;
  const tbody = qs("#ordersTable");
  if (!tbody) return;
  tbody.innerHTML = "";
  if (error || !data || !data.length) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 8;
    td.className = "no-data";
    td.textContent = "No orders found";
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }
  data.forEach((o) => {
    const tr = document.createElement("tr");
    const itemsCell = `<span>${String(o.items_count || "-")}</span>`;
    tr.innerHTML = `<td>#${o.id}</td><td>${o.customer_name || "N/A"}</td><td>${itemsCell}</td><td>${fmtCurrency(
      o.total_amount
    )}</td><td>${o.payment_method || "-"}</td><td>${o.status || ""}</td><td>${o.created_at ? new Date(o.created_at).toLocaleString() : ""
      }</td><td><div class="action-btns"><button class="btn btn-secondary" data-act="status" data-id="${o.id
      }">Update</button><button class="btn btn-danger" data-act="delete" data-id="${o.id}">Delete</button></div></td>`;
    tbody.appendChild(tr);
  });
  tbody.addEventListener("click", async (e) => {
    const t = e.target;
    if (!(t instanceof HTMLElement)) return;
    const act = t.dataset.act;
    const id = Number(t.dataset.id);
    if (!act || !id) return;
    if (act === "status") {
      openModal(
        "Update Order Status",
        `<div class="form-grid">
        <label>Status<select id="orderStatusSelect">
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select></label>
        <button class="btn btn-primary" id="saveOrderStatus">Save</button>
      </div>`,
        (root) => {
          const btn = qs("#saveOrderStatus", root);
          btn?.addEventListener("click", async () => {
            const val = qs("#orderStatusSelect", root)?.value;
            if (!val) return;
            await supa
              .from(T.orders || "orders")
              .update({ status: val })
              .eq("id", id);
            qs("#modalOverlay")?.classList.remove("open");
            loadOrders();
            computeDashboard();
          });
        }
      );
    }
    if (act === "delete") {
      await supa
        .from(T.orders || "orders")
        .delete()
        .eq("id", id);
      loadOrders();
      computeDashboard();
    }
  });
}
function productFormHtml(p) {
  const name = p?.name || "";
  const cat = p?.category || "";
  const price = p?.price || "";
  const rating = p?.rating || "";
  const sizes = Array.isArray(p?.sizes) ? p.sizes.join(",") : p?.sizes || "";
  const colors = Array.isArray(p?.colors) ? p.colors.join(",") : p?.colors || "";
  const image = p?.image || "";
  const desc = p?.description || "";
  return `<div class="form-grid">
    <label>Name<input id="p_name" value="${name}"/></label>
    <label>Category<input id="p_category" value="${cat}"/></label>
    <label>Price<input id="p_price" type="number" step="0.01" value="${price}"/></label>
    <label>Rating<input id="p_rating" type="number" step="0.1" value="${rating}"/></label>
    <label>Sizes<input id="p_sizes" placeholder="S,M,L,XL" value="${sizes}"/></label>
    <label>Colors<input id="p_colors" placeholder="Black,White" value="${colors}"/></label>
    <label>Image URL<input id="p_image" value="${image}"/></label>
    <label>Description<textarea id="p_desc">${desc}</textarea></label>
    <div><button class="btn btn-primary" id="saveProduct">Save</button></div>
  </div>`;
}
async function loadProducts() {
  const filter = qs("#productCategoryFilter")?.value || "";
  let q = supa
    .from(T.products || "products")
    .select("*")
    .order("created_at", { ascending: false });
  if (filter) q = q.eq("category", filter.charAt(0).toUpperCase() + filter.slice(1));
  const { data, error } = await q;
  const tbody = qs("#productsTable");
  if (!tbody) return;
  tbody.innerHTML = "";
  if (error || !data || !data.length) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 7;
    td.className = "no-data";
    td.textContent = "No products found";
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }
  data.forEach((p) => {
    const stockVal = Number(p.stock || 0);
    let stockBadge = "";
    if (stockVal <= 0) stockBadge = `<span class="status-badge status-out">Out</span>`;
    else if (stockVal < 5) stockBadge = `<span class="status-badge status-low">Low (${stockVal})</span>`;
    else stockBadge = `<span class="status-badge status-active">${stockVal}</span>`;

    const statusVal = p.status || "active";
    const statusBadge = statusVal === "draft"
      ? `<span class="status-badge status-inactive">Draft</span>`
      : `<span class="status-badge status-active">Active</span>`;

    const tr = document.createElement("tr");
    tr.innerHTML = `<td><img src="${p.image}" alt="${p.name}" style="width:48px;height:48px;object-fit:cover;border-radius:6px"/></td><td>${p.name}</td><td>${p.category}</td><td>${fmtCurrency(
      p.price
    )}</td><td>${stockBadge}</td><td>${statusBadge}</td><td><div class="action-btns"><button class="btn btn-secondary" data-act="edit" data-id="${p.id}">Edit</button><button class="btn btn-danger" data-act="delete" data-id="${p.id}">Delete</button></div></td>`;
    tbody.appendChild(tr);
  });
  // "Add Product" button now links to /admin/products/add.html (dedicated page)
  const handler = async (e) => {
    const t = e.target;
    if (!(t instanceof HTMLElement)) return;
    const act = t.dataset.act;
    const id = Number(t.dataset.id);
    if (!act || !id) return;
    const p = data.find((x) => x.id === id);
    if (act === "edit" && p) {
      openModal("Edit Product", productFormHtml(p), (root) => {
        const btn = qs("#saveProduct", root);
        btn?.addEventListener("click", async () => {
          const payload = {
            name: qs("#p_name", root)?.value?.trim(),
            category: qs("#p_category", root)?.value?.trim(),
            price: Number(qs("#p_price", root)?.value || 0),
            rating: Number(qs("#p_rating", root)?.value || 0),
            sizes: (qs("#p_sizes", root)?.value || "")
              .split(",")
              .map((x) => x.trim())
              .filter(Boolean),
            colors: (qs("#p_colors", root)?.value || "")
              .split(",")
              .map((x) => x.trim())
              .filter(Boolean),
            image: qs("#p_image", root)?.value?.trim(),
            description: qs("#p_desc", root)?.value?.trim(),
          };
          await supa
            .from(T.products || "products")
            .update(payload)
            .eq("id", id);
          qs("#modalOverlay")?.classList.remove("open");
          loadProducts();
        });
      });
    }
    if (act === "delete") {
      await supa
        .from(T.products || "products")
        .delete()
        .eq("id", id);
      loadProducts();
      computeDashboard();
    }
  };
  tbody.addEventListener("click", handler);
}
async function loadCustomers() {
  const search = qs("#customerSearch")?.value?.toLowerCase() || "";
  const { data, error } = await supa
    .from(T.profiles || "profiles")
    .select("*")
    .order("created_at", {
      ascending: false,
    });
  const tbody = qs("#customersTable");
  if (!tbody) return;
  tbody.innerHTML = "";
  if (error || !data || !data.length) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 7;
    td.className = "no-data";
    td.textContent = "No customers found";
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }
  const rows = data.filter((u) => {
    if (!search) return true;
    const s = `${u.name || ""} ${u.email || ""} ${u.phone || ""}`.toLowerCase();
    return s.includes(search);
  });
  const ordersByUser = {};
  try {
    const { data: orders } = await supa.from(T.orders || "orders").select("user_id,total_amount");
    (orders || []).forEach((o) => {
      const uid = o.user_id;
      if (!ordersByUser[uid]) ordersByUser[uid] = { count: 0, spent: 0 };
      ordersByUser[uid].count += 1;
      ordersByUser[uid].spent += Number(o.total_amount || 0);
    });
  } catch { }
  rows.forEach((u) => {
    const stats = ordersByUser[u.id] || { count: 0, spent: 0 };
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${u.name || "-"}</td><td>${u.email || "-"}</td><td>${u.phone || "-"
      }</td><td>${stats.count}</td><td>${fmtCurrency(stats.spent)}</td><td>${u.created_at ? new Date(u.created_at).toLocaleDateString() : "-"
      }</td><td><div class="action-btns"><button class="btn btn-secondary" data-act="view" data-id="${u.id
      }">View</button></div></td>`;
    tbody.appendChild(tr);
  });
}
async function loadBanners() {
  const grid = qs("#bannersGrid");
  if (!grid) return;
  const { data, error } = await supa
    .from("hero_slides")
    .select("*")
    .order("order", { ascending: true });
  grid.innerHTML = "";
  if (error || !data || !data.length) {
    grid.innerHTML = `<div class="no-data">No banners found</div>`;
    return;
  }
  data.forEach((b) => {
    const card = document.createElement("div");
    card.className = "banner-card";
    card.innerHTML = `<img src="${b.image}" alt="${b.title}"/><div class="banner-info"><div class="banner-title">${b.title}</div><div class="banner-actions"><button class="btn btn-secondary" data-act="edit" data-id="${b.id}">Edit</button><button class="btn btn-danger" data-act="delete" data-id="${b.id}">Delete</button></div></div>`;
    grid.appendChild(card);
  });
  grid.addEventListener("click", async (e) => {
    const t = e.target;
    if (!(t instanceof HTMLElement)) return;
    const act = t.dataset.act;
    const id = Number(t.dataset.id);
    if (!act || !id) return;
    if (act === "edit") {
      const { data } = await supa.from("hero_slides").select("*").eq("id", id).single();
      const b = data || {};
      openModal(
        "Edit Banner",
        `<div class="form-grid">
        <label>Eyebrow<input id="b_eyebrow" value="${b.eyebrow || ""}"/></label>
        <label>Title<input id="b_title" value="${b.title || ""}"/></label>
        <label>Description<textarea id="b_desc">${b.description || ""}</textarea></label>
        <label>Button Text<input id="b_btn" value="${b.button_text || ""}"/></label>
        <label>Button Link<input id="b_link" value="${b.button_link || ""}"/></label>
        <label>Image URL<input id="b_image" value="${b.image || ""}"/></label>
        <label>Order<input id="b_order" type="number" value="${b.order || 1}"/></label>
        <label>Status<select id="b_active"><option value="true"${b.is_active ? " selected" : ""
        }>Active</option><option value="false"${b.is_active ? "" : " selected"}>Inactive</option></select></label>
        <div><button class="btn btn-primary" id="saveBanner">Save</button></div></div>`,
        (root) => {
          qs("#saveBanner", root)?.addEventListener("click", async () => {
            const payload = {
              eyebrow: qs("#b_eyebrow", root)?.value?.trim(),
              title: qs("#b_title", root)?.value?.trim(),
              description: qs("#b_desc", root)?.value?.trim(),
              button_text: qs("#b_btn", root)?.value?.trim(),
              button_link: qs("#b_link", root)?.value?.trim(),
              image: qs("#b_image", root)?.value?.trim(),
              order: Number(qs("#b_order", root)?.value || 1),
              is_active: String(qs("#b_active", root)?.value) === "true",
            };
            await supa.from("hero_slides").update(payload).eq("id", id);
            qs("#modalOverlay")?.classList.remove("open");
            loadBanners();
          });
        }
      );
    }
    if (act === "delete") {
      await supa.from("hero_slides").delete().eq("id", id);
      loadBanners();
    }
  });
  qs("#addBannerBtn")?.addEventListener("click", () => {
    openModal(
      "Add Banner",
      `<div class="form-grid">
      <label>Eyebrow<input id="b_eyebrow"/></label>
      <label>Title<input id="b_title"/></label>
      <label>Description<textarea id="b_desc"></textarea></label>
      <label>Button Text<input id="b_btn"/></label>
      <label>Button Link<input id="b_link"/></label>
      <label>Image URL<input id="b_image"/></label>
      <label>Order<input id="b_order" type="number" value="1"/></label>
      <label>Status<select id="b_active"><option value="true">Active</option><option value="false">Inactive</option></select></label>
      <div><button class="btn btn-primary" id="saveBanner">Save</button></div></div>`,
      (root) => {
        qs("#saveBanner", root)?.addEventListener("click", async () => {
          const payload = {
            eyebrow: qs("#b_eyebrow", root)?.value?.trim(),
            title: qs("#b_title", root)?.value?.trim(),
            description: qs("#b_desc", root)?.value?.trim(),
            button_text: qs("#b_btn", root)?.value?.trim(),
            button_link: qs("#b_link", root)?.value?.trim(),
            image: qs("#b_image", root)?.value?.trim(),
            order: Number(qs("#b_order", root)?.value || 1),
            is_active: String(qs("#b_active", root)?.value) === "true",
          };
          await supa.from("hero_slides").insert(payload);
          qs("#modalOverlay")?.classList.remove("open");
          loadBanners();
        });
      }
    );
  });
}
async function loadDiscounts() {
  const tbody = qs("#discountsTable");
  if (!tbody) return;
  tbody.innerHTML = "";
  try {
    const { data } = await supa
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false });
    if (!data || !data.length) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 8;
      td.className = "no-data";
      td.textContent = "No coupons found";
      tr.appendChild(td);
      tbody.appendChild(tr);
      return;
    }
    data.forEach((c) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${c.code}</td><td>${c.type}</td><td>${c.value}</td><td>${c.min_order || "-"}</td><td>${c.usage_count || 0}/${c.usage_limit || "-"
        }</td><td>${c.expires_at ? new Date(c.expires_at).toLocaleDateString() : "-"}</td><td>${c.is_active ? "Active" : "Inactive"
        }</td><td><div class="action-btns"><button class="btn btn-secondary" data-act="edit" data-id="${c.id}">Edit</button><button class="btn btn-danger" data-act="delete" data-id="${c.id}">Delete</button></div></td>`;
      tbody.appendChild(tr);
    });
  } catch {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 8;
    td.className = "no-data";
    td.textContent = "No coupons found";
    tr.appendChild(td);
    tbody.appendChild(tr);
  }
  const addBtn = qs("#addDiscountBtn") || qs("#addCouponBtn");
  addBtn?.addEventListener("click", () => {
    openModal(
      "Add Coupon",
      `<div class="form-grid">
      <label>Code<input id="d_code"/></label>
      <label>Type<select id="d_type"><option value="percent">Percent</option><option value="fixed">Fixed</option></select></label>
      <label>Value<input id="d_value" type="number" step="0.01"/></label>
      <label>Min Order<input id="d_min" type="number" step="0.01"/></label>
      <label>Usage Limit<input id="d_limit" type="number"/></label>
      <label>Expiry<input id="d_exp" type="date"/></label>
      <label>Status<select id="d_active"><option value="true">Active</option><option value="false">Inactive</option></select></label>
      <div><button class="btn btn-primary" id="saveCoupon">Save</button></div></div>`,
      (root) => {
        qs("#saveCoupon", root)?.addEventListener("click", async () => {
          const payload = {
            code: qs("#d_code", root)?.value?.trim(),
            type: qs("#d_type", root)?.value,
            value: Number(qs("#d_value", root)?.value || 0),
            min_order: Number(qs("#d_min", root)?.value || 0),
            usage_limit: Number(qs("#d_limit", root)?.value || 0),
            expires_at: qs("#d_exp", root)?.value || null,
            is_active: String(qs("#d_active", root)?.value) === "true",
          };
          try {
            await supa.from("coupons").insert(payload);
          } catch { }
          qs("#modalOverlay")?.classList.remove("open");
          loadDiscounts();
        });
      }
    );
  });
  tbody.addEventListener("click", async (e) => {
    const t = e.target;
    if (!(t instanceof HTMLElement)) return;
    const act = t.dataset.act;
    const id = Number(t.dataset.id);
    if (!act || !id) return;
    if (act === "delete") {
      await supa.from("coupons").delete().eq("id", id);
      loadDiscounts();
      return;
    }
    if (act === "edit") {
      const { data } = await supa.from("coupons").select("*").eq("id", id).single();
      const c = data || {};
      openModal(
        "Edit Coupon",
        `<div class="form-grid">
        <label>Code<input id="d_code" value="${c.code || ""}"/></label>
        <label>Type<select id="d_type"><option value="percent"${c.type === "percent" ? " selected" : ""
        }>Percent</option><option value="fixed"${c.type === "fixed" ? " selected" : ""}>Fixed</option></select></label>
        <label>Value<input id="d_value" type="number" step="0.01" value="${c.value || 0}"/></label>
        <label>Min Order<input id="d_min" type="number" step="0.01" value="${c.min_order || 0}"/></label>
        <label>Usage Limit<input id="d_limit" type="number" value="${c.usage_limit || 0}"/></label>
        <label>Expiry<input id="d_exp" type="date" value="${c.expires_at ? String(c.expires_at).slice(0, 10) : ""
        }"/></label>
        <label>Status<select id="d_active"><option value="true"${c.is_active ? " selected" : ""
        }>Active</option><option value="false"${c.is_active ? "" : " selected"}>Inactive</option></select></label>
        <div><button class="btn btn-primary" id="saveCoupon">Save</button></div></div>`,
        (root) => {
          qs("#saveCoupon", root)?.addEventListener("click", async () => {
            const payload = {
              code: qs("#d_code", root)?.value?.trim(),
              type: qs("#d_type", root)?.value,
              value: Number(qs("#d_value", root)?.value || 0),
              min_order: Number(qs("#d_min", root)?.value || 0),
              usage_limit: Number(qs("#d_limit", root)?.value || 0),
              expires_at: qs("#d_exp", root)?.value || null,
              is_active: String(qs("#d_active", root)?.value) === "true",
            };
            await supa.from("coupons").update(payload).eq("id", id);
            qs("#modalOverlay")?.classList.remove("open");
            loadDiscounts();
          });
        }
      );
    }
  });
}
async function loadPayments() {
  const tbody = qs("#paymentsTable");
  if (!tbody) return;
  tbody.innerHTML = "";
  try {
    const method = qs("#paymentsMethodFilter")?.value || "";
    let q = supa.from("payments").select("*").order("created_at", { ascending: false });
    if (method) q = q.eq("method", method);
    const { data } = await q;
    if (!data || !data.length) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 7;
      td.className = "no-data";
      td.textContent = "No transactions found";
      tr.appendChild(td);
      tbody.appendChild(tr);
      return;
    }
    data.forEach((p) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${p.id}</td><td>${p.order_id || "-"}</td><td>${p.customer_name || "-"}</td><td>${p.method || "-"
        }</td><td>${fmtCurrency(p.amount)}</td><td>${p.status || "-"}</td><td>${p.created_at ? new Date(p.created_at).toLocaleString() : "-"
        }</td>`;
      tbody.appendChild(tr);
    });
  } catch {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 7;
    td.className = "no-data";
    td.textContent = "No transactions found";
    tr.appendChild(td);
    tbody.appendChild(tr);
  }
}
function invKey(pId, size, color) {
  return `${pId}__${size}__${color}`.toLowerCase();
}
function readInventory() {
  try {
    const raw = localStorage.getItem("hodo_inventory");
    const obj = raw ? JSON.parse(raw) : {};
    return obj && typeof obj === "object" ? obj : {};
  } catch {
    return {};
  }
}
function writeInventory(map) {
  try {
    localStorage.setItem("hodo_inventory", JSON.stringify(map));
  } catch { }
}
function stockStatus(n) {
  const v = Number(n || 0);
  if (v <= 0) return { text: "Out", cls: "status-out" };
  if (v < 5) return { text: "Low", cls: "status-low" };
  return { text: "In Stock", cls: "status-active" };
}
async function loadInventory() {
  const tbody = qs("#inventoryTable");
  if (!tbody) return;
  const filter = qs("#inventoryFilter")?.value || "";
  tbody.innerHTML = "";
  const { data, error } = await supa
    .from(T.products || "products")
    .select("*")
    .order("created_at", { ascending: false });
  if (error || !data || !data.length) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 6;
    td.className = "no-data";
    td.textContent = "No inventory data";
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }
  const map = readInventory();
  const rows = [];
  data.forEach((p) => {
    const sizes = Array.isArray(p.sizes) ? p.sizes : [];
    const colors = Array.isArray(p.colors) ? p.colors : [];
    if (!sizes.length && !colors.length) {
      const k = invKey(p.id, "-", "-");
      const stock = Number(map[k] || 0);
      rows.push({
        product: p.name,
        sku: `P${p.id}`,
        variant: "-",
        stock,
      });
    } else {
      (sizes.length ? sizes : ["-"]).forEach((s) => {
        (colors.length ? colors : ["-"]).forEach((c) => {
          const k = invKey(p.id, s, c);
          const stock = Number(map[k] || 0);
          rows.push({
            product: p.name,
            sku: `P${p.id}`,
            variant: `${s}/${c}`,
            stock,
            pid: p.id,
            size: s,
            color: c,
          });
        });
      });
    }
  });
  const filtered = rows.filter((r) => {
    const st = stockStatus(r.stock).text.toLowerCase();
    if (!filter) return true;
    if (filter === "low") return st === "low";
    if (filter === "out") return st === "out";
    if (filter === "normal") return st === "in stock";
    return true;
  });
  if (!filtered.length) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 6;
    td.className = "no-data";
    td.textContent = "No inventory data";
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }
  filtered.forEach((r) => {
    const st = stockStatus(r.stock);
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${r.product}</td><td>${r.sku}</td><td>${r.variant}</td><td>${r.stock}</td><td><span class="status-badge ${st.cls}">${st.text}</span></td><td><div class="action-btns"><button class="btn btn-secondary" data-act="adjust" data-key="${r.pid || ""}__${r.size || "-"}__${r.color || "-"}">Adjust</button></div></td>`;
    tbody.appendChild(tr);
  });
  tbody.addEventListener("click", (e) => {
    const t = e.target;
    if (!(t instanceof HTMLElement)) return;
    const act = t.dataset.act;
    const key = t.dataset.key;
    if (act !== "adjust" || !key) return;
    openModal(
      "Adjust Stock",
      `<div class="form-grid"><label>Quantity<input id="inv_qty" type="number" step="1" min="0"/></label><div><button class="btn btn-primary" id="saveInv">Save</button></div></div>`,
      (root) => {
        const btn = qs("#saveInv", root);
        btn?.addEventListener("click", () => {
          const qty = Number(qs("#inv_qty", root)?.value || 0);
          const m = readInventory();
          m[key.toLowerCase()] = qty;
          writeInventory(m);
          qs("#modalOverlay")?.classList.remove("open");
          loadInventory();
        });
      }
    );
  });
}
async function loadShipping() {
  const tbody = qs("#shippingTable");
  if (!tbody) return;
  tbody.innerHTML = "";
  try {
    const status = qs("#shippingStatusFilter")?.value || "";
    let q = supa.from("shipments").select("*").order("created_at", { ascending: false });
    if (status) q = q.eq("status", status);
    const { data } = await q;
    if (!data || !data.length) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 7;
      td.className = "no-data";
      td.textContent = "No shipments found";
      tr.appendChild(td);
      tbody.appendChild(tr);
      return;
    }
    data.forEach((s) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${s.order_id}</td><td>${s.customer_name || "-"}</td><td>${s.address || "-"}</td><td>${s.courier || "-"}</td><td>${s.tracking || "-"}</td><td>${s.status || "-"}</td><td><div class="action-btns"><button class="btn btn-secondary" data-act="status" data-id="${s.id}">Update</button></div></td>`;
      tbody.appendChild(tr);
    });
  } catch {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 7;
    td.className = "no-data";
    td.textContent = "No shipments found";
    tr.appendChild(td);
    tbody.appendChild(tr);
  }
  tbody.addEventListener("click", (e) => {
    const t = e.target;
    if (!(t instanceof HTMLElement)) return;
    const act = t.dataset.act;
    const id = Number(t.dataset.id);
    if (act !== "status" || !id) return;
    openModal(
      "Update Shipment",
      `<div class="form-grid"><label>Status<select id="ship_status"><option value="pending">Pending</option><option value="in_transit">In Transit</option><option value="delivered">Delivered</option></select></label><label>Courier<input id="ship_courier"/></label><label>Tracking<input id="ship_tracking"/></label><div><button class="btn btn-primary" id="saveShip">Save</button></div></div>`,
      (root) => {
        qs("#saveShip", root)?.addEventListener("click", async () => {
          const payload = {
            status: qs("#ship_status", root)?.value || "",
            courier: qs("#ship_courier", root)?.value?.trim() || null,
            tracking: qs("#ship_tracking", root)?.value?.trim() || null,
          };
          await supa.from("shipments").update(payload).eq("id", id);
          qs("#modalOverlay")?.classList.remove("open");
          loadShipping();
        });
      }
    );
  });
}
async function loadReviews() {
  const tbody = qs("#reviewsTable");
  if (!tbody) return;
  tbody.innerHTML = "";
  try {
    const { data } = await supa
      .from("reviews")
      .select("*")
      .order("created_at", { ascending: false });
    if (!data || !data.length) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 7;
      td.className = "no-data";
      td.textContent = "No reviews found";
      tr.appendChild(td);
      tbody.appendChild(tr);
      return;
    }
    data.forEach((r) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${r.product_name || "-"}</td><td>${r.customer_name || "-"}</td><td>${r.rating || "-"
        }</td><td>${r.review || "-"}</td><td>${r.status || "-"}</td><td>${r.created_at ? new Date(r.created_at).toLocaleString() : "-"
        }</td><td><div class="action-btns"><button class="btn btn-secondary" data-act="approve" data-id="${r.id}">Approve</button><button class="btn btn-danger" data-act="reject" data-id="${r.id}">Reject</button></div></td>`;
      tbody.appendChild(tr);
    });
  } catch {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 7;
    td.className = "no-data";
    td.textContent = "No reviews found";
    tr.appendChild(td);
    tbody.appendChild(tr);
  }
  tbody.addEventListener("click", async (e) => {
    const t = e.target;
    if (!(t instanceof HTMLElement)) return;
    const act = t.dataset.act;
    const id = Number(t.dataset.id);
    if (!act || !id) return;
    if (act === "approve" || act === "reject") {
      const status = act === "approve" ? "approved" : "rejected";
      await supa.from("reviews").update({ status }).eq("id", id);
      loadReviews();
    }
  });
}
async function loadStaff() {
  const tbody = qs("#staffTable");
  if (!tbody) return;
  tbody.innerHTML = "";
  try {
    const { data } = await supa
      .from(T.profiles || "profiles")
      .select("*")
      .neq("role", "customer");
    if (!data || !data.length) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 6;
      td.className = "no-data";
      td.textContent = "No staff members found";
      tr.appendChild(td);
      tbody.appendChild(tr);
      return;
    }
    data.forEach((s) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${s.name || "-"}</td><td>${s.email || "-"}</td><td>${s.role || "-"}</td><td>${s.status || "Active"
        }</td><td>${s.updated_at ? new Date(s.updated_at).toLocaleString() : "-"}</td><td><div class="action-btns"><button class="btn btn-secondary" data-act="role" data-id="${s.id}">Change Role</button></div></td>`;
      tbody.appendChild(tr);
    });
  } catch {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 6;
    td.className = "no-data";
    td.textContent = "No staff members found";
    tr.appendChild(td);
    tbody.appendChild(tr);
  }
  tbody.addEventListener("click", (e) => {
    const t = e.target;
    if (!(t instanceof HTMLElement)) return;
    const act = t.dataset.act;
    const id = t.dataset.id;
    if (act !== "role" || !id) return;
    openModal(
      "Change Role",
      `<div class="form-grid"><label>Role<select id="staff_role"><option value="admin">Admin</option><option value="manager">Manager</option><option value="staff">Staff</option></select></label><div><button class="btn btn-primary" id="saveRole">Save</button></div></div>`,
      (root) => {
        qs("#saveRole", root)?.addEventListener("click", async () => {
          const role = qs("#staff_role", root)?.value || "staff";
          await supa.from(T.profiles || "profiles").update({ role }).eq("id", id);
          qs("#modalOverlay")?.classList.remove("open");
          loadStaff();
        });
      }
    );
  });
  qs("#addStaffBtn")?.addEventListener("click", () => {
    openModal(
      "Add Staff",
      `<div class="form-grid"><label>Name<input id="s_name"/></label><label>Email<input id="s_email" type="email"/></label><label>Role<select id="s_role"><option value="staff">Staff</option><option value="manager">Manager</option><option value="admin">Admin</option></select></label><div><button class="btn btn-primary" id="saveStaff">Save</button></div></div>`,
      (root) => {
        qs("#saveStaff", root)?.addEventListener("click", async () => {
          const payload = {
            name: qs("#s_name", root)?.value?.trim(),
            email: qs("#s_email", root)?.value?.trim(),
            role: qs("#s_role", root)?.value || "staff",
            status: "Active",
          };
          await supa.from(T.profiles || "profiles").insert(payload);
          qs("#modalOverlay")?.classList.remove("open");
          loadStaff();
        });
      }
    );
  });
}
function bindFilters() {
  qs("#orderStatusFilter")?.addEventListener("change", loadOrders);
  qs("#productCategoryFilter")?.addEventListener("change", loadProducts);
  qs("#customerSearch")?.addEventListener("input", loadCustomers);
  qs("#inventoryFilter")?.addEventListener("change", loadInventory);
  qs("#paymentsMethodFilter")?.addEventListener("change", loadPayments);
  qs("#shippingStatusFilter")?.addEventListener("change", loadShipping);
}
function initialLoad() {
  computeDashboard();
  loadOrders();
  loadProducts();
  loadInventory();
  loadCustomers();
  loadBanners();
  loadDiscounts();
  loadReviews();
  loadPayments();
  loadShipping();
  loadStaff();
}
function readSettings() {
  try {
    const raw = localStorage.getItem("hodo_settings");
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}
function writeSettings(obj) {
  try {
    localStorage.setItem("hodo_settings", JSON.stringify(obj));
  } catch { }
}
function initSettings() {
  const name = qs("#storeName");
  const email = qs("#storeEmail");
  const card = qs("#enableCard");
  const cod = qs("#enableCOD");
  const days = qs("#deliveryDays");
  const btn = qs("#saveSettings");
  if (!name && !email && !card && !cod && !days && !btn) return;
  const s = readSettings();
  if (name) name.value = s.name || "";
  if (email) email.value = s.email || "";
  if (card) card.checked = !!s.card;
  if (cod) cod.checked = !!s.cod;
  if (days) days.value = String(s.days || 3);
  btn?.addEventListener("click", () => {
    const v = {
      name: name?.value?.trim() || "",
      email: email?.value?.trim() || "",
      card: !!(card && card.checked),
      cod: !!(cod && cod.checked),
      days: Number(days?.value || 3),
    };
    writeSettings(v);
    openModal("Saved", `<div style="padding:8px 0">Settings have been saved.</div>`);
    setTimeout(() => qs("#modalOverlay")?.classList.remove("open"), 800);
  });
}
function bindCustomers() {
  const tbody = qs("#customersTable");
  if (!tbody) return;
  tbody.addEventListener("click", async (e) => {
    const t = e.target;
    if (!(t instanceof HTMLElement)) return;
    const act = t.dataset.act;
    const id = t.dataset.id;
    if (act !== "view" || !id) return;
    const { data: user } = await supa.from(T.profiles || "profiles").select("*").eq("id", id).single();
    const { data: orders } = await supa.from(T.orders || "orders").select("*").eq("user_id", id).order("created_at", { ascending: false });
    const list =
      (orders || [])
        .slice(0, 10)
        .map((o) => `#${o.id} • ${fmtCurrency(o.total_amount)} • ${o.status || "-"}`)
        .join("<br/>") || "No orders";
    openModal(
      "Customer Details",
      `<div class="form-grid"><div><strong>Name</strong><div>${user?.name || "-"}</div></div><div><strong>Email</strong><div>${user?.email || "-"}</div></div><div><strong>Phone</strong><div>${user?.phone || "-"}</div></div><div style="grid-column:1/-1"><strong>Recent Orders</strong><div>${list}</div></div></div>`
    );
  });
}
function boot() {
  onHeader();
  onNav();
  bindFilters();
  bindCustomers();
  const sections = qsa(".content-section");
  if (sections.length > 1) {
    const hash = (location.hash || "").replace("#", "");
    const valid = new Set(qsa(".nav-item").map((el) => el.dataset.section).filter(Boolean));
    if (hash && valid.has(hash)) {
      showSection(hash);
    } else {
      showSection("dashboard");
    }
    window.addEventListener("hashchange", () => {
      const h = (location.hash || "").replace("#", "");
      if (h && valid.has(h)) showSection(h);
    });
  } else {
    const active = qs(".nav-item.active span")?.textContent || "";
    if (active) setText("#pageTitle", active);
  }
  initialLoad();
  initSettings();
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
else boot();
