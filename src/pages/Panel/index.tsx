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
import { PaapiContextProvider } from '../Shared/contexts/paapiContext';

render(
  <ThemeProvider theme={theme}>
    <InspectedPageContextProvider>
      <StateContextProvider>
        <PaapiContextProvider>
          <ErrorBoundary FallbackComponent={ErrorCardComponent}>
            <Panel />
          </ErrorBoundary>
        </PaapiContextProvider>
      </StateContextProvider>
    </InspectedPageContextProvider>
  </ThemeProvider>,
  window.document.querySelector('#app-container')
);

// (module as any)?.hot?.accept();
