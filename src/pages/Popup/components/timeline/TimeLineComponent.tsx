import { IPrebidAuctionEndEventData, IPrebidDetails } from '../../../../inject/scripts/prebid';
import React, { useEffect } from 'react';
import GanttChartComponent from './GanttChartComponent';
import logger from '../../../../logger';
import Card from '@mui/material/Card';

const TimeLineComponent = ({ prebid }: ITimeLineComponentProps): JSX.Element => {
  const [auctionEndEvents, setAuctionEndEvents] = React.useState<IPrebidAuctionEndEventData[]>([]);
  useEffect(() => {
    const auctionEndEvents = (prebid.events?.filter((event) => event.eventType === 'auctionEnd') || []) as IPrebidAuctionEndEventData[];
    setAuctionEndEvents(auctionEndEvents);
  }, [prebid.events]);
  logger.log(`[PopUp][GanttChartComponent]: render `, auctionEndEvents);
  return (
    <Card sx={{ backgroundColor: 'primary.light', opacity: 0.8 }}>
      {auctionEndEvents.map((event, index) => (
        <GanttChartComponent key={index} prebidEvents={prebid.events} auctionEndEvent={event}></GanttChartComponent>
      ))}
    </Card>
  );
};

interface ITimeLineComponentProps {
  prebid: IPrebidDetails;
}

export default TimeLineComponent;
