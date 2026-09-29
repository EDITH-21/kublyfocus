/**
 * BingeBlocker - Install Page Logic
 * Handles browser tab switching, extension address helpers, and copy functionality.
 */

document.addEventListener('DOMContentLoaded', () => {
  const browserTabs = document.querySelectorAll('.browser-tab-btn');
  const browserNameSpans = document.querySelectorAll('.browser-name-insert');
  const extensionUrlText = document.getElementById('extension-url-text');
  const btnCopyExtUrl = document.getElementById('btn-copy-ext-url');
  const storeCtaBtn = document.getElementById('install-store-cta');

  const browserConfigs = {
    chrome: {
      name: 'Google Chrome',
      extUrl: 'chrome://extensions',
      storeName: 'Chrome Web Store'
    },
    edge: {
      name: 'Microsoft Edge',
      extUrl: 'edge://extensions',
      storeName: 'Edge Add-ons & Chrome Store'
    },
    brave: {
      name: 'Brave Browser',
      extUrl: 'brave://extensions',
      storeName: 'Chrome Web Store'
    },
    opera: {
      name: 'Opera',
      extUrl: 'opera://extensions',
      storeName: 'Chrome Web Store'
    }
  };

  function setBrowserTab(browserKey) {
    const config = browserConfigs[browserKey] || browserConfigs.chrome;

    browserTabs.forEach(tab => {
      if (tab.getAttribute('data-browser') === browserKey) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });

    browserNameSpans.forEach(span => {
      span.textContent = config.name;
    });

    if (extensionUrlText) {
      extensionUrlText.textContent = config.extUrl;
    }

    if (storeCtaBtn && window.getInstallTarget) {
      const target = window.getInstallTarget(browserKey);
      if (target.isDirectStore) {
        storeCtaBtn.href = target.url;
        storeCtaBtn.textContent = `Install from ${config.storeName}`;
        storeCtaBtn.classList.remove('hidden');
      }
    }
  }

  // Bind browser tab buttons
  browserTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const browser = tab.getAttribute('data-browser');
      setBrowserTab(browser);
    });
  });

  // Copy command helper
  if (btnCopyExtUrl && extensionUrlText) {
    btnCopyExtUrl.addEventListener('click', async () => {
      try {
        const text = extensionUrlText.textContent.trim();
        await navigator.clipboard.writeText(text);
        const original = btnCopyExtUrl.textContent;
        btnCopyExtUrl.textContent = 'Copied! ✓';
        setTimeout(() => {
          btnCopyExtUrl.textContent = original;
        }, 2000);
      } catch (err) {
        console.debug('Clipboard write failed:', err);
      }
    });
  }

  // Auto-detect initial browser
  if (window.detectBrowser) {
    const current = window.detectBrowser();
    if (browserConfigs[current.name]) {
      setBrowserTab(current.name);
    } else {
      setBrowserTab('chrome');
    }
  }
});
