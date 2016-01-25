require('../css/inject.scss');

import React from 'react'
import ReactDOM from 'react-dom'
import MemoContainer from './components/MemoContainer'
import cssPath from 'css-path'
import _ from '../../util'

//新規登録用Componentの挿入
//background pageでcontext_menu eventを検知してcomponentの新規追加処を実行する
chrome.runtime.onMessage.addListener(function (req) {
  switch (req.type) {
    case "CONTEXT_MENU":
      insertNewMemo();
      break;
    case "TAB_ON_UPDATED":
      insertComponent(req.data);
      break;
    default:
      console.log("Error: Unknown request. : ", req);
  }
});

function insertNewMemo() {
  /* Componentを挿入(Editor)
  ------------------------------
   * selectされているDOMのCSS Pathを取得(targetElm: props)
   * 取得したDOMの子要素(containerElm)を生成
   * containerElmにuniqueなid(containerElmId: props)を付与
   * containerElmをPageに挿入
   * containerElmIdを頼りにReactComponentを挿入

   * 新規登録時のReactComponentに渡すprops
      {
        targetElmPath: 'cssPath',
        containerElmId: '_.uuid()で生成',
        url: location.hrefで取得
       }
  * */
  let selection = window.getSelection();
  let targetElmPath = cssPath(selection.getRangeAt(0).endContainer.parentNode);
  let targetElm = document.querySelector(targetElmPath);
  let containerElm = document.createElement('div');
  let containerElmId = _.uuid();

  containerElm.setAttribute('id', containerElmId);
  targetElm.appendChild(containerElm);

  ReactDOM.render(
    <MemoContainer
      url={location.href}
      targetElmPath={targetElmPath}
      containerElmId={containerElmId}
    />,
    document.getElementById(containerElmId)
  );
}


function insertComponent(memos = []) {

  memos.forEach(memo => {

    let targetElm = document.querySelector(memo.targetElmPath);
    let containerElm = document.createElement('div');
    let containerElmId = _.uuid();

    containerElm.setAttribute('id', containerElmId);
    targetElm.appendChild(containerElm);

    ReactDOM.render(
      <MemoContainer
        id={memo.id}
        url={memo.url}
        targetElmPath={memo.targetElmPath}
        containerElmId={containerElmId}
        contentText={memo.contentText}
      />,
      document.getElementById(containerElmId)
    );
  })
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
