import React, { useEffect, useContext } from 'react';
import { sendChromeTabsMessage } from '../Shared/utils';
import { PBJS_NAMESPACE_CHANGE } from '../Shared/constants';
import Box from '@mui/material/Box';
import { BrowserRouter } from 'react-router-dom';
import AppStateContext from '../Shared/contexts/appStateContext';
import InspectedPageContext from '../Shared/contexts/inspectedPageContext';
import NoPrebidCardComponent from '../Shared/components/NoPrebidCardComponent';
import RoutesComponent from '../Shared/components/RoutesComponent';
import { NavBar } from './Navbar';

export const Popup = (): JSX.Element => {
  const { pbjsNamespace } = useContext(AppStateContext);
  const { prebids } = useContext(InspectedPageContext);

  useEffect(() => {
    sendChromeTabsMessage(PBJS_NAMESPACE_CHANGE, pbjsNamespace);
  }, [pbjsNamespace]);

  return (
    <BrowserRouter>
      <Box sx={{ height: 600, overflowX: 'auto', backgroundColor: 'primary.light' }}>
        <NavBar />
        {(!prebids || !prebids[pbjsNamespace]) && <NoPrebidCardComponent />}
        {prebids && prebids[pbjsNamespace] && <RoutesComponent />}
      </Box>
    </BrowserRouter>
  );
};
