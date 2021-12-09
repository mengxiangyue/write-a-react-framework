import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';

const element = (
  <div id="foo" className="title">
    <a>bar</a>
    <b />
  </div>
)
const container = document.getElementById("root")
ReactDOM.render(element, container)