import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';

const element = <h1 title="foo" className="title">Hello Didact</h1>
console.log('mxy-----', element)
ReactDOM.render(
  element,
  document.getElementById('root')
);
