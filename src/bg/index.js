import messageListener from './message_listener';
import * as store from './store';

/* ========================================
* Tab Action
* ========================================*/
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    store.getMemosByUrl(tab.url)
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
