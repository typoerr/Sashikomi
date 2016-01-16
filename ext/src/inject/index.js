//TODO: URLでStorageを検索
//TODO: ReactComponentを作成
//TODO: data数だけReactComponentの挿入する処理
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


ReactDOM.render(
  <MemoContainer id={1} content="this is react"/>,
  document.getElementById("baz")
);
