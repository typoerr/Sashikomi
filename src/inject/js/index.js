require('../css/inject.scss');
import React from 'react';
import ReactDOM from 'react-dom';
import MemoContainer from './components/MemoContainer';
import cssPath from 'css-path';
import util from '../../util';
import ErrorPage from './components/ErrorPage';

function insertNewMemo() {
  /* Componentを挿入(Editor)
  ------------------------------
   * selectされているDOMのCSS Pathを取得(targetElm)
   * 取得したDOMの子要素(containerElm)を生成
   * containerElmにuniqueなid(containerElmId)を付与
   * containerElmをPageに挿入
   * containerElmIdを頼りにReactComponentを挿入
  * */
  const selection = window.getSelection();
  let targetElmPath = cssPath(selection.getRangeAt(0).endContainer.parentNode);
  const targetElm = document.querySelector(targetElmPath);
  const containerElm = document.createElement('div');
  let containerElmId = util.uuid();
  const url = util.removeUrlHash(location.href);

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


// TODO: すでにComponentが存在しているか判定して重複を避ける処理
function insertComponent(memos = []) {
  const insertionErrors = [];

  memos.forEach(memo => {
    const targetElm = document.querySelector(memo.targetElmPath);
    const containerElm = document.createElement('div');
    let containerElmId = util.uuid();

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
      insertionErrors.push(memo);
    }
  });

  if (insertionErrors.length) {
    chrome.runtime.sendMessage({ type: 'HAS_INSERTION_ERRORS', data: insertionErrors });
  }
}

/* ===============================================
* Message Listener
* ==============================================*/
chrome.runtime.onMessage.addListener(req => {
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


/* ===============================================
* InsertionErrorPage
* ==============================================*/
if (location.href.match(/chrome-extension:\/\//)) {
  ReactDOM.render(
    <ErrorPage />,
    document.getElementById('InsertionErrorContainer')
  );
}

