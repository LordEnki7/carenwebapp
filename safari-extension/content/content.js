(function() {
  'use strict';

  var browserAPI = (typeof browser !== 'undefined') ? browser : chrome;
  var floatingButton = null;
  var isMinimized = true;

  function init() {
    var stored = localStorage.getItem('caren_extension_hidden');
    if (stored === 'true') return;

    createFloatingButton();
  }

  function createFloatingButton() {
    if (floatingButton) return;

    floatingButton = document.createElement('div');
    floatingButton.id = 'caren-floating-btn';
    floatingButton.innerHTML = 
      '<div class="caren-fab-container">' +
        '<button class="caren-fab" title="C.A.R.E.N.™ ALERT Quick Access">' +
          '<span class="caren-fab-icon">\u2696\uFE0F</span>' +
        '</button>' +
        '<div class="caren-fab-menu hidden">' +
          '<button class="caren-fab-item caren-sos" title="SOS Emergency">\uD83D\uDEA8 SOS</button>' +
          '<button class="caren-fab-item caren-rights" title="My Rights">\uD83D\uDCCB Rights</button>' +
          '<button class="caren-fab-item caren-app" title="Open App">\uD83D\uDD17 App</button>' +
          '<button class="caren-fab-item caren-hide" title="Hide Button">\u2715 Hide</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(floatingButton);

    var fab = floatingButton.querySelector('.caren-fab');
    var menu = floatingButton.querySelector('.caren-fab-menu');

    fab.addEventListener('click', function() {
      isMinimized = !isMinimized;
      if (isMinimized) {
        menu.classList.add('hidden');
        fab.querySelector('.caren-fab-icon').textContent = '\u2696\uFE0F';
      } else {
        menu.classList.remove('hidden');
        fab.querySelector('.caren-fab-icon').textContent = '\u2715';
      }
    });

    floatingButton.querySelector('.caren-sos').addEventListener('click', function() {
      try {
        browserAPI.runtime.sendMessage({ action: 'activateSOS' });
      } catch (e) {
        console.log('Extension messaging not available');
      }
      window.open('https://carenalert.com/panic', '_blank');
    });

    floatingButton.querySelector('.caren-rights').addEventListener('click', function() {
      window.open('https://carenalert.com/legal-rights', '_blank');
    });

    floatingButton.querySelector('.caren-app').addEventListener('click', function() {
      window.open('https://carenalert.com', '_blank');
    });

    floatingButton.querySelector('.caren-hide').addEventListener('click', function() {
      floatingButton.remove();
      floatingButton = null;
      localStorage.setItem('caren_extension_hidden', 'true');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
