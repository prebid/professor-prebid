import React from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import LinearProgress from '@mui/material/LinearProgress';
import { IClassifiedNetworkEntry } from './networkClassifier';

export interface NetworkWaterfallViewProps {
  entries: IClassifiedNetworkEntry[];
  selectedEntry: IClassifiedNetworkEntry | null;
  onSelectEntry: (entry: IClassifiedNetworkEntry) => void;
}

const getStatusColor = (status: number): 'success' | 'info' | 'error' | 'default' => {
  if (status >= 200 && status < 300) return 'success';
  if (status >= 300 && status < 400) return 'info';
  if (status >= 400) return 'error';
  return 'default';
};

const getPrivacyChip = (entry: IClassifiedNetworkEntry) => {
  const { privacy } = entry;
  if (privacy.verdict === 'valid') {
    if (privacy.decodedTcf) {
      return <Chip label={`TCF v${privacy.decodedTcf.version}`} size="small" color="success" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />;
    }
    if (privacy.gpp) {
      return <Chip label="GPP" size="small" color="success" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />;
    }
    if (privacy.usPrivacy) {
      return <Chip label={`USP: ${privacy.usPrivacy}`} size="small" color="success" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />;
    }
    if (privacy.gpc === '1') {
      return <Chip label="Sec-GPC" size="small" color="success" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />;
    }
    return <Chip label="Valid" size="small" color="success" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />;
  }

  if (privacy.verdict === 'missing') {
    return <Chip label="Missing Consent" size="small" color="error" variant="filled" sx={{ height: 20, fontSize: '0.65rem' }} />;
  }

  if (privacy.verdict === 'warning') {
    return <Chip label="Invalid TCF" size="small" color="warning" variant="filled" sx={{ height: 20, fontSize: '0.65rem' }} />;
  }

  return <Chip label="None" size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem', color: 'text.disabled' }} />;
};

export const NetworkWaterfallView = ({ entries, selectedEntry, onSelectEntry }: NetworkWaterfallViewProps): JSX.Element => {
  const maxDuration = Math.max(...entries.map((e) => e.entry.time || 1), 100);

  if (entries.length === 0) {
    return (
      <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', mt: 1 }}>
        <Typography variant="body1" color="text.secondary">
          No network requests matched your search criteria.
        </Typography>
      </Paper>
    );
  }

  return (
    <TableContainer component={Paper} variant="outlined" sx={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 700, width: 70 }}>Status</TableCell>
            <TableCell sx={{ fontWeight: 700, width: 60 }}>Method</TableCell>
            <TableCell sx={{ fontWeight: 700, minWidth: 220 }}>Host & Path</TableCell>
            <TableCell sx={{ fontWeight: 700, width: 130 }}>Category</TableCell>
            <TableCell sx={{ fontWeight: 700, width: 140 }}>Provider</TableCell>
            <TableCell sx={{ fontWeight: 700, width: 120 }}>Privacy</TableCell>
            <TableCell sx={{ fontWeight: 700, width: 130 }}>Latency</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {entries.map((c) => {
            const isSelected = selectedEntry?.entry.id === c.entry.id;
            const progressVal = Math.min(100, Math.max(5, ((c.entry.time || 0) / maxDuration) * 100));

            return (
              <TableRow
                key={c.entry.id}
                hover
                onClick={() => onSelectEntry(c)}
                sx={{
                  cursor: 'pointer',
                  backgroundColor: isSelected ? 'action.selected' : 'inherit',
                  '&:hover': { backgroundColor: 'action.hover' },
                }}
              >
                {/* Status */}
                <TableCell sx={{ p: 0.75 }}>
                  <Chip label={c.entry.status || '0'} size="small" color={getStatusColor(c.entry.status)} sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700 }} />
                </TableCell>

                {/* Method */}
                <TableCell sx={{ p: 0.75, fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: 600 }}>{c.entry.method}</TableCell>

                {/* Host & Path */}
                <TableCell sx={{ p: 0.75 }}>
                  <Tooltip title={c.entry.url} arrow placement="top-start">
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>
                        {c.entry.host || c.entry.url}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          fontFamily: 'monospace',
                          fontSize: '0.7rem',
                          maxWidth: 380,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {c.entry.pathname || '/'}
                      </Typography>
                    </Box>
                  </Tooltip>
                </TableCell>

                {/* Category */}
                <TableCell sx={{ p: 0.75 }}>
                  <Chip label={c.categoryLabel} size="small" color={c.categoryColor} sx={{ height: 20, fontSize: '0.65rem' }} />
                </TableCell>

                {/* Provider */}
                <TableCell sx={{ p: 0.75 }}>
                  <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                    {c.providerName || 'N/A'}
                  </Typography>
                </TableCell>

                {/* Privacy */}
                <TableCell sx={{ p: 0.75 }}>
                  <Tooltip title={c.privacy.verdictReason} arrow>
                    <Box component="span" sx={{ display: 'inline-block' }}>
                      {getPrivacyChip(c)}
                    </Box>
                  </Tooltip>
                </TableCell>

                {/* Latency Waterfall Bar */}
                <TableCell sx={{ p: 0.75 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: '100%', mr: 1 }}>
                      <LinearProgress variant="determinate" value={progressVal} sx={{ height: 6, borderRadius: 1 }} />
                    </Box>
                    <Typography variant="caption" sx={{ minWidth: 45, textAlign: 'right', fontWeight: 600 }}>
                      {Math.round(c.entry.time)} ms
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
