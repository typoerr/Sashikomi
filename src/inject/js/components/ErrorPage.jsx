import React from 'react'
import ReactDOM from 'react-dom'
import Base from './Base'
import Memo from  './Memo'

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
        <Memo
          key={memo.id}
          id={memo.id}
          onDelete={this.handleDelete}
          contentText={memo.contentText}
        />
      )
    });
  }


  render() {
    return (
      <div className="l-page-component-wrapper">
        <header className="l-page-header">
          <h1 className="p-header__title">{this.props.url}</h1>
        </header>

        <section className="l-page-body">
          <div className="l-page-body__inner">
            <div className="p-operation-container">
              <button type="button" className="p-operation-btn"
                onClick={this.handleDeleteAll}>
                Clear All
              </button>
            </div>

            {this.contentList()}
          </div>

        </section>
      </div>
    )
  }
}

ErrorPage.propTypes = {
  url: React.PropTypes.string.isRequired,
  data: React.PropTypes.array.isRequired
};