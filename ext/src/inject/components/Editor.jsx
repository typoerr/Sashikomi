/*
* TODO: EditorのStyle
* TODO: keybind submit
* */
import React from 'react'
import Base from './Base'

export default class Editor extends Base {
  constructor(props) {
    super(props);
    this.state = {
      inputContent: this.props.content,
      hasChange: false
    };

    this._bind('handleSubmit', 'handleChange', 'handleClose');
  }


  handleSubmit(e) {
    e.preventDefault();
    this.props.onSubmit(this.state.inputContent);
    this.closeEditor();
  }

  handleChange(e) {
    this.setState({
      inputContent: e.target.value,
      hasChange: true
    })
  }

  handleClose() {
    if (this.state.hasChange) {
      if (confirm('入力内容が変更されています。閉じてもよろしいですか？')) {
        this.closeEditor();
      }
    } else {
      this.closeEditor()
    }
  }

  closeEditor() {
    this.setState({
      inputContent: '',
      hasChange: false
    });

    this.props.onClose()
  }


  render() {

    return (
      <div className="sashikomi__editor">
        <div className="sashikomi__editor__header">
          <button type="button" onClick={this.handleClose}>cancel</button>
        </div>

        <div className="sashikomi__editor__body">
          <form onSubmit={this.handleSubmit}>
            <textarea
              value={this.state.inputContent}
              onChange={this.handleChange}
            />

            <div className="sashikomi__editor__footer">
              <button type="submit">Submit</button>
            </div>
          </form>
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