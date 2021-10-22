import { IPrebidDetails } from "../../../../inject/scripts/prebid";
import { IGoogleAdManagerDetails } from "../../../../inject/scripts/googleAdManager";
import React from 'react';
import GanttChartComponent from '../timeline/GanttChartComponent';

const TimeLine = ({ prebid }: ITimelineComponentProps): JSX.Element => {
  const auctionEndEvents = prebid.events.filter(event => event.eventType === 'auctionEnd') || [];
  return (
    <React.Fragment>
      {auctionEndEvents.map((event, index) =>
        <GanttChartComponent key={index} prebid={prebid} auctionEndEvent={event}></GanttChartComponent>
      )}
    </React.Fragment>
  )
};

interface ITimelineComponentProps {
  prebid: IPrebidDetails;
}

export default TimeLine;
