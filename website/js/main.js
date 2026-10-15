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
          labelSpan.textContent = 'Add to Chrome — It’s Free';
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

    if (!menuToggle) return;

    function openDrawer() {
      menuToggle.setAttribute('aria-expanded', 'true');
      menuToggle.classList.add('is-open');
      if (drawer) {
        drawer.classList.add('active');
        drawer.setAttribute('aria-hidden', 'false');
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
     3. FAQ Accordion
     ========================================================================== */
  function initFAQ() {
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

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
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
});
