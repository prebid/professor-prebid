import React, { ReactNode } from 'react';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { GridCell } from './bids/BidsComponent';

interface IHeaderTabProps {
  selected: boolean;
  onClick: () => void;
  tooltip: string;
  children: ReactNode;
}

/** A clickable cell in a tab's header row that selects a view or filter, e.g. "Bids: 12". */
export const HeaderTab = ({ selected, onClick, tooltip, children }: IHeaderTabProps): JSX.Element => (
  <GridCell
    cols={2}
    variant="h2"
    sx={{
      cursor: 'pointer',
      userSelect: 'none',
      border: '1px solid',
      borderColor: selected ? 'primary.main' : 'divider',
      backgroundColor: selected ? 'action.selected' : 'background.paper',
      transition: 'all 0.2s',
      '&:hover': { borderColor: 'primary.main' },
    }}
    onClick={onClick}
  >
    <Tooltip title={tooltip} arrow>
      <Typography variant="h2" component="span" sx={{ fontSize: '0.8rem', fontWeight: 700, color: selected ? 'primary.main' : 'text.secondary' }}>
        {children}
      </Typography>
    </Tooltip>
  </GridCell>
);
