import React from 'react'
import Base from './Base'
import marked from 'marked'

export default class Memo extends Base {
  constructor(props) {
    super(props);
    this._bind('handleClose', 'handleDelete', 'rawMarkup');
  }

  //info: 保留

  componentDidMount() {
    if (!this.props.children.trim()) {
      this.props.hasNoContent()
    }
  }

  handleClose() {
    this.props.onClose();
  }

  // fixme: アラートは親で出すように変更
  handleDelete() {
    if (confirm("Sashikomi: Memoを1件削除します")) {
      this.props.onDelete();
    }
  }

  rawMarkup() {
    let md = marked(
      this.props.children.toString(),
      {
        sanitize: true,
        breaks: true,
        highlight: function (code) {
          return require('highlight.js').highlightAuto(code).value;
        }
      }
    );
    return { __html: md };
  }


  render() {
    return (
      <div className="chrome__sashikomi__memo">

        <div className="chrome__sashikomi__btn-group">
          <button type="button" onClick={this.handleClose}>
            EDIT
          </button>

          <button type="button" onClick={this.handleDelete}>
            DELETE
          </button>
        </div>

        <div className="chrome__sashikomi__memo__body"
          dangerouslySetInnerHTML={this.rawMarkup()}></div>
      </div>
    )
  }
}

Memo.propTypes = {
  //content: React.PropTypes.string.isRequired,
  onClose: React.PropTypes.func.isRequired,
  onDelete: React.PropTypes.func.isRequired,
  hasNoContent: React.PropTypes.func.isRequired
};