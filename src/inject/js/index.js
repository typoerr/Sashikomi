require('../css/inject.scss');

import React from 'react'
import ReactDOM from 'react-dom'
import MemoContainer from './components/MemoContainer'
import ErrorPage from './components/ErrorPage'
import cssPath from 'css-path'
import _ from '../../util'

/*===============================================
* Message Listener
* ==============================================*/
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
   * selectされているDOMのCSS Pathを取得(targetElm)
   * 取得したDOMの子要素(containerElm)を生成
   * containerElmにuniqueなid(containerElmId)を付与
   * containerElmをPageに挿入
   * containerElmIdを頼りにReactComponentを挿入
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
  let insertionErrors = [];

  memos.forEach(memo => {

    let targetElm = document.querySelector(memo.targetElmPath);
    let containerElm = document.createElement('div');
    let containerElmId = _.uuid();

    try {
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

    } catch (e) {
      insertionErrors.push(memo)
    }
  });

  if (insertionErrors.length) {
    chrome.runtime.sendMessage({ type: 'HAS_INSERTION_ERRORS', data: insertionErrors })
  }
}


/*===============================================
* InsertionErrorPage
* ==============================================*/
if (location.href.match(/chrome-extension:\/\//)) {
  ReactDOM.render(
    <ErrorPage/>,
    document.getElementById('InsertionErrorContainer')
  );
}