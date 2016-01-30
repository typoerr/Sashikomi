import React from 'react'
import ReactDOM from 'react-dom'
import Base from './Base'
import Memo from './Memo'
import Editor from './Editor'

export default class MemoContainer extends Base {
  constructor(props) {
    super(props);
    this.state = {
      id: this.props.id,
      url: this.props.url,
      targetElmPath: this.props.targetElmPath,
      contentText: this.props.contentText || "",
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
    if (!this.state.contentText.trim()) {
      this.setState({ isEditing: true })
    }
  }

  componentDidUpdate() {
    if (!this.state.isEditing && !this.state.contentText.trim()) {
      this.removeComponent();
    }
  }

  handleToggleChild() {
    this.setState({ isEditing: !this.state.isEditing })
  }

  handleSubmit(text) {
    let data = Object.assign({}, this.state, { contentText: text });
    this.setState(data);

    chrome.runtime.sendMessage({ type: 'PUT', data: data },
      (res) => {
        if (res.status === 'error') {
          console.log(res.errorMessage);
        } else if (res.status === 'success') {
          this.setState(res.data)
        }
      }
    );
  }


  handleDelete() {
    let msg = chrome.i18n.getMessage('alert_delete');
    if (confirm(msg)) {

      let data = Object.assign({}, this.state);

      chrome.runtime.sendMessage({ type: 'DELETE', data: data },
        (res) => {
          if (res.status === 'error') {
            console.log(res.errorMessage);
          } else if (res.status === 'success') {
            this.removeComponent();
          }
        }
      );
    }
  }

  removeComponent() {
    let elm = document.getElementById(this.props.containerElmId);
    ReactDOM.unmountComponentAtNode(elm);
    elm.parentNode.removeChild(elm);
  }


  rendererChild() {
    if (this.state.isEditing) {
      return (
        <Editor
          contentText={this.state.contentText}
          onClose={this.handleToggleChild}
          onSubmit={this.handleSubmit}
        />
      )
    } else {
      return (
        <Memo
          contentText={this.state.contentText}
          onClose={this.handleToggleChild}
          onDelete={this.handleDelete}
        />
      )
    }
  }

  render() {
    return (
      <div className='chrome__sashikomi'>
        <div className='chrome__sashikomi--ext'>
          {this.rendererChild()}
        </div>
      </div>
    )
  }
}

MemoContainer.propTypes = {
  id: React.PropTypes.number,
  url: React.PropTypes.string.isRequired,
  contentText: React.PropTypes.string,
  targetElmPath: React.PropTypes.string.isRequired,
  containerElmId: React.PropTypes.string.isRequired
};
