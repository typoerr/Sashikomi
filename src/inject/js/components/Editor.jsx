import React from 'react'
import ReactDOM from 'react-dom'
import Base from './Base'

export default class Editor extends Base {
  constructor(props) {
    super(props);
    this.state = {
      inputContent: this.props.content,
      hasChanged: false
    };

    this._bind('handleChange', 'handleCancel', 'handleSubmit');
  }

  componentDidMount() {
    // react-liteを使った場合にeditorのrenderが2回目以降からautoFocusが当たらないため
    // 直接DOMを参照してfocusを当てる
    this.refs._textarea.focus();
  }

  handleCancel() {
    //if (this.state.hasChanged) {
    //}
    this.props.onClose()
  }

  handleSubmit(e) {
    e.preventDefault();
    this.props.onSubmit(this.state.inputContent);
    this.props.onClose()
  }


  handleChange(e) {
    this.setState({
      inputContent: e.target.value,
      hasChanged: true
    })
  }

  render() {

    return (
      <div className="chrome__sashikomi__editor">

        <div className="chrome__sashikomi__btn-group">
          <button type="button" onClick={this.handleSubmit}>
            SUBMIT
          </button>

          <button type="button" onClick={this.handleCancel}>
            CANCEL
          </button>
        </div>

        <div className="chrome__sashikomi__editor__body">
          <textarea
            ref="_textarea"
            autoFocus="true"
            value={this.state.inputContent}
            onChange={this.handleChange}
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