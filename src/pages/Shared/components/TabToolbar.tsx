import React, { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import IconButton, { IconButtonProps } from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { lighten } from '@mui/material/styles';
import { AutoComplete } from './autocomplete/AutoComplete';

export interface ITabStat {
  label: ReactNode;
  /** Makes the stat a quick filter or a view switch. */
  onClick?: () => void;
  selected?: boolean;
  tooltip?: string;
}

/** A count in a tab's header, e.g. "Bids: 12"; clickable when it filters or switches the view. */
export const TabStat = ({ label, onClick, selected = false, tooltip }: ITabStat): JSX.Element => {
  const stat = (
    <Paper
      onClick={onClick}
      sx={{
        px: 1,
        py: 0.5,
        display: 'flex',
        alignItems: 'center',
        whiteSpace: 'nowrap',
        // Selected: blue text on a light tint of the primary colour (opaque, so the page background does not show through).
        backgroundColor: (theme) => (selected ? lighten(theme.palette.primary.main, 0.9) : theme.palette.background.paper),
        transition: 'background-color 0.2s',
        ...(onClick && { cursor: 'pointer', userSelect: 'none', '&:hover': { backgroundColor: (theme) => lighten(theme.palette.primary.main, selected ? 0.85 : 0.95) } }),
      }}
    >
      <Typography variant="h2" component="span" sx={{ color: selected ? 'primary.main' : 'text.primary' }}>
        {label}
      </Typography>
    </Paper>
  );
  return tooltip ? (
    <Tooltip title={tooltip} arrow>
      {stat}
    </Tooltip>
  ) : (
    stat
  );
};

interface IToolbarButtonProps {
  tooltip: string;
  onClick: () => void;
  icon: ReactNode;
  color?: IconButtonProps['color'];
  disabled?: boolean;
  /** For buttons that switch something on or off, e.g. a view: whether it is on. */
  pressed?: boolean;
}

/** An icon button in a tab's toolbar; every toolbar action (download, JSON view, reload...) uses it. */
export const ToolbarButton = ({ tooltip, onClick, icon, color = 'default', disabled = false, pressed }: IToolbarButtonProps): JSX.Element => {
  const button = (
    <IconButton size="small" onClick={onClick} color={color} disabled={disabled} aria-pressed={pressed} sx={{ p: 0.5, fontSize: '1.05rem', height: 'auto' }}>
      {icon}
    </IconButton>
  );
  // A disabled button fires no events, so the tooltip needs a wrapper to show on hover.
  return (
    <Tooltip title={tooltip} arrow>
      {disabled ? <span>{button}</span> : button}
    </Tooltip>
  );
};

export interface ITabSearch {
  query: string;
  onQueryChange: (query: string) => void;
  options: string[];
  fieldKeys: string[];
  placeholder: string;
}

interface ITabToolbarProps {
  stats?: ITabStat[];
  search: ITabSearch;
  /** Shown between the filter and the actions, e.g. a view switcher. */
  extra?: ReactNode;
  /** ToolbarButtons on the right, such as the JSON toggle and download. */
  actions?: ReactNode;
}

/**
 * The header row of a data tab: its counts, then the filter, which takes the remaining width, then its actions.
 * The filter, extra and actions wrap as one group, so on a narrow screen they move to a second line together.
 */
export const TabToolbar = ({ stats = [], search, extra, actions }: ITabToolbarProps): JSX.Element => (
  <Box sx={{ width: '100%', flexShrink: 0, display: 'flex', alignItems: 'stretch', flexWrap: 'wrap', gap: 0.5, mb: 0.5 }}>
    {stats.map((stat, i) => (
      <TabStat key={i} {...stat} />
    ))}
    <Box sx={{ flex: '1 1 320px', display: 'flex', alignItems: 'stretch', gap: 0.5, minWidth: 0 }}>
      <Box sx={{ flex: 1, minWidth: 180, display: 'flex', alignItems: 'center', '& .MuiInputBase-input': { paddingLeft: '4px !important', paddingTop: '4px !important' } }}>
        <Box sx={{ width: '100%' }}>
          <AutoComplete {...search} />
        </Box>
      </Box>
      {extra}
      {actions && <Paper sx={{ display: 'flex', alignItems: 'center', px: 0.25, flexShrink: 0 }}>{actions}</Paper>}
    </Box>
  </Box>
);

/** Takes the place of a tab's list when nothing matches the filter. */
export const TabEmptyState = ({ children }: { children: ReactNode }): JSX.Element => (
  <Grid size={{ xs: 12 }}>
    <Paper sx={{ p: 2, textAlign: 'center' }}>{children}</Paper>
  </Grid>
);
