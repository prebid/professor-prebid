import React, { useEffect, useState, useContext, useRef } from 'react';
import Box from '@mui/material/Box';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Tooltip from '@mui/material/Tooltip';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import AddIcon from '@mui/icons-material/Add';
import DownloadIcon from '@mui/icons-material/FileDownload';
import UploadIcon from '@mui/icons-material/FileUpload';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import BugReportIcon from '@mui/icons-material/BugReport';

import { getTabId, sendChromeTabsMessage } from '../../../../Shared/utils';
import { IPrebidDebugModuleConfig, IPrebidDebugModuleConfigRule } from '../../../../Injected/prebid';
import { STORE_RULES_TOGGLE } from '../../../constants';
import RuleComponent from './RuleComponent';
import AppStateContext from '../../../contexts/appStateContext';

const get = (obj: any, path: string[] = []): any => {
  return path.reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
};

const set = (obj: any, path: string[], value: any): any => {
  let temp = obj;
  path.slice(0, -1).forEach((key) => {
    if (typeof temp[key] !== 'object' || temp[key] === null) {
      temp[key] = {};
    }
    temp = temp[key];
  });
  temp[path[path.length - 1]] = value;
  return obj;
};

const PRESET_TEMPLATES: { label: string; rule: IPrebidDebugModuleConfigRule }[] = [
  {
    label: '🚀 High CPM Winner ($50.00)',
    rule: { when: { adUnitCode: '' }, then: { cpm: 50.0 } },
  },
  {
    label: '⏱️ Simulate 2500ms Network Delay',
    rule: { when: { adUnitCode: '' }, then: { cpm: 10.0 }, options: { delay: 2500 } },
  },
  {
    label: '📺 Mock Video Creative Override',
    rule: { when: { adUnitCode: '' }, then: { mediaType: 'video', cpm: 15.0 } },
  },
];

const DebuggingModuleComponent = (): JSX.Element => {
  const { prebid, pbjsNamespace } = useContext(AppStateContext);
  const [debuggingModuleConfig, setDebuggingModuleConfig] = useState<IPrebidDebugModuleConfig>({ enabled: false, intercept: [] });
  const [globalLoggingEnabled, setGlobalLoggingEnabled] = useState<boolean>(false);
  const [storeRules, setStoreRules] = useState<boolean>(false);
  const [presetAnchor, setPresetAnchor] = useState<null | HTMLElement>(null);
  const [snackbarMsg, setSnackbarMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chrome.storage?.local.get(STORE_RULES_TOGGLE, (result) => {
      const checked = result ? !!result[STORE_RULES_TOGGLE] : false;
      setStoreRules(checked);
    });
  }, []);

  const writeConfigToStorage = async (input: IPrebidDebugModuleConfig) => {
    setDebuggingModuleConfig(input);
    const tabId = await getTabId();
    await chrome.scripting.executeScript({
      target: { tabId },
      func: (namespace: string, input: object) => {
        try {
          if (typeof sessionStorage !== 'undefined') {
            sessionStorage.setItem(`__${namespace}_debugging__`, `${JSON.stringify(input)}`);
          }
        } catch (_) {}
      },
      args: [pbjsNamespace || 'pbjs', input],
    });
    if (!storeRules) return;
    await chrome.scripting.executeScript({
      target: { tabId },
      func: (namespace: string, input: object) => {
        try {
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem(`__${namespace}_debugging__`, `${JSON.stringify(input)}`);
          }
        } catch (_) {}
      },
      args: [pbjsNamespace || 'pbjs', input],
    });
  };

  const toggleGlobalLogging = async (enabled: boolean) => {
    setGlobalLoggingEnabled(enabled);
    const tabId = await getTabId();
    await chrome.scripting.executeScript({
      target: { tabId },
      func: (namespace: string, debugState: boolean) => {
        const globalPbjs = (window as any)[namespace || 'pbjs'];
        if (globalPbjs && typeof globalPbjs.setConfig === 'function') {
          globalPbjs.setConfig({ debug: debugState });
        } else if (globalPbjs) {
          globalPbjs.logging = debugState;
        }
      },
      args: [pbjsNamespace || 'pbjs', enabled],
    });
  };

  const handleRulesFormChange = async (_action: string, value: string | number | boolean | IPrebidDebugModuleConfigRule[], path: string[], deletePath?: string[]) => {
    const newFormValues = { ...debuggingModuleConfig };
    set(newFormValues, path, value);
    if (deletePath) {
      const last = deletePath.pop();
      const targetObj = get(newFormValues, deletePath);
      if (targetObj && last) delete targetObj[last];
    }
    setDebuggingModuleConfig(newFormValues);
    await writeConfigToStorage(newFormValues);
  };

  const handleStoreRulesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const checked = event.target.checked;
    setStoreRules(checked);
    chrome.storage?.local.set({ [STORE_RULES_TOGGLE]: checked }, () => {
      sendChromeTabsMessage(STORE_RULES_TOGGLE, { consoleState: checked });
    });
  };

  // Export rules to JSON file
  const exportRulesJson = () => {
    const dataStr = JSON.stringify(debuggingModuleConfig, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prebid-debug-rules-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setSnackbarMsg('Debug rules exported as JSON!');
  };

  // Copy rules to clipboard
  const copyRulesToClipboard = () => {
    const dataStr = JSON.stringify(debuggingModuleConfig, null, 2);
    navigator.clipboard.writeText(dataStr);
    setSnackbarMsg('Rules JSON copied to clipboard!');
  };

  // Import rules from JSON file
  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);
        if (typeof parsed === 'object' && Array.isArray(parsed.intercept)) {
          await writeConfigToStorage(parsed);
          setSnackbarMsg(`Successfully imported ${parsed.intercept.length} rule(s)!`);
        } else if (Array.isArray(parsed)) {
          const newConfig = { enabled: true, intercept: parsed };
          await writeConfigToStorage(newConfig);
          setSnackbarMsg(`Successfully imported ${parsed.length} rule(s)!`);
        } else {
          setSnackbarMsg('Invalid rules JSON format!');
        }
      } catch (err) {
        setSnackbarMsg('Failed to parse JSON file!');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  // read initial config on mount
  useEffect(() => {
    const getInitialState = async () => {
      try {
        const tabId = await getTabId();
        let [first] = await chrome.scripting.executeScript({
          target: { tabId },
          func: (namespace: string) => (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(`__${namespace}_debugging__`) : null),
          args: [pbjsNamespace || 'pbjs'],
        });
        if (!first || !first.result) {
          [first] = await chrome.scripting.executeScript({
            target: { tabId },
            func: (namespace: string) => (typeof localStorage !== 'undefined' ? localStorage.getItem(`__${namespace}_debugging__`) : null),
            args: [pbjsNamespace || 'pbjs'],
          });
        }
        if (first && first.result) {
          const savedConfig: IPrebidDebugModuleConfig = JSON.parse(first.result);
          setDebuggingModuleConfig(savedConfig);
        }
      } catch (e) {
        console.warn('Could not read debugging module state', e);
      }
    };
    getInitialState();
  }, [pbjsNamespace]);

  return (
    <Paper elevation={1} sx={{ p: 1.25, border: '1px solid', borderColor: debuggingModuleConfig?.enabled ? 'primary.main' : 'divider' }}>
      {/* Hidden File Input for Import */}
      <input type="file" ref={fileInputRef} accept=".json" style={{ display: 'none' }} onChange={handleImportFile} />

      {/* Header Title Bar */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BugReportIcon color={debuggingModuleConfig?.enabled ? 'primary' : 'action'} />
          <Typography variant="h3" sx={{ fontSize: '0.9rem', fontWeight: 700 }}>
            Prebid.js Debugging Module (v7.3.0+)
          </Typography>
          <Chip label={debuggingModuleConfig?.enabled ? 'MODULE ENABLED' : 'DISABLED'} size="small" color={debuggingModuleConfig?.enabled ? 'primary' : 'default'} sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700 }} />
        </Box>

        {/* JSON Sharing Action Buttons */}
        <Box sx={{ display: 'flex', gap: 0.75 }}>
          <Tooltip title="Export current rules to JSON file for sharing" arrow>
            <Button size="small" variant="outlined" startIcon={<DownloadIcon />} onClick={exportRulesJson} sx={{ fontSize: '0.725rem', textTransform: 'none', py: 0.25 }}>
              Export JSON
            </Button>
          </Tooltip>

          <Tooltip title="Import rules from coworker's JSON file" arrow>
            <Button size="small" variant="outlined" startIcon={<UploadIcon />} onClick={() => fileInputRef.current?.click()} sx={{ fontSize: '0.725rem', textTransform: 'none', py: 0.25 }}>
              Import JSON
            </Button>
          </Tooltip>

          <Tooltip title="Copy rules JSON configuration to clipboard" arrow>
            <Button size="small" variant="outlined" startIcon={<ContentCopyIcon />} onClick={copyRulesToClipboard} sx={{ fontSize: '0.725rem', textTransform: 'none', py: 0.25 }}>
              Copy JSON
            </Button>
          </Tooltip>
        </Box>
      </Box>

      {/* Master Toggles Row */}
      <Grid container spacing={0.75} sx={{ mb: 1, alignItems: 'center' }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <FormControlLabel
            control={<Switch checked={!!debuggingModuleConfig?.enabled} onChange={() => handleRulesFormChange('update', !debuggingModuleConfig.enabled, ['enabled'])} color="primary" size="small" />}
            label={
              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.775rem', color: debuggingModuleConfig?.enabled ? 'primary.main' : 'text.secondary' }}>
                Enable Rule Interceptor
              </Typography>
            }
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <FormControlLabel
            control={<Switch checked={globalLoggingEnabled} onChange={(e) => toggleGlobalLogging(e.target.checked)} color="primary" size="small" />}
            label={
              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.775rem', color: globalLoggingEnabled ? 'primary.main' : 'text.secondary' }}>
                Verbose Console Logs (pbjs.debug)
              </Typography>
            }
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <FormControlLabel
            control={<Switch checked={storeRules} onChange={handleStoreRulesChange} color="primary" size="small" />}
            label={
              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.775rem', color: storeRules ? 'primary.main' : 'text.secondary' }}>
                Persist Rules in Local Storage
              </Typography>
            }
          />
        </Grid>
      </Grid>

      {/* Add Rule & Preset Buttons Bar */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1 }}>
        <Button
          size="small"
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            handleRulesFormChange('update', [...(debuggingModuleConfig?.intercept || []), { when: { adUnitCode: '' }, then: { cpm: 20 } }], ['intercept']);
          }}
          sx={{ fontSize: '0.75rem', textTransform: 'none', fontWeight: 600, py: 0.25 }}
        >
          Add Custom Intercept Rule
        </Button>

        <Button size="small" variant="outlined" startIcon={<AutoAwesomeIcon />} onClick={(e) => setPresetAnchor(e.currentTarget)} sx={{ fontSize: '0.75rem', textTransform: 'none', fontWeight: 600, py: 0.25 }}>
          Insert Preset Template
        </Button>

        <Menu anchorEl={presetAnchor} open={Boolean(presetAnchor)} onClose={() => setPresetAnchor(null)}>
          {PRESET_TEMPLATES.map((tmpl, i) => (
            <MenuItem
              key={i}
              onClick={() => {
                handleRulesFormChange('update', [...(debuggingModuleConfig?.intercept || []), tmpl.rule], ['intercept']);
                setPresetAnchor(null);
                setSnackbarMsg(`Added preset rule: ${tmpl.label}`);
              }}
              sx={{ fontSize: '0.8rem' }}
            >
              {tmpl.label}
            </MenuItem>
          ))}
        </Menu>
      </Box>

      {/* Rules List */}
      <Grid container spacing={0.75}>
        {prebid && debuggingModuleConfig?.intercept && debuggingModuleConfig.intercept.length > 0 ? (
          debuggingModuleConfig.intercept.map((rule, index) => (
            <RuleComponent
              key={index}
              rule={rule}
              ruleIndex={index}
              handleRulesFormChange={handleRulesFormChange}
              prebid={prebid}
              removeRule={() => {
                const currentIntercepts = [...(debuggingModuleConfig?.intercept || [])];
                currentIntercepts.splice(index, 1);
                handleRulesFormChange('update', currentIntercepts, ['intercept']);
              }}
            />
          ))
        ) : (
          <Grid size={{ xs: 12 }}>
            <Box sx={{ p: 1.5, textAlign: 'center', border: '1px stroke', borderColor: 'divider', borderRadius: 1, backgroundColor: 'action.hover' }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                No active debug rules configured. Click <strong>Add Custom Intercept Rule</strong> or <strong>Insert Preset Template</strong> to start mocking bid responses.
              </Typography>
            </Box>
          </Grid>
        )}
      </Grid>

      {/* Feedback Toast */}
      <Snackbar open={!!snackbarMsg} autoHideDuration={3000} onClose={() => setSnackbarMsg(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setSnackbarMsg(null)} severity="success" sx={{ width: '100%' }}>
          {snackbarMsg}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default DebuggingModuleComponent;
