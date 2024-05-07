import React, { useContext, useEffect } from 'react';
import Box from '@mui/material/Box';
import NavBarComponent from './components/NavBarComponent';
import RoutesComponent from '../Shared/components/RoutesComponent';
import { BrowserRouter } from 'react-router-dom';
import InspectedPageContext from '../Shared/contexts/inspectedPageContext';
import StateContext from '../Shared/contexts/appStateContext';
import { PBJS_NAMESPACE_CHANGE } from '../Shared/constants';
import { sendChromeTabsMessage } from '../Shared/utils';
import DownloadingCardComponent from '../Shared/components/DownloadingCardComponent';

const Panel = (): JSX.Element => {
  const { pbjsNamespace } = useContext(StateContext);
  const { prebids, downloading } = useContext(InspectedPageContext);
  const [showDownloadCard, setShowDownloadCard] = React.useState(false);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    // set showDownloadCard to true when downloading is true for more than 1 second
    if (downloading === 'true' || downloading === 'error') {
      timeout = setTimeout(() => {
        setShowDownloadCard(true);
      }, 1000);
    } else {
      setShowDownloadCard(false);
    }
    return () => {
      clearTimeout(timeout);
    };
  }, [downloading]);

  useEffect(() => {
    sendChromeTabsMessage(PBJS_NAMESPACE_CHANGE, pbjsNamespace);
  }, [pbjsNamespace]);

  return (
    <BrowserRouter>
      <Box sx={{ backgroundColor: 'primary.light', minHeight: '100vH', height: '100%' }}>
        {/* <JSONViewerComponent src={auctionState} collapsed={2} /> */}
        <NavBarComponent />
        {/* {(!prebids || !prebids[pbjsNamespace]) && downloading === 'false' && <NoPrebidCardComponent />} */}
        {showDownloadCard && <DownloadingCardComponent />}
        {prebids && prebids[pbjsNamespace] && !showDownloadCard && <RoutesComponent />}
        <RoutesComponent />
      </Box>
    </BrowserRouter>
  );
};

export default Panel;
