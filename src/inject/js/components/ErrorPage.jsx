import React from 'react'
import ReactDOM from 'react-dom'
import Base from './Base'
import Memo from  './Memo'

export default class ErrorPage extends Base {
  constructor(props) {
    super(props);
    this.state = {
      url: "",
      data: []
    };

    this._bind('handleDelete', 'handleDeleteAll', 'contentList');
  }

  componentWillMount() {
    chrome.runtime.sendMessage({ type: 'GET_INSERTION_ERRORS' },
      (res) => {
        if (res.status === 'success') {
          this.setState({ url: res.data.url, data: res.data.errors });
        }
      });
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
    return this.state.data.map(memo => {
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
          <h1 className="p-header__title">{this.state.url}</h1>
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
