import React from 'react';
import { render } from 'react-dom';

import Options from './Options';

render(<Options title={'Settings'} />, window.document.querySelector('#app-container'));

if ((module as any).hot) (module as any).hot.accept();
