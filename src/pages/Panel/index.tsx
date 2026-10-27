import React from 'react';
import { createRoot } from 'react-dom/client';
import { ErrorBoundary } from 'react-error-boundary';
import Panel from './Panel';
import { StateContextProvider } from '../Shared/contexts/appStateContext';
import { InspectedPageContextProvider } from '../Shared/contexts/inspectedPageContext';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from '../../theme/theme';
import ErrorCardComponent from '../Shared/components/ErrorCardComponent';
import { OptionsContextProvider } from '../Shared/contexts/optionsContext';

const container = window.document.querySelector('#app-container') || document.getElementById('root');
if (container) {
  createRoot(container).render(
    <ThemeProvider theme={theme}>
      <OptionsContextProvider>
        <InspectedPageContextProvider>
          <StateContextProvider>
            <ErrorBoundary FallbackComponent={ErrorCardComponent}>
              <Panel />
            </ErrorBoundary>
          </StateContextProvider>
        </InspectedPageContextProvider>
      </OptionsContextProvider>
    </ThemeProvider>
  );
}
