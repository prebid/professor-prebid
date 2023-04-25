import { IPrebidAuctionEndEventData, IPrebidDetails } from '../../../Content/scripts/prebid';
import React, { useEffect } from 'react';
import GanttChartComponent from './GanttChartComponent';

const TimeLineComponent = ({ prebid }: ITimeLineComponentProps): JSX.Element => {
  const [auctionEndEvents, setAuctionEndEvents] = React.useState<IPrebidAuctionEndEventData[]>([]);
  useEffect(() => {
    const auctionEndEvents = (prebid.events?.filter((event) => event.eventType === 'auctionEnd') || []) as IPrebidAuctionEndEventData[];
    setAuctionEndEvents(auctionEndEvents);
  }, [prebid.events]);
  return (
    <React.Fragment>
      {prebid.events &&
        auctionEndEvents.map((event, index) => (
          <GanttChartComponent key={index} prebidEvents={prebid.events} auctionEndEvent={event}></GanttChartComponent>
        ))}
    </React.Fragment>
  );
};

interface ITimeLineComponentProps {
  prebid: IPrebidDetails;
}

export default TimeLineComponent;
