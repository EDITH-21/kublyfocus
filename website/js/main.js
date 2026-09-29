/**
 * BingeBlocker - Main Website Script
 * Connects CTAs to centralized config, handles FAQ accordion, mobile nav, and smooth interactions.
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
        browserBadge.textContent = 'Optimized for Chromium browsers (Chrome, Edge, Brave)';
      }
    }
  }

  bindInstallCTAs();

  /* ==========================================================================
     2. Mobile Navigation Toggle
     ========================================================================== */
  const menuToggle = document.getElementById('mobile-menu-toggle');
  const navLinks = document.getElementById('nav-links');

  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => {
      navLinks.classList.toggle('mobile-active');
      const isExpanded = navLinks.classList.contains('mobile-active');
      menuToggle.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
    });

    // Close mobile menu when a nav link is clicked
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('mobile-active');
        menuToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ==========================================================================
     3. FAQ Accordion
     ========================================================================== */
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

  /* ==========================================================================
     4. Smooth Scroll for Anchor Links
     ========================================================================== */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;

      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        e.preventDefault();
        const navHeight = 80;
        const elementPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;
        window.scrollTo({
          top: elementPosition - navHeight,
          behavior: 'smooth'
        });
      }
    });
  });
});
