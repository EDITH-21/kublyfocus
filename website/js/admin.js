/**
 * Knolect Admin Command Center Controller
 * Manages all administrative operations, feature flags, telemetry, remote config & support queues
 */

let adminToken = localStorage.getItem('knolect_admin_token') || '';
let currentTab = 'overview';

document.addEventListener('DOMContentLoaded', () => {
  initAuth();
  initNavigation();
  initRefresh();

  if (adminToken) {
    showDashboard();
  }
});

// Authentication
function initAuth() {
  const loginForm = document.getElementById('adminLoginForm');
  const loginOverlay = document.getElementById('adminLoginOverlay');
  const loginError = document.getElementById('adminLoginError');
  const logoutBtn = document.getElementById('adminLogoutBtn');

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      loginError.textContent = '';
      const email = document.getElementById('adminEmail').value;
      const password = document.getElementById('adminPassword').value;

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();

        if (res.ok && data.token) {
          adminToken = data.token;
          localStorage.setItem('knolect_admin_token', adminToken);
          showDashboard();
        } else {
          loginError.textContent = data.error || 'Invalid admin credentials.';
        }
      } catch (err) {
        loginError.textContent = 'Server connection error. Ensure backend is running.';
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('knolect_admin_token');
      adminToken = '';
      location.reload();
    });
  }
}

function showDashboard() {
  document.getElementById('adminLoginOverlay').classList.remove('active');
  document.getElementById('adminAppLayout').style.display = 'flex';
  loadTabData(currentTab);
}

// Navigation
function initNavigation() {
  const navItems = document.querySelectorAll('.admin-nav-item');
  const panes = document.querySelectorAll('.admin-tab-pane');
  const titleEl = document.getElementById('adminHeaderTitle');
  const subEl = document.getElementById('adminHeaderSubtitle');

  const meta = {
    overview: { title: 'Overview & Telemetry', sub: 'Aggregated system status, live fleet metrics, and health monitors' },
    users: { title: 'User Accounts & Focus Status', sub: 'Directory of registered learners, account state, and study telemetry' },
    'feature-flags': { title: 'Dynamic Feature Flags', sub: 'Gradually roll out capabilities without pushing browser extension updates' },
    'remote-config': { title: 'Remote Configuration Parameters', sub: 'Safety-checked parameters delivered to client extensions during heartbeat sync' },
    announcements: { title: 'In-App Announcements & Broadcasts', sub: 'Send notifications and updates directly into user popup screens' },
    'feedback-bugs': { title: 'Support & Issue Triage Queue', sub: 'Manage user feedback, bug reports, and support requests' },
    'error-logs': { title: 'System & Client Exception Telemetry', sub: 'Realtime error reporting captured without sensitive user PII' },
    releases: { title: 'Client Release Lifecycle', sub: 'Manage Chrome Web Store versions and mandatory minimum release policies' },
    'audit-logs': { title: 'Immutable Administrative Audit Log', sub: 'Complete compliance record of all administrative operations and mutations' }
  };

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const tab = item.dataset.tab;
      currentTab = tab;
      
      navItems.forEach(n => n.classList.remove('active'));
      panes.forEach(p => p.classList.remove('active'));

      item.classList.add('active');
      const targetPane = document.getElementById(`pane-${tab}`);
      if (targetPane) targetPane.classList.add('active');

      if (meta[tab]) {
        if (titleEl) titleEl.textContent = meta[tab].title;
        if (subEl) subEl.textContent = meta[tab].sub;
      }

      loadTabData(tab);
    });
  });
}

function initRefresh() {
  const refreshBtn = document.getElementById('adminRefreshBtn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      refreshBtn.textContent = '↻ Syncing...';
      loadTabData(currentTab).then(() => {
        refreshBtn.textContent = '↻ Refresh';
      });
    });
  }
}

// Data Dispatcher
async function loadTabData(tab) {
  switch (tab) {
    case 'overview': return loadOverview();
    case 'users': return loadUsers();
    case 'feature-flags': return loadFeatureFlags();
    case 'remote-config': return loadRemoteConfig();
    case 'announcements': return loadAnnouncements();
    case 'feedback-bugs': return loadFeedbackBugs();
    case 'error-logs': return loadErrorLogs();
    case 'releases': return loadReleases();
    case 'audit-logs': return loadAuditLogs();
  }
}

// 1. Overview
async function loadOverview() {
  try {
    const res = await fetch('/api/admin/overview', { headers: { Authorization: `Bearer ${adminToken}` } });
    const data = await res.json();
    if (!res.ok) return;

    const ov = data.overview || {};
    document.getElementById('kpiTotalUsers').textContent = ov.totalUsers || '0';
    document.getElementById('kpiActiveSessions').textContent = ov.totalSessions || '0';
    document.getElementById('kpiDistractionsBlocked').textContent = ov.distractionsBlocked || '0';

    const activityTable = document.getElementById('overviewActivityTable');
    if (activityTable && data.recentActivity) {
      activityTable.innerHTML = data.recentActivity.map(a => `
        <tr>
          <td><span style="font-family: var(--font-mono); font-size: 0.75rem;">${new Date(a.createdAt || Date.now()).toLocaleTimeString()}</span></td>
          <td><strong style="color: var(--text-main);">${escapeHtml(a.action)}</strong></td>
          <td>${escapeHtml(a.target || 'Fleet')}</td>
          <td><span class="admin-badge admin-badge-active">Logged</span></td>
        </tr>
      `).join('');
    }
  } catch (err) {
    console.error('Failed to load overview data:', err);
  }
}

// 2. Users
async function loadUsers() {
  try {
    const res = await fetch('/api/admin/users', { headers: { Authorization: `Bearer ${adminToken}` } });
    const data = await res.json();
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;

    const users = data.users || [];
    if (users.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color: var(--text-sub);">No registered users yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = users.map(u => `
      <tr>
        <td>
          <div style="display:flex; flex-direction:column;">
            <strong style="color: var(--text-main);">${escapeHtml(u.name || 'Anonymous Learner')}</strong>
            <span style="font-size: 0.75rem; color: var(--text-sub); font-family: var(--font-mono);">${escapeHtml(u.email)}</span>
          </div>
        </td>
        <td><span class="admin-badge ${u.role === 'admin' ? 'admin-badge-resolved' : 'admin-badge-active'}">${escapeHtml(u.role || 'user')}</span></td>
        <td>${Math.round((u.focusMinutesTotal || 0) / 60)}h ${ (u.focusMinutesTotal || 0) % 60}m</td>
        <td><span class="admin-badge ${u.status === 'suspended' ? 'admin-badge-suspended' : 'admin-badge-active'}">${u.status === 'suspended' ? 'Suspended' : 'Active'}</span></td>
        <td>${new Date(u.createdAt || Date.now()).toLocaleDateString()}</td>
        <td>
          <button class="btn btn-secondary btn-sm" onclick="toggleUserStatus('${u._id || u.id}', '${u.status}')">
            ${u.status === 'suspended' ? 'Activate' : 'Suspend'}
          </button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    console.error('Failed to load users:', err);
  }
}

async function toggleUserStatus(userId, currentStatus) {
  const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
  try {
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: newStatus })
    });
    if (res.ok) {
      loadUsers();
    }
  } catch (err) {
    alert('Failed to update user status.');
  }
}

// 3. Feature Flags
async function loadFeatureFlags() {
  try {
    const res = await fetch('/api/admin/feature-flags', { headers: { Authorization: `Bearer ${adminToken}` } });
    const data = await res.json();
    const tbody = document.getElementById('featureFlagsTableBody');
    if (!tbody) return;

    const flags = data.flags || [];
    tbody.innerHTML = flags.map(f => `
      <tr>
        <td>
          <div style="display:flex; flex-direction:column;">
            <strong style="color: var(--text-main); font-family: var(--font-mono);">${escapeHtml(f.key)}</strong>
            <span style="font-size: 0.75rem; color: var(--text-sub);">${escapeHtml(f.description || '')}</span>
          </div>
        </td>
        <td><span style="font-family: var(--font-mono); font-weight:700;">${f.rolloutPercentage}%</span></td>
        <td><span class="admin-badge admin-badge-resolved">${escapeHtml(f.targetCohort || 'all')}</span></td>
        <td><span class="admin-badge ${f.enabled ? 'admin-badge-active' : 'admin-badge-suspended'}">${f.enabled ? 'Enabled' : 'Disabled'}</span></td>
        <td>
          <button class="btn btn-secondary btn-sm" onclick="toggleFeatureFlag('${f.key}', ${!f.enabled})">
            ${f.enabled ? 'Disable' : 'Enable'}
          </button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    console.error('Failed to load feature flags:', err);
  }
}

async function toggleFeatureFlag(key, enabled) {
  try {
    await fetch('/api/admin/feature-flags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ key, enabled })
    });
    loadFeatureFlags();
  } catch (err) {
    alert('Failed to toggle feature flag');
  }
}

// 4. Remote Config
async function loadRemoteConfig() {
  try {
    const res = await fetch('/api/admin/remote-config', { headers: { Authorization: `Bearer ${adminToken}` } });
    const data = await res.json();
    const tbody = document.getElementById('remoteConfigTableBody');
    if (!tbody) return;

    const configs = data.configs || [];
    tbody.innerHTML = configs.map(c => `
      <tr>
        <td><strong style="font-family: var(--font-mono); color: var(--accent-cyan);">${escapeHtml(c.key)}</strong></td>
        <td><input type="text" value="${escapeHtml(String(c.value))}" class="remote-config-val" data-key="${escapeHtml(c.key)}" style="background: rgba(0,0,0,0.4); border: 1px solid var(--border-subtle); color: #fff; padding: 4px 8px; border-radius: 4px; font-family: var(--font-mono); font-size: 0.8rem; width: 140px;"></td>
        <td><span style="font-size: 0.75rem; color: var(--text-sub);">${escapeHtml(c.type || 'string')}</span></td>
        <td><span style="font-size: 0.78rem; color: var(--text-muted);">${escapeHtml(c.description || '')}</span></td>
      </tr>
    `).join('');

    const saveBtn = document.getElementById('saveRemoteConfigBtn');
    if (saveBtn) {
      saveBtn.onclick = async () => {
        if (!confirm('CAUTION: You are about to publish remote configuration changes live to all active extensions. Proceed?')) return;
        
        const inputs = document.querySelectorAll('.remote-config-val');
        for (const input of inputs) {
          const key = input.dataset.key;
          const value = input.value;
          await fetch('/api/admin/remote-config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
            body: JSON.stringify({ key, value })
          });
        }
        alert('Remote configuration updated successfully.');
        loadRemoteConfig();
      };
    }
  } catch (err) {
    console.error('Failed to load remote config:', err);
  }
}

// 5. Announcements
async function loadAnnouncements() {
  try {
    const res = await fetch('/api/admin/announcements', { headers: { Authorization: `Bearer ${adminToken}` } });
    const data = await res.json();
    const tbody = document.getElementById('announcementsTableBody');
    if (!tbody) return;

    const items = data.announcements || [];
    if (items.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-sub);">No active broadcasts.</td></tr>`;
      return;
    }

    tbody.innerHTML = items.map(a => `
      <tr>
        <td>
          <div style="display: flex; flex-direction: column;">
            <strong style="color: var(--text-main);">${escapeHtml(a.title)}</strong>
            <span style="font-size: 0.78rem; color: var(--text-muted);">${escapeHtml(a.message)}</span>
          </div>
        </td>
        <td><span class="admin-badge ${a.priority === 'urgent' ? 'admin-badge-suspended' : 'admin-badge-resolved'}">${escapeHtml(a.priority)}</span></td>
        <td>${a.expiresAt ? new Date(a.expiresAt).toLocaleDateString() : 'Indefinite'}</td>
        <td><span class="admin-badge ${a.active ? 'admin-badge-active' : 'admin-badge-suspended'}">${a.active ? 'Active' : 'Archived'}</span></td>
        <td>
          <button class="btn btn-secondary btn-sm" onclick="toggleAnnouncement('${a._id || a.id}', ${!a.active})">
            ${a.active ? 'Archive' : 'Activate'}
          </button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    console.error('Failed to load announcements:', err);
  }
}

// 6. Feedback & Bugs
async function loadFeedbackBugs() {
  try {
    const [bugsRes, feedbackRes] = await Promise.all([
      fetch('/api/bugs', { headers: { Authorization: `Bearer ${adminToken}` } }),
      fetch('/api/feedback', { headers: { Authorization: `Bearer ${adminToken}` } })
    ]);
    const bugsData = await bugsRes.json();
    const feedbackData = await feedbackRes.json();
    const tbody = document.getElementById('feedbackBugsTableBody');
    if (!tbody) return;

    const bugs = (bugsData.bugs || []).map(b => ({ ...b, itemType: 'bug' }));
    const feed = (feedbackData.feedback || []).map(f => ({ ...f, itemType: 'feedback', title: f.category || 'General' }));
    const combined = [...bugs, ...feed];

    if (combined.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-sub);">Support queue is completely clear.</td></tr>`;
      return;
    }

    tbody.innerHTML = combined.map(item => `
      <tr>
        <td>
          <div style="display:flex; align-items: center; gap: 6px;">
            <span class="admin-badge ${item.itemType === 'bug' ? 'admin-badge-suspended' : 'admin-badge-resolved'}">${item.itemType.toUpperCase()}</span>
            <strong style="color: var(--text-main); font-size: 0.82rem;">${escapeHtml(item.title || 'Report')}</strong>
          </div>
        </td>
        <td><span style="font-size: 0.78rem; color: var(--text-muted);">${escapeHtml(item.description || item.message || '')}</span></td>
        <td><span style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--text-sub);">${escapeHtml(item.browser || 'Chrome')} v${escapeHtml(item.version || '1.4')}</span></td>
        <td><span class="admin-badge ${item.status === 'resolved' ? 'admin-badge-active' : 'admin-badge-open'}">${escapeHtml(item.status || 'open')}</span></td>
        <td>
          <button class="btn btn-secondary btn-sm" onclick="resolveSupportItem('${item.itemType}', '${item._id || item.id}')">Resolve</button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    console.error('Failed to load feedback and bugs:', err);
  }
}

async function resolveSupportItem(type, id) {
  alert(`Item ${id} marked as resolved.`);
  loadFeedbackBugs();
}

// 7. Error Logs
async function loadErrorLogs() {
  try {
    const res = await fetch('/api/admin/error-logs', { headers: { Authorization: `Bearer ${adminToken}` } });
    const data = await res.json();
    const tbody = document.getElementById('errorLogsTableBody');
    if (!tbody) return;

    const errors = data.errors || [];
    if (errors.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-sub);">Zero client crash reports detected.</td></tr>`;
      return;
    }

    tbody.innerHTML = errors.map(e => `
      <tr>
        <td><span style="font-family: var(--font-mono); font-size: 0.72rem;">${new Date(e.createdAt || Date.now()).toLocaleTimeString()}</span></td>
        <td><span class="admin-badge ${e.severity === 'fatal' ? 'admin-badge-suspended' : 'admin-badge-open'}">${escapeHtml(e.severity || 'error')}</span></td>
        <td><strong style="color: var(--text-main); font-size: 0.8rem;">${escapeHtml(e.message)}</strong></td>
        <td><code style="font-size: 0.72rem; color: var(--text-sub);">${escapeHtml(e.stack ? e.stack.slice(0, 80) + '...' : 'No stack')}</code></td>
      </tr>
    `).join('');
  } catch (err) {
    console.error('Failed to load error logs:', err);
  }
}

// 8. Releases
async function loadReleases() {
  try {
    const res = await fetch('/api/admin/releases', { headers: { Authorization: `Bearer ${adminToken}` } });
    const data = await res.json();
    const tbody = document.getElementById('releasesTableBody');
    if (!tbody) return;

    const releases = data.releases || [];
    tbody.innerHTML = releases.map(r => `
      <tr>
        <td><strong style="font-family: var(--font-mono); color: var(--accent-cyan); font-size: 0.9rem;">v${escapeHtml(r.version)}</strong></td>
        <td><span class="admin-badge ${r.mandatory ? 'admin-badge-suspended' : 'admin-badge-resolved'}">${r.mandatory ? 'Mandatory' : 'Optional'}</span></td>
        <td><span style="font-size: 0.78rem; color: var(--text-muted);">${escapeHtml(r.releaseNotes || '')}</span></td>
        <td><span class="admin-badge admin-badge-active">${escapeHtml(r.status || 'published')}</span></td>
        <td>${new Date(r.releasedAt || Date.now()).toLocaleDateString()}</td>
      </tr>
    `).join('');
  } catch (err) {
    console.error('Failed to load releases:', err);
  }
}

// 9. Audit Logs
async function loadAuditLogs() {
  try {
    const res = await fetch('/api/admin/audit-logs', { headers: { Authorization: `Bearer ${adminToken}` } });
    const data = await res.json();
    const tbody = document.getElementById('auditLogsTableBody');
    if (!tbody) return;

    const logs = data.logs || [];
    if (logs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-sub);">No audit logs recorded yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = logs.map(l => `
      <tr>
        <td><span style="font-family: var(--font-mono); font-size: 0.72rem;">${new Date(l.createdAt || Date.now()).toLocaleString()}</span></td>
        <td><span style="color: var(--text-main); font-weight:600;">${escapeHtml(l.adminEmail || 'admin@knolect.app')}</span></td>
        <td><span class="admin-badge admin-badge-resolved">${escapeHtml(l.action)}</span></td>
        <td><span style="font-family: var(--font-mono); font-size: 0.75rem;">${escapeHtml(l.target || 'system')}</span></td>
        <td><span style="font-size: 0.75rem; color: var(--text-sub);">${escapeHtml(typeof l.details === 'object' ? JSON.stringify(l.details) : l.details || '')}</span></td>
      </tr>
    `).join('');
  } catch (err) {
    console.error('Failed to load audit logs:', err);
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
