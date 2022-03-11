import React, { useEffect } from 'react';
import { IPrebidBid } from '../../../../inject/scripts/prebid';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import ExpandedRowComponent from './ExpandedRowComponent';

const NoBidRowComponent = ({ bid, globalOpen }: INoBidRowComponentProps) => {
  const [open, setOpen] = React.useState(false);
  useEffect(() => {
    setOpen(globalOpen);
  }, [globalOpen]);
  return (
    <React.Fragment>
      <Grid item xs={0.62}>
        <Paper sx={{ height: 1 }}>
          <IconButton size="small" onClick={() => setOpen(!open)}>
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </Paper>
      </Grid>
      <Grid item xs={2.38}>
        <Paper sx={{ height: 1 }}>
          <Typography variant="body1">{bid.bidder} </Typography>
        </Paper>
      </Grid>
      <Grid item xs={9}>
        <Paper sx={{ height: 1 }}>
          <Typography variant="body1">{bid.adUnitCode.length > 15 ? bid.adUnitCode.substring(0, 15) + '...' : bid.adUnitCode}</Typography>
        </Paper>
      </Grid>
      {open && <ExpandedRowComponent bid={bid} />}
    </React.Fragment>
  );
};

interface INoBidRowComponentProps {
  bid: IPrebidBid;
  globalOpen?: boolean;
}

export default NoBidRowComponent;
