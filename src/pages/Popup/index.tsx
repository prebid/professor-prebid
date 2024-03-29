import React from 'react';
import { render } from 'react-dom';
import { Popup } from './Popup';
import { StateContextProvider } from '../Shared/contexts/appStateContext';
import { InspectedPageContextProvider } from '../Shared/contexts/inspectedPageContext';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from '../../theme/theme';
import { ErrorBoundary } from 'react-error-boundary';
import ErrorCardComponent from '../Shared/components/ErrorCardComponent';
render(
  <ThemeProvider theme={theme}>
    <InspectedPageContextProvider>
      <StateContextProvider>
        <ErrorBoundary FallbackComponent={ErrorCardComponent}>
          <Popup />
        </ErrorBoundary>
      </StateContextProvider>
    </InspectedPageContextProvider>
  </ThemeProvider>,
  document.getElementById('root')
);
const handleResize = () => {
  const width = window.innerWidth;
  const body = document.querySelector('body');
  body.style.width = width + 'px';
};
const interval = setInterval(() => handleResize, 1000);
window.addEventListener('resize', handleResize);
window.addEventListener('beforeunload', () => clearInterval(interval));
