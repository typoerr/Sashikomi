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
      isEditing: this.props.edit
    };

    this._bind('rendererChild', 'handleToggleChild', 'handleSubmit');
  }

  handleToggleChild() {
    this.setState({ isEditing: !this.state.isEditing })
  }

  handleSubmit(content) {
    console.log(content);

    // propsとしてReactDOM.renderからpropsを渡す
    // FIXME: 引数を修正
    //this.props.onSubmit()
  }

  rendererChild() {
    if (this.state.isEditing) {
      return (
        <Editor
          content={this.props.content}
          onClose={this.handleToggleChild}
          onSubmit={this.handleSubmit}
        />
      )
    } else {
      return <Memo
        content={this.props.content}
        onClose={this.handleToggleChild}
      />
    }
  }

  render() {
    return (
      <div className='chrome__sashikomi__container'>
        {this.rendererChild()}
      </div>
    )
  }
}

MemoContainer.propTypes = {
  id: React.PropTypes.number.isRequired,
  content: React.PropTypes.string.isRequired,
  edit: React.PropTypes.bool
  // TODO: FuncPropsをつけとる
  //onSubmit: React.PropTypes.func.isRequired
};