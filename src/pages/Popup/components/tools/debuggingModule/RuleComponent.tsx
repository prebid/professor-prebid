import { IPrebidDebugModuleConfigRule, IPrebidDetails } from '../../../../../inject/scripts/prebid';
import React from 'react';
import IconButton from '@mui/material/IconButton';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import AddIcon from '@mui/icons-material/Add';
import MatchRuleComponent, { matchRuleTargets } from './MatchRuleComponent';
import ReplaceRuleComponent, { replaceRuleTargets } from './ReplaceRuleComponent';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import Box from '@mui/material/Box';

const firstDifferent = (input: string[], excludes: string[]): string => {
  const [first] = input.filter((item) => !excludes.includes(item));
  return first;
};

const RuleComponent = ({ rule, ruleIndex, handleRulesFormChange, prebid }: RuleComponentProps): JSX.Element => {
  const addMatchRule = () => {
    const newMatchRuleTarget = firstDifferent(
      matchRuleTargets.map(({ value }) => value),
      Object.keys(rule.when)
    );
    if (!newMatchRuleTarget) return;
    handleRulesFormChange(ruleIndex, newMatchRuleTarget, {
      target: { name: 'addMatchRule', value: '' },
    });
  };

  const addReplaceRule = () => {
    const newReplaceRuleTarget = firstDifferent(
      replaceRuleTargets.map(({ value }) => value),
      Object.keys(rule.then)
    );
    if (!newReplaceRuleTarget) return;
    handleRulesFormChange(ruleIndex, newReplaceRuleTarget, { target: { name: 'addReplaceRule', value: '' } });
  };

  return (
    <Grid item xs={12} sx={{ display: 'flex', alignItems: 'center' }}>
      <Card sx={{ width: 1 }} elevation={2}>
        <CardHeader
          action={
            <IconButton
              color="primary"
              onClick={() => {
                handleRulesFormChange(ruleIndex, null, { target: { name: 'removeRule', value: '' } });
              }}
              children={<DeleteForeverIcon />}
            />
          }
          title={<Typography variant="h3">Rule #{ruleIndex + 1}:</Typography>}
          sx={{ pb: 0 }}
        />
        <CardContent sx={{ display: 'flex', flexDirection: 'row', pt: 0.1 }}>
          <Box sx={{ width: 0.5 }}>
            <Typography variant="h4" sx={{ p: 0.5 }}>
              When
            </Typography>
            {Object.keys(rule.when).map((targetKey, matchRuleTargetsIndex) => (
              <MatchRuleComponent
                groupIndex={matchRuleTargetsIndex}
                key={matchRuleTargetsIndex}
                rule={rule}
                ruleIndex={ruleIndex}
                targetKey={targetKey}
                handleRulesFormChange={handleRulesFormChange}
                prebid={prebid}
              />
            ))}
            {Object.keys(rule.when).length < 3 && <IconButton size="small" color="primary" children={<AddIcon />} onClick={addMatchRule} />}
          </Box>
          <Box sx={{ width: 0.5 }}>
            <Typography variant="h4" sx={{ p: 0.5 }}>
              Then
            </Typography>
            {Object.keys(rule.then).map((targetKey, replaceRuleTargetsIndex) => (
              <ReplaceRuleComponent
                key={replaceRuleTargetsIndex}
                rule={rule}
                ruleIndex={ruleIndex}
                targetKey={targetKey}
                groupIndex={replaceRuleTargetsIndex}
                handleRulesFormChange={handleRulesFormChange}
                addReplaceRule={addReplaceRule}
              />
            ))}
          </Box>
        </CardContent>
      </Card>
    </Grid>
  );
};

interface RuleComponentProps {
  rule: IPrebidDebugModuleConfigRule;
  ruleIndex: number;
  prebid: IPrebidDetails;
  handleRulesFormChange: (ruleIndex: number, groupKey: string, e: { target: { name: string; value: string } }) => void;
}

export default RuleComponent;
