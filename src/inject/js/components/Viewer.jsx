// TODO: iframe
import React, { Component, PropTypes } from 'react';
import marked from 'marked';
import highlightJS from 'highlight.js';

const ViewerPropTypes = {
  markdown: PropTypes.string,
  onEditButtonClick: PropTypes.func,
  onDeleteButtonClick: PropTypes.func,
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

  renderButtons() {
    const { onEditButtonClick, onDeleteButtonClick } = this.props;
    let editButton = '';
    let deleteButton = '';

    if (!!onEditButtonClick) {
      editButton = (
        <button
          type="button"
          className="button"
          onClick={this.props.onEditButtonClick.bind(this) }
          >
          Edit
        </button>
      );
    }

    if (!!onDeleteButtonClick) {
      deleteButton = (
        <button
          type="button"
          className="button"
          onClick={this.props.onDeleteButtonClick.bind(this) }
          >
          Delete
        </button>
      );
    }

    return (
      <div className="btn-group">
        {editButton}
        {deleteButton}
      </div>
    );
  }

  render() {
    return (
      <div className="Sashikomi Viewer">
        <div className="Sashikomi_header">
          {this.renderButtons() }
        </div>
        <div
          className="Viewer_body"
          dangerouslySetInnerHTML={this.rawMarkup() }>
        </div>
      </div>
    );
  }
}

Viewer.propTypes = ViewerPropTypes;

