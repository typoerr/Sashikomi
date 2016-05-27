// TODO: iframe
import React, { Component, PropTypes } from 'react';
import marked from 'marked';
import highlightJS from 'highlight.js';

const ViewerPropTypes = {
  markdown: PropTypes.string,
  onEditButtonClick: PropTypes.func.isRequired,
  onDeleteButtonClick: PropTypes.func.isRequired,
};

export default class Viewer extends Component {
  rawMarkup() {
    const md = marked(
      this.props.markdown,
      {
        breaks: true,
        highlight: code => highlightJS.highlightAuto(code).value,
      }
    );
    return { __html: md };
  }

  render() {
    return (
      <div className="Viewer">
        <div className="BtnGroup">
          <button type="button" onClick={this.props.onEditButtonClick.bind(this)}>Edit</button>
          <button type="button" onClick={this.props.onDeleteButtonClick.bind(this)}>Delete</button>
        </div>
        <div
          className="Viewer__body"
          dangerouslySetInnerHTML={this.rawMarkup() }>
        </div>
      </div>
    );
  }
}

Viewer.propTypes = ViewerPropTypes;

