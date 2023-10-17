import React, { useEffect, useState, useContext } from 'react';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import { INITIATOR_TOGGLE, INITIATOR_ROOT_URL } from '../../constants';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import JSONViewerComponent from '../JSONViewerComponent';
import AppStateContext from '../../contexts/appStateContext';
import InspectedPageContext from '../../contexts/inspectedPageContext';
import Grid from '@mui/material/Grid';
import RefreshIcon from '@mui/icons-material/Refresh';
import Snackbar from '@mui/material/Snackbar';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import './InitiatorComponent.css';
import { Bars } from 'react-loader-spinner';

export interface ToastMessage {
  message: string;
  key: number;
}

const gridStyle = {
  p: 0.5,
  '& .MuiGrid-item > .MuiPaper-root': {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};

const InitiatorComponent = (): JSX.Element => {
  const { isRefresh, initDataLoaded, setInitiatorOutput, setInitDataLoaded, setIsRefresh } = useContext(AppStateContext);
  const { initReqChainResult } = useContext(InspectedPageContext);
  const [initChainFeatureStatus, setInitChainFeatureStatus] = useState<boolean>(null);
  const [rootUrl, setRootUrl] = useState<string>('');
  const [showReqChain, setShowReqChain] = useState<boolean>(false);
  const [urlButtonDisabled, setUrlButtonDisabled] = useState<boolean>(true);

  const [toastMessage, setToastMessage] = React.useState<readonly ToastMessage[]>([]);
  const [showToastMessage, setShowToastMessage] = React.useState(false);
  const [messageInfo, setMessageInfo] = React.useState<ToastMessage | undefined>(
    undefined,
  );

  chrome.tabs?.onUpdated.addListener(function (tabId, info) {
    if (info.status === 'complete') {
      setShowReqChain(true);
      setInitDataLoaded(true);
    }
  });

  useEffect(() => {
    if (toastMessage.length && !messageInfo) {
      // Set a new toast message when we don't have an active one
      setMessageInfo({ ...toastMessage[0] });
      setToastMessage((prev) => prev.slice(1));
      setShowToastMessage(true);
    } else if (toastMessage.length && messageInfo && showToastMessage) {
      // Close an active toast message when a new one is added
      setShowToastMessage(false);
    }
  }, [toastMessage, messageInfo, showToastMessage]);

  useEffect(() => {
    chrome.storage.local.get(INITIATOR_TOGGLE, (result) => {
      const value = result ? result[INITIATOR_TOGGLE] : false;
      setInitChainFeatureStatus(value);
    });
  }, [initChainFeatureStatus]);

  useEffect(() => {
    chrome.storage.local.get(INITIATOR_ROOT_URL, (result) => {
      const value = result ? result[INITIATOR_ROOT_URL] : rootUrl;
      setRootUrl(value);
    });
  }, []);

  const handleRefreshClickToShowToastMessage = (message: string) => {
    setToastMessage((prev) => [...prev, { message, key: new Date().getTime() }]);
  };

  const handleCloseToastMessageClick = (event: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setShowToastMessage(false);
  };

  const handleToastMessageExited = () => {
    setMessageInfo(undefined);
  };

  const handleInitChainFeatureStatusChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInitChainFeatureStatus(event.target.checked);
    const { checked } = event.target;
    chrome.storage.local.set({ [INITIATOR_TOGGLE]: checked }, () => {
      chrome.tabs.query({ currentWindow: true, active: true }, (tabs) => {
        const tab = tabs[0];
        chrome.tabs.sendMessage(tab.id as number, { type: INITIATOR_TOGGLE, consoleState: checked });
      });
    });
  };

  const handleSettingRootUrl = () => {
    if (rootUrl === '') {
      return;
    }
    chrome.storage.local.set({ [INITIATOR_ROOT_URL]: rootUrl }, () => {
      chrome.tabs.query({ currentWindow: true, active: true }, (tabs) => {
        const tab = tabs[0];
        chrome.tabs.sendMessage(tab.id as number, { type: INITIATOR_ROOT_URL, rootUrl });
      });
      setUrlButtonDisabled(true);
    });
  };

  const handleChangeOfRootUrlField = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRootUrl(e.target.value);
    setUrlButtonDisabled(false);
  };

  const renderToasterContent = (message: any) => {
    return (
      <div className="toaster-content-wrapper">
        <WarningAmberOutlinedIcon className="toaster-warning-icon" color="secondary" />
        <p>{message}</p>
      </div>
    );
  };

  return (
    <>
      <Grid container direction="row" justifyContent="start" spacing={0.25} sx={gridStyle}>
        <Grid item xs={12}>
          <Box sx={{ backgroundColor: 'background.paper', borderRadius: 1, p: 1 }} className="box-wrapper">
            <Typography paragraph>
              <b>Use Case:</b>
            </Typography>
            <Typography paragraph>
              This tool was designed to be used to test SSP User Sync URL's in order to create transparancy and determine if privacy parameters were
              correctly getting passing down the request chain generated by a User Sync URL. Under the hood this tool uses the Chrome Devtools Network
              API{' '}
              <strong className="initiator__strong">
                which requires that a new instance of the Chrome devtools be opened each time a modification is made to this Network Inspector tool (Ex.
                modifying the root URL, toggling the feature on/off, etc.)
              </strong>
              . For more details see the instructions below.
            </Typography>
            <Typography paragraph>
              <b>Instructions on How to Use:</b>
            </Typography>
            <Typography paragraph>
              Note: It is advised when testing User Sync URL's that you clear cookies relative to the domain you are testing. This will ensure that
              results are in-line with an initial visit to the current page. Additionally, the first resource matching the root URL will be used to
              generate the initiator request chain.
            </Typography>
            <Typography paragraph>
              View instructions on the Prebid documentation site{' '}
              <a href="https://docs.prebid.org/tools/professor-prebid.html" target="_blank" rel="noreferrer">
                here
              </a>
              .
            </Typography>
            <br />
            <br />
            <div className="initiator-form">
              <FormControl>
                <FormControlLabel
                  control={<Switch checked={initChainFeatureStatus || false} onChange={handleInitChainFeatureStatusChange} />}
                  label={initChainFeatureStatus ? 'On' : 'Off'}
                />
              </FormControl>
              <TextField
                id="outlined-basic"
                label="Enter Root URL"
                variant="outlined"
                size="small"
                className="child margin-right"
                value={rootUrl}
                onChange={handleChangeOfRootUrlField}
              />
              <Button variant="outlined" className="submit-button margin-right" onClick={handleSettingRootUrl} disabled={urlButtonDisabled}>
                Set URL
              </Button>
            </div>
            <div
              className={`initiator__output ${
                (showReqChain || initDataLoaded) && initReqChainResult && Object.keys(initReqChainResult).length > 0
                  ? 'initiator__output-left-align'
                  : ''
              }`}
            >
              {(showReqChain || initDataLoaded) && initReqChainResult && Object.keys(initReqChainResult).length > 0 ? (
                <JSONViewerComponent
                  src={initReqChainResult}
                  name={false}
                  collapsed={2}
                  displayObjectSize={true}
                  displayDataTypes={false}
                  sortKeys={false}
                  quotesOnKeys={false}
                  indentWidth={2}
                  collapseStringsAfterLength={100}
                  style={{ fontSize: '12px', fontFamily: 'roboto', padding: '5px' }}
                />
              ) : isRefresh ? (
                <div className="initiator__loader-wrapper">
                  <p>Generating initiator request chain...</p>
                  <div className="loader">
                    <Bars height="80" width="50" color="#ff6f00" ariaLabel="bars-loading" wrapperStyle={{}} wrapperClass="" visible={true} />
                  </div>
                </div>
              ) : (
                <p className="initiator__short-instructions">
                  The initiator request chain will go here.
                  <br />
                  Follow the instructions above, then <strong className="initiator__strong">close</strong> and <strong className="initiator__strong">re-open</strong> the Chrome Devtools.
                  <br />
                  Afterwards navigate back to the "Network Inspector" tool and click the refresh icon here:&nbsp;&nbsp;
                  <RefreshIcon
                    className="initiator__refresh-icon"
                    onClick={() => {
                      if (!initChainFeatureStatus || !rootUrl) {
                        handleRefreshClickToShowToastMessage(`Make sure that the Network Inspector tool is enabled and that a root URL has been set.`);
                        return;
                      }

                      setInitiatorOutput({});
                      setInitDataLoaded(false);
                      setIsRefresh(true);
                      chrome.storage.local.set({ initReqChain: JSON.stringify(null) });
                      chrome.devtools.inspectedWindow.reload({ ignoreCache: true });
                    }}
                  />
                </p>
              )}
            </div>
            <div>
              <Snackbar
                key={messageInfo ? messageInfo.key : undefined}
                open={showToastMessage}
                autoHideDuration={6000}
                onClose={handleCloseToastMessageClick}
                TransitionProps={{ onExited: handleToastMessageExited }}
                message={messageInfo ? renderToasterContent(messageInfo.message) : undefined}
                className="toaster-modal"
                action={
                  <React.Fragment>
                    <IconButton
                      aria-label="close"
                      color="inherit"
                      sx={{ p: 0.5 }}
                      onClick={handleCloseToastMessageClick}
                    >
                      <CloseIcon className="toaster-close-icon" />
                    </IconButton>
                  </React.Fragment>
                }
              />
            </div>
          </Box>
        </Grid>
      </Grid>
    </>
  );
};

export interface InitiatorComponentProps {
  initReqChain: {
    [key: string]: any;
  };
}

export default InitiatorComponent;
