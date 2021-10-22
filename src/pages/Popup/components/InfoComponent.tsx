import React from 'react';
import { IGoogleAdManagerDetails } from "../../../inject/scripts/googleAdManager";
import { IPrebidDetails } from "../../../inject/scripts/prebid";
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Box from '@mui/material/Box';

const InfoComponent = ({ prebid, googleAdManager }: IInfoComponentProps): JSX.Element => {
  const allAvailableBids = prebid?.events?.filter(event => event.eventType === 'bidResponse') || [];
  const allNoBids = prebid?.events?.filter(event => event.eventType === 'noBid') || [];
  const allAdUnits = Array.from(new Set(prebid?.events?.filter(event => event.eventType === 'auctionInit').reduce((previousValue, currentValue) => [].concat(previousValue, currentValue.args.adUnitCodes), [])))
  const allBidders = Array.from(new Set([].concat(allAvailableBids, allNoBids).map(event => event?.args.bidder)))
  return (
    <Box>
      <List dense={true}>
        <ListItem>GAM Slots Detected: {googleAdManager?.slots?.length}</ListItem>
        <ListItem>AdUnits Detected: {allAdUnits.length}</ListItem>
        <ListItem>Bidders: {allBidders.length}</ListItem>
        <ListItem>NoBid / Bid Ratio: {allNoBids.length} / {allAvailableBids.length}</ListItem>
      </List>
    </Box>
  )
};

interface IInfoComponentProps {
  googleAdManager: IGoogleAdManagerDetails;
  prebid: IPrebidDetails
}

export default InfoComponent;
