import React, { useContext } from 'react';
import Popover from '@mui/material/Popover';
import StateContext from '../../contexts/appStateContext';
import EventsComponent from '../auctionDebugEvents/EventsComponent';

const EventsPopOver = ({ eventsPopUpOpen, setEventsPopUpOpen }: { eventsPopUpOpen: boolean; setEventsPopUpOpen: Function }): JSX.Element => {
  const { prebid } = useContext(StateContext);
  if (!prebid) return null;
  return (
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
  );
};

export default EventsPopOver;
