/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import { render } from 'react-dom';
import { ErrorBoundary } from 'react-error-boundary';
import Panel from './Panel';
import { StateContextProvider } from '../Shared/contexts/appStateContext';
import { InspectedPageContextProvider } from '../Shared/contexts/inspectedPageContext';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from '../../theme/theme';
import ErrorCardComponent from '../Shared/components/ErrorCardComponent';

render(
  <ThemeProvider theme={theme}>
    <InspectedPageContextProvider>
      <ErrorBoundary FallbackComponent={ErrorCardComponent}>
        <StateContextProvider>
          <Panel />
        </StateContextProvider>
      </ErrorBoundary>
    </InspectedPageContextProvider>
  </ThemeProvider>,
  window.document.querySelector('#app-container')
);

// (module as any)?.hot?.accept();
