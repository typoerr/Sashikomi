import React from 'react'
import Base from './Base'

export default class InsertionErrorHeader extends Base {
  render() {
    return (
      <header className="l-page-header">
        <h1 className="p-header__title">{this.props.url}</h1>
      </header>
    )
  }
}

InsertionErrorHeader.propTypes = {
  url: React.PropTypes.string.isRequired
};

