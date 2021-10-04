import React from 'react';

import { IPrebidDetails } from "../../../../inject/scripts/prebid";

const PrebidConfigAnalyticsComponent = ({ prebid }: PrebidConfigAnalyticsComponentProps): JSX.Element => {
  return (
    <div>
      <p><strong>Analytics:</strong>ToDo</p>
    </div>
  );
}

interface PrebidConfigAnalyticsComponentProps {
  prebid: IPrebidDetails
}

export default PrebidConfigAnalyticsComponent;
