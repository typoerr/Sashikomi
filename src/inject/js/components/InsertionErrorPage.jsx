import React from 'react'
import ReactDOM from 'react-dom'
import Base from './Base'
import InsertionErrorHeader from './InsertErrorHeader'

export default class InsertionErrorPage extends Base {
  constructor(props) {
    super(props);
    this.state = {
      data: []
    };

    this._bind();
  }

  render() {
    return (
      <div className="l-container">
        <InsertionErrorHeader url={'http://example.com'}/>

      </div>
    )
  }
}

InsertionErrorPage.propTypes = {};
