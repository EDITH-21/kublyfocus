/**
 * Knolect - Installation Page & Tutorial Engine
 * Manages one-click browser install detection, pre-launch/store listing states,
 * privacy-conscious video player / placeholder, and FAQ accordions.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const browserTabs = document.querySelectorAll('.browser-tab');
  const installCtaBtn = document.getElementById('primary-install-cta');
  const installCtaLabel = document.getElementById('install-cta-label');
  const browserIconImg = document.getElementById('selected-browser-icon');
  const browserNameHeading = document.getElementById('selected-browser-name');
  const unsupportedBanner = document.getElementById('unsupported-browser-banner');
  const unsupportedReason = document.getElementById('unsupported-reason-text');
  const prelaunchBox = document.getElementById('install-prelaunch-box');
  const notifyForm = document.getElementById('prelaunch-notify-form');
  const notifyMsg = document.getElementById('prelaunch-notify-msg');

  // Video Elements
  const videoWrapper = document.getElementById('video-frame-wrapper');
  const videoPosterView = document.getElementById('video-poster-view');
  const videoPlayBtn = document.getElementById('video-play-btn');
  const videoPlayerContainer = document.getElementById('video-player-container');
  const videoPlaceholderNotice = document.getElementById('video-placeholder-notice');

  // FAQ Elements
  const faqItems = document.querySelectorAll('.faq-item');

  // Browser metadata
  const browserData = {
    chrome: {
      name: 'Google Chrome',
      shortName: 'Chrome',
      icon: 'assets/icons/chrome.svg',
      storeName: 'Chrome Web Store'
    },
    edge: {
      name: 'Microsoft Edge',
      shortName: 'Edge',
      icon: 'assets/icons/edge.svg',
      storeName: 'Chrome Web Store'
    },
    brave: {
      name: 'Brave Browser',
      shortName: 'Brave',
      icon: 'assets/icons/brave.svg',
      storeName: 'Chrome Web Store'
    },
    opera: {
      name: 'Opera',
      shortName: 'Opera',
      icon: 'assets/icons/opera.svg',
      storeName: 'Chrome Web Store'
    }
  };

  let activeBrowserKey = 'chrome';

  /**
   * Set active browser tab and update UI
   */
  function updateBrowserUI(browserKey) {
    activeBrowserKey = browserData[browserKey] ? browserKey : 'chrome';
    const config = browserData[activeBrowserKey];

    // Update active tab buttons
    browserTabs.forEach(tab => {
      const isTarget = tab.getAttribute('data-browser') === activeBrowserKey;
      tab.classList.toggle('active', isTarget);
      tab.setAttribute('aria-selected', isTarget ? 'true' : 'false');
    });

    // Update icon and titles
    if (browserIconImg) {
      browserIconImg.src = config.icon;
      browserIconImg.alt = `${config.name} Logo`;
    }
    if (browserNameHeading) {
      browserNameHeading.textContent = `Install Knolect for ${config.shortName}`;
    }

    // Update CTA button based on store config
    if (window.getInstallTarget && installCtaBtn) {
      const target = window.getInstallTarget(activeBrowserKey);

      if (target.isLive) {
        installCtaBtn.href = target.url;
        installCtaBtn.target = '_blank';
        installCtaBtn.rel = 'noopener noreferrer';
        if (installCtaLabel) installCtaLabel.textContent = `Add to ${config.shortName}`;
        if (prelaunchBox) prelaunchBox.style.display = 'none';
      } else {
        // Pre-launch publication-ready state
        installCtaBtn.href = '#prelaunch-notify-box';
        installCtaBtn.removeAttribute('target');
        installCtaBtn.removeAttribute('rel');
        if (installCtaLabel) installCtaLabel.textContent = `Add to ${config.shortName} (Pre-launch)`;
        if (prelaunchBox) prelaunchBox.style.display = 'flex';
      }
    }
  }

  // Bind browser tab clicks
  browserTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const bKey = tab.getAttribute('data-browser');
      updateBrowserUI(bKey);
    });
  });

  // Initial browser detection
  if (window.detectBrowser) {
    const detected = window.detectBrowser();

    if (!detected.isSupported && unsupportedBanner) {
      unsupportedBanner.classList.remove('hidden');
      if (unsupportedReason) {
        unsupportedReason.textContent = detected.reason || 'Knolect is designed for desktop Chromium browsers.';
      }
    }

    if (browserData[detected.name]) {
      updateBrowserUI(detected.name);
    } else {
      updateBrowserUI('chrome');
    }
  } else {
    updateBrowserUI('chrome');
  }

  // Pre-launch notify form handler
  if (notifyForm) {
    notifyForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = notifyForm.querySelector('.prelaunch-notify-input');
      if (input && input.value && input.value.includes('@')) {
        if (notifyMsg) {
          notifyMsg.textContent = "✓ Thank you! You're on the early-access list for the Chrome Web Store release.";
          notifyMsg.style.display = 'block';
        }
        input.value = '';
      }
    });
  }

  // =========================================================================
  // Video Tutorial Controller
  // =========================================================================
  function initVideoPlayer() {
    const videoConfig = window.TUTORIAL_VIDEO || {};
    const ytId = (videoConfig.youtubeVideoId || '').trim();
    const hostedUrl = (videoConfig.hostedVideoUrl || '').trim();

    function handlePlayClick() {
      if (ytId) {
        // Privacy-conscious YouTube embed (zero requests until user clicks Play)
        const iframe = document.createElement('iframe');
        iframe.className = 'video-player-frame active';
        iframe.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(ytId)}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1`;
        iframe.title = videoConfig.title || 'Knolect Tutorial Video';
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
        iframe.allowFullscreen = true;

        if (videoPlayerContainer) {
          videoPlayerContainer.innerHTML = '';
          videoPlayerContainer.appendChild(iframe);
        }
        if (videoPosterView) {
          videoPosterView.style.display = 'none';
        }
      } else if (hostedUrl) {
        // Direct HTML5 video with controls and captions
        const video = document.createElement('video');
        video.className = 'video-player-frame active';
        video.src = hostedUrl;
        video.controls = true;
        video.autoplay = true;
        video.playsInline = true;
        video.title = videoConfig.title || 'Knolect Tutorial Video';

        if (videoConfig.captionsUrl) {
          const track = document.createElement('track');
          track.kind = 'captions';
          track.label = 'English';
          track.srclang = 'en';
          track.src = videoConfig.captionsUrl;
          track.default = true;
          video.appendChild(track);
        }

        if (videoPlayerContainer) {
          videoPlayerContainer.innerHTML = '';
          videoPlayerContainer.appendChild(video);
        }
        if (videoPosterView) {
          videoPosterView.style.display = 'none';
        }
      } else {
        // No live video asset configured yet — show elegant developer instructions
        if (videoPlaceholderNotice) {
          videoPlaceholderNotice.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          videoPlaceholderNotice.style.animation = 'none';
          void videoPlaceholderNotice.offsetWidth; // Trigger reflow
          videoPlaceholderNotice.style.animation = 'pulseGold 1s ease';
        }
      }
    }

    if (videoPlayBtn) {
      videoPlayBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        handlePlayClick();
      });
      // Keyboard accessible
      videoPlayBtn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handlePlayClick();
        }
      });
    }

    if (videoPosterView) {
      videoPosterView.addEventListener('click', handlePlayClick);
    }
  }

  initVideoPlayer();

  // =========================================================================
  // FAQ Accordion Controller
  // =========================================================================
  faqItems.forEach(item => {
    const questionBtn = item.querySelector('.faq-question');
    if (questionBtn) {
      questionBtn.addEventListener('click', () => {
        const isOpen = item.classList.contains('open');

        // Close all other items for clean accordion behavior
        faqItems.forEach(other => {
          if (other !== item) {
            other.classList.remove('open');
            const otherBtn = other.querySelector('.faq-question');
            if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
          }
        });

        // Toggle current item
        item.classList.toggle('open', !isOpen);
        questionBtn.setAttribute('aria-expanded', !isOpen ? 'true' : 'false');
      });
    }
  });
});
