import React from 'react'
import Memo from './Memo'
import Editor from './Editor'


export default class MemoContainer extends React.Component {
  constructor(props) {
    super(props);
    this.state = { isEditing: true };
  }

  render() {
    let MemoOrEditor = () => {
      if (this.state.isEditing) {
        return <Editor content={this.props.content}/>
      } else {
        return <Memo content={this.props.content}/>
      }
    };


    return (
      <div className={'memo-container__' + this.props.id}>
        {MemoOrEditor()}
      </div>
    )
  }
}

MemoContainer.propTypes = {
  id: React.PropTypes.number.isRequired,
  content: React.PropTypes.string.isRequired
};
