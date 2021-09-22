import React from 'react';
import { IPrebidDetails } from "../../../inject/scripts/prebid";

const PrebidConfigComponent: React.FC<IPrebidConfigComponentProps>  = ({ prebid }) => {
  return (
    <div>
      <h3>Config:</h3>
      <pre>
        {JSON.stringify(prebid.config, null, 4)}
      </pre>
    </div>
  );
}

interface IPrebidConfigComponentProps {
  prebid: IPrebidDetails;
}

export default PrebidConfigComponent;