import React, { ReactNode } from 'react';
import Paper from '@mui/material/Paper';

/** The card behind each tile on the Version tab; `highlighted` draws its border in the primary colour. */
export const VersionCard = ({ highlighted = false, children }: { highlighted?: boolean; children: ReactNode }): JSX.Element => (
  <Paper
    elevation={1}
    sx={{
      p: 1.25,
      border: '1px solid',
      borderColor: highlighted ? 'primary.main' : 'divider',
      backgroundColor: 'background.paper',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      boxSizing: 'border-box',
    }}
  >
    {children}
  </Paper>
);
