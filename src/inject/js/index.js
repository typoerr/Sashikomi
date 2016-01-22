require('../css/inject.scss');
import MemoContainer from './components/MemoContainer'
import React from 'react'
import ReactDOM from 'react-dom'

/* -----------------------------------
  Schema
* ------------------------------------

* memos:
* -------
  id: 1 // auto increment, index
  url: '', // index,
  targetElm: 'element',
  contentText: 'text or markdown'
*/

/* ------------------------------
  Sample Message Passing(send)
* -------------------------------- */
/*
chrome.runtime.sendMessage({
    type: "SUBMIT",
    text: "sample text"
  },
  function (response) {
    if (response) {
      alert(response);
    }
  }
);

* Component内に実装
* 1. DELETE, SUBMIT処理でbackground pageにmessageを送信
*    * responseでstateを更新
*
* TODO: URLでDBを検索
* 2. URLを監視して、dataの有無をbackground pageに問い合わせる
*   TODO: data数だけReactComponentの挿入する処理
*    * dataがあれば、responseでdataを受け取り、domにComponentを追加
*    * dataがなければ、なにもしない
*
*    // Contentの挿入方法
     * targetElmの子要素としてcontainerElmを生成。
     * 一意になるようにcontainerElmのidに_.uuid()を叩いて、idとして付与
       * (Componentの削除に使う。propsとして渡す。)
     * containerElmのidを頼りにReactComponentを挿入
*/

//// dbg
//(function() {
//  chrome.runtime.sendMessage({
//      type: "PUT_MEMO",
//      data: {
//        locationId: 1,
//        url: 'http://example.com',
//        targetElm: `<div id="bar">`,
//        contentId: 1,
//        containerElmId: "foo",
//        contentText: 'text'
//      }
//    },
//    function (res) {
//      if (res && res.status === 'success') {
//        console.log(res.data);
//      } else {
//        console.log(res);
//      }
//    }
//  );
//})();
//
//

/* -------------------------------------
*  Sample Message Passing(onMessage)
* ------------------------------------- */
/*

chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    console.log(request);

    // response
    sendResponse('fire!!!!! on Message');
  }
);

* TODO: 新規登録用Componentの挿入
* background pageでcontext_menu eventを検知してcomponentの新規追加処を実行する(?)
* */



/*==============================================
* Component
* ==============================================*/
// dbg
//let contentText = require('../../../sample.md');
//let contentText = require('../../../sample2.md');
//
//ReactDOM.render(
//  <MemoContainer
//    id={1}
//    url={"http:example.com"}
//    targetElm={"element"}
//    containerElmId={"foo"}
//    contentText={contentText}
//    //contentText=""
//  />,
//  document.getElementById("foo")
//);


