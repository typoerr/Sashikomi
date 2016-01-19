require('../css/inject.scss');
import MemoContainer from './components/MemoContainer'
import React from 'react'
import ReactDOM from 'react-dom'


/* -----------------------------------
  Schema
* ------------------------------------*/
/*
 id: 1 // auto increment, index
 url: '', // index
 contents: [
    {
      contentId: 1, // auto increment, index
      targetElm: 'element',
      contentText: 'text or markdown'
    },
 ]
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
*/


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



/* TODO: Componentの挿入処理
* contents.targetElmに対してcomponent挿入ポイントとなる、
  uniqueなid(containerElmId)を持ったdiv要素を生成して、targetElmの子要素として追加。
* containerElmIdに対してComponentを挿入。
*
*
* */

/*==============================================
* Component
* ==============================================*/
// dbg
//let contentText = require('../../../sample.md');
let contentText = require('../../../sample2.md');

// TODO: ComponentでもURLをPropで受取る(新規登録用)
ReactDOM.render(
  <MemoContainer
    id={1}
    contentId={1}
    containerElmId={"foo"}
    contentText={contentText}
    //contentText=""
  />,
  document.getElementById("foo")
);


