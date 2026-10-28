import React, { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
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

interface ISectionCardProps {
  title: ReactNode;
  icon?: ReactNode;
  /** Shown next to the title, e.g. an ACTIVE / DISABLED chip. */
  badge?: ReactNode;
  description?: ReactNode;
  /** Shown on the right of the header, e.g. a switch, a status chip or buttons. */
  actions?: ReactNode;
  /** Draws the border in the primary colour, e.g. while the feature is on. */
  highlighted?: boolean;
  children?: ReactNode;
}

/** A titled card on the dashboard-style tabs (Tools, Version). */
export const SectionCard = ({ title, icon, badge, description, actions, highlighted = false, children }: ISectionCardProps): JSX.Element => (
  <Paper elevation={1} sx={{ p: 1.25, border: '1px solid', borderColor: highlighted ? 'primary.main' : 'divider', height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1, mb: children ? 1 : 0 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
        {icon}
        <Box sx={{ minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
            <Typography variant="h3" sx={{ fontSize: '0.8rem', fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {title}
            </Typography>
            {badge}
          </Box>
          {description && (
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
              {description}
            </Typography>
          )}
        </Box>
      </Box>
      {actions}
    </Box>
    {children}
  </Paper>
);

/** The grid of SectionCards on a dashboard-style tab. */
export const SectionGrid = ({ children }: { children: ReactNode }): JSX.Element => (
  <Grid container spacing={0.75} sx={{ width: '100%', p: 0.5 }}>
    {children}
  </Grid>
);
