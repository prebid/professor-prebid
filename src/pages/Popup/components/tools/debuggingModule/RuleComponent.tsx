import { IPrebidDebugModuleConfigRule } from '../../../../../inject/scripts/prebid';
import { IMatchRuleTargetOptions } from './MatchRuleComponent';
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

const firstDifferent = (input: string[], excludes: string[]): string => {
  const [first] = input.filter(
    (
      (i) => (v) =>
        excludes[i] !== v || !++i
    )(0)
  );
  return first;
};

const RuleComponent = ({
  rule,
  ruleIndex,
  handleRulesFormChange,
  matchRuleTargetOptions,
  removeRulesFormFields,
}: RuleComponentProps): JSX.Element => {
  const addMatchRule = (e: any) => {
    const newMatchRuleTarget = firstDifferent(
      matchRuleTargets.map(({ value }) => value),
      Object.keys(rule.when)
    );
    if (!newMatchRuleTarget) return;
    const matchRuleValue = matchRuleTargetOptions[newMatchRuleTarget as keyof IMatchRuleTargetOptions][0];
    e.target.value = matchRuleValue;
    e.target.name = 'addMatchRule';
    handleRulesFormChange(ruleIndex, newMatchRuleTarget, e);
  };

  const addReplaceRule = (e: any) => {
    const newReplaceRuleTarget = firstDifferent(
      replaceRuleTargets.map(({ value }) => value),
      Object.keys(rule.then)
    );
    if (!newReplaceRuleTarget) return;
    e.target.value = '';
    e.target.name = 'addReplaceRule';
    handleRulesFormChange(ruleIndex, newReplaceRuleTarget, e);
  };

  return (
    <Grid item xs={12} sx={{ display: 'flex', alignItems: 'center' }}>
      <Card sx={{ width: 1 }} elevation={2}>
        <CardHeader
          action={
            <IconButton
              color="primary"
              onClick={() => {
                removeRulesFormFields(ruleIndex);
              }}
              children={<DeleteForeverIcon />}
            />
          }
          title={<Typography variant="h3">Rule #{ruleIndex + 1}:</Typography>}
          subheader={'When'}
          sx={{ pb: 0 }}
        />
        <CardContent>
          {Object.keys(rule.when).map((targetKey, matchRuleTargetsIndex) => (
            <MatchRuleComponent
              groupIndex={matchRuleTargetsIndex}
              key={matchRuleTargetsIndex}
              rule={rule}
              ruleIndex={ruleIndex}
              targetKey={targetKey}
              matchRuleTargetOptions={matchRuleTargetOptions}
              handleRulesFormChange={handleRulesFormChange}
            />
          ))}
          {Object.keys(rule.when).length < 3 && <IconButton size="small" color="primary" children={<AddIcon />} onClick={addMatchRule} />}
        </CardContent>

        <CardHeader subheader={'Then'} sx={{ pb: 0, pt: 0 }} />

        <CardContent>
          {Object.keys(rule.then).map((targetKey, replaceRuleTargetsIndex) => (
            <ReplaceRuleComponent
              key={replaceRuleTargetsIndex}
              rule={rule}
              ruleIndex={ruleIndex}
              targetKey={targetKey}
              groupIndex={replaceRuleTargetsIndex}
              handleRulesFormChange={handleRulesFormChange}
            />
          ))}
          {Object.keys(rule.then).length < 5 && <IconButton color="primary" size="small" children={<AddIcon />} onClick={addReplaceRule} />}
        </CardContent>
      </Card>
    </Grid>
  );
};

interface RuleComponentProps {
  rule: IPrebidDebugModuleConfigRule;
  ruleIndex: number;
  matchRuleTargetOptions: IMatchRuleTargetOptions;
  handleRulesFormChange: (ruleIndex: number, groupKey: string, e: { target: { name: string; value: string } }) => void;
  removeRulesFormFields: (i: number) => void;
}

export default RuleComponent;
