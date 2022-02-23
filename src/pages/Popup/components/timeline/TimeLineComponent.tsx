import { IPrebidAuctionEndEventData, IPrebidDetails } from '../../../../inject/scripts/prebid';
import React, { useEffect } from 'react';
import GanttChartComponent from './GanttChartComponent';
import logger from '../../../../logger';

const TimeLineComponent = ({ prebid }: ITimeLineComponentProps): JSX.Element => {
  const [auctionEndEvents, setAuctionEndEvents] = React.useState<IPrebidAuctionEndEventData[]>([]);
  useEffect(() => {
    const auctionEndEvents = (prebid.events?.filter((event) => event.eventType === 'auctionEnd') || []) as IPrebidAuctionEndEventData[];
    setAuctionEndEvents(auctionEndEvents);
  }, [prebid.events]);
  logger.log(`[PopUp][GanttChartComponent]: render `, auctionEndEvents);
  return (
    <React.Fragment>
      {auctionEndEvents.map((event, index) => (
        <GanttChartComponent key={index} prebid={prebid} auctionEndEvent={event}></GanttChartComponent>
      ))}
    </React.Fragment>
  );
};

interface ITimeLineComponentProps {
  prebid: IPrebidDetails;
}

export default TimeLineComponent;
