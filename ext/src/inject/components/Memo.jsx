import React from 'react'


export default class Memo extends React.Component {
  render() {
    return (
      <div className="memo">{this.props.content}</div>
    )
  }
}

Memo.propTypes = {
  content: React.PropTypes.string.isRequired
};