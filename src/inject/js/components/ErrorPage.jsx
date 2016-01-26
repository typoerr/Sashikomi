import React from 'react'
import ReactDOM from 'react-dom'
import Base from './Base'
import ErrorHeader from './ErrorHeader'
import ErrorList from './ErrorList'

export default class ErrorPage extends Base {
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
        <ErrorHeader url={this.props.url}/>
        <ErrorList data={this.state.data}/>
      </div>
    )
  }
}

ErrorPage.propTypes = {
  url: React.PropTypes.string.isRequired,
  data: React.PropTypes.array.isRequired
};
