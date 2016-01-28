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

    this._bind('handleDelete', 'handleDeleteAll', 'ContentList', 'DeleteAllButton');
  }

  componentWillMount() {
    chrome.runtime.sendMessage({ type: 'GET_INSERTION_ERRORS' },
      (res) => {
        if (res.status === 'success') {
          this.setState({ url: res.data.url, data: res.data.errors });
        }
      });
  }

  handleDelete(memo) {
    let _memo = Object.assign({}, memo);

    chrome.runtime.sendMessage({ type: 'DELETE', data: _memo },
      (res) => {
        if (res.status === 'error') {
          console.log(res.errorMessage);
        } else if (res.status === 'success') {
          let idx = this.state.data.findIndex(elm => elm.id === _memo.id);
          let _data = this.state.data.concat();

          _data.splice(idx, 1);
          this.setState({ data: _data });
        }
      }
    );
  }

  handleDeleteAll() {
    if (confirm('挿入errorがあったmemoをすべて削除します')) {
      this.state.data.forEach(memo => this.handleDelete(memo))
    }
  }

  DeleteAllButton() {
    if (this.state.data.length) {
      return (
        <button type="button" className="p-operation-btn" onClick={this.handleDeleteAll}>
          delete all
        </button>
      )
    }
  }

  ContentList() {
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
              {this.DeleteAllButton()}
            </div>

            {this.ContentList()}
          </div>

        </section>
      </div>
    )
  }
}
