import React, { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { SxProps, Theme } from '@mui/material/styles';

/** The small heading above a group of chips or values in a tile. */
export const SectionLabel = ({ children }: { children: ReactNode }): JSX.Element => (
  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5, color: 'text.secondary', fontSize: '0.75rem' }}>
    {children}
  </Typography>
);

/** A wrapping row of chips; `sx` adds spacing around it. */
export const ChipRow = ({ children, sx = {} }: { children: ReactNode; sx?: SxProps<Theme> }): JSX.Element => <Box sx={[{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }, ...(Array.isArray(sx) ? sx : [sx])]}>{children}</Box>;
