import React, { useEffect, useState } from 'react';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import constants from '../../../../constants.json';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import JSONViewerComponent from '../../../Shared/JSONViewerComponent';
import { useDebounce } from './hooks/useDebounce';

const InitiatorComponent = (): JSX.Element => {
  const [initChainFeatureStatus, setInitChainFeatureStatus] = useState<boolean>(null);
  const [rootUrl, setRootUrl] = useState<string>('');
  const [initiatorOutput, setInitiatorOutput] = useState<any>({});

  const initOutput = useDebounce(initiatorOutput, 2000);

  useEffect(() => {
    // setListing('')
    // if (searchQuery || query.length < 0) searchCharacter();
    // async function searchCharacter() {
    //   setListing('')
    //   setLoading(true)
    //   const data = await getCharacter(searchQuery)
    //   setListing(data.results)
    //   setLoading(false)
    // }
    if (initOutput) {
      // setInitiatorOutput(initOutput);
      console.log('initOutput: ', initOutput);
    }
  }, [initOutput]);

  useEffect(() => {
    chrome.storage.local.get(constants.INITIATOR_TOGGLE, (result) => {
      const value = result ? result[constants.INITIATOR_TOGGLE] : false;
      setInitChainFeatureStatus(value);
    });
  }, [initChainFeatureStatus]);

  useEffect(() => {
    chrome.storage.local.get(constants.INITIATOR_ROOT_URL, (result) => {
      const value = result ? result[constants.INITIATOR_ROOT_URL] : rootUrl;
      setRootUrl(value);
    });
  }, []);

  const handleInitChainFeatureStatusChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInitChainFeatureStatus(event.target.checked);
    const { checked } = event.target;
    chrome.storage.local.set({ [constants.INITIATOR_TOGGLE]: checked }, () => {
      chrome.tabs.query({ currentWindow: true, active: true }, (tabs) => {
        const tab = tabs[0];
        chrome.tabs.sendMessage(tab.id as number, { type: constants.INITIATOR_TOGGLE, consoleState: checked });
      });
    });
  };

  const handleSettingRootUrl = () => {
    chrome.storage.local.set({ [constants.INITIATOR_ROOT_URL]: rootUrl }, () => {
      chrome.tabs.query({ currentWindow: true, active: true }, (tabs) => {
        const tab = tabs[0];
        chrome.tabs.sendMessage(tab.id as number, { type: constants.INITIATOR_ROOT_URL, rootUrl });
      });
    });
  };

  const handleChangeOfRootUrlField = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRootUrl(e.target.value);
  };

  chrome.runtime.onMessage.addListener(function(request) {
    if (request.command === 'sendToConsole' && request.tabId) {
      const result = JSON.parse(unescape(request.args));
      console.log(result[1]);
      // if (result[1][rootUrl]) {
      //   // setInitiatorOutput(result[1]);
      // }
    }
  });

  return (
    <React.Fragment>
      <div className="initiator-instructions">
        <Tabs
          sx={{
            minHeight: 0,
            '& > div > div > button': { minHeight: 0 },
            '& > div  > span': { display: 'none' },
          }}
        >
          <Tab
            sx={{ p: 0, justifyContent: 'flex-start' }}
            label={
              <Typography variant="h2" component={Paper} sx={{ p: 1, border: 1, borderColor: 'primary.main' }}>
                Initiator Request Chain
              </Typography>
            }
          />
        </Tabs>
      </div>
      <Box sx={{ backgroundColor: 'background.paper', borderRadius: 1, p: 1 }} className="box-wrapper">
        <p>The initiator tool can be used to visualize initiator request chains originating from a specific root URL/resource.</p>
        <p><b>Instructions on How to Use:</b></p>
        <ul>
          <li>
            Enable the feature by sliding the toggle below.
          </li>
          <li>
            Enter and submit a URL that you know will be loaded onto this page.
          </li>
          <li>
            Open the developer tools on this webpage. This can be done by right-clicking anywhere on the page and selecting "Inspect". <b>Note:</b> Each time you toggle on/off the initiator tool or modify the root URL, you will need to refresh the page and re-open the developer tools (closing any prior open developer tool windows).
          </li>
          <li>
            Refresh the page, re-open Professor Prebid and navigate to the Initiator tool once again.  You will see data in object form outlining the initiator request chain for the provided root URL.
          </li>
        </ul>
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
            className="child"
            value={rootUrl}
            onChange={handleChangeOfRootUrlField}
          />
          <Button variant="outlined" className="submit-button" onClick={handleSettingRootUrl}>Submit</Button>
        </div>
        <div className="initiator-output">
          <JSONViewerComponent
            src={initiatorOutput}
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
        </div>
      </Box>
    </React.Fragment>
  );
};

// interface InitiatorComponentProps {
//   prebid: IPrebidDetails;
//   handleRouteChange: (route: string) => void;
// }

export default InitiatorComponent;
