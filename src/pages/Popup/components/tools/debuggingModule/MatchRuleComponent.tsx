import { IPrebidDebugModuleConfigRule } from '../../../../../inject/scripts/prebid';
import React, { useState, useEffect } from 'react';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import DeleteForever from '@mui/icons-material/DeleteForever';
import { IPrebidDetails, IPrebidAuctionInitEventData } from '../../../../../inject/scripts/prebid';
import PauseSharpIcon from '@mui/icons-material/PauseSharp';

export const matchRuleTargets: IMatchRuleTarget[] = [
  { value: 'adUnitCode', label: 'AdUnitCode' },
  { value: 'bidder', label: 'Bidder' },
  { value: 'mediaType', label: 'Mediatype' },
];

const MatchRuleComponent = ({ groupIndex, rule, ruleIndex, targetKey, handleRulesFormChange, prebid }: IMatchRuleComponentProps): JSX.Element => {
  const { events } = prebid;
  const [matchRuleTargetOptions, setMatchRuleTargetOptions] = useState<IMatchRuleTargetOptions>({ adUnitCode: [], bidder: [], mediaType: [] });

  // extract the matchRuleTargetOptions from  prebid.events
  useEffect(() => {
    const adUnitCodes = (events as IPrebidAuctionInitEventData[])?.reduce((prevValue, { args }) => {
      if (!args || !args.adUnitCodes) {
        return prevValue;
      }
      return Array.from(new Set([...prevValue, ...args.adUnitCodes]));
    }, [] as string[]);

    const mediaTypes = (events as IPrebidAuctionInitEventData[])?.reduce((prevValue, { args }) => {
      if (!args || !args.adUnits) {
        return prevValue;
      }

      const newMediaTypes = args.adUnits?.reduce((prevValue, { mediaTypes }) => {
        if (!mediaTypes) {
          return prevValue;
        }
        return Array.from(new Set([...prevValue, ...Object.keys(mediaTypes)]));
      }, [] as string[]);
      return Array.from(new Set([...prevValue, ...newMediaTypes]));
    }, [] as string[]);

    const bidders = (events as IPrebidAuctionInitEventData[])?.reduce((prevValue, { args }) => {
      if (!args || !args.adUnits) {
        return prevValue;
      }

      const newBidders = args.adUnits?.reduce((prevValue, { bids }) => {
        if (!bids) {
          return prevValue;
        }
        return Array.from(new Set([...prevValue, ...bids.map(({ bidder }) => bidder)]));
      }, [] as string[]);
      return Array.from(new Set([...prevValue, ...newBidders]));
    }, [] as string[]);

    setMatchRuleTargetOptions((prevValue) => {
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
        select
        size="small"
        label="MatchRule Target"
        name="matchRuleTarget"
        value={targetKey}
        onChange={(e) => handleRulesFormChange(ruleIndex, targetKey, e)}
        children={matchRuleTargets?.map((option, key) => (
          <MenuItem key={key} value={option.value} disabled={Object.keys(rule.when).includes(option.value)}>
            {option.label}
          </MenuItem>
        ))}
        sx={{ m: 0.25, width: '15ch' }}
      />

      <IconButton size="small" color="primary" children={<PauseSharpIcon sx={{ transform: 'rotate(90deg)' }} />} />

      <TextField
        select
        size="small"
        label="MatchRule Value"
        name="matchRule"
        value={rule.when[targetKey] || ''}
        onChange={(e) => handleRulesFormChange(ruleIndex, targetKey, e)}
        children={
          matchRuleTargetOptions[targetKey as keyof IMatchRuleTargetOptions]?.map((option: string, i: number) => (
            <MenuItem key={i} value={option} disabled={Object.values(rule.when).includes(option)}>
              {option}
            </MenuItem>
          )) || <MenuItem key={0} value={rule.when[targetKey] || ''} />
        }
        sx={{ m: 0.25, width: '18ch' }}
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
};

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
  prebid: IPrebidDetails;
  handleRulesFormChange: (ruleIndex: number, groupKey: string, e: { target: { name: string; value: any } }) => void;
}

export default MatchRuleComponent;
