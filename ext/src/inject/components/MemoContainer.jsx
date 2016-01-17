import React from 'react'
import Base from './Base'
import Memo from './Memo'
import Editor from './Editor'

/*
* TODO: Submit
* */

export default class MemoContainer extends Base {
  constructor(props) {
    super(props);
    this.state = {
      isEditing: true
    };

    this._bind('renderer', 'handleToggle');
  }

  renderer() {
    if (this.state.isEditing) {
      return (
        <Editor
          content={this.props.content}
          onClose={this.handleToggleChildren()}
        />
      )
    } else {
      return <Memo content={this.props.content}/>
    }
  }

  handleToggleChildren() {
    this.setState({ isEditing: !this.state.isEditing })
  }


  render() {
    return (
      <div className={'memo-container__' + this.props.id}>
        {this.renderer()}
      </div>
    )
  }
}

MemoContainer.propTypes = {
  id: React.PropTypes.number.isRequired,
  content: React.PropTypes.string.isRequired,
  edit: React.PropTypes.bool

};
