import { IPrebidDebugModuleConfigRule } from '../../../../../inject/scripts/prebid';
import React from 'react';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import DeleteForever from '@mui/icons-material/DeleteForever';
import DoubleArrowIcon from '@mui/icons-material/DoubleArrow';

export const replaceRuleTargets: IReplaceRuleTarget[] = [
  { value: 'ad', label: 'ad' },
  // { value: 'bidderCode', label: 'bidderCode' }, //can break setup
  { value: 'cpm', label: 'cpm' },
  { value: 'currency', label: 'currency' },
  { value: 'dealId', label: 'dealId' },
  { value: 'height', label: 'height' },
  { value: 'meta', label: 'meta' },
  { value: 'netRevenue', label: 'netRevenue' },
  { value: 'ttl', label: 'ttl' },
  // { value: 'vastUrl', label: 'vastUrl' }, // not working
  // { value: 'vastXml', label: 'vastXml' }, // not working
  // { value: 'vastImpUrl', label: 'vastImpUrl' },// not working
  { value: 'width', label: 'Width' },
];

const ReplaceRuleComponent = ({ rule, ruleIndex, groupIndex, targetKey, handleRulesFormChange }: IReplaceRuleComponentProps): JSX.Element => (
  <React.Fragment key={groupIndex}>
    {groupIndex !== 0 && (
      <Typography variant="body1" sx={{ p: 0.5 }}>
        and
      </Typography>
    )}

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

    <IconButton size='small' color='primary' children={<DoubleArrowIcon />} />

    <TextField
      size="small"
      label="Replace Rule Value"
      value={rule.then[targetKey] || ''}
      name="replaceRule"
      onChange={(e) => handleRulesFormChange(ruleIndex, targetKey, e)}
      sx={{ m: 0.25, width: '18ch' }}
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
