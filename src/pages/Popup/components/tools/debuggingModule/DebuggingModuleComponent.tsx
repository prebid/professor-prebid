import { IPrebidDetails, IPrebidDebugModuleConfig } from '../../../../../inject/scripts/prebid';
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

import AddIcon from '@mui/icons-material/Add';

const DebuggingModuleComponent = ({ prebid }: DebuggingModuleComponentProps): JSX.Element => {
  const theme = useTheme();
  const [debuggingModuleConfig, setDebuggingModuleConfig] = useState<IPrebidDebugModuleConfig>({
    enabled: null,
    intercept: [],
  });

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

  const handleRulesFormChange = async (ruleIndex: number, groupKey: string, e: { target: { value: string; name: string } }) => {
    const newFormValues = [...debuggingModuleConfig?.intercept];
    const { name, value } = e.target;
    switch (name) {
      case 'matchRuleTarget': {
        newFormValues[ruleIndex]['when'] = {
          ...newFormValues[ruleIndex]['when'],
          [value]: newFormValues[ruleIndex]['when'][groupKey],
        };
        delete newFormValues[ruleIndex]['when'][groupKey];
        break;
      }
      case 'matchRule': {
        newFormValues[ruleIndex]['when'] = { ...newFormValues[ruleIndex]['when'], [groupKey]: value };
        break;
      }
      case 'replaceRuleTarget': {
        newFormValues[ruleIndex]['then'] = { ...newFormValues[ruleIndex]['then'], [value]: newFormValues[ruleIndex]['then'][groupKey] };
        delete newFormValues[ruleIndex]['then'][groupKey];
        break;
      }
      case 'replaceRule': {
        newFormValues[ruleIndex]['then'] = { ...newFormValues[ruleIndex]['then'], [groupKey]: value };
        break;
      }
      case 'addMatchRule': {
        newFormValues[ruleIndex]['when'][groupKey] = value;
        break;
      }
      case 'addReplaceRule': {
        newFormValues[ruleIndex]['then'][groupKey] = value;
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
      case 'removeRule': {
        newFormValues.splice(ruleIndex, 1);
        break;
      }
      case 'addRule': {
        newFormValues.push({ when: { adUnitCode: '' }, then: { cpm: 20 } });
        break;
      }
      case 'toggleEnabled': {
        debuggingModuleConfig.enabled = !!!debuggingModuleConfig.enabled;
        break;
      }
      default: {
      }
    }
    setDebuggingModuleConfig({ ...debuggingModuleConfig, intercept: newFormValues });
    await writeConfigToLS({ ...debuggingModuleConfig, intercept: newFormValues });
  };

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
                        <Switch
                          checked={!!debuggingModuleConfig?.enabled}
                          onChange={(event) => {
                            handleRulesFormChange(null, null, { target: { name: 'toggleEnabled', value: null } });
                          }}
                        />
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
              <Grid item xs={6}>
                <Button
                  startIcon={<AddIcon />}
                  onClick={() => {
                    handleRulesFormChange(null, null, { target: { name: 'addRule', value: '' } });
                  }}
                  sx={{ width: 1, height: 1 }}
                >
                  <Typography variant="h4">Add Rule</Typography>
                </Button>
              </Grid>
            </Grid>
          </Grid>
          <Grid item xs={12}>
            <Box component="form" noValidate autoComplete="off">
              <Grid container rowSpacing={1} columnSpacing={0.5}>
                {prebid &&
                  debuggingModuleConfig?.intercept.map((rule, index) => (
                    <RuleComponent key={index} rule={rule} ruleIndex={index} handleRulesFormChange={handleRulesFormChange} prebid={prebid} />
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
