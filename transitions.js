/**
 * Page Transition System for Hodo E-commerce
 * Provides smooth fade transitions between page navigations
 */

(function () {
  "use strict";

  // Create transition overlay
  const overlay = document.createElement("div");
  overlay.className = "page-transition-overlay";
  document.body.appendChild(overlay);

  // Wrap main content in a container for animations
  function wrapContent() {
    const wrapper = document.createElement("div");
    wrapper.className = "page-content fade-in";

    // Move all body children (except overlay) into wrapper
    while (document.body.firstChild) {
      if (document.body.firstChild !== overlay) {
        wrapper.appendChild(document.body.firstChild);
      } else {
        break;
      }
    }

    // Also move any remaining siblings after overlay
    let nextSibling = overlay.nextSibling;
    while (nextSibling) {
      const toMove = nextSibling;
      nextSibling = nextSibling.nextSibling;
      wrapper.appendChild(toMove);
    }

    document.body.insertBefore(wrapper, overlay);

    return wrapper;
  }

  // Initialize on DOM ready
  let contentWrapper = null;

  function init() {
    contentWrapper = document.querySelector(".page-content") || wrapContent();

    // Handle all link clicks for smooth transitions
    document.addEventListener("click", handleLinkClick, true);

    // Handle browser back/forward
    window.addEventListener("popstate", handlePopState);
  }

  function handleLinkClick(e) {
    // Find the closest anchor tag
    const link = e.target.closest("a");

    if (!link) return;

    const href = link.getAttribute("href");

    // Skip if no href, external links, anchors, or javascript
    if (
      !href ||
      href.startsWith("http") ||
      href.startsWith("#") ||
      href.startsWith("javascript:") ||
      href.startsWith("mailto:") ||
      href.startsWith("tel:")
    ) {
      return;
    }

    // Skip if modifier key is pressed (open in new tab, etc.)
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
      return;
    }

    // Skip if target is specified
    if (link.hasAttribute("target") && link.getAttribute("target") !== "_self") {
      return;
    }

    // Prevent default navigation
    e.preventDefault();
    e.stopPropagation();

    // Resolve the URL properly - use the link's resolved href property
    // This ensures relative URLs are resolved correctly relative to current page
    const resolvedUrl = link.href || new URL(href, window.location.href).href;

    // Navigate with transition
    navigateTo(resolvedUrl);
  }

  function navigateTo(url) {
    // Add fade-out class to content
    if (contentWrapper) {
      contentWrapper.classList.add("fade-out");
      contentWrapper.classList.remove("fade-in");
    }

    // Show overlay
    overlay.classList.add("active");

    // Navigate after transition
    setTimeout(() => {
      // Store scroll position
      sessionStorage.setItem("scrollPos", window.scrollY);
      sessionStorage.setItem("previousPage", window.location.href);

      // Navigate to new page - url is already resolved
      window.location.href = url;
    }, 200);
  }

  function handlePopState() {
    // The page will reload, but we can add a quick transition
    if (contentWrapper) {
      contentWrapper.classList.add("fade-out");
    }
    overlay.classList.add("active");
  }

  // Run initialization
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // Expose navigation function globally
  window.HodoNavigate = navigateTo;
})();
