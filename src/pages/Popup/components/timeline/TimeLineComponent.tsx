import { IPrebidAuctionEndEventData, IPrebidDetails } from '../../../../inject/scripts/prebid';
import { IGoogleAdManagerDetails } from '../../../../inject/scripts/googleAdManager';
import React from 'react';
import GanttChartComponent from './GanttChartComponent';
import logger from '../../../../logger';

const TimeLineComponent = ({ prebid }: ITimeLineComponentProps): JSX.Element => {
  const auctionEndEvents = (prebid.events.filter((event) => event.eventType === 'auctionEnd') || []) as IPrebidAuctionEndEventData[];
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
