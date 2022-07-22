import { IPrebidDebugModuleConfigRule, INativeRules } from '../../../../../inject/scripts/prebid';
import React from 'react';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import DeleteForever from '@mui/icons-material/DeleteForever';
import DoubleArrowIcon from '@mui/icons-material/DoubleArrow';
import Box from '@mui/material/Box';
import AddIcon from '@mui/icons-material/Add';

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
  { value: 'width', label: 'width' },
  { value: 'mediaType', label: 'mediaType', options: ['banner', 'native', 'video'] },
];

export const replaceNativeRuleTargets: IReplaceNativeRuleTarget[] = [
  { value: 'clickUrl', label: 'clickUrl' },
  { value: 'title', label: 'title' },
  { value: 'image', label: 'image' },
  { value: 'cta', label: 'cta' },
];

const ReplaceRuleComponent = ({
  rule,
  ruleIndex,
  groupIndex,
  targetKey,
  handleRulesFormChange,
  addReplaceRule,
}: IReplaceRuleComponentProps): JSX.Element => {
  return (
    <React.Fragment key={groupIndex}>
      {groupIndex !== 0 && targetKey !== 'native' && (
        <Typography variant="body1" sx={{ p: 0.5 }}>
          and
        </Typography>
      )}

      {targetKey !== 'native' && (
        <>
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
            sx={{ m: 0.25, minWidth: '17ch' }}
          />

          <IconButton size="small" color="primary" children={<DoubleArrowIcon />} />
          {targetKey === 'mediaType' ? (
            <TextField
              size="small"
              select
              label="Replace Rule Value"
              value={rule.then[targetKey] || ''}
              name="replaceRule"
              onChange={(e) => handleRulesFormChange(ruleIndex, targetKey, e)}
              sx={{ m: 0.25, minWidth: '17ch' }}
              children={
                targetKey === 'mediaType' &&
                replaceRuleTargets
                  .find((target) => target.value === targetKey)
                  ?.options.map((option, index) => (
                    <MenuItem key={index} value={option}>
                      {option}
                    </MenuItem>
                  ))
              }
            />
          ) : (
            <TextField
              size="small"
              label="Replace Rule Value"
              value={rule.then[targetKey] || ''}
              name="replaceRule"
              onChange={(e) => handleRulesFormChange(ruleIndex, targetKey, e)}
              sx={{ m: 0.25, width: '17ch' }}
            />
          )}

          {Object.keys(rule.then).length > 1 && (
            <IconButton
              size="small"
              color="primary"
              children={<DeleteForever />}
              onClick={() => {
                handleRulesFormChange(ruleIndex, targetKey, {
                  target: {
                    name: 'removeReplaceRule',
                    value: null,
                  },
                });
              }}
            />
          )}

          {Object.keys(rule.then).length < 5 && <IconButton color="primary" size="small" children={<AddIcon />} onClick={addReplaceRule} />}
        </>
      )}

      {rule.then?.mediaType === 'native' && targetKey !== 'native' && targetKey === 'mediaType' && (
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '5px',
            marginTop: '5px',
          }}
        >
          {replaceNativeRuleTargets.map((target) => (
            <TextField
              size="small"
              label={`native ${target.label}`}
              name="replaceNativeRule"
              onChange={(e) => handleRulesFormChange(ruleIndex, target.value, e)}
              sx={{ m: 0.25, minWidth: '17ch' }}
              value={rule.then?.native ? rule.then?.native[target.value] : ''}
            />
          ))}
        </Box>
      )}
    </React.Fragment>
  );
};

interface IReplaceRuleTarget {
  value: string;
  label: string;
  options?: string[];
}

interface IReplaceNativeRuleTarget {
  value: keyof INativeRules;
  label: string;
}

interface IReplaceRuleComponentProps {
  rule: IPrebidDebugModuleConfigRule;
  ruleIndex: number;
  groupIndex: number;
  targetKey: string;
  handleRulesFormChange: (ruleIndex: number, groupKey: string, e: { target: { name: string; value: string } }) => void;
  addReplaceRule: () => void;
}

export default ReplaceRuleComponent;
