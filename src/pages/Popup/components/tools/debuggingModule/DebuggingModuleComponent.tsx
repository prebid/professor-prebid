import { IPrebidDetails, IPrebidDebugModuleConfig, IPrebidAuctionInitEventData } from '../../../../../inject/scripts/prebid';
import Box from '@mui/material/Box';
import Switch from '@mui/material/Switch';
import React, { useEffect, useState } from 'react';
import FormControlLabel from '@mui/material/FormControlLabel';
import { getTabId } from '../../../utils';
import { useTheme } from '@mui/material';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import RuleComponent from './RuleComponent';
import { IMatchRuleTargetOptions } from './MatchRuleComponent';
import AddIcon from '@mui/icons-material/Add';

const DebuggingModuleComponent = ({ prebid }: DebuggingModuleComponentProps): JSX.Element => {
  const theme = useTheme();
  const [debuggingModuleConfig, setDebuggingModuleConfig] = useState<IPrebidDebugModuleConfig>({
    enabled: null,
    intercept: [],
  });
  const [matchRuleTargetOptions, setMatchRuleTargetOptions] = useState<IMatchRuleTargetOptions>(null);

  const writeConfigToLS = async (input: IPrebidDebugModuleConfig) => {
    input = { ...debuggingModuleConfig, ...input };
    setDebuggingModuleConfig(input);
    const tabId = await getTabId();
    await chrome.scripting.executeScript({
      target: { tabId },
      func: (namespace: string, input: object) => {
        sessionStorage.setItem(`__${namespace}_debugging__`, `${JSON.stringify(input)}`);
      },
      args: [prebid.namespace, input],
    });
  };

  const handleRulesFormChange = (ruleIndex: number, groupKey: string, e: { target: { value: string; name: string } }) => {
    const newFormValues = [...debuggingModuleConfig?.intercept];
    switch (e.target.name) {
      case 'matchRuleTarget': {
        newFormValues[ruleIndex]['when'] = {
          [e.target.value]: newFormValues[ruleIndex]['when'][groupKey],
        };
        break;
      }
      case 'matchRule': {
        newFormValues[ruleIndex]['when'] = { [groupKey]: e.target.value };
        break;
      }
      case 'replaceRuleTarget': {
        newFormValues[ruleIndex]['then'] = {
          [e.target.value]: newFormValues[ruleIndex]['then'][groupKey],
        };
        break;
      }
      case 'replaceRule': {
        newFormValues[ruleIndex]['then'] = { [groupKey]: e.target.value };
        break;
      }
      case 'addMatchRule': {
        newFormValues[ruleIndex]['when'][groupKey] = e.target.value;
        break;
      }
      case 'addReplaceRule': {
        newFormValues[ruleIndex]['then'][groupKey] = e.target.value;
        break;
      }
      case 'removeMatchRule': {
        delete newFormValues[ruleIndex]['when'][groupKey];
        break;
      }
      case 'removeReplaceRule': {
        delete newFormValues[ruleIndex]['then'][groupKey];
        break;
      }
      default: {
      }
    }
    setDebuggingModuleConfig({ ...debuggingModuleConfig, intercept: newFormValues });
    writeConfigToLS({ intercept: newFormValues });
  };

  const addRulesFormFields = () => {
    setDebuggingModuleConfig({
      ...debuggingModuleConfig,
      intercept: [...debuggingModuleConfig?.intercept, { when: { adUnitCode: matchRuleTargetOptions['adUnitCode'][0] }, then: { cpm: 20 } }],
    });
    writeConfigToLS({
      ...debuggingModuleConfig,
      intercept: [...debuggingModuleConfig?.intercept, { when: { adUnitCode: matchRuleTargetOptions['adUnitCode'][0] }, then: { cpm: 20 } }],
    });
  };

  const removeRulesFormFields = (i: number) => {
    const newFormValues = [...debuggingModuleConfig?.intercept];
    newFormValues.splice(i, 1);
    setDebuggingModuleConfig({ ...debuggingModuleConfig, intercept: newFormValues });
    writeConfigToLS({ ...debuggingModuleConfig, intercept: newFormValues });
  };

  // extract the matchRuleTargetOptions from  prebid.events
  useEffect(() => {
    const adUnitCodes = (prebid.events as IPrebidAuctionInitEventData[])?.reduce((prevValue, { args }) => {
      if (!args || !args.adUnitCodes) {
        return prevValue;
      }
      return Array.from(new Set([...prevValue, ...args.adUnitCodes]));
    }, [] as string[]);

    const mediaTypes = (prebid.events as IPrebidAuctionInitEventData[])?.reduce((prevValue, { args }) => {
      if (!args || !args.adUnits) {
        return prevValue;
      }
      const { adUnits } = args;
      const newMediaTypes = adUnits?.reduce((prevValue, { mediaTypes }) => {
        if (!mediaTypes) {
          return prevValue;
        }
        return Array.from(new Set([...prevValue, ...Object.keys(mediaTypes)]));
      }, [] as string[]);
      return Array.from(new Set([...prevValue, ...newMediaTypes]));
    }, [] as string[]);

    const bidders = (prebid.events as IPrebidAuctionInitEventData[])?.reduce((prevValue, { args }) => {
      if (!args || !args.adUnits) {
        return prevValue;
      }
      const { adUnits } = args;
      const newBidders = adUnits?.reduce((prevValue, { bids }) => {
        if (!bids) {
          return prevValue;
        }
        return Array.from(new Set([...prevValue, ...bids.map(({ bidder }) => bidder)]));
      }, [] as string[]);
      return Array.from(new Set([...prevValue, ...newBidders]));
    }, [] as string[]);

    setMatchRuleTargetOptions({ adUnitCode: adUnitCodes, mediaType: mediaTypes, bidder: bidders });
  }, [prebid.events]);

  // read config from session storage & set states on mount
  useEffect(() => {
    const getInitialState = async () => {
      const tabId = await getTabId();
      const [first] = await chrome.scripting.executeScript({
        target: { tabId },
        func: (namespace: string) => sessionStorage.getItem(`__${namespace}_debugging__`),
        args: [prebid.namespace],
      });
      if (!first || !first.result) return;
      const savedConfig: IPrebidDebugModuleConfig = JSON.parse(first.result);
      setDebuggingModuleConfig(savedConfig);
      if (!savedConfig || !savedConfig?.intercept) return;
      setDebuggingModuleConfig(savedConfig);
    };
    getInitialState();
  }, [prebid.namespace]);

  return (
    <Grid item xs={12}>
      <Box sx={{ backgroundColor: 'background.paper', borderRadius: 1, p: 1 }}>
        <Grid container rowSpacing={1} columnSpacing={0.5}>
          <Grid item xs={12}>
            <Grid container rowSpacing={1} columnSpacing={0.5}>
              <Grid item xs={1}>
                <Box sx={{ alignContent: 'center', [theme.breakpoints.down('sm')]: { transform: 'rotate(90deg)' } }}>
                  <FormControl>
                    <FormControlLabel
                      control={
                        <Switch checked={!!debuggingModuleConfig?.enabled} onChange={(event) => writeConfigToLS({ enabled: event.target.checked })} />
                      }
                      label=""
                    />
                  </FormControl>
                </Box>
              </Grid>
              <Grid item xs={5}>
                <Box sx={{ border: 1, borderColor: debuggingModuleConfig?.enabled ? 'primary.main' : 'text.disabled', borderRadius: 1 }}>
                  <Typography variant="h4" sx={{ width: 1, p: 1, color: debuggingModuleConfig?.enabled ? 'primary.main' : 'text.disabled' }}>
                    Enable Debugging Module
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sx={{ display: 'flex' }}>
                <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={addRulesFormFields} sx={{ width: 1, height: 1 }}>
                  <Typography variant="h4">Add Rule</Typography>
                </Button>
              </Grid>
            </Grid>
          </Grid>
          <Grid item xs={12}>
            <Box
              component="form"
              sx={{
                '& .MuiTextField-root': { m: 0.25, width: '20ch' },
              }}
              noValidate
              autoComplete="off"
            >
              <Grid container rowSpacing={1} columnSpacing={0.5}>
                {debuggingModuleConfig?.intercept.map((rule, index) => (
                  <RuleComponent
                    key={index}
                    rule={rule}
                    ruleIndex={index}
                    matchRuleTargetOptions={matchRuleTargetOptions}
                    handleRulesFormChange={handleRulesFormChange}
                    removeRulesFormFields={removeRulesFormFields}
                  />
                ))}
              </Grid>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Grid>
  );
};

interface DebuggingModuleComponentProps {
  prebid: IPrebidDetails;
}

export default DebuggingModuleComponent;
