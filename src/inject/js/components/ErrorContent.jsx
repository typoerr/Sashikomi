import React from 'react'
import Base from './Base'
import marked from 'marked'

export default class ErrorContent extends Base {
  constructor(props) {
    super(props);
    this._bind('handleDelete');
  }

  handleDelete() {
    this.props.onDelete(this.props.id);
  }

  rawMarkup() {
    let md = marked(
      this.props.contentText.toString(),
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
      <div className="p-error-content">

        <div className="p-btn-group">
          <button type="button"
            onClick={this.handleDelete}>
            DELETE
          </button>
        </div>

        <div className="p-error-content__body"
          dangerouslySetInnerHTML={this.rawMarkup()}>
        </div>
      </div>
    )
  }
}

ErrorContent.propTypes = {
  id: React.PropTypes.number.isRequired,
  contentText: React.PropTypes.string.isRequired,
  onDelete: React.PropTypes.func.isRequired
};