import React from 'react'
import ReactDOM from 'react-dom'
import Base from './Base'
import Memo from './Memo'
import Editor from './Editor'

/*
* TODO: Submit, Deleteで、bg_pageで更新に必要なdataを定義
* TODO: Delete
* TODO: Submit
* */

/* ------------------------------
  Sample Message Passing(send)
* --------------------------------
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

* TODO: DELETE, SUBMIT処理でbackground.jsにmessageを送信
* responseでstateを更新
*/

export default class MemoContainer extends Base {
  constructor(props) {
    super(props);
    this.state = {
      contentText: this.props.contentText,
      isEditing: false
    };

    this._bind(
      'rendererChild',
      'handleToggleChild',
      'handleSubmit',
      'handleDelete'
    );
  }

  componentWillMount() {
    if (!this.props.contentText.trim()) {
      this.setState({ isEditing: true })
    }
  }

  componentWillUnmount() {
    // TODO: DBに削除リクエストを送る
  }

  handleToggleChild() {
    this.setState({ isEditing: !this.state.isEditing })
  }

  handleSubmit(text) {
    // TODO: background.jsにmessage passingしてDBを更新
    this.setState({ contentText: text });
  }

  handleDelete() {
    // TODO: background.jsにmessage passingしてDBを更新
    let elm = document.getElementById(this.props.containerElmId);
    ReactDOM.unmountComponentAtNode(elm); // -> componentWillUnmount()が呼ばれる
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
  contentId: React.PropTypes.number,
  containerElmId: React.PropTypes.string.isRequired,
  contentText: React.PropTypes.string
};
