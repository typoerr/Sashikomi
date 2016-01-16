import React from 'react'

export default class Editor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      inputContent: this.props.content,
      hasChange: false
    };

    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleClose = this.handleClose.bind(this);
  }

  handleSubmit(e) {
    e.preventDefault();
    console.log(this.state.inputContent)
  }

  handleChange(e) {
    this.setState({
      inputContent: e.target.value,
      hasChange: true
    });
  }

  handleClose() {
    if (this.state.hasChange) {
      if (confirm('入力内容が変更されています。閉じてもよろしいですか？')) {
        //todo: editorを閉じる
      }
    } else {
      //todo: editorを閉じる
    }
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
  content: React.PropTypes.string
};