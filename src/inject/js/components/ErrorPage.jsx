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

    this._bind('handleDelete', 'handleDeleteAll', 'contentList');
  }

  //TODO: delete処理
  handleDelete(id) {
    console.log(id);
  }

  //TODO: delete処理
  handleDeleteAll() {
    console.log('all');

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

        <section className="l-page-body">
          <div className="p-operation-container">
            <button type="button" className="c-btn--link"
              onClick={this.handleDeleteAll}>
              Clear All
            </button>
          </div>

          {this.contentList()}
        </section>
      </div>
    )
  }
}

ErrorPage.propTypes = {
  url: React.PropTypes.string.isRequired,
  data: React.PropTypes.array.isRequired
};
