require('../css/inject.scss');

import React from 'react'
import ReactDOM from 'react-dom'
import MemoContainer from './components/MemoContainer'
import cssPath from 'css-path'
import _ from '../../util'

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

/* -------------------------------------
*  Message Passing(onMessage)
* -------------------------------------
* TODO: 新規登録用Componentの挿入
  * background pageでcontext_menu eventを検知してcomponentの新規追加処を実行する
* */


chrome.runtime.onMessage.addListener(function
    (req, sender, sendResponse) {

    switch (req.type) {
      case "CONTEXT_MENU":
        /*
        * todo: Editorを挿入
          1 selectされているDOMを取得(targetElm: props)
          2 取得したDOMの子要素(containerElm)を生成
          3 containerElmにuniqueなid(containerElmId: props)を付与
          4 containerElmをPageに挿入
          5 containerElmIdを頼りにReactComponentを挿入

          * 新規登録時のReactComponentに渡すprops
            {
              targetElm: 'element',
              containerElmId: '_.uuid()で生成',
              url: location.hrefで取得
             }
        * */
        createNewMemo();
        break;
      default:
        console.log("Error: Unknown request. : ", req);
    }
  }
);

function createNewMemo() {

  /*
   * selectされているDOMを取得(targetElm: props)
   * 取得したDOMの子要素(containerElm)を生成
   * containerElmにuniqueなid(containerElmId: props)を付与
  */

  let selection = window.getSelection();
  let targetElmPath = cssPath(selection.getRangeAt(0).endContainer.parentNode);
  let targetElm = document.querySelector(targetElmPath);
  let containerElm = document.createElement('div');
  let containerElmId = _.uuid();
  let url = location.href;

  containerElm.setAttribute('id', containerElmId);
  targetElm.appendChild(containerElm);

  ReactDOM.render(
    <MemoContainer
      url={url}
      targetElmPath={targetElmPath}
      containerElmId={containerElmId}
    />,
    document.getElementById(containerElmId)
  );
}

function insertToHtml(memos = []) {
  /*
    4 containerElmをPageに挿入
    5 containerElmIdを頼りにReactComponentを挿入
  */


}


/*==============================================
* Component
* ==============================================*/
/* -----------------------------------
  DB Schema
* ------------------------------------
* memos:
* -------
  id: 1 // auto increment, index
  url: '', // index,
  targetElmPath: 'element',
  contentText: 'text or markdown'
*/

// dbg
//let contentText = require('../../../sample.md');
//let contentText = require('../../../sample2.md');
/*

ReactDOM.render(
  <MemoContainer
    url={"http:example.com"}
    targetElmPath={"element"}
    containerElmId={"foo"}
    contentText=""
  />,
  document.getElementById("foo")
);


*/
