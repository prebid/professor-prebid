import React from 'react';
import { createRoot } from 'react-dom/client';

import Options from './Options';

const container = window.document.querySelector('#app-container');
if (container) {
  createRoot(container).render(<Options title={'Settings'} />);
}

if ((module as any).hot) (module as any).hot.accept();
