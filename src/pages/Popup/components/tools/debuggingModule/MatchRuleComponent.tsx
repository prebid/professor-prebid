import { IPrebidDebugModuleConfigRule } from '../../../../../inject/scripts/prebid';
import React from 'react';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import DeleteForever from '@mui/icons-material/DeleteForever';
import { CardHeader } from '@mui/material';

export const matchRuleTargets: IMatchRuleTarget[] = [
  { value: 'adUnitCode', label: 'AdUnitCode' },
  { value: 'bidder', label: 'Bidder' },
  { value: 'mediaType', label: 'Mediatype' },
];

const MatchRuleComponent = ({
  groupIndex,
  rule,
  ruleIndex,
  targetKey,
  matchRuleTargetOptions,
  handleRulesFormChange,
}: IMatchRuleComponentProps): JSX.Element => (
  <React.Fragment>
    {groupIndex !== 0 && <CardHeader subheader="and" sx={{ pb: 0.5, pt: 0.5 }} />}
    <TextField
      select
      size="small"
      label="Match-Rule Target"
      name="matchRuleTarget"
      value={targetKey}
      onChange={(e) => handleRulesFormChange(ruleIndex, targetKey, e)}
      children={matchRuleTargets?.map((option) => (
        <MenuItem key={option.value} value={option.value || ''}>
          {option.label}
        </MenuItem>
      ))}
    />
    <Typography variant="h4" sx={{ h: 1 }} component="span">
      equals
    </Typography>

    <TextField
      select
      size="small"
      label="Match-Rule Value"
      name="matchRule"
      value={rule.when[targetKey]}
      onChange={(e) => handleRulesFormChange(ruleIndex, targetKey, e)}
      children={
        matchRuleTargetOptions[targetKey as keyof IMatchRuleTargetOptions]?.map((option: string, i: number) => (
          <MenuItem key={i} value={option}>
            {option}
          </MenuItem>
        )) || <MenuItem key={0} value={''} />
      }
    />

    {Object.keys(rule.when).length > 1 && (
      <IconButton
        size="small"
        color="primary"
        children={<DeleteForever />}
        onClick={() => {
          handleRulesFormChange(ruleIndex, targetKey, { target: { name: 'removeMatchRule', value: null } });
        }}
      />
    )}
  </React.Fragment>
);

export interface IMatchRuleTargetOptions {
  adUnitCode: string[];
  mediaType: string[];
  bidder: string[];
}

interface IMatchRuleTarget {
  value: string;
  label: string;
}

interface IMatchRuleComponentProps {
  groupIndex: number;
  rule: IPrebidDebugModuleConfigRule;
  ruleIndex: number;
  targetKey: string;
  matchRuleTargetOptions: IMatchRuleTargetOptions;
  handleRulesFormChange: (ruleIndex: number, groupKey: string, e: { target: { name: string; value: any } }) => void;
}

export default MatchRuleComponent;
