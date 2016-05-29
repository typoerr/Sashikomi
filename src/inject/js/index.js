// TODO: insert処理で重複している処理がたくさんあるので、きれいにまとめたい

require('./../css/inject.scss');
import React from 'react';
import ReactDOM from 'react-dom';
import MemoContainer from './components/MemoContainer.jsx';
import cssPath from 'css-path';
import util from '../../util';
import ErrorPage from './components/ErrorPage.jsx';

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

  if (targetElm.dataset.sashikomi) {
    const msg = chrome.i18n.getMessage('alert_insert_warn');
    window.alert(msg);
  } else {
    const containerElm = document.createElement('div');
    let containerElmId = util.uuid();
    const url = util.removeUrlHash(location.href);

    containerElm.setAttribute('id', containerElmId);
    targetElm.dataset.sashikomi = 'true';
    targetElm.parentNode.insertBefore(containerElm, targetElm.nextSibling);
    // targetElm.appendChild(containerElm);

    ReactDOM.render(
      <MemoContainer
        url={url}
        targetElmPath={targetElmPath}
        containerElmId={containerElmId}
        />,
      document.getElementById(containerElmId)
    );
  }
}


function insertComponent(memos = []) {
  const insertionErrors = [];

  for (const memo of memos) {
    const targetElm = document.querySelector(memo.targetElmPath);
    // targetElmにdata属性を付けて存在を判断
    if (targetElm && targetElm.dataset.sashikomi) continue;

    try {
      const containerElm = document.createElement('div');
      let containerElmId = util.uuid();
      containerElm.setAttribute('id', containerElmId);

      // 要素の子要素に追加するか兄弟要素にするか、しばらく使ってから判断したい
      targetElm.dataset.sashikomi = 'true';
      targetElm.parentNode.insertBefore(containerElm, targetElm.nextSibling);
      // targetElm.appendChild(containerElm);

      ReactDOM.render(
        <MemoContainer
          id={memo.id}
          url={memo.url}
          targetElmPath={memo.targetElmPath}
          containerElmId={containerElmId}
          contentText={memo.contentText}
          />,
        containerElm
      );
    } catch (e) {
      insertionErrors.push(memo);
    }
  }

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

