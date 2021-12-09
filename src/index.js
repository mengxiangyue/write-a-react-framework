import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
const element = /*#__PURE__*/React.createElement("div", {
  id: "foo",
  className: "title"
}, /*#__PURE__*/React.createElement("a", null, "bar"), /*#__PURE__*/React.createElement("b", null));
const container = document.getElementById("root");
ReactDOM.render(element, container);