/**
 * Knolect Interactive Simulator Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('sim-toggle-focus');
  const distractions = document.getElementById('sim-distractions');
  const overlay = document.getElementById('sim-focus-overlay');
  const statusPill = document.getElementById('sim-status-pill');
  const toggleDesc = document.getElementById('sim-toggle-desc');
  const shortsItem = document.querySelector('.sim-shorts-item');

  if (!toggle || !distractions || !overlay) return;

  function updateSimulator(isFocused) {
    if (isFocused) {
      distractions.classList.add('hidden');
      overlay.classList.remove('hidden');
      if (shortsItem) shortsItem.style.display = 'none';

      if (statusPill) {
        statusPill.textContent = 'Knolect Strict Focus ON (Clean Workspace)';
        statusPill.style.color = '#10b981';
      }
      if (toggleDesc) {
        toggleDesc.textContent = 'Distractions, Shorts, and algorithmic feeds are blocked';
      }
    } else {
      distractions.classList.remove('hidden');
      overlay.classList.add('hidden');
      if (shortsItem) shortsItem.style.display = 'block';

      if (statusPill) {
        statusPill.textContent = 'Default Distracting YouTube';
        statusPill.style.color = '#ef4444';
      }
      if (toggleDesc) {
        toggleDesc.textContent = 'Toggle to eliminate algorithmic noise';
      }
    }
  }

  toggle.addEventListener('change', () => {
    updateSimulator(toggle.checked);
  });

  // Initial state: Start with Focus Mode ON so visitors immediately see the value!
  toggle.checked = true;
  updateSimulator(true);
});
