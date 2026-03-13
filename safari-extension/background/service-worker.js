var CAREN_BASE_URL = 'https://carenalert.com';

var browserAPI = (typeof browser !== 'undefined') ? browser : chrome;

browserAPI.runtime.onInstalled.addListener(function(details) {
  if (details.reason === 'install') {
    browserAPI.storage.local.set({
      installed: Date.now(),
      sosActivations: 0,
      lastState: null
    });
  }
});

browserAPI.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if (message.action === 'activateSOS') {
    handleSOSActivation(message.state);
    sendResponse({ status: 'sos_activated' });
  } else if (message.action === 'getState') {
    browserAPI.storage.local.get('lastState', function(data) {
      sendResponse({ state: data.lastState });
    });
    return true;
  } else if (message.action === 'updateState') {
    browserAPI.storage.local.set({ lastState: message.state });
    sendResponse({ status: 'updated' });
  }
});

function handleSOSActivation(state) {
  browserAPI.storage.local.get('sosActivations', function(data) {
    var count = (data.sosActivations || 0) + 1;
    browserAPI.storage.local.set({
      sosActivations: count,
      lastSOSTime: Date.now(),
      lastSOSState: state
    });
  });

  if (browserAPI.notifications && browserAPI.notifications.create) {
    try {
      browserAPI.notifications.create('sos-alert', {
        type: 'basic',
        iconUrl: browserAPI.runtime.getURL('icons/icon-128.png'),
        title: 'C.A.R.E.N.™ ALERT - SOS ACTIVATED',
        message: 'Emergency mode activated' + (state ? ' in ' + state : '') + '. Opening emergency panel.'
      });
    } catch (e) {
      console.log('Notification not available:', e);
    }
  }
}
