import React from 'react';
import { IPrebidDetails } from '../../../../inject/scripts/prebid';
import PrebidDetailsBidsComponent from './PrebidDetailsBidsComponent';
import PrebidDetailsSlotsComponent from './PrebidDetailsSlotsComponent';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';

const PrebidAdUnitsComponent = ({ prebid }: IPrebidAdUnitsComponentProps): JSX.Element => {
  const allAvailableBids = prebid.events.filter(event => event.eventType === 'bidResponse') || [];
  const allNoBids = prebid.events.filter(event => event.eventType === 'noBid') || [];
  const allAdUnits = Array.from(new Set(prebid?.events?.filter(event => event.eventType === 'auctionInit').reduce((previousValue, currentValue) => [].concat(previousValue, currentValue.args.adUnitCodes), [])))
  const allBidders = Array.from(new Set([].concat(allAvailableBids, allNoBids).map(event => event?.args.bidder)))

  return (
    <Card sx={{ backgroundColor: '#eceeef' }}>
      <CardContent>
        {prebid.version && <Typography><strong>Version: </strong>{prebid.version}</Typography>}
        {prebid.config?.timeout && <Typography><strong>Timeout: </strong>{prebid.config.timeout}</Typography>}
        <Typography><strong>AdUnits Detected:</strong> {allAdUnits.length}</Typography>
        <Typography><strong>Bidders:</strong> {allBidders.length}</Typography>
        <Typography><strong>NoBid / Bid Ratio:</strong> {allNoBids.length} / {allAvailableBids.length}</Typography>
        {prebid.events[0] && <PrebidDetailsSlotsComponent prebid={prebid}></PrebidDetailsSlotsComponent>}
      </CardContent>
    </Card>
  )
};

interface IPrebidAdUnitsComponentProps {
  prebid: IPrebidDetails;
}

export default PrebidAdUnitsComponent;
