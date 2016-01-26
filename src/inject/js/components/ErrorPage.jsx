import React from 'react'
import ReactDOM from 'react-dom'
import Base from './Base'
import ErrorContent from './ErrorContent'

export default class ErrorPage extends Base {
  constructor(props) {
    super(props);
    this.state = {
      data: this.props.data
    };

    this._bind('handleDelete', 'contentList');
  }

  handleDelete(id) {
    console.log(id);
  }

  contentList() {
    return this.props.data.map(memo => {
      return (
        <ErrorContent
          key={memo.id}
          onDelete={this.handleDelete}
          id={memo.id}
          contentText={memo.contentText}
        />
      )
    });
  }


  render() {
    return (
      <div className="l-component-wrapper">
        <header className="l-page-header">
          <h1 className="p-header__title">{this.props.url}</h1>
        </header>

        <div className="l-page-body">
          {this.contentList()}
        </div>
      </div>
    )
  }
}

ErrorPage.propTypes = {
  url: React.PropTypes.string.isRequired,
  data: React.PropTypes.array.isRequired
};
