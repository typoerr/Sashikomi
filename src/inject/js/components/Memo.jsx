import React from 'react'
import Base from './Base'
import Button from './Button'
import marked from 'marked'

export default class Memo extends Base {
  constructor(props) {
    super(props);
    this._bind('handleClose', 'handleDelete', 'rawMarkup', 'buttons');
  }

  handleClose() {
    this.props.onClose();
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

  buttons() {
    if (typeof this.props.onClose === "function") {
      return (
        <span>
         <Button onClick={this.props.onClose}>EDIT</Button>
         <Button onClick={this.props.onDelete}>DELETE</Button>
       </span>
      )
    } else {
      return (
        <Button onClick={this.props.onDelete}>DELETE</Button>
      )
    }
  }


  render() {
    return (
      <div className="p-memo">
        <div className="p-memo__btn-group">
          {this.buttons()}
        </div>

        <div className="p-memo__body"
          dangerouslySetInnerHTML={this.rawMarkup()}>
        </div>
      </div>
    )
  }
}

Memo.propTypes = {
  id: React.PropTypes.number,
  contentText: React.PropTypes.string.isRequired,
  onClose: React.PropTypes.func,
  onDelete: React.PropTypes.func
};