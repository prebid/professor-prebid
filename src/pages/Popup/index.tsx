import React from 'react';
import { createRoot } from 'react-dom/client';
import { Popup } from './Popup';
import { OptionsContextProvider } from '../Shared/contexts/optionsContext';
import { StateContextProvider } from '../Shared/contexts/appStateContext';
import { InspectedPageContextProvider } from '../Shared/contexts/inspectedPageContext';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from '../../theme/theme';
import { ErrorBoundary } from 'react-error-boundary';
import ErrorCardComponent from '../Shared/components/ErrorCardComponent';
const container = document.getElementById('root');
const root = createRoot(container);
root.render(
  <ThemeProvider theme={theme}>
    <OptionsContextProvider>
      <InspectedPageContextProvider>
        <StateContextProvider>
          <ErrorBoundary FallbackComponent={ErrorCardComponent}>
            <Popup />
          </ErrorBoundary>
        </StateContextProvider>
      </InspectedPageContextProvider>
    </OptionsContextProvider>
  </ThemeProvider>
);
const handleResize = () => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const body = document.querySelector('body');
  body.style.width = width + 'px';
  body.style.height = height + 'px';
  body.style.backgroundColor = theme.palette.primary.light;
};
const interval = setInterval(handleResize, 1000);
window.addEventListener('resize', handleResize);
window.addEventListener('beforeunload', () => clearInterval(interval));
