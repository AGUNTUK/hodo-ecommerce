// ============================================
// Banner Display System - Main Site
// Loads and displays banners dynamically
// ============================================

const supa = window.supabaseClient;

// Get current page context
function getCurrentPageContext() {
    const path = window.location.pathname;

    if (path.includes('/shop.html') || path.includes('/product.html')) {
        return 'category';
    }

    return 'homepage';
}

// Get banner position based on page
function getBannerPosition(page) {
    const positions = {
        homepage: 'homepage_hero',
        category: 'category_banner'
    };

    return positions[page] || 'homepage_hero';
}

// Check if banner is currently active based on schedule
function isBannerActive(banner) {
    const now = new Date();
    if (!banner.is_active) return false;
    if (banner.start_date && new Date(banner.start_date) > now) return false;
    if (banner.end_date && new Date(banner.end_date) < now) return false;
    return true;
}

// Load banners for a specific position
async function loadBannersForPosition(position, limit = 5) {
    const { data, error } = await supa
        .from('hero_slides')
        .select('*')
        .eq('position', position)
        .eq('is_active', true)
        .order('order', { ascending: true })
        .limit(limit);

    if (error) {
        console.error('Error loading banners:', error);
        return [];
    }

    // Filter by schedule
    return (data || []).filter(isBannerActive);
}

// Render hero banner
function renderHeroBanner(banner) {
    const isVideo = banner.media_type === 'video';

    return `
    <div class="hero-banner" data-banner-id="${banner.id}">
      ${isVideo
            ? `<video class="hero-media" src="${banner.image}" autoplay muted loop playsinline></video>`
            : `<img class="hero-media" src="${banner.image}" alt="${banner.title}"/>`
        }
      <div class="hero-overlay"></div>
      <div class="hero-content">
        ${banner.eyebrow ? `<p class="eyebrow">${banner.eyebrow}</p>` : ''}
        <h1>${banner.title}</h1>
        ${banner.subtitle ? `<p class="hero-subtitle">${banner.subtitle}</p>` : ''}
        ${banner.description ? `<p class="hero-description">${banner.description}</p>` : ''}
        <div class="hero-actions">
          ${banner.button_text ? `<a href="${banner.button_link || '#'}" class="btn primary-btn">${banner.button_text}</a>` : ''}
          ${banner.secondary_button_text ? `<a href="${banner.secondary_button_link || '#'}" class="btn secondary-btn">${banner.secondary_button_text}</a>` : ''}
        </div>
      </div>
    </div>
  `;
}

// Render hero carousel with multiple banners
function renderHeroCarousel(banners) {
    if (!banners || banners.length === 0) {
        return renderDefaultHero();
    }

    if (banners.length === 1) {
        return renderHeroBanner(banners[0]);
    }

    return `
    <div class="hero-carousel" id="heroCarousel">
      <div class="carousel-slides">
        ${banners.map((banner, index) => `
          <div class="carousel-slide ${index === 0 ? 'active' : ''}" data-index="${index}">
            ${banner.media_type === 'video'
            ? `<video class="hero-media" src="${banner.image}" muted loop playsinline></video>`
            : `<img class="hero-media" src="${banner.image}" alt="${banner.title}"/>`
        }
            <div class="hero-overlay"></div>
            <div class="hero-content">
              ${banner.eyebrow ? `<p class="eyebrow">${banner.eyebrow}</p>` : ''}
              <h1>${banner.title}</h1>
              ${banner.subtitle ? `<p class="hero-subtitle">${banner.subtitle}</p>` : ''}
              ${banner.description ? `<p class="hero-description">${banner.description}</p>` : ''}
              <div class="hero-actions">
                ${banner.button_text ? `<a href="${banner.button_link || '#'}" class="btn primary-btn">${banner.button_text}</a>` : ''}
                ${banner.secondary_button_text ? `<a href="${banner.secondary_button_link || '#'}" class="btn secondary-btn">${banner.secondary_button_text}</a>` : ''}
              </div>
            </div>
          </div>
        `).join('')}
      </div>
      ${banners.length > 1 ? `
        <div class="carousel-controls">
          <button class="carousel-btn prev" aria-label="Previous slide">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <div class="carousel-dots">
            ${banners.map((_, index) => `
              <button class="carousel-dot ${index === 0 ? 'active' : ''}" data-index="${index}" aria-label="Go to slide ${index + 1}"></button>
            `).join('')}
          </div>
          <button class="carousel-btn next" aria-label="Next slide">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        </div>
      ` : ''}
    </div>
  `;
}

// Default hero when no banners
function renderDefaultHero() {
    return `
    <section class="home-hero surface">
      <div class="hero-content">
        <p class="eyebrow">Premium Menswear</p>
        <h1>Elevate Your Style with Hodo</h1>
        <p class="hero-subtitle">
          Discover curated collections of sharp, modern essentials designed for the contemporary man.
        </p>
        <div class="hero-actions">
          <a href="shop.html" class="btn primary-btn">Shop Collection</a>
          <a href="#featured" class="btn secondary-btn">Explore Featured</a>
        </div>
      </div>
    </section>
  `;
}

// Initialize hero carousel
function initCarousel() {
    const carousel = document.getElementById('heroCarousel');
    if (!carousel) return;

    const slides = carousel.querySelectorAll('.carousel-slide');
    const dots = carousel.querySelectorAll('.carousel-dot');
    const prevBtn = carousel.querySelector('.carousel-btn.prev');
    const nextBtn = carousel.querySelector('.carousel-btn.next');

    if (slides.length <= 1) return;

    let currentIndex = 0;
    let autoplayInterval;

    function goToSlide(index) {
        slides.forEach((slide, i) => {
            slide.classList.toggle('active', i === index);
        });
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === index);
        });
        currentIndex = index;
    }

    function nextSlide() {
        const next = (currentIndex + 1) % slides.length;
        goToSlide(next);
    }

    function prevSlide() {
        const prev = (currentIndex - 1 + slides.length) % slides.length;
        goToSlide(prev);
    }

    function startAutoplay() {
        stopAutoplay();
        autoplayInterval = setInterval(nextSlide, 5000);
    }

    function stopAutoplay() {
        if (autoplayInterval) {
            clearInterval(autoplayInterval);
        }
    }

    // Event listeners
    prevBtn?.addEventListener('click', () => {
        prevSlide();
        startAutoplay();
    });

    nextBtn?.addEventListener('click', () => {
        nextSlide();
        startAutoplay();
    });

    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            goToSlide(index);
            startAutoplay();
        });
    });

    // Pause on hover
    carousel.addEventListener('mouseenter', stopAutoplay);
    carousel.addEventListener('mouseleave', startAutoplay);

    // Start autoplay
    startAutoplay();
}

// Render secondary banners
function renderSecondaryBanners(banners) {
    if (!banners || banners.length === 0) return '';

    return `
    <section class="secondary-banners">
      ${banners.map(banner => `
        <div class="secondary-banner" style="background-image: url('${banner.image}')">
          <div class="secondary-banner-content">
            ${banner.eyebrow ? `<p class="eyebrow">${banner.eyebrow}</p>` : ''}
            <h3>${banner.title}</h3>
            ${banner.description ? `<p>${banner.description}</p>` : ''}
            ${banner.button_text ? `<a href="${banner.button_link || '#'}" class="btn secondary-btn">${banner.button_text}</a>` : ''}
          </div>
        </div>
      `).join('')}
    </section>
  `;
}

// Render promotional banners
function renderPromotionalBanners(banners) {
    if (!banners || banners.length === 0) return '';

    return `
    <section class="promotional-banners" id="promotional">
      ${banners.map(banner => `
        <div class="promo-banner" style="background-image: url('${banner.image}')">
          <div class="promo-banner-overlay"></div>
          <div class="promo-banner-content">
            ${banner.eyebrow ? `<span class="eyebrow">${banner.eyebrow}</span>` : ''}
            <h3>${banner.title}</h3>
            ${banner.subtitle ? `<p class="subtitle">${banner.subtitle}</p>` : ''}
            ${banner.description ? `<p>${banner.description}</p>` : ''}
            ${banner.button_text ? `<a href="${banner.button_link || '#'}" class="btn primary-btn">${banner.button_text}</a>` : ''}
          </div>
        </div>
      `).join('')}
    </section>
  `;
}

// Main initialization
async function initBanners() {
    const heroContainer = document.getElementById('heroContainer');
    const secondaryContainer = document.getElementById('secondaryBanners');
    const promoContainer = document.getElementById('promoBanners');

    // Get page context
    const page = getCurrentPageContext();

    // Load hero banners
    if (heroContainer) {
        const heroBanners = await loadBannersForPosition('homepage_hero', 5);
        heroContainer.innerHTML = renderHeroCarousel(heroBanners);
        initCarousel();
    }

    // Load secondary banners
    if (secondaryContainer) {
        const secondaryBanners = await loadBannersForPosition('homepage_secondary', 3);
        secondaryContainer.innerHTML = renderSecondaryBanners(secondaryBanners);
    }

    // Load promotional banners
    if (promoContainer) {
        const promoBanners = await loadBannersForPosition('promotional', 2);
        promoContainer.innerHTML = renderPromotionalBanners(promoBanners);
    }
}

// Export for use
window.BannerDisplay = {
    loadBannersForPosition,
    initBanners,
    isBannerActive
};

// Auto-initialize when DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBanners);
} else {
    initBanners();
}
