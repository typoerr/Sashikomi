import Dexie from 'dexie'

/* ==========================================
 * indexedDBのsetup
 * ===========================================*/

/* -----------------------------------
  Schema
* ------------------------------------
 locationId: 1 // auto increment, index
 url: '', // index
 contents: [
    {
      contentId: 1, // auto increment, index
      targetElm: 'element',
      contentText: 'text or markdown'
    },
 ]
* */

/*-----------------------------------
  Operation Sample
* -----------------------------------
 db.transaction('rw', db.memos, function () {
   db.memos.add({ url: 'http://example.com',
      contents: [{ node: 'element', content: 'text or markdown' }]
   });
   db.memos.where('url').equals('http://example.com').each((item) => console.log(item));
 });

*/

// TODO: Schemaを変更
let db = new Dexie('SashikomiDB');
db.version(1).stores({
  memos: "++id, url"
});

db.open();


/* =============================================
 * Message Passing(onMessage)
 * ==============================================
// TODO: inject.jsからのMessageをlistenして、DBのCRUD処理
* request:
  { type: 'ActionType', data: {MemoContainerComponentのstate}}

  * type: {
      PUT: Memoの新規作成、更新,
      DELETE: MemoのDelete
    }


* response:
  {
    status: 'error or success',
    data: {MemoContainerComponentのstateに合わせたオブジェクトフォーマットを返す}
  }


// 以下、Sample

chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {

    console.log(request);
    console.log(request.url);

    sendResponse({url: request.url});

    // 実際はtypeを受け取って、以下のような感じでswitch分岐
    switch (request.type) {
      case "hello":
        hello(request.text, sendResponse);
        break;
      case "night":
        night(request.text, sendResponse);
        break;
      default:
        console.log("Error: Unkown request.");
        console.log(request);
    }
  }
);


function hello(name, callback) {
  callback("Hello, " + name);
}

function night(name, callback) {
  callback("Good night, " + name);
}
 * */



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

 1. ContextMenuから新規Component追加の命令をContentScriptsに司令

* */




/* =============================================
 * browserAction
 * ==============================================*/

/* #onClick
* TODO: popup.htmlを開く
* 挿入できなかったcontent(error)をpopup.htmlで表示
* errorがなければなにも表示しない
* -------------------------------*/
//chrome.browserAction.onClicked.addListener(function () {
//
//});

/* #setBadgeText
* TODO: 挿入errorがあればBadgeTextで通知
* chrome.browserAction.setBadgeText(object details)
* https://developer.chrome.com/extensions/browserAction
*/
