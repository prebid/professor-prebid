import React from 'react';
import ReactDOM from 'react-dom';
import { Popup } from './Popup';
import './index.scss';
ReactDOM.render(<Popup />, document.getElementById('root'));
const handleResize = () => {
  const width = window.innerWidth;
  const body = document.querySelector('body');
  if (width < 900 && width > 424) {
    body.style.width = '800px';
    body.style.height = '600px';
    body.style.margin = '0px';
  } else if (width < 425) {
    body.style.width = '378px';
    body.style.height = '600px';
    body.style.margin = '0px';
  }
};
handleResize();
window.addEventListener('resize', handleResize);
