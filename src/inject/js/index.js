require('../css/inject.scss');
import MemoContainer from './components/MemoContainer'
import React from 'react'
import ReactDOM from 'react-dom'

//TODO: URLでStorageを検索
//TODO: ReactComponentを作成
//TODO: data数だけReactComponentの挿入する処理

// dbg
//let content = require('../../../sample.md');
let content = require('../../../sample2.md');

ReactDOM.render(
  <MemoContainer
    id={1}
    contentId={1}
    containerElmId={"foo"}
    contentText={content}
    CREATE
  />,
  document.getElementById("foo")
);
