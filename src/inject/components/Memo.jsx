/*
* TODO: MEMOのStyle
* TODO: Markdown
* TODO: Delete
* TODO: this.props.contentが空ならば、Componentの自体を削除する
        つまりinsertしているの親NODEを削除する
*/

import React from 'react'
import Base from './Base'

export default class Memo extends Base {
  constructor(props) {
    super(props);
    this._bind('handleDoubleClick');
  }

  handleDoubleClick() {
    this.props.onClose();
  }

  render() {
    return (
      <div
        className="chrome__sashikomi__memo"
        onDoubleClick={this.handleDoubleClick}
      >
        {this.props.content}
      </div>
    )
  }
}

Memo.propTypes = {
  content: React.PropTypes.string.isRequired,
  onClose: React.PropTypes.func.isRequired
};