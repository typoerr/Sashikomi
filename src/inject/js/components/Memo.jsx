/*
* TODO: Delete
* TODO: this.props.contentが空ならば、Componentの自体を削除する
        つまりinsertしているの親NODEを削除する
*/

import React from 'react'
import Base from './Base'
import marked from 'marked'

export default class Memo extends Base {
  constructor(props) {
    super(props);
    this._bind('handleDoubleClick', 'rawMarkup');
  }

  handleDoubleClick() {
    this.props.onClose();
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
      <div
        className="chrome__sashikomi__memo"
        onDoubleClick={this.handleDoubleClick}
      >
        <div className="chrome__sashikomi__memo__body"
          dangerouslySetInnerHTML={this.rawMarkup()}
        ></div>
      </div>
    )
  }
}

Memo.propTypes = {
  //content: React.PropTypes.string.isRequired,
  onClose: React.PropTypes.func.isRequired
};