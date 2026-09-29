/**
 * BingeBlocker - Focus Mode Engine
 * Manages DOM modifications, layout state attributes, and learning placeholders.
 */

class BingeBlockerFocusEngine {
  constructor() {
    this.focusMode = false;
    this.settings = {
      hideShorts: true,
      hideComments: true,
      hideRecommendations: true,
      hideHomeFeed: true,
      hideEndScreen: true,
      defaultTimerDuration: 1500
    };
    this.whitelist = [];
    this.currentChannel = null;
    this.isCurrentWhitelisted = false;

    // Inspirational learning quotes
    this.quotes = [
      "\"Live as if you were to die tomorrow. Learn as if you were to live forever.\" — Mahatma Gandhi",
      "\"An investment in knowledge pays the best interest.\" — Benjamin Franklin",
      "\"The expert in anything was once a beginner.\" — Helen Hayes",
      "\"Focus is a superpower in a distracted world.\" — Cal Newport",
      "\"Small disciplines repeated with consistency every day lead to great achievements.\" — John C. Maxwell"
    ];
  }

  /**
   * Update internal state and re-apply
   */
  async updateState({ focusMode, settings, whitelist }) {
    if (typeof focusMode === 'boolean') this.focusMode = focusMode;
    if (settings) this.settings = { ...this.settings, ...settings };
    if (Array.isArray(whitelist)) this.whitelist = whitelist;

    await this.apply();
  }

  /**
   * Apply focus mode state to the document
   */
  async functionApply() {
    const targets = [document.documentElement, document.body].filter(Boolean);

    if (!this.focusMode) {
      this.revert();
      this.renderFloatingBar();
      return;
    }

    targets.forEach(el => {
      el.setAttribute('data-bingeblocker-focus', 'true');
      el.setAttribute('data-hide-shorts', this.settings.hideShorts ? 'true' : 'false');
      el.setAttribute('data-hide-comments', this.settings.hideComments ? 'true' : 'false');
      el.setAttribute('data-hide-recommendations', this.settings.hideRecommendations ? 'true' : 'false');
      el.setAttribute('data-hide-home-feed', this.settings.hideHomeFeed ? 'true' : 'false');
      el.setAttribute('data-hide-endscreen', this.settings.hideEndScreen ? 'true' : 'false');
    });

    // Evaluate channel whitelist for current page
    await this.evaluateChannelWhitelist();

    // Process page-specific adjustments
    this.processCurrentPage();

    // Render on-page floating control
    this.renderFloatingBar();
  }

  async apply() {
    return this.functionApply();
  }

  /**
   * Revert all focus mode modifications
   */
  revert() {
    const targets = [document.documentElement, document.body].filter(Boolean);
    targets.forEach(el => {
      el.removeAttribute('data-bingeblocker-focus');
      el.removeAttribute('data-hide-shorts');
      el.removeAttribute('data-hide-comments');
      el.removeAttribute('data-hide-recommendations');
      el.removeAttribute('data-hide-home-feed');
      el.removeAttribute('data-hide-endscreen');
      el.removeAttribute('data-bingeblocker-whitelisted');
    });

    // Remove any injected placeholders or indicators
    const homePlaceholder = document.getElementById('bingeblocker-home-placeholder');
    if (homePlaceholder) homePlaceholder.remove();

    const indicator = document.getElementById('bingeblocker-whitelist-badge');
    if (indicator) indicator.remove();

    this.renderFloatingBar();
  }

  /**
   * Render or update the on-page floating status bar
   */
  renderFloatingBar() {
    let bar = document.getElementById('bingeblocker-floating-control');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'bingeblocker-floating-control';
      bar.className = 'bingeblocker-floating-bar';
      document.body.appendChild(bar);
    }

    const isOn = this.focusMode;
    bar.innerHTML = `
      <div class="bingeblocker-float-pill ${isOn ? '' : 'off'}">
        <span>${isOn ? '🎯' : '💤'}</span>
        <span>Focus ${isOn ? 'ON' : 'OFF'}</span>
      </div>
      <button type="button" class="bingeblocker-float-toggle ${isOn ? '' : 'off'}" id="bingeblocker-btn-toggle-float">
        ${isOn ? 'Pause' : 'Activate'}
      </button>
    `;

    const toggleBtn = bar.querySelector('#bingeblocker-btn-toggle-float');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const newState = !this.focusMode;
        if (typeof globalThis.sendRuntimeMessage === 'function') {
          await globalThis.sendRuntimeMessage({
            type: (globalThis.MESSAGE_TYPES && globalThis.MESSAGE_TYPES.TOGGLE_FOCUS_MODE) || 'BINGEBLOCKER_TOGGLE_FOCUS_MODE',
            enabled: newState
          });
        }
        await this.updateState({ focusMode: newState });
      });
    }
  }

  /**
   * Extract current video/channel info from YouTube DOM
   * @returns {{ name: string, identifier: string, handle: string }}
   */
  detectCurrentChannel() {
    let name = '';
    let handle = '';
    let identifier = '';

    const pathname = window.location.pathname;

    // 1. Check Channel Page (e.g. youtube.com/@ChannelName or /channel/UC...)
    if (pathname.startsWith('/@') || pathname.startsWith('/channel/') || pathname.startsWith('/c/')) {
      const parts = pathname.split('/').filter(Boolean);
      if (parts[0] && parts[0].startsWith('@')) {
        handle = parts[0];
        identifier = handle.toLowerCase();
        name = handle.slice(1);
      } else if (parts[0] === 'channel' && parts[1]) {
        identifier = parts[1].toLowerCase();
        name = parts[1];
      }

      // Try reading channel name from page header
      const headerElem = document.querySelector('ytd-channel-name#channel-header-name, ytd-c4-tabbed-header-renderer #channel-name, #channel-header yt-formatted-string');
      if (headerElem && headerElem.textContent) {
        name = headerElem.textContent.trim();
      }
    }

    // 2. Check Watch Page (youtube.com/watch?v=...)
    if (pathname.includes('/watch')) {
      const ownerLink = document.querySelector('#owner #channel-name a, ytd-video-owner-renderer #channel-name a, #upload-info #channel-name a');
      if (ownerLink) {
        name = ownerLink.textContent.trim();
        const href = ownerLink.getAttribute('href') || '';
        if (href.startsWith('/@')) {
          handle = href.split('/')[1] || href;
          identifier = handle.toLowerCase();
        } else if (href.includes('/channel/')) {
          identifier = href.split('/channel/')[1] || '';
        }
      }
    }

    // If identifier is missing but name exists, use normalized name
    if (!identifier && name) {
      identifier = name.toLowerCase().replace(/\s+/g, '');
    }

    return { name, identifier, handle };
  }

  /**
   * Evaluate if current channel is whitelisted
   */
  async evaluateChannelWhitelist() {
    this.currentChannel = this.detectCurrentChannel();
    const docEl = document.documentElement;

    if (!this.currentChannel.name && !this.currentChannel.identifier) {
      this.isCurrentWhitelisted = false;
      if (docEl) docEl.removeAttribute('data-bingeblocker-whitelisted');
      return;
    }

    const targetName = this.currentChannel.name.toLowerCase().trim();
    const targetId = this.currentChannel.identifier.toLowerCase().trim();
    const targetHandle = (this.currentChannel.handle || '').toLowerCase().trim();

    this.isCurrentWhitelisted = this.whitelist.some(item => {
      const itemName = (item.name || '').toLowerCase().trim();
      const itemId = (item.identifier || '').toLowerCase().trim();
      const itemHandle = (item.handle || '').toLowerCase().trim();

      if (targetHandle && itemHandle && (targetHandle === itemHandle || targetHandle === itemId)) return true;
      if (targetId && (itemId === targetId || itemHandle === targetId)) return true;
      if (targetName && (itemName === targetName || itemId === targetName)) return true;
      return false;
    });

    if (this.isCurrentWhitelisted) {
      if (docEl) docEl.setAttribute('data-bingeblocker-whitelisted', 'true');
      this.injectWhitelistIndicator();
    } else {
      if (docEl) docEl.removeAttribute('data-bingeblocker-whitelisted');
      const badge = document.getElementById('bingeblocker-whitelist-badge');
      if (badge) badge.remove();
    }
  }

  /**
   * Process page specific adjustments (Home feed placeholder, search focus)
   */
  processCurrentPage() {
    const isHome = window.location.pathname === '/' || window.location.pathname === '';
    const isWatch = window.location.pathname.includes('/watch');

    if (isHome && this.focusMode && this.settings.hideHomeFeed) {
      this.injectHomePlaceholder();
    } else {
      const homePlaceholder = document.getElementById('bingeblocker-home-placeholder');
      if (homePlaceholder) homePlaceholder.remove();
    }

    if (isWatch && this.isCurrentWhitelisted) {
      this.injectWhitelistIndicator();
    }
  }

  /**
   * Inject friendly learning hub placeholder into YouTube homepage
   */
  injectHomePlaceholder() {
    if (document.getElementById('bingeblocker-home-placeholder')) return;

    const targetContainer = document.querySelector('ytd-browse[page-subtype="home"] #primary, ytd-browse[page-subtype="home"]');
    if (!targetContainer) return;

    const randomQuote = this.quotes[Math.floor(Math.random() * this.quotes.length)];

    const placeholder = document.createElement('div');
    placeholder.id = 'bingeblocker-home-placeholder';
    placeholder.className = 'bingeblocker-home-container';

    // Build whitelisted channels quick chips
    let channelsHtml = '';
    if (this.whitelist && this.whitelist.length > 0) {
      const chips = this.whitelist.slice(0, 8).map(ch => {
        const link = ch.identifier.startsWith('@')
          ? `https://www.youtube.com/${ch.identifier}`
          : (ch.identifier.startsWith('uc') || ch.identifier.startsWith('UC')
              ? `https://www.youtube.com/channel/${ch.identifier}`
              : `https://www.youtube.com/@${encodeURIComponent(ch.name.replace(/\s+/g, ''))}`);
        return `<a href="${link}" class="bingeblocker-chip-link">📚 ${ch.name}</a>`;
      }).join('');

      channelsHtml = `
        <div class="bingeblocker-channels-quick">
          <div class="bingeblocker-channels-title">Your Whitelisted Channels</div>
          <div class="bingeblocker-chips-grid">
            ${chips}
          </div>
        </div>
      `;
    }

    placeholder.innerHTML = `
      <div class="bingeblocker-card">
        <div class="bingeblocker-badge-pill">
          <span>🎯</span> Focus Mode Active
        </div>
        <h1 class="bingeblocker-title">Transforming YouTube into a Learning Space</h1>
        <p class="bingeblocker-subtitle">Infinite feeds and distractions are paused so you can learn with intention.</p>

        <div class="bingeblocker-quote-box">
          ${randomQuote}
        </div>

        <div class="bingeblocker-actions">
          <button type="button" class="bingeblocker-btn-search" id="bingeblocker-btn-focus-search">
            <span>🔍</span> Search for what you want to learn
          </button>
        </div>

        ${channelsHtml}
      </div>
    `;

    targetContainer.prepend(placeholder);

    // Attach search focus button action
    const searchBtn = placeholder.querySelector('#bingeblocker-btn-focus-search');
    if (searchBtn) {
      searchBtn.addEventListener('click', () => {
        const searchInput = document.querySelector('input#search, input[name="search_query"]');
        if (searchInput) {
          searchInput.focus();
          searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
    }
  }

  /**
   * Inject Whitelisted status pill on watch page
   */
  injectWhitelistIndicator() {
    if (document.getElementById('bingeblocker-whitelist-badge')) return;

    const titleContainer = document.querySelector('#title h1, ytd-watch-metadata #title, #above-the-fold #title');
    if (!titleContainer) return;

    const badge = document.createElement('div');
    badge.id = 'bingeblocker-whitelist-badge';
    badge.className = 'bingeblocker-whitelist-indicator';
    badge.innerHTML = `<span>⭐</span> Whitelisted Channel: <strong>${this.currentChannel.name || 'Learning Content'}</strong> (Unrestricted)`;

    titleContainer.parentNode.insertBefore(badge, titleContainer);
  }
}

// Attach to window for global access in content script
if (typeof window !== 'undefined') {
  window.BingeBlockerFocusEngine = BingeBlockerFocusEngine;
}
