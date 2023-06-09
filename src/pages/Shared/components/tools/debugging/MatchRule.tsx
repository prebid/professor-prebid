import { IPrebidDebugModuleConfigRule, IPrebidDetails, IPrebidAuctionInitEventData } from '../../../../Content/scripts/prebid';
import React, { useState, useEffect } from 'react';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import DeleteForever from '@mui/icons-material/DeleteForever';
import PauseSharpIcon from '@mui/icons-material/PauseSharp';
import AddIcon from '@mui/icons-material/Add';
import { firstDifferent } from '../../../../Popup/utils';

export const matchRuleTargets: { value: string; label: string }[] = [
  { value: 'adUnitCode', label: 'AdUnitCode' },
  { value: 'bidder', label: 'Bidder' },
  // { value: 'mediaType', label: 'Mediatype' }, // match on mediaType not working
];

const MatchRule = ({ groupIndex, rule, ruleKey, handleRulesFormChange, prebid, path }: IMatchRuleProps): JSX.Element => {
  const { events } = prebid;
  const [options, setOptions] = useState<IMatchRuleKeyOptions>({ adUnitCode: [], bidder: [], mediaType: [] });

  const addMatchRule = () => {
    const newMatchRuleTarget = firstDifferent(
      matchRuleTargets.map(({ value }) => value),
      Object.keys(rule.when)
    );
    if (!newMatchRuleTarget) return;
    handleRulesFormChange('update', '', [...path.slice(0, path.length - 1), newMatchRuleTarget]);
  };

  useEffect(() => {
    // extract the matchRuleTargetOptions from  prebid.events
    const adUnitCodes = (events as IPrebidAuctionInitEventData[])?.reduce((prevValue, { args }) => {
      if (!args || !args.adUnitCodes) return prevValue;

      return Array.from(new Set([...prevValue, ...args.adUnitCodes]));
    }, [] as string[]);

    const mediaTypes = (events as IPrebidAuctionInitEventData[])?.reduce((prevValue, { args }) => {
      if (!args || !args.adUnits) return prevValue;

      const newMediaTypes = args.adUnits?.reduce((prevValue, { mediaTypes }) => {
        if (!mediaTypes) return prevValue;

        return Array.from(new Set([...prevValue, ...Object.keys(mediaTypes)]));
      }, [] as string[]);

      return Array.from(new Set([...prevValue, ...newMediaTypes]));
    }, [] as string[]);

    const bidders = (events as IPrebidAuctionInitEventData[])?.reduce((prevValue, { args }) => {
      if (!args || !args.adUnits) return prevValue;

      const newBidders = args.adUnits?.reduce((prevValue, { bids }) => {
        if (!bids) return prevValue;

        return Array.from(new Set([...prevValue, ...bids.map(({ bidder }) => bidder)]));
      }, [] as string[]);

      return Array.from(new Set([...prevValue, ...newBidders]));
    }, [] as string[]);

    setOptions((prevValue) => {
      return {
        adUnitCode: adUnitCodes || prevValue.adUnitCode,
        mediaType: mediaTypes || prevValue.mediaType,
        bidder: bidders || prevValue.bidder,
      };
    });
  }, [events]);

  return (
    <React.Fragment>
      {groupIndex !== 0 && (
        <Typography variant="body1" sx={{ p: 0.5 }}>
          and
        </Typography>
      )}

      <TextField
        sx={{ m: 0.25, width: '15ch' }}
        select
        size="small"
        label="MatchRule Target"
        value={ruleKey}
        onChange={(e) => {
          handleRulesFormChange('update', null, [...path.slice(0, path.length - 1), e.target.value], [...path.slice(0, path.length - 1), ruleKey]);
        }}
        children={matchRuleTargets?.map((option, key) => (
          <MenuItem key={key} value={option.value} disabled={Object.keys(rule.when).includes(option.value)}>
            {option.label}
          </MenuItem>
        ))}
      />

      <IconButton size="small" color="primary" children={<PauseSharpIcon sx={{ transform: 'rotate(90deg)' }} />} />

      <TextField
        sx={{ m: 0.25, width: '18ch' }}
        select
        size="small"
        label="MatchRule Value"
        value={rule.when[ruleKey]}
        onChange={(e) => {
          handleRulesFormChange('update', e.target.value, path);
        }}
        children={
          options[ruleKey as keyof IMatchRuleKeyOptions]?.map((option: string, i: number) => (
            <MenuItem key={i} value={option} disabled={Object.values(rule.when).includes(option)}>
              {option}
            </MenuItem>
          )) || <MenuItem key={0} value={rule.when[ruleKey] || ''} />
        }
      />

      {Object.keys(rule.when).length > 1 && (
        <IconButton
          size="small"
          color="primary"
          children={<DeleteForever />}
          onClick={() => {
            handleRulesFormChange('update', null, path, path);
          }}
        />
      )}
      {Object.keys(rule.when).length < matchRuleTargets.length && (
        <IconButton size="small" color="primary" children={<AddIcon />} onClick={addMatchRule} />
      )}
    </React.Fragment>
  );
};

export interface IMatchRuleKeyOptions {
  adUnitCode: string[];
  mediaType: string[];
  bidder: string[];
}

interface IMatchRuleProps {
  groupIndex: number;
  rule: IPrebidDebugModuleConfigRule;
  ruleKey: string;
  prebid: IPrebidDetails;
  handleRulesFormChange: (action: string, value: string, path: string[], deletePath?: any[]) => void;
  path: string[];
}

export default MatchRule;
