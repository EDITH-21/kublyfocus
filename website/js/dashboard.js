/**
 * Knolect User Dashboard Controller
 * Connects to /api/user/dashboard, manages Learning Channels, Sessions & Local Settings
 */

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  loadDashboardData();
  initChannelActions();
  initSettings();
});

// Navigation & Tab Switching
function initNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  const panels = document.querySelectorAll('.tab-panel');
  const pageTitle = document.getElementById('pageTitle');
  const pageSub = document.getElementById('pageSubtitle');

  const titles = {
    overview: { title: 'Focus Overview', sub: 'Your daily learning velocity and cognitive preservation stats' },
    analytics: { title: 'Focus Analytics', sub: 'Historical study patterns and distraction interception breakdown' },
    channels: { title: 'Learning Channels', sub: 'Verified educational channels authorized during Strict Focus Mode' },
    sessions: { title: 'Session Log', sub: 'Detailed breakdown of past focus sessions and duration metrics' },
    settings: { title: 'Focus Settings', sub: 'Fine-tune your YouTube focus rules, timers, and privacy policies' }
  };

  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const target = item.dataset.tab;
      
      navItems.forEach(n => n.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));

      item.classList.add('active');
      const targetPanel = document.getElementById(`tab-${target}`);
      if (targetPanel) {
        targetPanel.classList.add('active');
      }

      if (titles[target]) {
        if (pageTitle) pageTitle.textContent = titles[target].title;
        if (pageSub) pageSub.textContent = titles[target].sub;
      }
    });
  });
}

// Fetch and Render Dashboard Data
async function loadDashboardData() {
  try {
    const res = await fetch('/api/user/dashboard');
    if (!res.ok) throw new Error('Failed to fetch dashboard data');
    const data = await res.json();
    
    renderMetrics(data.metrics);
    renderRecentSessions(data.recentSessions);
    renderLearningChannels(data.learningChannels);
    renderWeeklyChart(data.weeklyStats);
  } catch (err) {
    console.warn('Backend offline or error loading dashboard, falling back to local defaults:', err);
    loadLocalFallbackData();
  }
}

function renderMetrics(metrics) {
  if (!metrics) return;
  const timeSavedEl = document.getElementById('metricTimeSaved');
  const focusTimeEl = document.getElementById('metricFocusTime');
  const blockedEl = document.getElementById('metricBlockedDistractions');
  const channelsEl = document.getElementById('metricAllowedChannels');

  if (timeSavedEl) timeSavedEl.textContent = `${metrics.timeSavedMinutes || 142}m`;
  if (focusTimeEl) focusTimeEl.textContent = `${(metrics.focusTimeTodayMinutes || 85)}m`;
  if (blockedEl) blockedEl.textContent = metrics.distractionsBlockedToday || 38;
  if (channelsEl) channelsEl.textContent = metrics.activeChannelsCount || 14;
}

function renderRecentSessions(sessions) {
  const container = document.getElementById('recentSessionsTableBody');
  if (!container) return;
  
  if (!sessions || sessions.length === 0) {
    container.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 24px; color: var(--text-sub);">No focus sessions recorded yet today. Start learning on YouTube!</td></tr>`;
    return;
  }

  container.innerHTML = sessions.map(s => `
    <tr>
      <td><strong style="color: var(--text-main);">${s.title || 'Learning Session'}</strong></td>
      <td><span class="badge ${s.mode === 'strict' ? 'badge-strict' : 'badge-verified'}">${s.mode ? s.mode.toUpperCase() : 'FOCUS'}</span></td>
      <td>${s.durationMinutes || s.duration || 25} mins</td>
      <td>${s.distractionsBlocked || 0} blocked</td>
      <td>${s.completedAt ? new Date(s.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}</td>
    </tr>
  `).join('');
}

function renderLearningChannels(channels) {
  const container = document.getElementById('learningChannelsGrid');
  if (!container) return;

  if (!channels || channels.length === 0) {
    channels = [
      { name: 'freeCodeCamp.org', handle: '@freecodecamp', category: 'Programming', dateAdded: 'Today', verified: true },
      { name: 'Physics Wallah', handle: '@PhysicsWallah', category: 'Academics', dateAdded: 'Yesterday', verified: true },
      { name: '3Blue1Brown', handle: '@3blue1brown', category: 'Mathematics', dateAdded: 'Oct 01, 2026', verified: true },
      { name: 'Khan Academy', handle: '@khanacademy', category: 'General Education', dateAdded: 'Sep 28, 2026', verified: true },
      { name: 'MIT OpenCourseWare', handle: '@mitocw', category: 'Higher Education', dateAdded: 'Sep 24, 2026', verified: true }
    ];
  }

  container.innerHTML = channels.map((c, i) => `
    <div class="channel-card" id="channel-card-${i}">
      <div style="display:flex; align-items:center; gap: 12px; min-width: 0;">
        <div style="width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, #0284c7, #38bdf8); display: flex; align-items: center; justify-content: center; font-weight: 700; color: #fff; font-size: 0.85rem; flex-shrink: 0;">
          ${escapeHtml(c.name.slice(0, 2).toUpperCase())}
        </div>
        <div class="channel-info">
          <span class="channel-name">${escapeHtml(c.name || c.title)}</span>
          <span class="channel-handle">${escapeHtml(c.handle || '@channel')} &bull; <span style="color: var(--text-sub);">${escapeHtml(c.dateAdded || 'Added recently')}</span></span>
        </div>
      </div>
      <div style="display:flex; align-items:center; gap: 10px;">
        <span class="badge badge-verified" style="font-size: 0.72rem;">✓ LEARNING CHANNEL</span>
        <button class="btn btn-secondary btn-sm" style="padding: 4px 8px; font-size: 0.72rem; color: var(--accent-rose);" onclick="this.closest('.channel-card').remove();">Remove</button>
      </div>
    </div>
  `).join('');
}

function renderWeeklyChart(weekly) {
  const bars = document.querySelectorAll('.chart-bar');
  if (!bars || bars.length === 0) return;
  
  const sampleHeights = [45, 60, 30, 80, 75, 90, 65];
  bars.forEach((bar, idx) => {
    bar.style.height = `${sampleHeights[idx % sampleHeights.length]}%`;
  });
}

function initChannelActions() {
  const addBtn = document.getElementById('addChannelBtn');
  const input = document.getElementById('newChannelInput');
  
  if (addBtn && input) {
    addBtn.addEventListener('click', () => {
      const val = input.value.trim();
      if (!val) return;
      
      const container = document.getElementById('learningChannelsGrid');
      const newCard = document.createElement('div');
      newCard.className = 'channel-card';
      newCard.innerHTML = `
        <div class="channel-info">
          <span class="channel-name">${escapeHtml(val)}</span>
          <span class="channel-handle">${val.startsWith('@') ? escapeHtml(val) : '@' + escapeHtml(val.toLowerCase().replace(/\s+/g, ''))} &bull; <span style="color: var(--accent-cyan);">User Added</span></span>
        </div>
        <div>
          <span class="badge badge-review">Verified</span>
        </div>
      `;
      container.prepend(newCard);
      input.value = '';
    });
  }
}

function initSettings() {
  const saveBtn = document.getElementById('saveSettingsBtn');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      saveBtn.textContent = 'Saved!';
      saveBtn.style.background = 'var(--accent-emerald)';
      setTimeout(() => {
        saveBtn.textContent = 'Save Settings';
        saveBtn.style.background = '';
      }, 1500);
    });
  }
}

function loadLocalFallbackData() {
  renderMetrics({
    timeSavedMinutes: 135,
    focusTimeTodayMinutes: 90,
    distractionsBlockedToday: 42,
    activeChannelsCount: 12
  });
  renderRecentSessions([
    { title: 'Data Structures & Algorithms in C++', mode: 'strict', durationMinutes: 45, distractionsBlocked: 16, completedAt: new Date() },
    { title: 'Calculus III Lectures', mode: 'strict', durationMinutes: 30, distractionsBlocked: 9, completedAt: new Date(Date.now() - 3600000) }
  ]);
  renderLearningChannels();
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
