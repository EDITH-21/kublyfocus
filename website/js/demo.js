/**
 * BingeBlocker - Interactive Focus Mode Simulator Logic
 * Provides real-time interactive demonstration of YouTube transformation.
 */

document.addEventListener('DOMContentLoaded', () => {
  const simContainer = document.getElementById('interactive-sim');
  const btnToggleSim = document.getElementById('btn-toggle-sim');
  const simToggleBadge = document.getElementById('sim-toggle-badge');
  const simStatusPill = document.getElementById('sim-status-pill');

  if (!simContainer || !btnToggleSim) return;

  let isFocusOn = false;

  function updateSimulatorState(enabled) {
    isFocusOn = enabled;

    if (isFocusOn) {
      simContainer.classList.add('focus-active');
      btnToggleSim.textContent = 'Turn Focus Mode Off';
      btnToggleSim.classList.remove('btn-primary');
      btnToggleSim.classList.add('btn-secondary');

      if (simToggleBadge) {
        simToggleBadge.textContent = 'Focus ON';
        simToggleBadge.className = 'demo-state-badge state-on';
      }

      if (simStatusPill) {
        simStatusPill.textContent = '🎯 Focus Mode Active';
        simStatusPill.style.color = '#34d399';
      }
    } else {
      simContainer.classList.remove('focus-active');
      btnToggleSim.textContent = 'Turn Focus Mode On';
      btnToggleSim.classList.remove('btn-secondary');
      btnToggleSim.classList.add('btn-primary');

      if (simToggleBadge) {
        simToggleBadge.textContent = 'Normal YouTube';
        simToggleBadge.className = 'demo-state-badge state-off';
      }

      if (simStatusPill) {
        simStatusPill.textContent = 'Default Distracting YouTube';
        simStatusPill.style.color = '#94a3b8';
      }
    }
  }

  btnToggleSim.addEventListener('click', () => {
    updateSimulatorState(!isFocusOn);
  });
});
