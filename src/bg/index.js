//import {db} from './database'
//import {putMemo} from './database'
//import {deleteMemo} from './database'
//import {getMemosByUrl} from './database'
import * as store from './store'
import _ from '../util'

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

    // successの場合、
    data: {MemoContainerComponentのstateに合わせたオブジェクトフォーマットを返す}

    // errorの場合、
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
//chrome.runtime.onMessage.addListener(
//  function (req, sender, sendResponse) {
//
//    switch (req.type) {
//      case "PUT_MEMO":
//        putMemo(req, sendResponse);
//        break;
//      case "DELETE_MEMO":
//        deleteMemo(req, sendResponse);
//        break;
//      default:
//        console.log("Error: Unknown request.");
//        console.log(req);
//    }
//  }
//);


//function putMemo(req, res) {
//  // TODO: DBを更新して、更新データをresする
//  // 成功時
//  res({
//    status: 'success',
//    data: {
//      locationId: 1,
//      url: 'http://example.com',
//      targetElm: `<div id="bar">`,
//      contentId: 1,
//      containerElmId: "foo",
//      contentText: 'text!!'
//    }
//  });
//
//  // 失敗時
//  //res({
//  //  status: 'error',
//  //  errorMessage: 'error message'
//  //})
//}
//
//function deleteMemo(name, callback) {
//  //callback("Good night, " + name);
//}


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
//chrome.browserAction.onClicked.addListener(() => {
//});

/* #setBadgeText
* TODO: 挿入errorがあればBadgeTextで通知
* chrome.browserAction.setBadgeText(object details)
* https://developer.chrome.com/extensions/browserAction
*/
