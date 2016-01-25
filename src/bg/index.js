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


//TODO: browserActionからPageActionに変更する
/* =============================================
 * browserAction
 * ==============================================*/
//chrome.browserAction.onClicked.addListener((tab) => {
//  chrome.browserAction.getBadgeText({ tabId: tab.id }, function (count) {
//    if (count) {
//      chrome.tabs.create({ url: chrome.extension.getURL('insertion_error.html') });
//    }
//  });
//});

