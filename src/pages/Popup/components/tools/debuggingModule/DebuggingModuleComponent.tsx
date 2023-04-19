import { IPrebidDetails, IPrebidDebugModuleConfig, IPrebidDebugModuleConfigRule } from '../../../../Content/scripts/prebid';
import { getTabId } from '../../../utils';
import constants from '../../../../../constants.json';
import Box from '@mui/material/Box';
import Switch from '@mui/material/Switch';
import React, { useEffect, useState } from 'react';
import FormControlLabel from '@mui/material/FormControlLabel';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import RuleComponent from './RuleComponent';
import AddIcon from '@mui/icons-material/Add';
import set from 'lodash/set';
import get from 'lodash/get';
import FormGroup from '@mui/material/FormGroup';

const DebuggingModuleComponent = ({ prebid }: DebuggingModuleComponentProps): JSX.Element => {
  const [debuggingModuleConfig, setDebuggingModuleConfig] = useState<IPrebidDebugModuleConfig>({ enabled: false, intercept: [] });
  const [storeRules, setStoreRules] = useState<boolean>(false);

  useEffect(() => {
    chrome.storage.local.get(constants.STORE_RULES_TOGGLE, (result) => {
      const checked = result ? result[constants.STORE_RULES_TOGGLE] : false;
      setStoreRules(checked);
    });
  }, [storeRules]);

  const writeConfigToStorage = async (input: IPrebidDebugModuleConfig) => {
    setDebuggingModuleConfig(input);
    const tabId = await getTabId();
    await chrome.scripting.executeScript({
      target: { tabId },
      func: (namespace: string, input: object) => {
        sessionStorage.setItem(`__${namespace}_debugging__`, `${JSON.stringify(input)}`);
      },
      args: [prebid.namespace, input],
    });
    if (!storeRules) return;
    await chrome.scripting.executeScript({
      target: { tabId },
      func: (namespace: string, input: object) => {
        localStorage.setItem(`__${namespace}_debugging__`, `${JSON.stringify(input)}`);
      },
      args: [prebid.namespace, input],
    });
  };

  const handleRulesFormChange = async (
    action: string,
    value: string | number | boolean | IPrebidDebugModuleConfigRule[],
    path: string[],
    deletePath?: string[]
  ) => {
    const newFormValues = { ...debuggingModuleConfig };
    set(newFormValues, path, value);
    if (deletePath) {
      const last = deletePath.pop();
      delete get(newFormValues, deletePath)[last];
      if (Object.keys(get(newFormValues, deletePath)).length === 0) {
        const last = deletePath.pop();
        // don't leave empty native object
        if (last === 'native') {
          delete get(newFormValues, deletePath)[last];
        }
      }
    }

    setDebuggingModuleConfig(newFormValues);
    await writeConfigToStorage(newFormValues);
  };

  const handleStoreRulesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setStoreRules(event.target.checked);
    const { checked } = event.target;
    chrome.storage.local.set({ [constants.STORE_RULES_TOGGLE]: checked }, () => {
      chrome.tabs.query({ currentWindow: true, active: true }, (tabs) => {
        const tab = tabs[0];
        chrome.tabs.sendMessage(tab.id as number, { type: constants.STORE_RULES_TOGGLE, consoleState: checked });
      });
    });
  };

  // read config from session storage & set states on mount
  useEffect(() => {
    const getInitialState = async () => {
      const tabId = await getTabId();
      let [first] = await chrome.scripting.executeScript({
        target: { tabId },
        func: (namespace: string) => sessionStorage.getItem(`__${namespace}_debugging__`),
        args: [prebid.namespace],
      });
      if (!first || !first.result) {
        [first] = await chrome.scripting.executeScript({
          target: { tabId },
          func: (namespace: string) => localStorage.getItem(`__${namespace}_debugging__`),
          args: [prebid.namespace],
        });
      }
      if (!first || !first.result) return;
      const savedConfig: IPrebidDebugModuleConfig = JSON.parse(first.result);
      setDebuggingModuleConfig(savedConfig);
      writeConfigToStorage(savedConfig);
    };
    getInitialState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prebid.namespace]);

  return (
    <Grid item xs={12}>
      <Box sx={{ backgroundColor: 'background.paper', borderRadius: 1, p: 1 }}>
        <Grid container rowSpacing={1} columnSpacing={0.5}>
          <Grid item xs={12}>
            <FormGroup sx={{ flexDirection: 'row' }}>
              <FormControlLabel
                sx={{ width: 0.33 }}
                control={
                  <Switch
                    checked={!!debuggingModuleConfig?.enabled}
                    onChange={(event) => {
                      handleRulesFormChange('update', !debuggingModuleConfig.enabled, ['enabled']);
                    }}
                  />
                }
                label={
                  <Typography variant="h4" sx={{ width: 1, p: 1, color: debuggingModuleConfig?.enabled ? 'primary.main' : 'text.disabled' }}>
                    Enable Debugging Module
                  </Typography>
                }
              />
              <FormControlLabel
                sx={{ width: 0.33 }}
                control={<Switch checked={storeRules} onChange={handleStoreRulesChange} />}
                label={
                  <Typography variant="h4" sx={{ width: 1, p: 1, color: debuggingModuleConfig?.enabled ? 'primary.main' : 'text.disabled' }}>
                    Store Rules in Local Storage
                  </Typography>
                }
              />
              <Button
                startIcon={<AddIcon />}
                onClick={() => {
                  handleRulesFormChange(
                    'update',
                    [...debuggingModuleConfig.intercept, { when: { adUnitCode: '' }, then: { cpm: 20 } }],
                    ['intercept']
                  );
                }}
                sx={{ width: 0.3 }}
              >
                <Typography variant="h4">Add Rule</Typography>
              </Button>
            </FormGroup>
          </Grid>

          <Grid item xs={12}>
            <Box component="form" noValidate autoComplete="off">
              <Grid container rowSpacing={1} columnSpacing={0.5}>
                {prebid &&
                  debuggingModuleConfig?.intercept?.map((rule, index) => (
                    <RuleComponent
                      key={index}
                      rule={rule}
                      ruleIndex={index}
                      handleRulesFormChange={handleRulesFormChange}
                      prebid={prebid}
                      removeRule={() => {
                        debuggingModuleConfig.intercept.splice(index, 1);
                        handleRulesFormChange('update', debuggingModuleConfig.intercept, ['intercept']);
                      }}
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

export interface IHandleRulesFormChangeProps {}
