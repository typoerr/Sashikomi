import message_listener from './message_listener'
import * as store from './store'

/*========================================
* Tab Action
* ========================================*/
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  store.getMemosByUrl(tab.url)
    .then(data => {
      if (data.length) {
        chrome.tabs.sendMessage(tabId, { type: 'TAB_ON_UPDATED', data: data, tabId: tabId });
        chrome.pageAction.show(tabId);
      }
    })
    .catch(err => console.log(err))
});

// dbg
//store.save({
//  url: "https://github.com/dfahlander/Dexie.js/wiki/Collection",
//  contentText: 'test',
//  targetElmPath: '.foo'
//});

/* ============================================
* Context Menu
* ============================================*/
chrome.contextMenus.create({
  id: 'sashikomi_context_menu',
  title: 'Sashikomi',
  contexts: ['selection']
});

chrome.contextMenus.onClicked.addListener(function (info, tab) {
  chrome.tabs.sendMessage(tab.id, { type: 'CONTEXT_MENU' });
});


/* =============================================
 * PageAction
 * ==============================================*/
chrome.pageAction.onClicked.addListener(tab => {
  chrome.pageAction.getTitle({ tabId: tab.id }, function (title) {
    if (title.match(/error/)) {
      chrome.tabs.create({ url: chrome.extension.getURL('insertion_error.html') });
    }
  });
});
