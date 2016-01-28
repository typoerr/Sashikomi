import React from 'react'
import ReactDOM from 'react-dom'
import Base from './Base'
import Button from './Button'

export default class Editor extends Base {
  constructor(props) {
    super(props);
    this.state = {
      inputContent: this.props.content,
      hasChanged: false
    };

    this._bind('handleChange', 'handleCancel', 'handleSubmit', 'handleKeyDown');
  }

  componentDidMount() {
    // react-liteを使った場合にeditorのrenderが2回目以降からautoFocusが何故か当たらないため
    // 直接DOMを参照してfocusを当ててる
    this.refs._textarea.focus();
  }

  handleCancel() {
    if (this.state.hasChanged) {
      confirm('Sashikomi: 変更内容が破棄されます。') && this.props.onClose();
    } else {
      this.props.onClose()
    }
  }

  handleSubmit(e) {
    e.preventDefault();
    if (this.state.inputContent.trim()) {
      this.props.onSubmit(this.state.inputContent);
      this.props.onClose()
    }
  }

  handleKeyDown(e) {
    if (e.ctrlKey && e.keyCode === 13) {
      e.preventDefault();
      this.handleSubmit(e);
    }
  }


  handleChange(e) {
    this.setState({
      inputContent: e.target.value,
      hasChanged: true
    })
  }

  render() {

    return (
      <div className="p-editor">

        <div className="p-editor__btn-group">
          <Button onClick={this.handleSubmit}>SUBMIT</Button>
          <Button onClick={this.handleCancel}>CANCEL</Button>
        </div>

        <div className="p-editor__body">
          <textarea
            ref="_textarea"
            value={this.state.inputContent}
            onChange={this.handleChange}
            onKeyDown={this.handleKeyDown}
          />
        </div>
      </div>
    )
  }
}

Editor.propTypes = {
  content: React.PropTypes.string,
  onClose: React.PropTypes.func.isRequired,
  onSubmit: React.PropTypes.func.isRequired
};