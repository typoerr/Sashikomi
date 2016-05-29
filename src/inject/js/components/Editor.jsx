import React, { Component, PropTypes } from 'react';

export default class Editor extends Component {
  constructor(props) {
    super(props);
    this.state = {
      inputText: this.props.value || '',
      hasChanged: false,
    };
  }

  handleCancel() {
    if (this.state.hasChanged) {
      const msg = chrome.i18n.getMessage('alert_cancel');
      confirm(msg) && this.props.onCancel();
    } else {
      this.props.onCancel();
    }
  }

  handleSubmit(e) {
    e.preventDefault();
    if (this.state.inputText.trim()) {
      this.props.onSubmit(this.state.inputText);
    }
  }

  handleKeyDown(e) {
    if (e.ctrlKey && e.keyCode === 13) {
      e.preventDefault();
      this.handleSubmit(e);
    }
  }

  handleChange(e) {
    this.setState({
      inputText: e.target.value,
      hasChanged: true,
    });
  }

  render() {
    return (
      <div className="Sashikomi Editor">
        <div className="Sashikomi_header">
          <div className="btn-group">
            <button className="button" onClick={this.handleSubmit.bind(this) }>Submit</button>
            <button className="button"onClick={this.handleCancel.bind(this) }>Cancel</button>
          </div>
        </div>

        <div className="Editor_body">
          <textarea
            className="textarea"
            autoFocus="true"
            value={this.state.inputText}
            onChange={this.handleChange.bind(this) }
            onKeyDown={this.handleKeyDown.bind(this) }
            />
        </div>
      </div>
    );
  }
}

Editor.propTypes = {
  value: PropTypes.string,
  onCancel: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};
