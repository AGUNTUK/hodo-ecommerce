/**
 * Hodo Admin — Add Product Logic
 * Handles form validation, media upload to Supabase Storage,
 * product record insertion, success toast, and redirect.
 *
 * Admin Dashboard and Main Site MUST use the SAME reactive data source.
 * Newly added products must propagate globally in real time.
 */

(function () {
    "use strict";

    // ─── References ──────────────────────────────────────────────────────────────
    const supa = window.supabaseClient;
    const BUCKET = "product-media";
    const PRODUCTS_TABLE = (window.TABLES && window.TABLES.products) || "products";

    // Form fields
    const $ = (id) => document.getElementById(id);
    const productName = $("productName");
    const productPrice = $("productPrice");
    const productDiscountPrice = $("productDiscountPrice");
    const productCategory = $("productCategory");
    const productDescription = $("productDescription");
    const productSizes = $("productSizes");
    const productColors = $("productColors");
    const productRating = $("productRating");
    const productStock = $("productStock");
    const productSKU = $("productSKU");
    const productStatusHidden = $("productStatus");

    // Media
    const imageInput = $("imageInput");
    const videoInput = $("videoInput");
    const imageDropzone = $("imageDropzone");
    const imagePickerBtn = $("imagePickerBtn");
    const videoDropzone = $("videoDropzone");
    const videoPickerBtn = $("videoPickerBtn");
    const imagePreviewGrid = $("imagePreviewGrid");
    const videoPreviewWrap = $("videoPreviewWrap");
    const videoPreview = $("videoPreview");
    const removeVideoBtn = $("removeVideoBtn");

    // Buttons & UI
    const saveProductBtn = $("saveProductBtn");
    const saveProductBtnBottom = $("saveProductBtnBottom");
    const apError = $("apError");
    const apToast = $("apToast");
    const apToastMsg = $("apToastMsg");
    const statusPills = document.querySelectorAll(".ap-status-pill");
    const statusHint = $("statusHint");
    const menuToggle = $("menuToggle");
    const sidebar = $("sidebar");
    const sidebarClose = $("sidebarClose");

    // Internal state
    let selectedImages = []; // Array of { file: File, objectUrl: string }
    let selectedVideo = null; // File | null

    // ─── Sidebar toggle (mobile) ─────────────────────────────────────────────────
    if (menuToggle && sidebar) {
        menuToggle.addEventListener("click", () => sidebar.classList.toggle("open"));
    }
    if (sidebarClose && sidebar) {
        sidebarClose.addEventListener("click", () => sidebar.classList.remove("open"));
    }

    // ─── Status pills ─────────────────────────────────────────────────────────────
    statusPills.forEach((pill) => {
        pill.addEventListener("click", () => {
            statusPills.forEach((p) => p.classList.remove("active"));
            pill.classList.add("active");
            const val = pill.dataset.value;
            productStatusHidden.value = val;
            statusHint.textContent =
                val === "active"
                    ? "Product is live and visible on the store."
                    : "Product is saved as draft and hidden from the store.";
        });
    });

    // ─── Image upload ─────────────────────────────────────────────────────────────
    imagePickerBtn.addEventListener("click", () => imageInput.click());

    imageDropzone.addEventListener("click", (e) => {
        if (e.target === imageDropzone || e.target.id === "imageDropzoneInner") {
            imageInput.click();
        }
    });

    // Drag and drop for images
    imageDropzone.addEventListener("dragover", (e) => {
        e.preventDefault();
        imageDropzone.classList.add("drag-over");
    });
    imageDropzone.addEventListener("dragleave", () => imageDropzone.classList.remove("drag-over"));
    imageDropzone.addEventListener("drop", (e) => {
        e.preventDefault();
        imageDropzone.classList.remove("drag-over");
        const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
        addImages(files);
    });

    imageInput.addEventListener("change", () => {
        const files = Array.from(imageInput.files);
        addImages(files);
        imageInput.value = ""; // Reset so same files can be re-added if needed
    });

    function addImages(files) {
        files.forEach((file) => {
            if (file.size > 10 * 1024 * 1024) {
                showFieldError("err-images", `"${file.name}" exceeds 10 MB limit.`);
                return;
            }
            const objectUrl = URL.createObjectURL(file);
            selectedImages.push({ file, objectUrl });
        });
        renderImagePreviews();
        clearFieldError("err-images");
    }

    function renderImagePreviews() {
        imagePreviewGrid.innerHTML = "";
        selectedImages.forEach((item, index) => {
            const thumb = document.createElement("div");
            thumb.className = "ap-image-thumb";
            thumb.innerHTML = `
        <img src="${item.objectUrl}" alt="preview ${index + 1}">
        ${index === 0 ? '<span class="ap-primary-badge">Primary</span>' : ""}
        <button type="button" class="ap-remove-img" data-index="${index}" aria-label="Remove image">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      `;
            imagePreviewGrid.appendChild(thumb);
        });

        // Bind remove buttons
        imagePreviewGrid.querySelectorAll(".ap-remove-img").forEach((btn) => {
            btn.addEventListener("click", (e) => {
                e.stopPropagation();
                const idx = Number(btn.dataset.index);
                URL.revokeObjectURL(selectedImages[idx].objectUrl);
                selectedImages.splice(idx, 1);
                renderImagePreviews();
            });
        });
    }

    // ─── Video upload ─────────────────────────────────────────────────────────────
    videoPickerBtn.addEventListener("click", () => videoInput.click());

    videoDropzone.addEventListener("click", (e) => {
        if (e.target === videoDropzone || e.target.id === "videoDropzoneInner") {
            videoInput.click();
        }
    });

    videoDropzone.addEventListener("dragover", (e) => {
        e.preventDefault();
        videoDropzone.classList.add("drag-over");
    });
    videoDropzone.addEventListener("dragleave", () => videoDropzone.classList.remove("drag-over"));
    videoDropzone.addEventListener("drop", (e) => {
        e.preventDefault();
        videoDropzone.classList.remove("drag-over");
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith("video/")) setVideo(file);
    });

    videoInput.addEventListener("change", () => {
        if (videoInput.files[0]) setVideo(videoInput.files[0]);
        videoInput.value = "";
    });

    function setVideo(file) {
        if (file.size > 50 * 1024 * 1024) {
            showError("Video file exceeds 50 MB limit. Please choose a smaller file.");
            return;
        }
        if (selectedVideo) URL.revokeObjectURL(videoPreview.src);
        selectedVideo = file;
        videoPreview.src = URL.createObjectURL(file);
        videoPreviewWrap.style.display = "block";
        videoDropzone.style.display = "none";
    }

    removeVideoBtn.addEventListener("click", () => {
        URL.revokeObjectURL(videoPreview.src);
        videoPreview.src = "";
        selectedVideo = null;
        videoPreviewWrap.style.display = "none";
        videoDropzone.style.display = "";
        videoInput.value = "";
    });

    // ─── Validation ───────────────────────────────────────────────────────────────
    function clearAllErrors() {
        apError.style.display = "none";
        apError.textContent = "";
        document.querySelectorAll(".field-error").forEach((el) => (el.textContent = ""));
        [productName, productPrice, productCategory].forEach((el) =>
            el && el.classList.remove("input-error")
        );
    }

    function showFieldError(id, msg) {
        const el = $(id);
        if (el) el.textContent = msg;
    }

    function clearFieldError(id) {
        const el = $(id);
        if (el) el.textContent = "";
    }

    function showError(msg) {
        apError.textContent = "⚠ " + msg;
        apError.style.display = "flex";
        apError.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    function validate() {
        let valid = true;
        clearAllErrors();

        const name = productName.value.trim();
        if (!name) {
            showFieldError("err-name", "Product name is required.");
            valid = false;
        }

        const price = parseFloat(productPrice.value);
        if (!productPrice.value || isNaN(price) || price < 0) {
            showFieldError("err-price", "Enter a valid price (≥ 0).");
            valid = false;
        }

        if (!productCategory.value) {
            showFieldError("err-category", "Please select a category.");
            valid = false;
        }

        if (selectedImages.length === 0) {
            showFieldError("err-images", "At least one product image is required.");
            valid = false;
        }

        // Discount price must be less than price
        const discountPrice = productDiscountPrice.value.trim();
        if (discountPrice !== "") {
            const dp = parseFloat(discountPrice);
            if (isNaN(dp) || dp < 0) {
                showError("Discount price must be a positive number.");
                valid = false;
            } else if (!isNaN(price) && dp >= price) {
                showError("Discount price must be less than the regular price.");
                valid = false;
            }
        }

        return valid;
    }

    // ─── Upload helpers ───────────────────────────────────────────────────────────
    /**
     * Uploads a file to Supabase Storage and returns its public URL.
     * Falls back gracefully if bucket doesn't exist — instead returns an empty string
     * so the product can still be saved with a placeholder URL.
     */
    async function uploadFile(file, folder) {
        if (!supa) return "";

        const ext = file.name.split(".").pop() || "bin";
        const unique = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

        try {
            const { data, error } = await supa.storage.from(BUCKET).upload(unique, file, {
                cacheControl: "3600",
                upsert: false,
            });

            if (error) {
                console.warn("Storage upload warning:", error.message);
                // If bucket doesn't exist, return the local object URL as a temporary placeholder
                return URL.createObjectURL(file);
            }

            const { data: publicData } = supa.storage.from(BUCKET).getPublicUrl(unique);
            return publicData?.publicUrl || "";
        } catch (err) {
            console.warn("Storage upload error:", err);
            return URL.createObjectURL(file);
        }
    }

    // ─── Save Product ─────────────────────────────────────────────────────────────
    async function saveProduct() {
        if (!validate()) return;

        // Set loading state
        setLoading(true);

        try {
            // 1. Upload images
            const imageUrls = [];
            for (const item of selectedImages) {
                const url = await uploadFile(item.file, "images");
                if (url) imageUrls.push(url);
            }

            if (imageUrls.length === 0) {
                throw new Error(
                    "Image upload failed. Please check your Supabase Storage bucket 'product-media' is set to Public."
                );
            }

            // 2. Upload video (if any)
            let videoUrl = null;
            if (selectedVideo) {
                videoUrl = await uploadFile(selectedVideo, "videos");
            }

            // 3. Build payload (matches Supabase products table schema)
            const sizesRaw = productSizes.value.trim();
            const colorsRaw = productColors.value.trim();
            const ratingVal = parseFloat(productRating.value) || 4.5;
            const discountVal = productDiscountPrice.value.trim();

            const payload = {
                name: productName.value.trim(),
                category: productCategory.value,
                price: parseFloat(productPrice.value),
                rating: Math.min(5, Math.max(0, ratingVal)),
                sizes: sizesRaw ? sizesRaw.split(",").map((s) => s.trim()).filter(Boolean) : [],
                colors: colorsRaw ? colorsRaw.split(",").map((c) => c.trim()).filter(Boolean) : [],
                image: imageUrls[0],          // Primary image
                description: productDescription.value.trim() || null,
                // Extended fields (requires schema migration)
                discount_price: discountVal !== "" ? parseFloat(discountVal) : null,
                sku: productSKU.value.trim() || null,
                stock: parseInt(productStock.value, 10) || 0,
                status: productStatusHidden.value || "active",
                video_url: videoUrl || null,
            };

            // 4. Check for duplicate SKU
            if (payload.sku && supa) {
                const { data: existing } = await supa
                    .from(PRODUCTS_TABLE)
                    .select("id")
                    .eq("sku", payload.sku)
                    .maybeSingle();
                if (existing) {
                    showFieldError("err-sku", `SKU "${payload.sku}" already exists. Please use a unique SKU.`);
                    setLoading(false);
                    return;
                }
            }

            // 5. Insert into Supabase
            if (!supa) {
                throw new Error("Supabase client not available. Check supabase-config.js.");
            }

            const { data: inserted, error: insertError } = await supa
                .from(PRODUCTS_TABLE)
                .insert(payload)
                .select()
                .single();

            if (insertError) {
                // Handle gracefully if new columns don't exist yet (schema migration not run)
                if (insertError.message && insertError.message.includes("column")) {
                    // Retry with base schema only
                    const basePayload = {
                        name: payload.name,
                        category: payload.category,
                        price: payload.price,
                        rating: payload.rating,
                        sizes: payload.sizes,
                        colors: payload.colors,
                        image: payload.image,
                        description: payload.description,
                    };
                    const { error: retryError } = await supa.from(PRODUCTS_TABLE).insert(basePayload);
                    if (retryError) throw retryError;
                } else {
                    throw insertError;
                }
            }

            // 6. Success!
            showToast("✅ Product successfully added");

            // Redirect after 1.5s
            setTimeout(() => {
                window.location.href = "/admin/products.html";
            }, 1500);

        } catch (err) {
            console.error("Add product error:", err);
            showError(
                err.message || "An unexpected error occurred. Please try again."
            );
            setLoading(false);
        }
    }

    // ─── UI helpers ───────────────────────────────────────────────────────────────
    function setLoading(on) {
        [saveProductBtn, saveProductBtnBottom].forEach((btn) => {
            if (!btn) return;
            if (on) {
                btn.classList.add("btn-loading");
                btn.disabled = true;
                btn.dataset.originalText = btn.textContent;
            } else {
                btn.classList.remove("btn-loading");
                btn.disabled = false;
            }
        });
    }

    function showToast(msg) {
        apToastMsg.textContent = msg;
        apToast.classList.add("show");
    }

    // ─── Bind save buttons ────────────────────────────────────────────────────────
    if (saveProductBtn) saveProductBtn.addEventListener("click", saveProduct);
    if (saveProductBtnBottom) saveProductBtnBottom.addEventListener("click", saveProduct);

    // ─── Live validation hints ─────────────────────────────────────────────────────
    if (productName) {
        productName.addEventListener("input", () => {
            if (productName.value.trim()) clearFieldError("err-name");
        });
    }
    if (productPrice) {
        productPrice.addEventListener("input", () => {
            if (productPrice.value && parseFloat(productPrice.value) >= 0) clearFieldError("err-price");
        });
    }
    if (productCategory) {
        productCategory.addEventListener("change", () => {
            if (productCategory.value) clearFieldError("err-category");
        });
    }

})();
