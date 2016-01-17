//TODO: URLでStorageを検索
//TODO: ReactComponentを作成
//TODO: data数だけReactComponentの挿入する処理

require('./inject.scss');
import MemoContainer from './components/MemoContainer'
import React from 'react'
import ReactDOM from 'react-dom'

/* ------------------------------
  Sample Message Passing(send)
* --------------------------------
chrome.runtime.sendMessage({
    type: "ADD",
    text: "sample text"
  },
  function (response) {
    if (response) {
      alert(response);
    }
  }
);

* これをReactのイベントハンドラで叩けば良さそう
*/

// dbg
let content = require('../../sample.md');


ReactDOM.render(
  <MemoContainer
    id={1}
    content={content}
  />,
  document.getElementById("foo")
);
