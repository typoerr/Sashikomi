require('./message_listener');
import * as store from './store';
import util from './../util.js';

/* ========================================
* Tab Action
* ========================================*/
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    const url = util.removeUrlHash(tab.url);
    store.getMemosByUrl(url)
      .then(data => {
        if (data.length) {
          chrome.tabs.sendMessage(tabId, { type: 'TAB_ON_UPDATED', data });
          chrome.pageAction.show(tabId);
        }
      })
      .catch(err => console.log(err));
  }
});


/* ============================================
* Context Menu
* ============================================*/
chrome.contextMenus.removeAll(() => {
  chrome.contextMenus.create({
    id: 'sashikomi_context_menu',
    title: 'Sashikomi',
    contexts: ['selection'],
  });
});


chrome.contextMenus.onClicked.addListener((info, tab) => {
  chrome.tabs.sendMessage(tab.id, { type: 'CONTEXT_MENU' });
});


/* =============================================
 * PageAction
 * ==============================================*/
chrome.pageAction.onClicked.addListener(tab => {
  chrome.pageAction.getTitle({ tabId: tab.id }, title => {
    if (title.match(/error/)) {
      sessionStorage.insetionErrorURL = tab.url;
      chrome.tabs.create({ url: chrome.extension.getURL('insertion_error.html') });
    }
  });
});
