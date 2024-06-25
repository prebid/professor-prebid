import React, { useContext, useEffect } from 'react';
import Box from '@mui/material/Box';
import RoutesComponent from '../Shared/components/RoutesComponent';
import NoPrebidCardComponent from '../Shared/components/NoPrebidCardComponent';
import { BrowserRouter } from 'react-router-dom';
import { NavBar } from '../Shared/components/navBar/Navbar';
import InspectedPageContext from '../Shared/contexts/inspectedPageContext';
import StateContext from '../Shared/contexts/appStateContext';
import { PBJS_NAMESPACE_CHANGE } from '../Shared/constants';
import { sendChromeTabsMessage } from '../Shared/utils';
import DownloadingCardComponent from '../Shared/components/DownloadingCardComponent';

const Panel = (): JSX.Element => {
  const { pbjsNamespace, prebids } = useContext(StateContext);
  const { downloading } = useContext(InspectedPageContext);
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
        <NavBar />
        {(!prebids || !prebids[pbjsNamespace]) && downloading === 'false' && <NoPrebidCardComponent />}
        {showDownloadCard && <DownloadingCardComponent />}
        {prebids && prebids[pbjsNamespace] && !showDownloadCard && <RoutesComponent />}
      </Box>
    </BrowserRouter>
  );
};

export default Panel;
