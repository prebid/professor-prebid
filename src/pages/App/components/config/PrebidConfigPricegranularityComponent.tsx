import React from 'react';
import { IPrebidDetails } from "../../../../inject/scripts/prebid";
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

const PrebidConfigPricegranularityComponent = ({ prebid }: PrebidConfigPricegranularityComponentProps): JSX.Element => {
  return (
    <Box sx={{ width: '100%', textAlign: 'center' }}>
      {(() => {
        switch (prebid?.config?.priceGranularity) {
          case 'low':
            return (
              <Box sx={{ width: '100%' }}>
                <Typography><strong>low:</strong></Typography>
                <Typography>Precision: 2 | Min: 0 | Max: 5 | Increment: 0.50</Typography>
              </Box>
            );
          case 'medium':
            return (
              <Box sx={{ width: '100%' }}>
                <Typography><strong>medium:</strong></Typography>
                <Typography>Precision: 2 | Min: 0 | Max: 20 | Increment: 0.10</Typography>
              </Box>
            );
          case 'high':
            return (
              <Box sx={{ width: '100%' }}>
                <Typography><strong>high:</strong></Typography>
                <Typography>Precision: 2 | Min: 0 | Max: 20 | Increment: 0.01</Typography>
              </Box>
            );
          case 'auto':
            return (
              <Box sx={{ width: '100%', padding: '5px 5px 5px 5px' }}>
                <Typography><strong>auto:</strong></Typography>
                <Typography><strong>Bucket #1:</strong></Typography>
                <Typography>Precision: 2 | Min: 0 | Max: 5 | Increment: 0.05</Typography>
                <Typography><strong>Bucket #2:</strong></Typography>
                <Typography>Precision: 2 | Min: 5 | Max: 10 | Increment: 0.10</Typography>
                <Typography><strong>Bucket #3:</strong></Typography>
                <Typography>Precision: 2 | Min: 10 | Max: 20 | Increment: 0.50</Typography>
              </Box>
            );
          case 'dense':
            return (
              <Box sx={{ width: '100%', padding: '5px 5px 5px 5px' }}>
                <Typography><strong>dense:</strong></Typography>
                <Typography><strong>Bucket #1:</strong></Typography>
                <Typography>Precision: 2 | Min: 0 | Max: 5 | Increment: 0.05</Typography>
                <Typography><strong>Bucket #2:</strong></Typography>
                <Typography>Precision: 2 | Min: 5 | Max: 10 | Increment: 0.10</Typography>
                <Typography><strong>Bucket #3:</strong></Typography>
                <Typography>Precision: 2 | Min: 10 | Max: 20 | Increment: 0.50</Typography>
              </Box>
            );
          default:
            break;
        }
      })()}
      {prebid?.config?.customPriceBucket?.buckets?.map((bucket, index) =>
        <Box key={index} sx={{ width: '100%', padding: '5px 5px 5px 5px' }}>
          <Typography><strong>Bucket #{index}:</strong></Typography>
          <Typography>Precision: {bucket.precision} | Min: {bucket.min} | Max: {bucket.max} | Increment: {bucket.increment}</Typography>
        </Box>
      )}
    </Box>
  );
}

interface PrebidConfigPricegranularityComponentProps {
  prebid: IPrebidDetails
}

export default PrebidConfigPricegranularityComponent;
