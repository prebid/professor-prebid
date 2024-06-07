import React, { useContext } from 'react';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import AdUnitsComponentState from '../AdUnitsComponentState';
import AdUnitGridRow from './AdUnitsGridRow';
import AppStateContext from '../../../contexts/appStateContext';
import SyncAltIcon from '@mui/icons-material/SyncAlt';
import SyncProblemIcon from '@mui/icons-material/SyncProblem';
import RotateRightIcon from '@mui/icons-material/RotateRight';
import { Tooltip } from '@mui/material';

const AdUnitsGridComponent = (): JSX.Element => {
  const { adUnits } = AdUnitsComponentState();
  const { isPanel, googleAdManager } = useContext(AppStateContext);
  const showAdServerComlumn = isPanel && googleAdManager?.slots?.length > 0;
  const showOrtb2ImpColumn = isPanel && adUnits.find(({ ortb2Imp }) => ortb2Imp);
  let columns = 12;
  if (showAdServerComlumn) columns += 4;
  if (showOrtb2ImpColumn) columns += 4;
  return (
    <Grid spacing={0.25} container direction="row" columns={columns}>
      <Grid item xs={4} md={4}>
        <Paper>
          <Typography variant="h3" sx={{ p: 0.5 }}>
            Code
          </Typography>
        </Paper>
      </Grid>
      <Grid item xs={4} md={4}>
        <Paper>
          <Typography variant="h3" sx={{ p: 0.5 }}>
            Media Types
          </Typography>
        </Paper>
      </Grid>

      <Grid item xs={4} md={4}>
        <Paper>
          <Typography variant="h3" sx={{ p: 0.5 }}>
            Bidders
          </Typography>
        </Paper>
      </Grid>
      {isPanel && googleAdManager?.slots?.length > 0 && (
        <Grid item md={4}>
          <Paper sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
            <Typography variant="h3" sx={{ p: 0.5 }}>
              Ad Server
            </Typography>
            {googleAdManager?.async === false && (
              <Tooltip title="Ad Server is not async">
                <SyncProblemIcon fontSize="small" color="error" />
              </Tooltip>
            )}
            {googleAdManager?.fetchBeforeKeyvalue === true && (
              <Tooltip title="Ad Server fetch before key/value was set">
                <SyncAltIcon fontSize="small" color="error" />
              </Tooltip>
            )}
            {googleAdManager?.fetchBeforeRefresh === true && (
              <Tooltip title="Ad Server fetch before refresh">
                <RotateRightIcon fontSize="small" color="error" />
              </Tooltip>
            )}
          </Paper>
        </Grid>
      )}
      {isPanel && !!adUnits.find(({ ortb2Imp }) => ortb2Imp) && (
        <Grid item md={4}>
          <Paper sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
            <Typography variant="h3" sx={{ p: 0.5 }}>
              OpenRtb2 Imp
            </Typography>
          </Paper>
        </Grid>
      )}
      {adUnits?.map((adUnit, index) => (
        <AdUnitGridRow adUnit={adUnit} key={index} />
      ))}
    </Grid>
  );
};

export default AdUnitsGridComponent;
