import React from 'react';
import { IPrebidDetails } from "../../../../inject/scripts/prebid";

const PrebidConfigPricegranularityComponent = ({ prebid }: PrebidConfigPricegranularityComponentProps): JSX.Element => {
  return (
    <div>
      <pre>
        {prebid?.config?.customPriceBucket?.buckets?.map((bucket, index) => 
        <div key={index}>
          <p><strong>Bucket #{index}:</strong></p>
          <p>Precision: {bucket.precision} | Min: {bucket.min} | Max: {bucket.max} | Increment: {bucket.increment}</p>
        </div>
        )}
      </pre>
    </div>
  );
}

interface PrebidConfigPricegranularityComponentProps {
  prebid: IPrebidDetails
}

export default PrebidConfigPricegranularityComponent;
