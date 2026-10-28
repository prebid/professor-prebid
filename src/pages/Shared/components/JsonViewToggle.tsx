import React from 'react';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import CodeIcon from '@mui/icons-material/Code';

interface JsonViewToggleProps {
  active: boolean;
  onToggle: () => void;
  /** The view the button switches back to, e.g. "list view". */
  formattedView?: string;
  /** Sized to sit next to the search field of a tab's toolbar rather than in a card header. */
  toolbar?: boolean;
}

/** Switches a view between its formatted rendering and the raw JSON behind it. */
export const JsonViewToggle = ({ active, onToggle, formattedView = 'formatted view', toolbar = false }: JsonViewToggleProps): JSX.Element => (
  <Tooltip title={active ? `Switch to ${formattedView}` : 'Switch to raw JSON view'} arrow>
    <IconButton size="small" onClick={onToggle} color={active ? 'primary' : 'default'} sx={toolbar ? { p: 0.5, fontSize: '1.05rem', height: 'auto' } : { mr: 0.5 }}>
      <CodeIcon fontSize={toolbar ? 'inherit' : 'small'} />
    </IconButton>
  </Tooltip>
);
