import React from 'react';
import TableCell from '@mui/material/TableCell';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import LinearProgress from '@mui/material/LinearProgress';
import { IClassifiedNetworkEntry } from './networkClassifier';
import { EmptyNetworkView, INetworkColumn, NetworkRow, NetworkTable, RequestSummary, statusColor } from './networkTableParts';

export interface NetworkWaterfallViewProps {
  entries: IClassifiedNetworkEntry[];
  selectedEntry: IClassifiedNetworkEntry | null;
  onSelectEntry: (entry: IClassifiedNetworkEntry) => void;
}

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

const WATERFALL_COLUMNS: INetworkColumn[] = [
  { label: 'Status', width: 70 },
  { label: 'Method', width: 60 },
  { label: 'Host & Path', minWidth: 220 },
  { label: 'Category', width: 130 },
  { label: 'Provider', width: 140 },
  { label: 'Privacy', width: 120 },
  { label: 'Latency', width: 130 },
];

export const NetworkWaterfallView = ({ entries, selectedEntry, onSelectEntry }: NetworkWaterfallViewProps): JSX.Element => {
  const maxDuration = Math.max(...entries.map((e) => e.entry.time || 1), 100);

  if (entries.length === 0) {
    return <EmptyNetworkView>No network requests matched your search criteria.</EmptyNetworkView>;
  }

  return (
    <NetworkTable columns={WATERFALL_COLUMNS}>
      {entries.map((c) => {
        const isSelected = selectedEntry?.entry.id === c.entry.id;
        const progressVal = Math.min(100, Math.max(5, ((c.entry.time || 0) / maxDuration) * 100));

        return (
          <NetworkRow key={c.entry.id} selected={isSelected} onSelect={() => onSelectEntry(c)}>
            {/* Status */}
            <TableCell sx={{ p: 0.75 }}>
              <Chip label={c.entry.status || '0'} size="small" color={statusColor(c.entry.status)} sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700 }} />
            </TableCell>

            {/* Method */}
            <TableCell sx={{ p: 0.75, fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: 600 }}>{c.entry.method}</TableCell>

            {/* Host & Path */}
            <TableCell sx={{ p: 0.75 }}>
              <RequestSummary title={c.entry.host || c.entry.url} path={c.entry.pathname || '/'} url={c.entry.url} maxWidth={380} />
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
          </NetworkRow>
        );
      })}
    </NetworkTable>
  );
};
