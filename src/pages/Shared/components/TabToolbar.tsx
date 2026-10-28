import React, { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
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
        border: '1px solid',
        borderColor: selected ? 'primary.main' : 'transparent',
        backgroundColor: selected ? 'action.selected' : 'background.paper',
        transition: 'border-color 0.2s',
        ...(onClick && { cursor: 'pointer', userSelect: 'none', '&:hover': { borderColor: 'primary.main' } }),
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
  /** Icon buttons on the right, such as the JSON toggle and download. */
  actions?: ReactNode;
}

/** The header row of a data tab: its counts, then the filter, which takes the remaining width, then its actions. */
export const TabToolbar = ({ stats = [], search, actions }: ITabToolbarProps): JSX.Element => (
  <Grid size={{ xs: 12 }} sx={{ display: 'flex', alignItems: 'stretch', flexWrap: 'wrap', gap: 0.5, mb: 0.5 }}>
    {stats.map((stat, i) => (
      <TabStat key={i} {...stat} />
    ))}
    <Box sx={{ flex: 1, minWidth: 200, display: 'flex', alignItems: 'center', '& .MuiInputBase-input': { paddingLeft: '4px !important', paddingTop: '4px !important' } }}>
      <Box sx={{ width: '100%' }}>
        <AutoComplete {...search} />
      </Box>
    </Box>
    {actions && <Paper sx={{ display: 'flex', alignItems: 'center', px: 0.25 }}>{actions}</Paper>}
  </Grid>
);

/** Takes the place of a tab's list when nothing matches the filter. */
export const TabEmptyState = ({ children }: { children: ReactNode }): JSX.Element => (
  <Grid size={{ xs: 12 }}>
    <Paper sx={{ p: 2, textAlign: 'center' }}>{children}</Paper>
  </Grid>
);
