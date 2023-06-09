import React, { useContext, useState } from 'react';
import Typography from '@mui/material/Typography';
import Popover from '@mui/material/Popover';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import StateContext from '../../contexts/appStateContext';
import EventsComponent from '../auctionDebugEvents/EventsComponent';

const HeaderGridItem = ({ children, onClick }: HeaderGridItemProps): JSX.Element => (
  <Grid item onClick={onClick}>
    <Paper sx={{ p: 1 }} elevation={1}>
      <Typography variant="h2">{children}</Typography>
    </Paper>
  </Grid>
);

interface HeaderGridItemProps {
  children: JSX.Element;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
}

const conditionalPluralization = (input: Array<any>): string => (input?.length > 1 ? 's' : '');

const AdUnitsHeaderComponent = (): JSX.Element => {
  const { allBidResponseEvents, prebid, allNoBidEvents, allBidderEvents, allAdUnitCodes } = useContext(StateContext);
  const [eventsPopUpOpen, setEventsPopUpOpen] = useState<boolean>(false);
  if (!prebid) return null;
  return (
    <>
      <HeaderGridItem>
        <>Version: {prebid.version}</>
      </HeaderGridItem>

      <HeaderGridItem>
        <>Timeout: {prebid.config?.bidderTimeout}</>
      </HeaderGridItem>

      <HeaderGridItem>
        <>
          AdUnit{conditionalPluralization(allAdUnitCodes)}: : {allAdUnitCodes.length}
        </>
      </HeaderGridItem>

      <HeaderGridItem>
        <>
          Bidder{conditionalPluralization(allBidderEvents)}: : {allBidderEvents.length}
        </>
      </HeaderGridItem>

      <HeaderGridItem>
        <>
          Bid{conditionalPluralization(allBidResponseEvents)}: {allBidResponseEvents.length}
        </>
      </HeaderGridItem>

      <HeaderGridItem>
        <>
          noBid{conditionalPluralization(allNoBidEvents)} : {allNoBidEvents.length}
        </>
      </HeaderGridItem>

      <HeaderGridItem onClick={() => setEventsPopUpOpen(true)}>
        <>
          Event{conditionalPluralization(prebid.events)} : {prebid.events.length}
        </>
      </HeaderGridItem>

      <Popover
        open={eventsPopUpOpen}
        anchorReference="anchorPosition"
        anchorPosition={{ top: 1, left: 1 }}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        onClose={() => setEventsPopUpOpen(false)}
        PaperProps={{ style: { width: '100%', padding: 1 } }}
      >
        <EventsComponent close={() => setEventsPopUpOpen(false)} />
      </Popover>
    </>
  );
};

export default AdUnitsHeaderComponent;
