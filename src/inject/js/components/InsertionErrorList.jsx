import React from 'react'
import Base from './Base'
import InsertErrorContent from './InsertErrorContent'

export default class InsertionErrors extends Base {
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
        <InsertErrorContent
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

InsertionErrors.propTypes = {
  data: React.PropTypes.array
};
