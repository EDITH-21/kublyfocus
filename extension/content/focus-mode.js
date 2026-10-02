/**
 * Knolect - Focus Mode & Strict Focus Engine
 * Enforces allowlist-first access control for verified Learning Channels,
 * blocks search exploration, pauses non-learning videos, and renders clean study spaces.
 */

class KnolectFocusEngine {
  constructor() {
    this.focusMode = true;
    this.strictFocus = true;
    this.settings = {
      hideShorts: true,
      hideComments: true,
      hideRecommendations: true,
      hideHomeFeed: true,
      hideEndScreen: true,
      blockSearch: true,
      defaultTimerDuration: 1500
    };
    this.learningChannels = [];
    this.currentChannel = { name: '', identifier: '', handle: '', normalizedHandle: '', channelId: '' };
    this.isCurrentLearningApproved = false;
    this.currentClassification = null;
    this.detectionRetryCount = 0;
    this.detectionTimer = null;

    // Inspirational learning quotes
    this.quotes = [
      "\"Live as if you were to die tomorrow. Learn as if you were to live forever.\" — Mahatma Gandhi",
      "\"An investment in knowledge pays the best interest.\" — Benjamin Franklin",
      "\"The expert in anything was once a beginner.\" — Helen Hayes",
      "\"Focus is a superpower in a distracted world.\" — Cal Newport",
      "\"Small disciplines repeated with consistency every day lead to great achievements.\" — John C. Maxwell",
      "\"Concentrate all your thoughts upon the work in hand. The sun's rays do not burn until brought to a focus.\" — Alexander Graham Bell",
      "\"Education is not the learning of facts, but the training of the mind to think.\" — Albert Einstein"
    ];
  }

  /**
   * Update internal state and re-enforce
   */
  async updateState({ focusMode, strictFocus, settings, learningChannels, whitelist }) {
    if (typeof focusMode === 'boolean') this.focusMode = focusMode;
    if (typeof strictFocus === 'boolean') this.strictFocus = strictFocus;
    if (settings) this.settings = { ...this.settings, ...settings };
    if (Array.isArray(learningChannels)) {
      this.learningChannels = learningChannels;
    } else if (Array.isArray(whitelist)) {
      this.learningChannels = whitelist;
    }

    await this.apply();
  }

  /**
   * Master enforcement method
   */
  async apply() {
    const targets = [document.documentElement, document.body].filter(Boolean);

    if (!this.focusMode) {
      this.revert();
      this.renderFloatingBar();
      return;
    }

    // Set attributes for CSS-driven distraction removal
    targets.forEach(el => {
      el.setAttribute('data-knolect-focus', 'true');
      el.setAttribute('data-knolect-strict', this.strictFocus ? 'true' : 'false');
      el.setAttribute('data-hide-shorts', this.settings.hideShorts ? 'true' : 'false');
      el.setAttribute('data-hide-comments', this.settings.hideComments ? 'true' : 'false');
      el.setAttribute('data-hide-recommendations', this.settings.hideRecommendations ? 'true' : 'false');
      el.setAttribute('data-hide-home-feed', this.settings.hideHomeFeed ? 'true' : 'false');
      el.setAttribute('data-hide-endscreen', this.settings.hideEndScreen ? 'true' : 'false');
    });

    // Evaluate channel learning approval
    await this.evaluateChannelLearningApproval();

    // Enforce URL & Page-Specific Rules (Strict Focus Allowlist)
    this.enforcePageRules();

    // Render floating on-page widget
    this.renderFloatingBar();
  }

  /**
   * Revert all Knolect modifications
   */
  revert() {
    const targets = [document.documentElement, document.body].filter(Boolean);
    targets.forEach(el => {
      el.removeAttribute('data-knolect-focus');
      el.removeAttribute('data-knolect-strict');
      el.removeAttribute('data-hide-shorts');
      el.removeAttribute('data-hide-comments');
      el.removeAttribute('data-hide-recommendations');
      el.removeAttribute('data-hide-home-feed');
      el.removeAttribute('data-hide-endscreen');
      el.removeAttribute('data-knolect-whitelisted');
      el.removeAttribute('data-knolect-learning-approved');
    });

    // Remove block screens & placeholders
    this.removeBlockScreen();

    const homePlaceholder = document.getElementById('knolect-home-placeholder');
    if (homePlaceholder) homePlaceholder.remove();

    const indicator = document.getElementById('knolect-whitelist-badge');
    if (indicator) indicator.remove();

    this.renderFloatingBar();
  }

  /**
   * Extract channel metadata with comprehensive fallback selectors
   */
  detectCurrentChannel() {
    let name = '';
    let handle = '';
    let channelId = '';
    let videoTitle = '';

    const pathname = window.location.pathname;

    // 1. Channel Page (e.g. /@handle or /channel/UC... or /c/...)
    if (pathname.startsWith('/@') || pathname.startsWith('/channel/') || pathname.startsWith('/c/')) {
      const parts = pathname.split('/').filter(Boolean);
      if (parts[0] && parts[0].startsWith('@')) {
        handle = parts[0];
        name = handle.slice(1);
      } else if (parts[0] === 'channel' && parts[1]) {
        channelId = parts[1];
      }

      const headerElem = document.querySelector('ytd-channel-name#channel-header-name, ytd-c4-tabbed-header-renderer #channel-name, #channel-header yt-formatted-string, ytd-tabbed-page-header ytd-channel-name');
      if (headerElem && headerElem.textContent) {
        name = headerElem.textContent.trim();
      }
    }

    // 2. Watch Page (/watch?v=...)
    if (pathname.includes('/watch')) {
      // Channel link & handle
      const ownerLink = document.querySelector('#owner #channel-name a, ytd-video-owner-renderer #channel-name a, #upload-info #channel-name a, ytd-channel-name a, ytd-watch-metadata #owner a');
      if (ownerLink) {
        name = ownerLink.textContent.trim();
        const href = ownerLink.getAttribute('href') || '';
        if (href.startsWith('/@')) {
          handle = href.split('/')[1] || href;
        } else if (href.includes('/channel/')) {
          channelId = href.split('/channel/')[1] || '';
        }
      }

      // Meta tag fallbacks (often available immediately in DOM)
      if (!channelId) {
        const metaChId = document.querySelector('meta[itemprop="channelId"]');
        if (metaChId) channelId = metaChId.getAttribute('content') || '';
      }
      if (!name) {
        const metaAuthor = document.querySelector('span[itemprop="author"] link[itemprop="name"], meta[itemprop="name"]');
        if (metaAuthor) name = metaAuthor.getAttribute('content') || '';
      }

      // Video title
      const titleEl = document.querySelector('ytd-watch-metadata #title h1, h1.title, #container > h1 > yt-formatted-string');
      if (titleEl) {
        videoTitle = titleEl.textContent.trim();
      }
    }

    const resolved = (typeof globalThis.resolveChannelIdentity === 'function')
      ? globalThis.resolveChannelIdentity({ name, handle, channelId })
      : { name, handle, channelId, normalizedHandle: (handle || '').replace(/^@/, '').toLowerCase() };

    return {
      ...resolved,
      videoTitle
    };
  }

  /**
   * Evaluate whether the active channel is approved for learning
   */
  async evaluateChannelLearningApproval() {
    this.currentChannel = this.detectCurrentChannel();
    const docEl = document.documentElement;

    // If channel metadata is not yet populated on watch page, schedule a quick retry
    if (window.location.pathname.includes('/watch') && !this.currentChannel.name && !this.currentChannel.handle && !this.currentChannel.channelId) {
      if (this.detectionRetryCount < 5) {
        this.detectionRetryCount++;
        clearTimeout(this.detectionTimer);
        this.detectionTimer = setTimeout(async () => {
          await this.evaluateChannelLearningApproval();
          this.enforcePageRules();
        }, 150 * this.detectionRetryCount);
        return;
      }
    } else {
      this.detectionRetryCount = 0;
    }

    if (!this.currentChannel.name && !this.currentChannel.handle && !this.currentChannel.channelId) {
      this.isCurrentLearningApproved = false;
      if (docEl) {
        docEl.removeAttribute('data-knolect-whitelisted');
        docEl.removeAttribute('data-knolect-learning-approved');
      }
      return;
    }

    // 1. Check System Verified Learning Channels
    let isApproved = false;
    if (typeof globalThis.isSystemVerifiedLearningChannel === 'function') {
      const verified = globalThis.isSystemVerifiedLearningChannel(this.currentChannel);
      if (verified) {
        isApproved = true;
      }
    }

    // 2. Check User-Approved Stored Learning Channels
    if (!isApproved) {
      const targetHandle = (this.currentChannel.normalizedHandle || (this.currentChannel.handle || '')).replace(/^@/, '').toLowerCase().trim();
      const targetId = (this.currentChannel.channelId || '').toLowerCase().trim();
      const targetName = (this.currentChannel.name || '').toLowerCase().trim();

      const matched = this.learningChannels.find(item => {
        const itemHandle = (item.normalizedHandle || (item.handle || item.identifier || '')).replace(/^@/, '').toLowerCase().trim();
        const itemId = (item.channelId || item.identifier || '').toLowerCase().trim();
        const itemName = (item.name || '').toLowerCase().trim();

        if (targetHandle && itemHandle && targetHandle === itemHandle) return true;
        if (targetId && itemId && targetId === itemId) return true;
        if (targetName && itemName && targetName === itemName) return true;
        return false;
      });

      if (matched) {
        // Validate that stored entry is still eligible
        if (typeof globalThis.isStillEligible === 'function') {
          isApproved = globalThis.isStillEligible(matched);
        } else {
          isApproved = matched.category === 'education' && matched.eligible !== false;
        }
      }
    }

    this.isCurrentLearningApproved = isApproved;

    // Run local classifier for context
    if (typeof globalThis.classifyChannel === 'function') {
      this.currentClassification = globalThis.classifyChannel(this.currentChannel);
    }

    if (this.isCurrentLearningApproved) {
      if (docEl) {
        docEl.setAttribute('data-knolect-whitelisted', 'true');
        docEl.setAttribute('data-knolect-learning-approved', 'true');
      }
      this.injectWhitelistIndicator();
    } else {
      if (docEl) {
        docEl.removeAttribute('data-knolect-whitelisted');
        docEl.removeAttribute('data-knolect-learning-approved');
      }
      const badge = document.getElementById('knolect-whitelist-badge');
      if (badge) badge.remove();
    }
  }

  /**
   * Enforce Strict Focus vs Normal Focus Rules on the active page
   */
  enforcePageRules() {
    const pathname = window.location.pathname;
    const isHome = pathname === '/' || pathname === '';
    const isSearch = pathname.startsWith('/results');
    const isShorts = pathname.startsWith('/shorts');
    const isWatch = pathname.includes('/watch');
    const isChannel = pathname.startsWith('/@') || pathname.startsWith('/channel/') || pathname.startsWith('/c/');

    // 1. Home Page
    if (isHome) {
      this.removeBlockScreen();
      if (this.focusMode && this.settings.hideHomeFeed) {
        this.injectHomePlaceholder();
      }
      return;
    } else {
      const homePlaceholder = document.getElementById('knolect-home-placeholder');
      if (homePlaceholder) homePlaceholder.remove();
    }

    // 2. YouTube Search Blocking (/results?search_query=...)
    if (isSearch && this.focusMode && this.strictFocus) {
      this.pauseVideo();
      this.renderBlockScreen({
        title: "Search Disabled in Strict Focus",
        message: "Search is disabled during your active Focus Session to prevent algorithmic distraction loops. Study with your approved Learning Channels.",
        actionText: "Return to Learning Space",
        actionType: "home",
        showLearningChannels: true
      });
      return;
    }

    // 3. YouTube Shorts Blocking (/shorts/...)
    // Note: Shorts remain blocked under Strict Focus even if uploaded by a learning channel
    if (isShorts && this.focusMode) {
      this.pauseVideo();
      this.renderBlockScreen({
        title: "Shorts Feed Blocked",
        message: "Short-form video feeds are disabled to protect your deep focus and study momentum.",
        actionText: "Return to Learning Space",
        actionType: "home",
        showLearningChannels: true
      });
      return;
    }

    // 4. Video Watch Page (/watch?v=...)
    if (isWatch && this.focusMode) {
      if (this.strictFocus && !this.isCurrentLearningApproved) {
        // Strict Focus: Block non-approved videos
        this.pauseVideo();
        const chName = this.currentChannel.name || this.currentChannel.handle || 'this channel';
        this.renderBlockScreen({
          title: "Stay Focused on Learning",
          message: `This video (${chName}) is not in your approved Learning Channels. During Strict Focus, only verified educational content is accessible.`,
          actionText: "Return to Learning Space",
          actionType: "home",
          allowApprovalEvaluation: true,
          currentChannel: this.currentChannel,
          classification: this.currentClassification
        });
        return;
      } else {
        // Allowed (Learning Approved or Normal Focus)
        this.removeBlockScreen();
        if (this.isCurrentLearningApproved) {
          this.injectWhitelistIndicator();
        }
      }
      return;
    }

    // 5. Channel Page
    if (isChannel && this.focusMode && this.strictFocus && !this.isCurrentLearningApproved) {
      const chName = this.currentChannel.name || this.currentChannel.handle || 'this channel';
      this.renderBlockScreen({
        title: "Channel Blocked in Strict Focus",
        message: `"${chName}" is not an approved Learning Channel.`,
        actionText: "Return to Learning Space",
        actionType: "home",
        allowApprovalEvaluation: true,
        currentChannel: this.currentChannel,
        classification: this.currentClassification
      });
      return;
    }

    // Other pages: Clear block screen
    this.removeBlockScreen();
  }

  /**
   * Pause any active HTML5 video element immediately
   */
  pauseVideo() {
    try {
      const videos = document.querySelectorAll('video');
      videos.forEach(v => {
        if (!v.paused) {
          v.pause();
        }
      });
    } catch (e) {}
  }

  /**
   * Render modern Knolect Block Screen Overlay
   */
  renderBlockScreen({ title, message, actionText, showLearningChannels, allowApprovalEvaluation, currentChannel, classification }) {
    let screen = document.getElementById('knolect-block-screen');
    if (!screen) {
      screen = document.createElement('div');
      screen.id = 'knolect-block-screen';
      screen.className = 'knolect-block-overlay';
      document.body.appendChild(screen);
    }

    // Build approved learning channels list
    let channelsHtml = '';
    const channels = this.learningChannels || [];
    if ((showLearningChannels || allowApprovalEvaluation) && channels.length > 0) {
      const chips = channels.map(ch => {
        const link = (ch.handle && ch.handle.startsWith('@'))
          ? `https://www.youtube.com/${ch.handle}`
          : (ch.channelId ? `https://www.youtube.com/channel/${ch.channelId}` : `https://www.youtube.com/@${encodeURIComponent(ch.name.replace(/\s+/g, ''))}`);
        return `<a href="${link}" class="knolect-chip-link">📚 ${(typeof globalThis.escapeHtml === 'function') ? globalThis.escapeHtml(ch.name) : ch.name}</a>`;
      }).join('');

      channelsHtml = `
        <div class="knolect-block-whitelist-box">
          <div class="knolect-block-whitelist-title">Your Approved Learning Channels</div>
          <div class="knolect-chips-grid">${chips}</div>
        </div>
      `;
    }

    // Channel Evaluation & Approval Action
    let approvalActionHtml = '';
    if (allowApprovalEvaluation && currentChannel && (currentChannel.name || currentChannel.handle)) {
      const isEligible = classification && classification.eligible;
      const chName = (typeof globalThis.escapeHtml === 'function') ? globalThis.escapeHtml(currentChannel.name || currentChannel.handle) : (currentChannel.name || currentChannel.handle);

      if (isEligible) {
        approvalActionHtml = `
          <button type="button" class="knolect-btn-secondary" id="knolect-btn-approve-channel">
            <span>✓</span> Add "${chName}" to Learning Channels (${classification.confidence}% Match)
          </button>
        `;
      } else {
        approvalActionHtml = `
          <div class="knolect-ineligible-notice">
            <span>🚫</span> "${chName}" is classified as entertainment/non-learning and cannot bypass Strict Focus.
          </div>
        `;
      }
    }

    screen.innerHTML = `
      <div class="knolect-block-modal">
        <div class="knolect-block-badge">
          <span>🛡️</span> KNOLECT STRICT FOCUS
        </div>
        <h2 class="knolect-block-title">${title || 'Stay Focused'}</h2>
        <p class="knolect-block-desc">${message}</p>

        <div class="knolect-block-actions">
          <button type="button" class="knolect-btn-primary" id="knolect-btn-block-action">
            <span>🏠</span> ${actionText || 'Return to Learning Space'}
          </button>
          ${approvalActionHtml}
        </div>

        ${channelsHtml}
      </div>
    `;

    // Attach listeners
    const mainActionBtn = screen.querySelector('#knolect-btn-block-action');
    if (mainActionBtn) {
      mainActionBtn.addEventListener('click', () => {
        window.location.href = 'https://www.youtube.com/';
      });
    }

    const approveBtn = screen.querySelector('#knolect-btn-approve-channel');
    if (approveBtn && currentChannel) {
      approveBtn.addEventListener('click', async () => {
        if (typeof globalThis.addLearningChannel === 'function') {
          const res = await globalThis.addLearningChannel(currentChannel);
          if (res.success) {
            this.removeBlockScreen();
            window.location.reload();
          }
        }
      });
    }
  }

  /**
   * Remove block screen if present
   */
  removeBlockScreen() {
    const screen = document.getElementById('knolect-block-screen');
    if (screen) {
      screen.remove();
    }
  }

  /**
   * Inject Home Learning Space Placeholder
   */
  injectHomePlaceholder() {
    if (document.getElementById('knolect-home-placeholder')) return;

    const targetContainer = document.querySelector('ytd-browse[page-subtype="home"] #primary, ytd-browse[page-subtype="home"], ytd-two-column-browse-results-renderer');
    if (!targetContainer) return;

    const randomQuote = this.quotes[Math.floor(Math.random() * this.quotes.length)];

    const placeholder = document.createElement('div');
    placeholder.id = 'knolect-home-placeholder';
    placeholder.className = 'knolect-home-container';

    let channelsHtml = '';
    const channels = this.learningChannels || [];
    if (channels.length > 0) {
      const chips = channels.map(ch => {
        const link = (ch.handle && ch.handle.startsWith('@'))
          ? `https://www.youtube.com/${ch.handle}`
          : (ch.channelId ? `https://www.youtube.com/channel/${ch.channelId}` : `https://www.youtube.com/@${encodeURIComponent(ch.name.replace(/\s+/g, ''))}`);
        return `<a href="${link}" class="knolect-chip-link">📚 ${(typeof globalThis.escapeHtml === 'function') ? globalThis.escapeHtml(ch.name) : ch.name}</a>`;
      }).join('');

      channelsHtml = `
        <div class="knolect-channels-quick">
          <div class="knolect-channels-title">Your Approved Learning Channels</div>
          <div class="knolect-chips-grid">
            ${chips}
          </div>
        </div>
      `;
    }

    placeholder.innerHTML = `
      <div class="knolect-card">
        <div class="knolect-badge-pill">
          <span>🎯</span> ${this.strictFocus ? 'Strict Focus Active (Allowlist Mode)' : 'Focus Mode Active'}
        </div>
        <h1 class="knolect-title">Turn YouTube into Your Learning Space</h1>
        <p class="knolect-subtitle">Learn what you came for. Block what pulls you away.</p>

        <div class="knolect-quote-box">
          ${randomQuote}
        </div>

        ${channelsHtml}
      </div>
    `;

    targetContainer.prepend(placeholder);
  }

  /**
   * Inject visual badge on approved learning channels
   */
  injectWhitelistIndicator() {
    if (document.getElementById('knolect-whitelist-badge')) return;

    const badge = document.createElement('div');
    badge.id = 'knolect-whitelist-badge';
    badge.className = 'knolect-verified-badge';
    badge.innerHTML = `
      <span>✓</span>
      <span>Learning Channel Approved</span>
    `;

    const targetHeader = document.querySelector('ytd-channel-name#channel-header-name, #owner ytd-channel-name, ytd-video-owner-renderer ytd-channel-name');
    if (targetHeader && targetHeader.parentElement) {
      targetHeader.parentElement.appendChild(badge);
    }
  }

  /**
   * Render discrete floating focus badge
   */
  renderFloatingBar() {
    let bar = document.getElementById('knolect-floating-bar');
    if (!this.focusMode) {
      if (bar) bar.remove();
      return;
    }

    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'knolect-floating-bar';
      bar.className = 'knolect-float-indicator';
      document.body.appendChild(bar);
    }

    bar.innerHTML = `
      <div class="knolect-float-pill" title="Knolect Focus Active">
        <span class="knolect-dot ${this.strictFocus ? 'knolect-dot-strict' : 'knolect-dot-on'}"></span>
        <span class="knolect-float-text">KNOLECT ${this.strictFocus ? 'STRICT' : 'FOCUS'}</span>
      </div>
    `;
  }
}

// Global scope attachment
if (typeof globalThis !== 'undefined') {
  globalThis.KnolectFocusEngine = KnolectFocusEngine;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { KnolectFocusEngine };
}
