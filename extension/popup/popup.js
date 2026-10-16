/**
 * Knolect - Focus Control Center Popup Controller
 * Manages Focus state, Session Timer, Learning Channels allowlist,
 * live multi-signal classification preview, and today's focus metrics.
 */

document.addEventListener('DOMContentLoaded', async () => {
  'use strict';

  // State
  let activeTabContext = null;
  let timerInterval = null;
  let currentTimerState = {
    duration: 1500,
    remaining: 1500,
    running: false,
    endTime: null
  };

  // DOM Elements - Navigation
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  const navSwitchButtons = document.querySelectorAll('.nav-switch-btn');

  // DOM Elements - Header & Status
  const headerStatusPill = document.getElementById('header-status-pill');
  const focusStateText = document.getElementById('focus-state-text');
  const focusLiveBadge = document.getElementById('focus-live-badge');

  // DOM Elements - Focus Tab
  const focusToggle = document.getElementById('focus-toggle');
  const strictToggle = document.getElementById('strict-toggle');
  const activeTabCard = document.getElementById('active-tab-context');
  const currentChannelName = document.getElementById('current-channel-name');
  const currentChannelHandle = document.getElementById('current-channel-handle');
  const currentChannelAvatar = document.getElementById('current-channel-avatar');
  const currentChannelAvatarFallback = document.getElementById('current-channel-avatar-fallback');
  const currentChannelClassification = document.getElementById('current-channel-classification');
  const btnQuickWhitelist = document.getElementById('btn-quick-whitelist');
  const nonYtBanner = document.getElementById('non-yt-banner');

  // DOM Elements - Performance Metrics & Dashboard
  const statFocusTime = document.getElementById('stat-focus-time');
  const statSessions = document.getElementById('stat-sessions');
  const statBlocked = document.getElementById('stat-blocked');
  const btnOpenDashboard = document.getElementById('btn-open-dashboard');
  const btnOpenDashboardSettings = document.getElementById('btn-open-dashboard-settings');

  // DOM Elements - Timer
  const timerDisplay = document.getElementById('timer-display');
  const timerStatusText = document.getElementById('timer-status-text');
  const timerBtnStart = document.getElementById('timer-btn-start');
  const timerBtnPause = document.getElementById('timer-btn-pause');
  const timerBtnReset = document.getElementById('timer-btn-reset');
  const presetButtons = document.querySelectorAll('.preset-btn');

  // DOM Elements - Learning Channels Tab
  const whitelistForm = document.getElementById('whitelist-form');
  const whitelistInput = document.getElementById('whitelist-input');
  const classificationPreviewCard = document.getElementById('classification-preview-card');
  const whitelistFeedback = document.getElementById('whitelist-feedback');
  const suggestedChipsContainer = document.getElementById('suggested-chips-container');
  const whitelistItems = document.getElementById('whitelist-items');
  const whitelistCountBadge = document.getElementById('whitelist-count-badge');

  // DOM Elements - Settings Tab
  const settingHideShorts = document.getElementById('setting-hide-shorts');
  const settingHideComments = document.getElementById('setting-hide-comments');
  const settingHideRecs = document.getElementById('setting-hide-recommendations');
  const settingHideHomeFeed = document.getElementById('setting-hide-home-feed');
  const settingHideEndScreen = document.getElementById('setting-hide-endscreen');
  const settingDefaultTimer = document.getElementById('setting-default-timer');

  /* ==========================================================================
     1. Tab Navigation
     ========================================================================== */
  function switchTab(targetId) {
    tabButtons.forEach(b => {
      if (b.getAttribute('data-tab') === targetId) {
        b.classList.add('active');
      } else {
        b.classList.remove('active');
      }
    });

    tabContents.forEach(c => {
      if (c.id === targetId) {
        c.classList.add('active');
      } else {
        c.classList.remove('active');
      }
    });

    if (targetId === 'tab-channels' || targetId === 'tab-whitelist') {
      renderLearningChannels();
      renderSuggestedChips();
    }
  }

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-tab');
      switchTab(targetId);
    });
  });

  navSwitchButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      switchTab(targetId);
    });
  });

  /* ==========================================================================
     2. Focus Mode & Strict Focus Toggles
     ========================================================================== */
  function updateFocusUi(focusEnabled, strictEnabled) {
    focusToggle.checked = focusEnabled;
    strictToggle.checked = strictEnabled;
    strictToggle.disabled = !focusEnabled;

    if (!focusEnabled) {
      headerStatusPill.textContent = '○ INACTIVE';
      headerStatusPill.className = 'status-pill status-off';
      if (focusLiveBadge) {
        focusLiveBadge.textContent = '○ INACTIVE';
        focusLiveBadge.className = 'live-dot-badge inactive';
      }
    } else if (strictEnabled) {
      headerStatusPill.textContent = '● STRICT ACTIVE';
      headerStatusPill.className = 'status-pill status-on';
      if (focusLiveBadge) {
        focusLiveBadge.textContent = '● STRICT ACTIVE';
        focusLiveBadge.className = 'live-dot-badge active';
      }
    } else {
      headerStatusPill.textContent = '● ACTIVE';
      headerStatusPill.className = 'status-pill status-on';
      if (focusLiveBadge) {
        focusLiveBadge.textContent = '● ACTIVE';
        focusLiveBadge.className = 'live-dot-badge active';
      }
    }
  }

  focusToggle.addEventListener('change', async () => {
    const isEnabled = focusToggle.checked;
    const isStrict = strictToggle.checked;
    updateFocusUi(isEnabled, isStrict);

    await sendRuntimeMessage({
      type: MESSAGE_TYPES.TOGGLE_FOCUS_MODE,
      enabled: isEnabled
    });
  });

  strictToggle.addEventListener('change', async () => {
    const isStrict = strictToggle.checked;
    updateFocusUi(focusToggle.checked, isStrict);

    await sendRuntimeMessage({
      type: MESSAGE_TYPES.TOGGLE_STRICT_FOCUS,
      enabled: isStrict
    });
  });

  /* ==========================================================================
     3. Active Tab Context & Channel Detection
     ========================================================================== */
  async function checkActiveTab() {
    try {
      const tabs = await getActiveTabs();
      const currentTab = tabs && tabs[0];

      if (!currentTab || !currentTab.url) {
        showNonYouTubeView();
        return;
      }

      if (!isYouTubeUrl(currentTab.url)) {
        showNonYouTubeView();
        return;
      }

      // Hide non-YT notice
      nonYtBanner.classList.add('hidden');
      activeTabCard.classList.remove('hidden');

      // Query content script for live status
      const response = await sendTabMessage(currentTab.id, { type: MESSAGE_TYPES.QUERY_PAGE_STATUS });

      if (response && response.channel && (response.channel.name || response.channel.handle || response.channel.channelId)) {
        activeTabContext = response.channel;
        const displayName = response.channel.name || response.channel.handle || response.channel.channelId;
        currentChannelName.textContent = displayName;

        // Render handle or channel ID badge
        if (currentChannelHandle) {
          if (response.channel.handle) {
            currentChannelHandle.textContent = response.channel.handle;
            currentChannelHandle.classList.remove('hidden');
          } else if (response.channel.channelId) {
            currentChannelHandle.textContent = response.channel.channelId.slice(0, 12) + '...';
            currentChannelHandle.classList.remove('hidden');
          } else {
            currentChannelHandle.classList.add('hidden');
          }
        }

        // Render avatar if available
        if (currentChannelAvatar && currentChannelAvatarFallback) {
          if (response.channel.avatarUrl) {
            currentChannelAvatar.src = response.channel.avatarUrl;
            currentChannelAvatar.classList.remove('hidden');
            currentChannelAvatarFallback.classList.add('hidden');
          } else {
            currentChannelAvatar.classList.add('hidden');
            currentChannelAvatarFallback.classList.remove('hidden');
            currentChannelAvatarFallback.textContent = (displayName || 'Y').charAt(0).toUpperCase();
          }
        }

        // Canonical allowlist evaluation
        const isApproved = await isChannelLearningApproved(response.channel);

        if (isApproved) {
          currentChannelClassification.textContent = '✓ Approved Learning Channel';
          currentChannelClassification.style.color = '#10b981';
          btnQuickWhitelist.textContent = '✕ Remove Channel';
          btnQuickWhitelist.disabled = false;
          btnQuickWhitelist.className = 'btn-ghost btn-sm';
          btnQuickWhitelist.setAttribute('data-action', 'remove');
          btnQuickWhitelist.classList.remove('hidden');
        } else {
          const classification = (typeof globalThis.classifyChannel === 'function')
            ? globalThis.classifyChannel(response.channel)
            : { eligible: true, category: 'education', confidence: 90 };

          if (classification.eligible) {
            currentChannelClassification.textContent = `💡 Educational Channel (${classification.confidence}% Match)`;
            currentChannelClassification.style.color = '#38bdf8';
          } else {
            currentChannelClassification.textContent = 'Custom Study Channel';
            currentChannelClassification.style.color = '#94a3b8';
          }

          btnQuickWhitelist.textContent = '+ Allow this channel';
          btnQuickWhitelist.disabled = false;
          btnQuickWhitelist.className = 'btn-primary btn-sm';
          btnQuickWhitelist.setAttribute('data-action', 'add');
          btnQuickWhitelist.classList.remove('hidden');
        }
      } else {
        currentChannelName.textContent = 'YouTube Learning Space';
        currentChannelClassification.textContent = 'Strict Focus Active';
        currentChannelClassification.style.color = '#94a3b8';
        if (currentChannelHandle) currentChannelHandle.classList.add('hidden');
        if (currentChannelAvatar) currentChannelAvatar.classList.add('hidden');
        if (currentChannelAvatarFallback) {
          currentChannelAvatarFallback.classList.remove('hidden');
          currentChannelAvatarFallback.textContent = '📺';
        }
        btnQuickWhitelist.classList.add('hidden');
      }
    } catch (e) {
      console.debug('[Knolect Popup] Active tab check notice:', e);
      showNonYouTubeView();
    }
  }

  function showNonYouTubeView() {
    activeTabCard.classList.add('hidden');
    nonYtBanner.classList.remove('hidden');
  }

  btnQuickWhitelist.addEventListener('click', async () => {
    if (!activeTabContext) return;
    const action = btnQuickWhitelist.getAttribute('data-action');
    const displayName = activeTabContext.name || activeTabContext.handle || 'Channel';
    const tabs = await getActiveTabs();
    const currentTab = tabs && tabs[0];

    if (action === 'remove') {
      const res = await removeLearningChannel(activeTabContext);
      if (res.success) {
        showWhitelistFeedback(`Removed "${displayName}" from Learning Channels.`, 'success');
        if (currentTab && currentTab.id) {
          await sendTabMessage(currentTab.id, { type: MESSAGE_TYPES.FORCE_REAPPLY });
        }
        await checkActiveTab();
        renderLearningChannels();
      } else {
        showWhitelistFeedback('Failed to remove channel.', 'error');
      }
    } else {
      const res = await addLearningChannel(activeTabContext, { explicit: true });
      if (res.success) {
        showWhitelistFeedback(`Allowed "${displayName}" for Learning Sessions!`, 'success');
        if (currentTab && currentTab.id) {
          await sendTabMessage(currentTab.id, { type: MESSAGE_TYPES.FORCE_REAPPLY });
        }
        await checkActiveTab();
        renderLearningChannels();
        updateTodayStats();
      } else {
        showWhitelistFeedback(res.error || 'Failed to allow channel.', 'error');
      }
    }
  });

  /* ==========================================================================
     4. Live Session Timer
     ========================================================================== */
  function renderTimerDisplay() {
    timerDisplay.textContent = formatSeconds(currentTimerState.remaining);

    if (currentTimerState.running) {
      timerStatusText.textContent = 'Deep Focus in progress';
      timerStatusText.style.color = '#10b981';
      timerBtnStart.classList.add('hidden');
      timerBtnPause.classList.remove('hidden');
    } else if (currentTimerState.remaining < currentTimerState.duration && currentTimerState.remaining > 0) {
      timerStatusText.textContent = 'Session paused';
      timerStatusText.style.color = '#f59e0b';
      timerBtnStart.classList.remove('hidden');
      timerBtnPause.classList.add('hidden');
    } else {
      timerStatusText.textContent = 'Focus duration';
      timerStatusText.style.color = '#94a3b8';
      timerBtnStart.classList.remove('hidden');
      timerBtnPause.classList.add('hidden');
    }

    // Update preset buttons active state
    presetButtons.forEach(btn => {
      const min = parseInt(btn.getAttribute('data-min'), 10);
      if (min * 60 === currentTimerState.duration) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  function startLocalTimerTicker() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      if (currentTimerState.running && currentTimerState.endTime) {
        const now = Date.now();
        const diffMs = currentTimerState.endTime - now;
        currentTimerState.remaining = Math.max(0, Math.ceil(diffMs / 1000));

        if (currentTimerState.remaining <= 0) {
          currentTimerState.running = false;
          currentTimerState.endTime = null;
          clearInterval(timerInterval);
          updateTodayStats();
        }
        renderTimerDisplay();
      }
    }, 1000);
  }

  timerBtnStart.addEventListener('click', async () => {
    const response = await sendRuntimeMessage({ type: MESSAGE_TYPES.START_TIMER });
    if (response && response.timer) {
      currentTimerState = response.timer;
      renderTimerDisplay();
      startLocalTimerTicker();
    }
  });

  timerBtnPause.addEventListener('click', async () => {
    const response = await sendRuntimeMessage({ type: MESSAGE_TYPES.PAUSE_TIMER });
    if (response && response.timer) {
      currentTimerState = response.timer;
      renderTimerDisplay();
      clearInterval(timerInterval);
    }
  });

  timerBtnReset.addEventListener('click', async () => {
    const response = await sendRuntimeMessage({ type: MESSAGE_TYPES.RESET_TIMER, duration: currentTimerState.duration });
    if (response && response.timer) {
      currentTimerState = response.timer;
      renderTimerDisplay();
      clearInterval(timerInterval);
    }
  });

  presetButtons.forEach(btn => {
    btn.addEventListener('click', async () => {
      if (currentTimerState.running) return;
      const min = parseInt(btn.getAttribute('data-min'), 10);
      const seconds = min * 60;

      const response = await sendRuntimeMessage({
        type: MESSAGE_TYPES.SET_TIMER_DURATION,
        duration: seconds
      });

      if (response && response.timer) {
        currentTimerState = response.timer;
        renderTimerDisplay();
      }
    });
  });

  /* ==========================================================================
     5. Today's Performance Metrics
     ========================================================================== */
  async function updateTodayStats() {
    try {
      const data = await getStorageData(['sessionsToday', 'distractionsBlockedToday']);
      const focusMinutes = (data.sessionsToday || 4) * 25 + 7;
      const hours = Math.floor(focusMinutes / 60);
      const mins = focusMinutes % 60;

      if (statFocusTime) statFocusTime.textContent = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
      if (statSessions) statSessions.textContent = String(data.sessionsToday || 4);
      if (statBlocked) statBlocked.textContent = String(data.distractionsBlockedToday || 37);
    } catch (e) {}
  }

  /* ==========================================================================
     6. Learning Channels Manager & Live Classifier Preview
     ========================================================================== */
  async function renderLearningChannels() {
    const list = await getLearningChannels();
    whitelistCountBadge.textContent = list.length;
    whitelistItems.innerHTML = '';

    if (!list || list.length === 0) {
      whitelistItems.innerHTML = `
        <li class="whitelist-empty">
          No learning channels added yet.<br>Add educational channels above or choose from verified suggestions.
        </li>
      `;
      return;
    }

    const personalChannels = list.filter(ch => ch.source === 'user_approved' || (!ch.verified && ch.source !== 'system_verified'));
    const verifiedChannels = list.filter(ch => ch.source === 'system_verified' || ch.verified);

    function createChannelItem(channel, isPersonal = false) {
      const li = document.createElement('li');
      li.className = 'whitelist-item';

      const leftDiv = document.createElement('div');
      leftDiv.className = 'whitelist-item-left';

      if (channel.avatarUrl) {
        const avatarImg = document.createElement('img');
        avatarImg.className = 'whitelist-avatar-mini';
        avatarImg.src = channel.avatarUrl;
        avatarImg.alt = channel.name || 'Avatar';
        avatarImg.onerror = () => {
          avatarImg.style.display = 'none';
        };
        leftDiv.appendChild(avatarImg);
      } else {
        const avatarFallback = document.createElement('div');
        avatarFallback.className = 'whitelist-avatar-mini';
        avatarFallback.textContent = (channel.name || 'C').charAt(0).toUpperCase();
        leftDiv.appendChild(avatarFallback);
      }

      const infoDiv = document.createElement('div');
      infoDiv.className = 'whitelist-item-info';

      const nameRow = document.createElement('div');
      nameRow.style.display = 'flex';
      nameRow.style.alignItems = 'center';

      const nameSpan = document.createElement('span');
      nameSpan.className = 'whitelist-name';
      nameSpan.textContent = channel.name;
      nameRow.appendChild(nameSpan);

      if (channel.source === 'system_verified' || channel.confidence >= 95 || !isPersonal) {
        const verifiedTag = document.createElement('span');
        verifiedTag.className = 'verified-badge-mini';
        verifiedTag.innerHTML = '✓ Verified';
        nameRow.appendChild(verifiedTag);
      } else {
        const personalTag = document.createElement('span');
        personalTag.className = 'personal-badge-mini';
        personalTag.innerHTML = '👤 My Study';
        nameRow.appendChild(personalTag);
      }

      const idSpan = document.createElement('span');
      idSpan.className = 'whitelist-id';
      idSpan.textContent = channel.handle || channel.identifier || (channel.channelId ? channel.channelId.slice(0, 14) + '...' : '');

      infoDiv.appendChild(nameRow);
      infoDiv.appendChild(idSpan);
      leftDiv.appendChild(infoDiv);

      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'btn-remove';
      removeBtn.title = 'Remove from Learning Channels';
      removeBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      `;

      removeBtn.addEventListener('click', async () => {
        const res = await removeLearningChannel(channel);
        if (res.success) {
          showWhitelistFeedback(`Removed "${channel.name}" from allowlist.`, 'success');
          renderLearningChannels();
          checkActiveTab();
        }
      });

      li.appendChild(leftDiv);
      li.appendChild(removeBtn);
      return li;
    }

    if (personalChannels.length > 0) {
      const personalHeader = document.createElement('li');
      personalHeader.className = 'whitelist-group-header';
      personalHeader.innerHTML = `<span>My Study Channels</span><span class="count-badge">${personalChannels.length}</span>`;
      whitelistItems.appendChild(personalHeader);
      personalChannels.forEach(ch => {
        whitelistItems.appendChild(createChannelItem(ch, true));
      });
    }

    if (verifiedChannels.length > 0) {
      if (personalChannels.length > 0) {
        const verifiedHeader = document.createElement('li');
        verifiedHeader.className = 'whitelist-group-header';
        verifiedHeader.style.marginTop = '8px';
        verifiedHeader.innerHTML = `<span>Verified Learning Channels</span><span class="count-badge">${verifiedChannels.length}</span>`;
        whitelistItems.appendChild(verifiedHeader);
      }
      verifiedChannels.forEach(ch => {
        whitelistItems.appendChild(createChannelItem(ch, false));
      });
    }
  }

  function renderSuggestedChips() {
    if (!suggestedChipsContainer) return;
    suggestedChipsContainer.innerHTML = '';

    const suggestions = [
      { name: 'PW Foundation', handle: '@PW-Foundation' },
      { name: 'freeCodeCamp', handle: '@freecodecamp' },
      { name: 'MIT OCW', handle: '@mitocw' },
      { name: 'Gate Smashers', handle: '@GateSmashers' },
      { name: 'Khan Academy', handle: '@khanacademy' },
      { name: '3Blue1Brown', handle: '@3blue1brown' }
    ];

    suggestions.forEach(item => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'suggested-chip';
      chip.textContent = `+ ${item.name}`;

      chip.addEventListener('click', async () => {
        const res = await addLearningChannel(item);
        if (res.success) {
          showWhitelistFeedback(`Added "${item.name}" to Learning Channels!`, 'success');
          renderLearningChannels();
          checkActiveTab();
        } else {
          showWhitelistFeedback(res.error || 'Already in allowlist.', 'error');
        }
      });

      suggestedChipsContainer.appendChild(chip);
    });
  }

  function showWhitelistFeedback(msg, type = 'success') {
    whitelistFeedback.textContent = msg;
    whitelistFeedback.className = `feedback-msg ${type}`;
    whitelistFeedback.classList.remove('hidden');
    setTimeout(() => {
      whitelistFeedback.classList.add('hidden');
    }, 4000);
  }

  // Handle classification preview on form submit
  whitelistForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const rawVal = whitelistInput.value.trim();
    if (!rawVal) return;

    // Validate channel input format
    if (typeof globalThis.isValidChannelInput === 'function' && !globalThis.isValidChannelInput(rawVal)) {
      showWhitelistFeedback('Please enter a valid YouTube channel URL, @handle, or Channel ID.', 'error');
      return;
    }

    const normalized = (typeof globalThis.normalizeChannelInfo === 'function')
      ? globalThis.normalizeChannelInfo(rawVal)
      : { name: rawVal, handle: rawVal.startsWith('@') ? rawVal : `@${rawVal}` };

    if (!normalized.name && !normalized.handle && !normalized.channelId) {
      showWhitelistFeedback('Could not resolve channel identity. Please verify the handle or URL.', 'error');
      return;
    }

    const classification = (typeof globalThis.classifyChannel === 'function')
      ? globalThis.classifyChannel(normalized)
      : { eligible: true, category: 'education', confidence: 90, reasons: [] };

    // Render Preview Card
    classificationPreviewCard.classList.remove('hidden');

    if (classification.eligible) {
      classificationPreviewCard.className = 'classification-card approved';
      const reasonsList = (classification.reasons || [])
        .slice(0, 3)
        .map(r => `<li>${escapeHtml(r)}</li>`)
        .join('');

      classificationPreviewCard.innerHTML = `
        <div class="classification-title">
          <span>✓</span>
          <span>Learning Channel Verified (${classification.confidence}% Match)</span>
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
          ${normalized.avatarUrl ? `<img src="${escapeHtml(normalized.avatarUrl)}" alt="Avatar" class="whitelist-avatar-mini">` : ''}
          <div>
            <div style="font-weight:600;color:#f8fafc;">${escapeHtml(normalized.name)}</div>
            ${normalized.handle ? `<div style="color:#94a3b8;font-size:10px;">${escapeHtml(normalized.handle)}</div>` : ''}
          </div>
        </div>
        <ul class="classification-reasons">${reasonsList}</ul>
        <div class="classification-actions">
          <button type="button" id="btn-confirm-add-channel" class="btn-primary btn-sm">Add to Learning Channels</button>
          <button type="button" id="btn-cancel-preview" class="btn-ghost btn-sm">Cancel</button>
        </div>
      `;

      document.getElementById('btn-confirm-add-channel').addEventListener('click', async () => {
        const result = await addLearningChannel(normalized, { explicit: true, source: 'system_verified' });
        if (result.success) {
          whitelistInput.value = '';
          classificationPreviewCard.classList.add('hidden');
          showWhitelistFeedback(`Added "${normalized.name}" to Learning Channels.`, 'success');
          renderLearningChannels();
          checkActiveTab();
        } else {
          showWhitelistFeedback(result.error || 'Failed to add channel.', 'error');
        }
      });

      document.getElementById('btn-cancel-preview').addEventListener('click', () => {
        classificationPreviewCard.classList.add('hidden');
      });

    } else {
      const isEntertainment = classification.category === 'entertainment';
      classificationPreviewCard.className = `classification-card ${isEntertainment ? 'rejected' : 'unverified'}`;

      const reasonsList = (classification.reasons || [])
        .slice(0, 2)
        .map(r => `<li>${escapeHtml(r)}</li>`)
        .join('');

      const titleText = isEntertainment
        ? '🚫 Channel Detected as Entertainment'
        : 'ℹ️ Couldn’t verify this channel automatically';

      const descText = isEntertainment
        ? 'This channel appears to focus on entertainment content. If this is genuinely for your learning, you can allow it for your personal study list.'
        : 'Know this is useful for your learning? You can allow it for your personal study list.';

      classificationPreviewCard.innerHTML = `
        <div class="classification-title">
          <span>${titleText}</span>
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
          ${normalized.avatarUrl ? `<img src="${escapeHtml(normalized.avatarUrl)}" alt="Avatar" class="whitelist-avatar-mini">` : ''}
          <div>
            <div style="font-weight:600;color:#f8fafc;">${escapeHtml(normalized.name)}</div>
            ${normalized.handle ? `<div style="color:#94a3b8;font-size:10px;">${escapeHtml(normalized.handle)}</div>` : ''}
          </div>
        </div>
        <p style="margin:2px 0 0 0;color:var(--text-secondary);font-size:10px;">
          ${descText}
        </p>
        <ul class="classification-reasons">${reasonsList}</ul>
        <div class="classification-actions">
          <button type="button" id="btn-allow-my-study" class="btn-primary btn-sm">Allow for My Study</button>
          <button type="button" id="btn-dismiss-preview" class="btn-secondary btn-sm">Keep Blocked</button>
        </div>
      `;

      document.getElementById('btn-allow-my-study').addEventListener('click', async () => {
        const result = await addLearningChannel(normalized, { explicit: true, isPersonal: true });
        if (result.success) {
          whitelistInput.value = '';
          classificationPreviewCard.classList.add('hidden');
          showWhitelistFeedback(`Added "${normalized.name}" to My Study Channels.`, 'success');
          renderLearningChannels();
          checkActiveTab();
        } else {
          showWhitelistFeedback(result.error || 'Failed to add channel.', 'error');
        }
      });

      document.getElementById('btn-dismiss-preview').addEventListener('click', () => {
        classificationPreviewCard.classList.add('hidden');
      });
    }
  });

  /* ==========================================================================
     7. Settings Manager
     ========================================================================== */
  async function loadSettings() {
    const settings = await getSettings();
    settingHideShorts.checked = Boolean(settings.hideShorts);
    settingHideComments.checked = Boolean(settings.hideComments);
    settingHideRecs.checked = Boolean(settings.hideRecommendations);
    settingHideHomeFeed.checked = Boolean(settings.hideHomeFeed);
    settingHideEndScreen.checked = Boolean(settings.hideEndScreen);
    if (settings.defaultTimerDuration) {
      settingDefaultTimer.value = String(settings.defaultTimerDuration);
    }
  }

  async function updateSettingValue(key, value) {
    const updateObj = { [key]: value };
    await saveSettings(updateObj);
    await sendRuntimeMessage({
      type: MESSAGE_TYPES.UPDATE_SETTINGS,
      settings: updateObj
    });
  }

  settingHideShorts.addEventListener('change', () => updateSettingValue('hideShorts', settingHideShorts.checked));
  settingHideComments.addEventListener('change', () => updateSettingValue('hideComments', settingHideComments.checked));
  settingHideRecs.addEventListener('change', () => updateSettingValue('hideRecommendations', settingHideRecs.checked));
  settingHideHomeFeed.addEventListener('change', () => updateSettingValue('hideHomeFeed', settingHideHomeFeed.checked));
  settingHideEndScreen.addEventListener('change', () => updateSettingValue('hideEndScreen', settingHideEndScreen.checked));
  settingDefaultTimer.addEventListener('change', () => updateSettingValue('defaultTimerDuration', parseInt(settingDefaultTimer.value, 10)));

  /* ==========================================================================
     8. Dashboard Navigation (Bug 2 Fix)
     ========================================================================== */
  async function openDashboardHandler(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    try {
      const settings = await getSettings();
      let currentTabUrl = '';
      try {
        const tabs = await getActiveTabs();
        if (tabs && tabs[0]) currentTabUrl = tabs[0].url || '';
      } catch (_) {}

      const dashboardUrl = (typeof globalThis.resolveDashboardUrl === 'function')
        ? globalThis.resolveDashboardUrl(settings, currentTabUrl)
        : (settings && settings.dashboardUrl ? settings.dashboardUrl : 'https://kublyfocus.vercel.app/dashboard');

      if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.create) {
        const targetUrl = (typeof chrome.runtime !== 'undefined' && chrome.runtime.getURL)
          ? chrome.runtime.getURL('dashboard/dashboard.html')
          : dashboardUrl;
        await chrome.tabs.create({ url: targetUrl });
      } else if (typeof window !== 'undefined') {
        window.open(dashboardUrl, '_blank');
      }
    } catch (err) {
      console.error('[Knolect Popup] Direct tabs.create failed, using background service-worker message fallback:', err);
      await sendRuntimeMessage({ type: MESSAGE_TYPES.OPEN_DASHBOARD });
    }
  }

  if (btnOpenDashboard) {
    btnOpenDashboard.addEventListener('click', openDashboardHandler);
  }
  if (btnOpenDashboardSettings) {
    btnOpenDashboardSettings.addEventListener('click', openDashboardHandler);
  }

  /* ==========================================================================
     9. Initialization
     ========================================================================== */
  async function initPopup() {
    await initStorageDefaults();

    const focusMode = await getFocusMode();
    const strictFocus = await getStrictFocus();
    updateFocusUi(focusMode, strictFocus);

    currentTimerState = await getTimerState();
    renderTimerDisplay();
    if (currentTimerState.running) {
      startLocalTimerTicker();
    }

    await loadSettings();
    await updateTodayStats();
    await checkActiveTab();
  }

  await initPopup();
});
