import React from 'react';
import { IPrebidAdUnit, IPrebidDetails } from '../../../../inject/scripts/prebid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import { useTheme } from '@mui/material';
import AdUnitRowComponent from './AdUnitRowComponent';
import AdUnitCardComponent from './AdUnitCardComponent';

const SlotsComponent = ({ adUnits, events }: ISlotsComponentProps): JSX.Element => {
  const theme = useTheme();
  return (
    <React.Fragment>
      <Grid item xs={4}>
        <Paper>
          <Typography variant="h3" sx={{ p: 0.5, [theme.breakpoints.down('sm')]: { display: 'none' } }}>
            Code
          </Typography>
        </Paper>
      </Grid>
      <Grid item xs={4}>
        <Paper>
          <Typography variant="h3" sx={{ p: 0.5, [theme.breakpoints.down('sm')]: { display: 'none' } }}>
            Media Types
          </Typography>
        </Paper>
      </Grid>
      <Grid item xs={4}>
        <Paper>
          <Typography variant="h3" sx={{ p: 0.5, [theme.breakpoints.down('sm')]: { display: 'none' } }}>
            Bidders
          </Typography>
        </Paper>
      </Grid>
      {adUnits.map((adUnit, index) => (
        <AdUnitRowComponent events={events} adUnit={adUnit} key={index} />
      ))}
      <Grid item xs={12}>
        <Stack
          sx={{
            backgroundColor: 'primary.light',
            [theme.breakpoints.up('sm')]: {
              display: 'none',
            },
          }}
        >
          {adUnits.map((adUnit, index) => (
            <AdUnitCardComponent events={events} adUnit={adUnit} key={index} />
          ))}
        </Stack>
      </Grid>
    </React.Fragment>
  );
};

interface ISlotsComponentProps {
  events: IPrebidDetails['events'];
  adUnits: IPrebidAdUnit[];
}

export default SlotsComponent;
