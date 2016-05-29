import React, { Component, PropTypes } from 'react';
import ReactDOM from 'react-dom';
import Editor from './Editor.jsx';
import Viewer from './Viewer.jsx';

export default class MemoContainer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      contentText: this.props.contentText || "",
      isEditing: false,
    };
  }

  componentWillMount() {
    if (!this.state.contentText.trim()) {
      this.setState({ isEditing: true });
    }
  }

  // これは必要あるか？
  componentDidUpdate() {
    if (!this.state.isEditing && !this.state.contentText.trim()) {
      this.removeComponent();
    }
  }

  handleToggleView() {
    this.setState({ isEditing: !this.state.isEditing });
  }

  handleSubmit(text) {
    const data = Object.assign({}, this.props, { contentText: text });
    chrome.runtime.sendMessage({ type: 'PUT', data },
      (res) => {
        const { contentText } = res.data;
        if (res.status === 'success') this.setState({ contentText, isEditing: false });
      }
    );
  }

  handleDelete() {
    const msg = chrome.i18n.getMessage('alert_delete');
    if (confirm(msg)) {
      const data = Object.assign({}, this.props);
      chrome.runtime.sendMessage({ type: 'DELETE', data },
        (res) => {
          if (res.status === 'success') this.removeComponent();
        }
      );
    }
  }

  removeComponent() {
    const elm = document.getElementById(this.props.containerElmId);
    ReactDOM.unmountComponentAtNode(elm);
    elm.parentNode.removeChild(elm);
  }


  render() {
    return (
      <div className="ch_sahiskomi">
        <div className="ch_sashikomi--ext">
          {
            this.state.isEditing
              ? <Editor
                value={this.state.contentText}
                onCancel={this.handleToggleView.bind(this) }
                onSubmit={this.handleSubmit.bind(this) }
                />
              : <Viewer
                markdown={this.state.contentText}
                onEditButtonClick={this.handleToggleView.bind(this) }
                onDeleteButtonClick={this.handleDelete.bind(this) }
                />
          }
        </div>
      </div>
    );
  }
}

MemoContainer.propTypes = {
  id: PropTypes.number,
  url: PropTypes.string.isRequired,
  contentText: PropTypes.string,
  targetElmPath: PropTypes.string.isRequired,
  containerElmId: PropTypes.string.isRequired,
};
