import React from 'react';
import { IPrebidDetails } from "../../../../inject/scripts/prebid";

const PrebidConfigModulesComponent = ({ prebid }: PrebidConfigModulesComponentProps): JSX.Element => {
  return (
    <div>
      <p><strong>Modules:</strong>ToDo</p>
    </div>
  );
}

interface PrebidConfigModulesComponentProps {
  prebid: IPrebidDetails
}

export default PrebidConfigModulesComponent;
