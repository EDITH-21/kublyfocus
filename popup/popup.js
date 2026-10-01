/**
 * Knolect - Popup Controller
 * Manages popup UI state, tabs, focus toggling, strict focus, live timer, whitelist, and settings.
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

  // DOM Elements - Header & Status
  const headerStatusPill = document.getElementById('header-status-pill');

  // DOM Elements - Focus Tab
  const focusToggle = document.getElementById('focus-toggle');
  const strictToggle = document.getElementById('strict-toggle');
  const activeTabCard = document.getElementById('active-tab-context');
  const currentChannelName = document.getElementById('current-channel-name');
  const btnQuickWhitelist = document.getElementById('btn-quick-whitelist');
  const nonYtBanner = document.getElementById('non-yt-banner');

  // DOM Elements - Timer
  const timerDisplay = document.getElementById('timer-display');
  const timerStatusText = document.getElementById('timer-status-text');
  const timerBtnStart = document.getElementById('timer-btn-start');
  const timerBtnPause = document.getElementById('timer-btn-pause');
  const timerBtnReset = document.getElementById('timer-btn-reset');
  const presetButtons = document.querySelectorAll('.preset-btn');

  // DOM Elements - Whitelist Tab
  const whitelistForm = document.getElementById('whitelist-form');
  const whitelistInput = document.getElementById('whitelist-input');
  const whitelistFeedback = document.getElementById('whitelist-feedback');
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
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-tab');
      tabButtons.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      const targetContent = document.getElementById(targetId);
      if (targetContent) targetContent.classList.add('active');

      if (targetId === 'tab-whitelist') {
        renderWhitelist();
      }
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
      headerStatusPill.textContent = 'INACTIVE';
      headerStatusPill.className = 'status-pill status-off';
    } else if (strictEnabled) {
      headerStatusPill.textContent = 'STRICT';
      headerStatusPill.className = 'status-pill status-on';
    } else {
      headerStatusPill.textContent = 'FOCUS ON';
      headerStatusPill.className = 'status-pill status-on';
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
    const isFocus = focusToggle.checked;
    updateFocusUi(isFocus, isStrict);

    await sendRuntimeMessage({
      type: MESSAGE_TYPES.TOGGLE_STRICT_FOCUS,
      enabled: isStrict
    });
  });

  /* ==========================================================================
     3. Active YouTube Tab Detection & Quick Whitelist
     ========================================================================== */
  async function checkActiveTab() {
    try {
      if (!chrome.tabs || !chrome.tabs.query) return;
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (tab && tab.url && (tab.url.includes('youtube.com') || tab.url.includes('youtu.be'))) {
        nonYtBanner.classList.add('hidden');

        if (tab.id) {
          const response = await sendTabMessage(tab.id, { type: MESSAGE_TYPES.QUERY_PAGE_STATUS });
          if (response && response.channel && (response.channel.name || response.channel.handle)) {
            activeTabContext = response.channel;
            currentChannelName.textContent = response.channel.name || response.channel.handle;
            activeTabCard.classList.remove('hidden');

            const isWhitelisted = await isChannelWhitelisted(response.channel);
            if (isWhitelisted) {
              btnQuickWhitelist.textContent = 'Whitelisted ✓';
              btnQuickWhitelist.disabled = true;
              btnQuickWhitelist.className = 'btn-ghost btn-sm';
            } else {
              btnQuickWhitelist.textContent = '+ Whitelist';
              btnQuickWhitelist.disabled = false;
              btnQuickWhitelist.className = 'btn-secondary btn-sm';
            }
            return;
          }
        }
      } else {
        nonYtBanner.classList.remove('hidden');
        activeTabCard.classList.add('hidden');
      }
    } catch (e) {
      console.debug('[Knolect Popup] Tab check notice:', e);
    }
  }

  btnQuickWhitelist.addEventListener('click', async () => {
    if (!activeTabContext) return;
    const result = await addWhitelistChannel(activeTabContext);
    if (result.success) {
      btnQuickWhitelist.textContent = 'Whitelisted ✓';
      btnQuickWhitelist.disabled = true;
      btnQuickWhitelist.className = 'btn-ghost btn-sm';
      renderWhitelist();

      // Refresh tab enforcement
      if (chrome.tabs && chrome.tabs.query) {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab && tab.id) {
          await sendTabMessage(tab.id, { type: MESSAGE_TYPES.FORCE_REAPPLY });
        }
      }
    }
  });

  /* ==========================================================================
     4. Session Timer
     ========================================================================== */
  function renderTimerDisplay() {
    if (currentTimerState.running && currentTimerState.endTime) {
      const remainingMs = currentTimerState.endTime - Date.now();
      currentTimerState.remaining = Math.max(0, Math.ceil(remainingMs / 1000));
    }

    timerDisplay.textContent = formatSeconds(currentTimerState.remaining);

    if (currentTimerState.running) {
      timerStatusText.textContent = 'Learning session in progress 🔥';
      timerBtnStart.classList.add('hidden');
      timerBtnPause.classList.remove('hidden');
    } else {
      timerStatusText.textContent = currentTimerState.remaining === 0 ? 'Session completed! Take a break ☕' : 'Ready to focus';
      timerBtnStart.classList.remove('hidden');
      timerBtnPause.classList.add('hidden');
    }

    const curMin = Math.round(currentTimerState.duration / 60);
    presetButtons.forEach(btn => {
      const btnMin = parseInt(btn.getAttribute('data-min'), 10);
      if (btnMin === curMin) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  function startLiveTimerTick() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      if (currentTimerState.running) {
        renderTimerDisplay();
        if (currentTimerState.remaining <= 0) {
          currentTimerState.running = false;
          renderTimerDisplay();
        }
      }
    }, 500);
  }

  async function loadTimerState() {
    const timer = await getTimerState();
    currentTimerState = timer;
    renderTimerDisplay();
    if (timer.running) {
      startLiveTimerTick();
    }
  }

  timerBtnStart.addEventListener('click', async () => {
    const response = await sendRuntimeMessage({ type: MESSAGE_TYPES.START_TIMER });
    if (response && response.timer) {
      currentTimerState = response.timer;
      renderTimerDisplay();
      startLiveTimerTick();
    }
  });

  timerBtnPause.addEventListener('click', async () => {
    const response = await sendRuntimeMessage({ type: MESSAGE_TYPES.PAUSE_TIMER });
    if (response && response.timer) {
      currentTimerState = response.timer;
      renderTimerDisplay();
    }
  });

  timerBtnReset.addEventListener('click', async () => {
    const response = await sendRuntimeMessage({ type: MESSAGE_TYPES.RESET_TIMER, duration: currentTimerState.duration });
    if (response && response.timer) {
      currentTimerState = response.timer;
      renderTimerDisplay();
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
     5. Whitelist Manager
     ========================================================================== */
  async function renderWhitelist() {
    const list = await getWhitelist();
    whitelistCountBadge.textContent = list.length;
    whitelistItems.innerHTML = '';

    if (!list || list.length === 0) {
      whitelistItems.innerHTML = `
        <li class="whitelist-empty">
          No channels whitelisted yet.<br>Add your favorite educational channels above.
        </li>
      `;
      return;
    }

    list.forEach(channel => {
      const li = document.createElement('li');
      li.className = 'whitelist-item';

      const infoDiv = document.createElement('div');
      infoDiv.className = 'whitelist-item-info';

      const nameSpan = document.createElement('span');
      nameSpan.className = 'whitelist-name';
      nameSpan.textContent = channel.name;

      const idSpan = document.createElement('span');
      idSpan.className = 'whitelist-id';
      idSpan.textContent = channel.handle || channel.identifier;

      infoDiv.appendChild(nameSpan);
      infoDiv.appendChild(idSpan);

      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'btn-remove';
      removeBtn.title = 'Remove from Whitelist';
      removeBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      `;

      removeBtn.addEventListener('click', async () => {
        const res = await removeWhitelistChannel(channel.id || channel.identifier);
        if (res.success) {
          showWhitelistFeedback('Channel removed.', 'success');
          renderWhitelist();
          checkActiveTab();
        }
      });

      li.appendChild(infoDiv);
      li.appendChild(removeBtn);
      whitelistItems.appendChild(li);
    });
  }

  function showWhitelistFeedback(msg, type = 'success') {
    whitelistFeedback.textContent = msg;
    whitelistFeedback.className = `feedback-msg ${type}`;
    whitelistFeedback.classList.remove('hidden');
    setTimeout(() => {
      whitelistFeedback.classList.add('hidden');
    }, 3000);
  }

  whitelistForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const rawVal = whitelistInput.value.trim();
    if (!rawVal) return;

    const normalized = normalizeChannelInfo(rawVal);
    const result = await addWhitelistChannel(normalized);

    if (result.success) {
      whitelistInput.value = '';
      showWhitelistFeedback(`Added "${normalized.name}" to whitelist.`, 'success');
      renderWhitelist();
      checkActiveTab();
    } else {
      showWhitelistFeedback(result.error || 'Failed to add channel.', 'error');
    }
  });

  /* ==========================================================================
     6. Settings Tab
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

  async function handleSettingChange() {
    const updated = {
      hideShorts: settingHideShorts.checked,
      hideComments: settingHideComments.checked,
      hideRecommendations: settingHideRecs.checked,
      hideHomeFeed: settingHideHomeFeed.checked,
      hideEndScreen: settingHideEndScreen.checked,
      defaultTimerDuration: parseInt(settingDefaultTimer.value, 10) || 1500
    };

    await sendRuntimeMessage({
      type: MESSAGE_TYPES.UPDATE_SETTINGS,
      settings: updated
    });
  }

  settingHideShorts.addEventListener('change', handleSettingChange);
  settingHideComments.addEventListener('change', handleSettingChange);
  settingHideRecs.addEventListener('change', handleSettingChange);
  settingHideHomeFeed.addEventListener('change', handleSettingChange);
  settingHideEndScreen.addEventListener('change', handleSettingChange);
  settingDefaultTimer.addEventListener('change', handleSettingChange);

  /* ==========================================================================
     7. Initialize Popup State
     ========================================================================== */
  const currentFocus = await getFocusMode();
  const currentStrict = await getStrictFocus();
  updateFocusUi(currentFocus, currentStrict);
  await loadTimerState();
  await loadSettings();
  await checkActiveTab();
});
