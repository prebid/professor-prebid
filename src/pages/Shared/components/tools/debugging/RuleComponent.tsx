import React from 'react';
import { IPrebidDebugModuleConfigRule, IPrebidDetails } from '../../../../Injected/prebid';
import IconButton from '@mui/material/IconButton';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import Tooltip from '@mui/material/Tooltip';
import MatchRule from './MatchRule';
import ReplaceRule from './ReplaceRule';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import Box from '@mui/material/Box';

const RuleComponent = ({ rule, ruleIndex, handleRulesFormChange, prebid, removeRule }: RuleComponentProps): JSX.Element => (
  <Grid size={{ xs: 12 }}>
    <Card sx={{ width: 1, border: '1px solid', borderColor: 'divider' }} elevation={1}>
      <CardHeader
        action={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {}
            <Tooltip title="Simulate network latency delay (ms) before returning this mock bid response" arrow>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'text.secondary', whiteSpace: 'nowrap' }}>
                  Simulated Delay:
                </Typography>
                <TextField
                  type="number"
                  size="small"
                  placeholder="0"
                  value={rule.options?.delay !== undefined ? rule.options.delay : ''}
                  onChange={(e) => {
                    const val = e.target.value === '' ? 0 : Math.max(0, Number(e.target.value));
                    handleRulesFormChange('update', val, ['intercept', `${ruleIndex}`, 'options', 'delay']);
                  }}
                  sx={{
                    width: 100,
                    backgroundColor: 'background.paper',
                    '& .MuiInputBase-input': { fontSize: '0.8rem', py: 0.5, px: 1 },
                  }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end" sx={{ '& .MuiTypography-root': { fontSize: '0.75rem' } }}>
                        ms
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
            </Tooltip>

            {/* Delete Rule Button */}
            <IconButton color="error" onClick={() => removeRule()} size="small" title="Delete rule">
              <DeleteForeverIcon fontSize="small" />
            </IconButton>
          </Box>
        }
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h3" sx={{ fontSize: '0.85rem', fontWeight: 700 }}>
              Rule #{ruleIndex + 1}
            </Typography>
          </Box>
        }
        sx={{ pb: 0.75, pt: 0.75, px: 1.5, backgroundColor: 'action.hover', borderBottom: '1px solid', borderColor: 'divider' }}
      />

      <CardContent sx={{ display: 'flex', flexDirection: 'row', pt: 1, pb: '12px !important', px: 1.5, gap: 2, flexWrap: 'wrap' }}>
        {/* WHEN (Match Conditions) */}
        <Box sx={{ flex: 1, minWidth: 260 }}>
          <Typography variant="h4" sx={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'primary.main', mb: 0.5 }}>
            WHEN (Match Request)
          </Typography>
          {Object.keys(rule.when).map((key, matchRuleTargetsIndex) => (
            <MatchRule groupIndex={matchRuleTargetsIndex} key={key} rule={rule} ruleKey={key} handleRulesFormChange={handleRulesFormChange} prebid={prebid} path={['intercept', `${ruleIndex}`, 'when', key]} />
          ))}
        </Box>

        {/* THEN (Mock Response Replacements) */}
        <Box sx={{ flex: 1, minWidth: 260 }}>
          <Typography variant="h4" sx={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'success.main', mb: 0.5 }}>
            THEN (Mock Bid Response)
          </Typography>
          {Object.keys(rule.then).map((key, index) => {
            if (key === 'native') {
              return Object.keys(rule.then[key]).map((k, i) => <ReplaceRule key={k} rule={rule} ruleKey={k} groupIndex={index} handleRulesFormChange={handleRulesFormChange} path={['intercept', `${ruleIndex}`, 'then', 'native', k]} />);
            } else {
              return <ReplaceRule key={key} rule={rule} ruleKey={key} groupIndex={index} handleRulesFormChange={handleRulesFormChange} path={['intercept', `${ruleIndex}`, 'then', key]} />;
            }
          })}
        </Box>
      </CardContent>
    </Card>
  </Grid>
);

interface RuleComponentProps {
  rule: IPrebidDebugModuleConfigRule;
  ruleIndex: number;
  prebid: IPrebidDetails;
  handleRulesFormChange: (action: string, value: string | number, path: string[], deletePath?: any[]) => void;
  removeRule: () => void;
}

export default RuleComponent;
