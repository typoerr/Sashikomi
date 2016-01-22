import React from 'react'
import ReactDOM from 'react-dom'
import Base from './Base'
import Memo from './Memo'
import Editor from './Editor'

/* -----------------------------------
  Schema
* ------------------------------------

* memos:
* -------
  id: 1 // auto increment, index
  url: '', // index,
  targetElm: 'element',
  contentText: 'text or markdown'
*/

/* ------------------------------
  Sample Message Passing(send)
* --------------------------------
chrome.runtime.sendMessage({
    type: "PUT",
    text: "sample text"
  },
  function (response) {
    if (response) {
      alert(response);
    }
  }
);

* DELETE, PUT処理でbackground.jsにmessageを送信
* responseでstateを更新
*/

/*---------------------------------------------
*  PUT, DELETE処理について
*  --------------------------------------------
*
*  ComponentのレンダリングではcontentTextとisEditingしか利用しないが、
   新規登録と更新の処理に対応するために、DBで保存されている値をすべてpropsとして受け取り、
   stateとして保持する。
*  DBの更新はtypeとdataのオブジェクトをrequestとして送る。
*  dataは全てのstateを含める
*  responseには'status'と'data'を期待し、statusに応じて適切な処理を行う
*  */


export default class MemoContainer extends Base {
  constructor(props) {
    super(props);
    this.state = {
      id: this.props.id,
      url: this.props.url,
      targetElm: this.props.targetElm,
      contentText: this.props.contentText,
      isEditing: false
    };

    this._bind(
      'rendererChild',
      'handleToggleChild',
      'handleSubmit',
      'handleDelete',
      'noContent'
    );
  }

  componentWillMount() {
    if (!this.props.contentText.trim()) {
      this.setState({ isEditing: true })
    }
  }

  handleToggleChild() {
    this.setState({ isEditing: !this.state.isEditing })
  }

  handleSubmit(text) {
    let data = Object.assign({}, this.state, { contentText: text });

    // background.jsにmessage passingしてDBを更新
    chrome.runtime.sendMessage({ type: 'PUT', data: data },
      (res) => {
        if (res.status === 'error') {
          // TODO: 正しいerrorハンドリングに置き換える
          alert('error');
        } else if (res.status === 'success') {
          this.setState(res.data)
        }
      }
    );
  }


  handleDelete() {
    let data = Object.assign({}, this.state);

    //background.jsにmessage passingしてDBを更新
    chrome.runtime.sendMessage({ type: 'DELETE', data: data },
      (res) => {
        if (res.status === 'error') {
          // TODO: 正しいerrorハンドリングに置き換える
          alert('error');
        } else if (res.status === 'success') {
          // DOMから自身のComponentとContainerNODEを削除
          this.removeComponentAndContainer();
        }
      }
    );
  }

  noContent() {
    this.removeComponentAndContainer();
  }

  removeComponentAndContainer() {
    let elm = document.getElementById(this.props.containerElmId);
    ReactDOM.unmountComponentAtNode(elm);
    elm.parentNode.removeChild(elm);
  }


  rendererChild() {
    if (this.state.isEditing) {
      return (
        <Editor
          content={this.state.contentText}
          onClose={this.handleToggleChild}
          onSubmit={this.handleSubmit}
        />
      )
    } else {
      return (
        <Memo
          onClose={this.handleToggleChild}
          onDelete={this.handleDelete}
          noContent={this.noContent}
        >
          {this.state.contentText}
        </Memo>
      )
    }
  }

  render() {
    return (
      <div className='chrome__sashikomi__container'>
        {this.rendererChild()}
      </div>
    )
  }
}

MemoContainer.propTypes = {
  id: React.PropTypes.number,
  url: React.PropTypes.string,
  contentText: React.PropTypes.string,
  targetElm: React.PropTypes.string,
  containerElmId: React.PropTypes.string.isRequired
};
