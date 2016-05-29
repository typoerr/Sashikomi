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

  renderContentList() {
    return this.state.data.map(memo =>
      <Viewer
        key={memo.id}
        onDeleteButtonClick={this.handleDelete.bind(this, memo) }
        markdown={memo.contentText}
        />
    );
  }


  render() {
    return (
      <div className="ch_sashikomi ch_sashikomi--page">
        <header className="page-header">
          <h1 className="page-header heading">{this.state.url}</h1>
        </header>

        <section className="page-body">
          <div className="page-body_inner">
            <div className="page-nav">
              {
                this.state.data.length
                  ? <button
                    type="button"
                    className="button button-lg"
                    onClick={this.handleDeleteAll.bind(this) }
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
