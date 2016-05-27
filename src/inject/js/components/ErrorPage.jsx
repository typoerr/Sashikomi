import React, { Component } from 'react';
import Viewer from './Viewer.jsx';

export default class ErrorPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      url: "",
      data: [],
    };
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
    chrome.runtime.sendMessage({ type: 'DELETE', data: memo },
      (res) => {
        if (res.status === 'success') {
          const data = this.state.data.filter(x => x.id !== memo.id);
          this.setState({ data });
        }
      }
    );
  }

  handleDeleteAll() {
    const msg = chrome.i18n.getMessage('alert_deleteAll');
    if (confirm(msg)) {
      this.state.data.forEach(memo => this.handleDelete(memo));
    }
  }

  // viewerにonEidtButtonClickプロパティを渡していないのでerrorが出る
  renderContentList() {
    return this.state.data.map(memo =>
      <Viewer
        key={memo.id}
        onDeleteButtonClick={this.handleDelete(memo)}
        markdown={memo.contentText}
        />
    );
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
              {
                this.state.data.length
                  ? <button
                    type="button"
                    className="p-operation-btn"
                    onClick={this.handleDeleteAll}
                    >
                    delete all
                  </button>
                  : ''
              }
            </div>

            {this.renderContentList() }
          </div>

        </section>
      </div>
    );
  }
}
