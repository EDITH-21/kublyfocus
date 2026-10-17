/**
 * Knolect — Official Product Script
 * Connects CTAs to centralized config, handles FAQ accordion, accessible mobile navigation drawer, and smooth interactions.
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  /* ==========================================================================
     1. Centralized CTA & Store Link Binding
     ========================================================================== */
  function bindInstallCTAs() {
    const ctaButtons = document.querySelectorAll('.js-install-cta');
    const browser = window.detectBrowser ? window.detectBrowser() : { name: 'chrome', label: 'Chrome', isChromium: true };
    const target = window.getInstallTarget ? window.getInstallTarget() : { url: 'install.html', isDirectStore: false, label: 'Add to Chrome' };

    ctaButtons.forEach(btn => {
      btn.setAttribute('href', target.url);
      if (target.isDirectStore) {
        btn.setAttribute('target', '_blank');
        btn.setAttribute('rel', 'noopener noreferrer');
      }

      // Update button text if it has a dynamic label placeholder
      const labelSpan = btn.querySelector('.js-cta-label');
      if (labelSpan) {
        if (target.isDirectStore) {
          labelSpan.textContent = `Add to ${browser.label}`;
        } else {
          labelSpan.textContent = 'Get Early Access';
        }
      }
    });

    // Update browser badge if present
    const browserBadge = document.getElementById('user-browser-badge');
    if (browserBadge) {
      if (browser.isChromium) {
        browserBadge.textContent = `Available for ${browser.label} & Chromium`;
      } else {
        browserBadge.textContent = 'Optimized for Chromium browsers (Chrome, Edge, Brave, Opera)';
      }
    }
  }

  bindInstallCTAs();

  /* ==========================================================================
     2. Accessible Mobile Navigation Drawer
     ========================================================================== */
  function initMobileNavigation() {
    const menuToggle = document.getElementById('mobile-menu-toggle');
    const drawer = document.getElementById('mobile-nav-drawer');
    const backdrop = document.getElementById('mobile-menu-backdrop');

    // Initialize drawer as non-focusable when closed
    if (drawer) {
      drawer.setAttribute('aria-hidden', 'true');
      drawer.setAttribute('inert', '');
    }

    function openDrawer() {
      menuToggle.setAttribute('aria-expanded', 'true');
      menuToggle.classList.add('is-open');
      if (drawer) {
        drawer.classList.add('active');
        drawer.setAttribute('aria-hidden', 'false');
        drawer.removeAttribute('inert');
      }
      if (backdrop) {
        backdrop.classList.add('active');
        backdrop.setAttribute('aria-hidden', 'false');
      }
      document.body.classList.add('mobile-nav-open');
    }

    function closeDrawer() {
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.classList.remove('is-open');
      if (drawer) {
        drawer.classList.remove('active');
        drawer.setAttribute('aria-hidden', 'true');
        drawer.setAttribute('inert', '');
      }
      if (backdrop) {
        backdrop.classList.remove('active');
        backdrop.setAttribute('aria-hidden', 'true');
      }
      document.body.classList.remove('mobile-nav-open');
    }

    menuToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
      if (isExpanded) {
        closeDrawer();
      } else {
        openDrawer();
      }
    });

    if (backdrop) {
      backdrop.addEventListener('click', () => {
        closeDrawer();
      });
    }

    // Close on link click inside drawer
    if (drawer) {
      drawer.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
          closeDrawer();
        });
      });
    }

    // Close on Escape key press
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menuToggle.getAttribute('aria-expanded') === 'true') {
        closeDrawer();
        menuToggle.focus();
      }
    });

    // Auto close drawer if resized beyond tablet breakpoint (1024px)
    window.addEventListener('resize', () => {
      if (window.innerWidth > 1024 && menuToggle.getAttribute('aria-expanded') === 'true') {
        closeDrawer();
      }
    });
  }

  initMobileNavigation();

  /* ==========================================================================
     3. FAQ Accordion (Semantic Details Progressive Enhancement)
     ========================================================================== */
  function initFAQ() {
    const faqDetails = document.querySelectorAll('details.faq-item');
    if (faqDetails.length > 0) {
      faqDetails.forEach(detail => {
        detail.addEventListener('toggle', () => {
          if (detail.open) {
            faqDetails.forEach(other => {
              if (other !== detail && other.open) {
                other.removeAttribute('open');
              }
            });
          }
        });
      });
      return;
    }

    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
      const questionBtn = item.querySelector('.faq-question-btn');
      if (questionBtn) {
        questionBtn.addEventListener('click', () => {
          const isActive = item.classList.contains('active');

          // Close other items
          faqItems.forEach(other => {
            if (other !== item) {
              other.classList.remove('active');
              const otherBtn = other.querySelector('.faq-question-btn');
              if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
            }
          });

          // Toggle current item
          if (isActive) {
            item.classList.remove('active');
            questionBtn.setAttribute('aria-expanded', 'false');
          } else {
            item.classList.add('active');
            questionBtn.setAttribute('aria-expanded', 'true');
          }
        });
      }
    });
  }

  initFAQ();

  /* ==========================================================================
     4. Smooth Scroll for Anchor Links with Header Offset
     ========================================================================== */
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        const targetId = this.getAttribute('href');
        if (!targetId || targetId === '#') return;

        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          e.preventDefault();
          const navElement = document.querySelector('.navbar');
          const navHeight = navElement ? navElement.offsetHeight : 72;
          const elementPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;
          const offsetPosition = elementPosition - navHeight - 12;

          const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

          window.scrollTo({
            top: offsetPosition,
            behavior: prefersReducedMotion ? 'auto' : 'smooth'
          });

          // Update URL hash without jump
          if (history.pushState) {
            history.pushState(null, null, targetId);
          }
        }
      });
    });
  }

  initSmoothScroll();

  /* ==========================================================================
     5. Navbar Appearance on Scroll (Subtle Elevation Transition)
     ========================================================================== */
  function initNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    let ticking = false;
    function updateNavbarElevation() {
      if (window.pageYOffset > 10) {
        navbar.classList.add('navbar-scrolled');
      } else {
        navbar.classList.remove('navbar-scrolled');
      }
      ticking = false;
    }

    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(updateNavbarElevation);
        ticking = true;
      }
    }, { passive: true });

    // Initial check in case page is reloaded when scrolled
    updateNavbarElevation();
  }

  initNavbarScroll();

  /* ==========================================================================
     6. Scroll-Triggered Content Reveal Animations (Progressive Enhancement)
     ========================================================================== */
  function initScrollReveals() {
    // Respect user reduced motion preference
    const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      return; // Elements remain in their natural visible state
    }

    if (!('IntersectionObserver' in window)) {
      return; // Graceful fallback: all elements remain visible
    }

    // Enable CSS hidden styles only when JS and IntersectionObserver are confirmed active
    document.documentElement.classList.add('js-reveal-enabled');

    // Canonical list of elements and components to reveal across public pages
    const revealSelectors = [
      '.hero-content',
      '.hero-visual-card',
      '.section-header',
      '.problem-editorial-grid',
      '.problem-card',
      '.lead-feature-banner',
      '.features-grid',
      '.feature-card',
      '.steps-grid',
      '.step-card',
      '.browser-cards-grid',
      '.browser-card',
      '.privacy-grid',
      '.privacy-card',
      '.faq-accordion',
      '.faq-item',
      '.knolect-focus-showcase',
      '.knolect-visual-box',
      '.transformation-card',
      '.focus-timeline-strip',
      '.cta-section .container',
      '.footer-brand-hero',
      '.footer-col-nav',
      '.about-hero-content',
      '.about-mission-card',
      '.about-narrative-copy',
      '.about-visual-panel',
      '.principles-grid',
      '.principle-card',
      '.feature-status-banner',
      '.team-grid',
      '.team-card',
      '.team-careers-banner',
      '.install-header',
      '.browser-tabs',
      '.install-step-card',
      '.support-grid > *'
    ];

    const elementsToReveal = document.querySelectorAll(revealSelectors.join(', '));
    if (elementsToReveal.length === 0) return;

    // Grid parents that stagger child reveals
    const staggerGridSelectors = [
      '.features-grid',
      '.steps-grid',
      '.browser-cards-grid',
      '.problem-editorial-grid',
      '.privacy-grid',
      '.team-grid',
      '.principles-grid',
      '.knolect-focus-showcase',
      '.footer-master-grid'
    ];

    elementsToReveal.forEach(el => {
      el.classList.add('reveal-on-scroll');

      // Check if inside a staggered grid
      const parentGrid = el.closest(staggerGridSelectors.join(', '));
      if (parentGrid && parentGrid !== el) {
        const siblings = Array.from(parentGrid.children);
        const index = siblings.indexOf(el);
        if (index >= 0) {
          // Stagger delay between 60ms and 280ms
          const delay = Math.min((index % 6) * 70, 350);
          el.style.transitionDelay = `${delay}ms`;
        }
      }
    });

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          obs.unobserve(entry.target); // Reveal once, no repeated triggers on scroll
        }
      });
    }, {
      root: null,
      rootMargin: '0px 0px -40px 0px',
      threshold: 0.12
    });

    elementsToReveal.forEach(el => observer.observe(el));
  }

  initScrollReveals();
});
