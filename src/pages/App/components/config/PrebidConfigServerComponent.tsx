import React from 'react';

import { IPrebidDetails } from "../../../../inject/scripts/prebid";

const PrebidConfigServerComponent = ({ prebid }: PrebidConfigServerComponentProps): JSX.Element => {
  return (
    <div>
      <p><strong>Adapter:</strong> {prebid.config.s2sConfig.adapter}</p>
      <p><strong>Adapter Options:</strong> {JSON.stringify(prebid.config.s2sConfig.adapterOptions)}</p>
      <p><strong>max. Bids:</strong> {prebid.config.s2sConfig.maxBids}</p>
      <p><strong>Sync. Url Modifier:</strong> {JSON.stringify(prebid.config.s2sConfig.syncUrlModifier)}</p>
      <p><strong>Timeout:</strong> {prebid.config.s2sConfig.timeout}</p>
    </div>
  );
}

interface PrebidConfigServerComponentProps {
  prebid: IPrebidDetails
}


export default PrebidConfigServerComponent;
