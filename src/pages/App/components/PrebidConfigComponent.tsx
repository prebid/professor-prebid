import React from 'react';
import { IPrebidDetails } from "../../../inject/scripts/prebid";

class PrebidConfigComponent extends React.Component<IPrebidConfigComponentProps> {
  render() {
    const {prebid} = this.props;
    return (
      <div>
        <h3>Config:</h3>
        <pre>
          {JSON.stringify(prebid.config, null, 4)}
        </pre>
      </div>
    );
  }
}

interface IPrebidConfigComponentProps {
  prebid: IPrebidDetails;
}

export default PrebidConfigComponent;