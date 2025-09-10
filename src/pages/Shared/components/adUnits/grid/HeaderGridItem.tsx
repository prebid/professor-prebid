import { Paper, Tooltip, Typography } from '@mui/material';
import React from 'react';
import Grid from '@mui/material/Grid';

export const HeaderGridItem = ({ label, onClick, tooltip, xs, children }: { label?: string; onClick?: () => void; tooltip?: string; xs?: number; children?: React.ReactNode }) => (
  <Grid {...(xs ? { size: { xs } } : {})} onClick={onClick} sx={{ cursor: onClick ? 'pointer' : 'default' }}>
    {children ? (
      children
    ) : (
      <Paper sx={{ p: 0.5 }}>
        {tooltip ? (
          <Tooltip title={tooltip} arrow>
            <Typography variant="h2">{label}</Typography>
          </Tooltip>
        ) : (
          <Typography variant="h2">{label}</Typography>
        )}
      </Paper>
    )}
  </Grid>
);
