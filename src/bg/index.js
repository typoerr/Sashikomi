import message_listener from './message_listener'
import context_menu from './context_menu'
import * as store from './store'
/* =============================================
 * Message Passing(send)
 * ==============================================

 * content_scripsへのmessage_sendはchrome.tabs.sendMessageでtabIdを
 指定して送信する必要がある。以下の例は、tab eventと組み合わせて、
 tabIdを取得し、sendMessageしている。

  * chrome.tabs.sendMessageでsendしているが、
 content_scrips側では、chrome.runtime.onMessageに発火する

 chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  chrome.tabs.sendMessage(tabId, tab.url,  function(res) {
    if (res) {
      console.log(res)
    }
  });
});
* */
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
store.save({
  url: "https://github.com/dfahlander/Dexie.js/wiki/Collection",
  contentText: 'test',
  targetElmPath: '.foo'
});

/* =============================================
 * browserAction
 * ==============================================*/

/* #onClick
* TODO: popup.htmlを開く
* 挿入できなかったcontent(error)をpopup.htmlで表示
* errorがなければなにも表示しない
* -------------------------------*/
//chrome.browserAction.onClicked.addListener(() => {
//});

/* #setBadgeText
* TODO: 挿入errorがあればBadgeTextで通知
* chrome.browserAction.setBadgeText(object details)
* https://developer.chrome.com/extensions/browserAction
*/
