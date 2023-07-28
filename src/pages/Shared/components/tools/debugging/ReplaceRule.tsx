import { INativeRules, IPrebidDebugModuleConfigRule } from '../../../../Content/scripts/prebid';
import React from 'react';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import DeleteForever from '@mui/icons-material/DeleteForever';
import DoubleArrowIcon from '@mui/icons-material/DoubleArrow';
import AddIcon from '@mui/icons-material/Add';
import Select from '@mui/material/Select';
import { firstDifferent } from '../../../../Popup/utils';
import { replaceRuleTargets } from '../../../constants';

const sanityCheck = (rule: IPrebidDebugModuleConfigRule, mediaType: string) => {
  if (mediaType === 'native') {
    // if (Object.keys(rule.when).includes('mediaType') && Object.values(rule.when).includes('native')) return true; // matching on mediaType not working
    if (Object.keys(rule.then).includes('mediaType') && Object.values(rule.then).includes('native')) return true;
  }
  if (mediaType === 'video') {
    // if (Object.keys(rule.when).includes('mediaType') && Object.values(rule.when).includes('video')) return true; // matching on mediaType not working
    if (Object.keys(rule.then).includes('mediaType') && Object.values(rule.then).includes('video')) return true;
  }
  if (['allMediaTypes', 'banner'].includes(mediaType)) return true;
  return false;
};

const mediaTypes = replaceRuleTargets
  .reduce((acc, cur) => {
    if (!acc.includes(cur.mediaType)) {
      return [...acc, cur.mediaType];
    } else {
      return acc;
    }
  }, [] as string[])
  .sort((x, y) => {
    return x == 'allMediaTypes' ? -1 : y == 'allMediaTypes' ? 1 : 0;
  });

const ReplaceRule = ({ rule, groupIndex, ruleKey, handleRulesFormChange, path }: IReplaceRuleProps): JSX.Element => {
  const addReplaceRule = () => {
    const newReplaceRuleTarget = firstDifferent(
      replaceRuleTargets.map(({ value }) => value),
      Object.keys(rule.then)
    );
    if (!newReplaceRuleTarget) return;
    handleRulesFormChange('update', '', [...path.slice(0, path.length - 1), newReplaceRuleTarget]);
  };
  return (
    <React.Fragment>
      {groupIndex !== 0 && (
        <Typography variant="body1" sx={{ p: 0.5 }}>
          and
        </Typography>
      )}

      <Select
        sx={{ m: 0.25, minWidth: '17ch' }}
        native
        size="small"
        label="Replace-Rule Target"
        value={ruleKey}
        onChange={(e) => {
          const subkeys = replaceRuleTargets.map((x) => x.subkey).filter((x) => x);
          const newKey = replaceRuleTargets.find((keyOption) => keyOption.value === e.target.value);
          const newPath = [...path.slice(0, path.length - 1), e.target.value];
          if (newKey.subkey && newPath[3] !== newKey.subkey) {
            newPath.splice(3, 0, newKey.subkey);
          }
          if (!newKey.subkey && subkeys.includes(newPath[2])) {
            newPath.splice(3, 1);
          }
          handleRulesFormChange('update', '', newPath, [...path.slice(0, path.length - 1), ruleKey]);
        }}
      >
        {mediaTypes
          .filter((mediaType) => sanityCheck(rule, mediaType))
          ?.map((group, index) => (
            <optgroup key={index} label={group !== 'allMediaTypes' ? `mediaType: ${group}` : 'all mediaTypes'}>
              {replaceRuleTargets
                ?.filter((replaceRuleTarget) => replaceRuleTarget.mediaType === group)
                .map((option, index) => (
                  <option key={index} value={option.value}>
                    {option.label}
                  </option>
                ))}
            </optgroup>
          ))}
      </Select>

      <IconButton size="small" color="primary" children={<DoubleArrowIcon />} />

      <TextField
        error={(path[3] === 'native' ? rule.then.native[ruleKey as keyof INativeRules] || '' : rule.then[ruleKey] || '') === ''}
        sx={{ m: 0.25, width: '17ch' }}
        size="small"
        select={ruleKey === 'mediaType'}
        label="Replace-Rule Value"
        value={path[3] === 'native' ? rule.then.native[ruleKey as keyof INativeRules] || '' : rule.then[ruleKey] || ''}
        type={ruleKey === 'mediaType' ? 'text' : replaceRuleTargets.find((x) => x.value === ruleKey)?.type}
        onChange={(event) => {
          const type = replaceRuleTargets.find((x) => x.value === ruleKey)?.type;
          handleRulesFormChange('update', type === 'number' ? Number(event.target.value) : event.target.value, path);
        }}
        children={
          ruleKey === 'mediaType' &&
          replaceRuleTargets
            .find((target) => target.value === ruleKey)
            ?.options.map((option, index) => (
              <MenuItem key={index} value={option} dense>
                {option}
              </MenuItem>
            ))
        }
      />

      {Object.keys(rule.then).length > 1 && (
        <IconButton
          size="small"
          color="primary"
          children={<DeleteForever />}
          onClick={() => {
            handleRulesFormChange('update', null, path, path);
          }}
        />
      )}

      {Object.keys(rule.then).length < 5 && <IconButton color="primary" size="small" children={<AddIcon />} onClick={addReplaceRule} />}
    </React.Fragment>
  );
};

interface IReplaceRuleProps {
  groupIndex: number;
  rule: IPrebidDebugModuleConfigRule;
  ruleKey: string;
  handleRulesFormChange: (action: string, value: string | number, path: string[], deletePath?: any[]) => void;
  path: string[];
}

export default ReplaceRule;
