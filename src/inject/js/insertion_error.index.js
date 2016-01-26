import React from 'react'
import ReactDOM from 'react-dom'
import ErrorPage from './components/ErrorPage'
import _ from '../../util'

/*
  id: 1 // auto increment, index
  url: '', // index,
  targetElmPath: 'element',
  contentText: 'text or markdown'
*/

let sample = require('../../../sample.md');
let sample2 = require('../../../sample2.md');

let d = {
  url: 'http://example.com',
  insertionErrorData: [
    { id: 1, url: 'http://example.com', targetElmPath: '.path', contentText: sample },
    { id: 2, url: 'http://example.com', targetElmPath: '.path', contentText: sample2 },
    { id: 3, url: 'http://example.com', targetElmPath: '.path', contentText: 'sample' },
    { id: 4, url: 'http://example.com', targetElmPath: '.path', contentText: 'sample' }
  ]
};

ReactDOM.render(
  <ErrorPage
    url={d.url}
    data={d.insertionErrorData}
  />,
  document.getElementById('InsertionErrorContainer')
);