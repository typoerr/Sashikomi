import React from 'react'
import ReactDOM from 'react-dom'
import Base from './Base'
import InsertionErrorHeader from './InsertErrorHeader'
import InsertionErrorList from './InsertionErrorList'

export default class InsertionErrorPage extends Base {
  constructor(props) {
    super(props);
    this.state = {
      data: this.props.data
    };
  }

  render() {
    console.log(this.state);
    return (
      <div className="l-component-wrapper">
        <InsertionErrorHeader url={this.props.url}/>
        <InsertionErrorList data={this.state.data}/>
      </div>
    )
  }
}

InsertionErrorPage.propTypes = {
  url: React.PropTypes.string.isRequired,
  data: React.PropTypes.array.isRequired
};
