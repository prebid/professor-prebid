import React, { useEffect, useState, useContext } from 'react';
import Box from '@mui/material/Box';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import { getTabId } from '../../../../Shared/utils';
import BidderFilter from './BidderFilter';
import BidOverWriteComponent from './BidOverWriteComponent';
import { IPrebidDebugConfig } from '../../../../Content/scripts/prebid';
import AppStateContext from '../../../contexts/appStateContext';

const ModifyBidResponsesComponent = (): JSX.Element => {
  const { isSmallScreen, pbjsNamespace } = useContext(AppStateContext);
  const [debugConfgigState, setDebugConfigState] = useState<IPrebidDebugConfig>(null);

  const handleChange = async (input: IPrebidDebugConfig) => {
    input = { ...debugConfgigState, ...input };
    setDebugConfigState(input);
    const tabId = await getTabId();
    await chrome.scripting.executeScript({
      target: { tabId },
      func: (namespace: string, input: object) => {
        sessionStorage.setItem(`${namespace}:debugging`, `${JSON.stringify(input)}`);
      },
      args: [pbjsNamespace, input],
    });
  };

  const handleEnabledChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleChange({ enabled: event.target.checked });
  };

  // read config from session storage & set states on mount
  useEffect(() => {
    const getInitialState = async () => {
      const tabId = await getTabId();
      const result = await chrome.scripting.executeScript({
        target: { tabId },
        func: (namespace: string) => {
          return sessionStorage.getItem(`${namespace}:debugging`);
        },
        args: [pbjsNamespace],
      });

      const savedConfig: IPrebidDebugConfig = JSON.parse(result[0].result);
      setDebugConfigState(savedConfig);
    };
    getInitialState();
  }, [pbjsNamespace]);

  return (
    <Grid item xs={12}>
      <Box sx={{ backgroundColor: 'background.paper', borderRadius: 1, p: 1 }}>
        <Grid container rowSpacing={1} columnSpacing={0.5}>
          <Grid item xs={12}>
            <Grid container rowSpacing={1} columnSpacing={0.5}>
              <Grid item md={1} xs={1}>
                <Box sx={{ alignContent: 'center', transform: isSmallScreen ? 'rotate(90deg)' : 'unset' }}>
                  <FormControl>
                    <FormControlLabel control={<Switch checked={!!debugConfgigState?.enabled} onChange={handleEnabledChange} />} label="" />
                  </FormControl>
                </Box>
              </Grid>
              <Grid item xs={11} md={11}>
                <Box sx={{ border: 1, borderColor: debugConfgigState?.enabled ? 'primary.main' : 'text.disabled', borderRadius: 1 }}>
                  <Typography variant="h4" sx={{ width: 1, p: 1, color: debugConfgigState?.enabled ? 'primary.main' : 'text.disabled' }}>
                    Enable Debugging
                  </Typography>
                </Box>
              </Grid>
              <BidderFilter debugConfigState={debugConfgigState} setDebugConfigState={handleChange} />
              <BidOverWriteComponent debugConfigState={debugConfgigState} setDebugConfigState={handleChange} />
            </Grid>
          </Grid>
        </Grid>
      </Box>
    </Grid>
  );
};

export default ModifyBidResponsesComponent;
