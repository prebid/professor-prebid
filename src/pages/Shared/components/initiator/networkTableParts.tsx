import React, { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

/** Chip colour for an HTTP status. */
export const statusColor = (status: number): 'success' | 'info' | 'error' | 'default' => {
  if (status >= 200 && status < 300) return 'success';
  if (status >= 300 && status < 400) return 'info';
  if (status >= 400) return 'error';
  return 'default';
};

/** Takes the place of a network view that has nothing to show. */
export const EmptyNetworkView = ({ children }: { children: ReactNode }): JSX.Element => (
  <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', mt: 1 }}>
    <Typography variant="body1" color="text.secondary">
      {children}
    </Typography>
  </Paper>
);

export interface INetworkColumn {
  label: string;
  width?: number;
  minWidth?: number;
}

/** A scrolling table of requests with a sticky header. */
export const NetworkTable = ({ columns, children }: { columns: INetworkColumn[]; children: ReactNode }): JSX.Element => (
  <TableContainer component={Paper} variant="outlined" sx={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
    <Table size="small" stickyHeader>
      <TableHead>
        <TableRow>
          {columns.map(({ label, width, minWidth }) => (
            <TableCell key={label} sx={{ fontWeight: 700, width, minWidth }}>
              {label}
            </TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>{children}</TableBody>
    </Table>
  </TableContainer>
);

/** A request row that selects its entry when clicked. */
export const NetworkRow = ({ selected, onSelect, children }: { selected: boolean; onSelect: () => void; children: ReactNode }): JSX.Element => (
  <TableRow
    hover
    onClick={onSelect}
    sx={{
      cursor: 'pointer',
      backgroundColor: selected ? 'action.selected' : 'inherit',
      '&:hover': { backgroundColor: 'action.hover' },
    }}
  >
    {children}
  </TableRow>
);

interface IRequestSummaryProps {
  /** Host or provider name, shown in bold. */
  title: ReactNode;
  path: string;
  url: string;
  /** Shown next to the title, e.g. the method. */
  adornment?: ReactNode;
  maxWidth?: number;
}

/** A request's host (or provider) over its path, with the full URL as tooltip. */
export const RequestSummary = ({ title, path, url, adornment, maxWidth }: IRequestSummaryProps): JSX.Element => (
  <Tooltip title={url} arrow placement="top-start">
    <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
          {title}
        </Typography>
        {adornment}
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace', fontSize: '0.7rem', maxWidth, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {path}
      </Typography>
    </Box>
  </Tooltip>
);
