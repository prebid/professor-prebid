import React from 'react';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import CodeIcon from '@mui/icons-material/Code';
import { ToolbarButton } from './TabToolbar';

interface JsonViewToggleProps {
  active: boolean;
  onToggle: () => void;
  /** The view the button switches back to, e.g. "list view". */
  formattedView?: string;
  /** A ToolbarButton for a tab's toolbar rather than the smaller button in a card header. */
  toolbar?: boolean;
}

/** Switches a view between its formatted rendering and the raw JSON behind it. */
export const JsonViewToggle = ({ active, onToggle, formattedView = 'formatted view', toolbar = false }: JsonViewToggleProps): JSX.Element => {
  const tooltip = active ? `Switch to ${formattedView}` : 'Switch to raw JSON view';
  return toolbar ? (
    <ToolbarButton tooltip={tooltip} onClick={onToggle} icon={<CodeIcon fontSize="inherit" />} color={active ? 'primary' : 'default'} />
  ) : (
    <Tooltip title={tooltip} arrow>
      <IconButton size="small" onClick={onToggle} color={active ? 'primary' : 'default'} sx={{ mr: 0.5 }}>
        <CodeIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  );
};
