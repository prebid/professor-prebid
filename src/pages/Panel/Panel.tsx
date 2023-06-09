import React, { useContext, useEffect } from 'react';
import Box from '@mui/material/Box';
import NavBarComponent from './components/NavBarComponent';
import RoutesComponent from '../Shared/components/RoutesComponent';
import NoPrebidCardComponent from '../Shared/components/NoPrebidCardComponent';
import { BrowserRouter } from 'react-router-dom';
import InspectedPageContext from '../Shared/contexts/inspectedPageContext';
import StateContext from '../Shared/contexts/appStateContext';
import { PBJS_NAMESPACE_CHANGE } from '../Shared/constants';

const Panel = (): JSX.Element => {
  const { pbjsNamespace } = useContext(StateContext);
  const { prebids } = useContext(InspectedPageContext);
  useEffect(() => {
    chrome.tabs.sendMessage(chrome.devtools.inspectedWindow.tabId, { type: PBJS_NAMESPACE_CHANGE, pbjsNamespace });
  }, [pbjsNamespace]);

  return (
    <BrowserRouter>
      <Box sx={{ backgroundColor: 'primary.light' }}>
        {/* <JSONViewerComponent src={inspectedPageState} collapsed={2} /> */}
        <NavBarComponent />
        {(!prebids || !prebids[pbjsNamespace]) && <NoPrebidCardComponent />}
        {prebids && prebids[pbjsNamespace] && <RoutesComponent />}
      </Box>
    </BrowserRouter>
  );
};

export default Panel;
