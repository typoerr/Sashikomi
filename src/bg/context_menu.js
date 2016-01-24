/* ============================================
* Context Menu
* ============================================*/
export default (function () {
  chrome.contextMenus.create({
    id: 'sashikomi_context_menu',
    title: 'Sashikomi',
    contexts: ['selection']
  });

  chrome.contextMenus.onClicked.addListener(function (info, tab) {
    chrome.tabs.sendMessage(tab.id, { type: 'CONTEXT_MENU' });
  });
})();
