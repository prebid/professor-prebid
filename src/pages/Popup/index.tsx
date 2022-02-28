import React from 'react';
import ReactDOM from 'react-dom';
import { Popup } from './Popup';
ReactDOM.render(<Popup />, document.getElementById('root'));
const handleResize = () => {
  const width = window.innerWidth;
  const body = document.querySelector('body');
  body.style.width = width + 'px';
};
const interval = setInterval(() => handleResize, 1000);
window.addEventListener('resize', handleResize);
window.addEventListener('close', () => clearInterval(interval));
