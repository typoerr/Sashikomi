require('./../css/inject.scss');
import React from 'react';
import ReactDOM from 'react-dom';
import MemoContainer from './components/MemoContainer.jsx';
import ErrorPage from './components/ErrorPage.jsx';
import SashikomiDOM from './../sashikomi-dom.js';

function insertNewMemo() {
  const sashikomi = new SashikomiDOM();
  if (sashikomi.exists()) {
    window.alert(sashikomi.alertMessage);
  } else {
    sashikomi.insert();
    const { url, targetElmPath, containerElmId, containerElm } = sashikomi;

    ReactDOM.render(
      <MemoContainer
        url={url}
        targetElmPath={targetElmPath}
        containerElmId={containerElmId}
        />,
      containerElm
    );
  }
}


function insertComponent(memos = []) {
  const insertionErrors = [];

  for (const memo of memos) {
    try {
      const sashikomi = new SashikomiDOM(memo);
      if (sashikomi.exists()) continue;
      sashikomi.insert();
      const { containerElmId, containerElm } = sashikomi;

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

