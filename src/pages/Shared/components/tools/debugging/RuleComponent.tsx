import React from 'react';
import { IPrebidDebugModuleConfigRule, IPrebidDetails } from '../../../../Injected/prebid';
import IconButton from '@mui/material/IconButton';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import MatchRule from './MatchRule';
import ReplaceRule from './ReplaceRule';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import Box from '@mui/material/Box';

const RuleComponent = ({ rule, ruleIndex, handleRulesFormChange, prebid, removeRule }: RuleComponentProps): JSX.Element => (
  <Grid item xs={12} sx={{ display: 'flex', alignItems: 'center' }}>
    <Card sx={{ width: 1 }} elevation={2}>
      <CardHeader
        action={<IconButton color="primary" onClick={() => removeRule()} children={<DeleteForeverIcon />} />}
        title={<Typography variant="h3">Rule #{ruleIndex + 1}:</Typography>}
        sx={{ pb: 0 }}
      />
      <CardContent sx={{ display: 'flex', flexDirection: 'row', pt: 0.1 }}>
        <Box sx={{ width: 0.5 }}>
          <Typography variant="h4" sx={{ p: 0.5 }}>
            When
          </Typography>
          {Object.keys(rule.when).map((key, matchRuleTargetsIndex) => (
            <MatchRule
              groupIndex={matchRuleTargetsIndex}
              key={matchRuleTargetsIndex}
              rule={rule}
              ruleKey={key}
              handleRulesFormChange={handleRulesFormChange}
              prebid={prebid}
              path={['intercept', `${ruleIndex}`, 'when', key]}
            />
          ))}
        </Box>
        <Box sx={{ width: 0.5 }}>
          <Typography variant="h4" sx={{ p: 0.5 }}>
            Then
          </Typography>
          {Object.keys(rule.then).map((key, index) => {
            if (key === 'native') {
              return Object.keys(rule.then[key]).map((k, i) => {
                return (
                  <ReplaceRule
                    key={i}
                    rule={rule}
                    ruleKey={k}
                    groupIndex={index}
                    handleRulesFormChange={handleRulesFormChange}
                    path={['intercept', `${ruleIndex}`, 'then', 'native', k]}
                  />
                );
              });
            } else {
              return (
                <ReplaceRule
                  key={index}
                  rule={rule}
                  ruleKey={key}
                  groupIndex={index}
                  handleRulesFormChange={handleRulesFormChange}
                  path={['intercept', `${ruleIndex}`, 'then', key]}
                />
              );
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
