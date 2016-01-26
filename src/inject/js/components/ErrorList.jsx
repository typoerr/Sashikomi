import React from 'react'
import Base from './Base'
import ErrorContent from './ErrorContent'

export default class ErrorList extends Base {
  constructor(props) {
    super(props);
    this._bind('handleDelete');
  }


  handleDelete(id) {
    console.log(id);
  }

  render() {
    let memos = this.props.data.map(memo => {
      return (
        <ErrorContent
          key={memo.id}
          onDelete={this.handleDelete}
          id={memo.id}
          contentText={memo.contentText}
        />
      )

    });

    return (
      <div className="l-page-main-container">
        {memos}
      </div>
    )
  }
}

ErrorList.propTypes = {
  data: React.PropTypes.array
};
