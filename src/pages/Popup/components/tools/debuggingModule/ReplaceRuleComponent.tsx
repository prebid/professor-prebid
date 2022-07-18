import { IPrebidDebugModuleConfigRule } from '../../../../../inject/scripts/prebid';
import React from 'react';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import DeleteForever from '@mui/icons-material/DeleteForever';
import CardHeader from '@mui/material/CardHeader';

export const replaceRuleTargets: IReplaceRuleTarget[] = [
  { value: 'cpm', label: 'CPM' },
  { value: 'creative', label: 'Creative' },
  { value: 'width', label: 'Width' },
  { value: 'height', label: 'Height' },
  { value: 'deal', label: 'Deal' },
];

const ReplaceRuleComponent = ({ rule, ruleIndex, groupIndex, targetKey, handleRulesFormChange }: IReplaceRuleComponentProps): JSX.Element => (
  <React.Fragment key={groupIndex}>
    {groupIndex !== 0 && <Typography variant="body1"> and </Typography>}

    <TextField
      size="small"
      select
      label="Replace-Rule Target"
      value={targetKey}
      name="replaceRuleTarget"
      onChange={(e) => handleRulesFormChange(ruleIndex, targetKey, e)}
      children={replaceRuleTargets?.map((option, index) => (
        <MenuItem key={index} value={option.value}>
          {option.label}
        </MenuItem>
      ))}
      sx={{ m: 0.25, width: '15ch' }}
    />

    <Typography variant="h4" sx={{ h: 1 }} component="span">
      should be
    </Typography>

    <TextField
      size="small"
      label="Replace Rule Value"
      value={rule.then[targetKey] || ''}
      name="replaceRule"
      onChange={(e) => handleRulesFormChange(ruleIndex, targetKey, e)}
      sx={{ m: 0.25, width: '20ch' }}
    />
    {Object.keys(rule.then).length > 1 && (
      <IconButton
        size="small"
        color="primary"
        children={<DeleteForever />}
        onClick={() => {
          handleRulesFormChange(ruleIndex, targetKey, { target: { name: 'removeReplaceRule', value: null } });
        }}
      />
    )}
  </React.Fragment>
);

interface IReplaceRuleTarget {
  value: string;
  label: string;
}

interface IReplaceRuleComponentProps {
  rule: IPrebidDebugModuleConfigRule;
  ruleIndex: number;
  groupIndex: number;
  targetKey: string;
  handleRulesFormChange: (ruleIndex: number, groupKey: string, e: { target: { name: string; value: string } }) => void;
}

export default ReplaceRuleComponent;
