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
import IconButton from '@mui/material/IconButton';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { IClassifiedNetworkEntry } from './networkClassifier';

export interface NetworkPrivacyAuditViewProps {
  entries: IClassifiedNetworkEntry[];
  selectedEntry: IClassifiedNetworkEntry | null;
  onSelectEntry: (entry: IClassifiedNetworkEntry) => void;
}

const copyToClipboard = (text: string, e: React.MouseEvent) => {
  e.stopPropagation();
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text);
  }
};

export const NetworkPrivacyAuditView = ({ entries, selectedEntry, onSelectEntry }: NetworkPrivacyAuditViewProps): JSX.Element => {
  if (entries.length === 0) {
    return (
      <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', mt: 1 }}>
        <Typography variant="body1" color="text.secondary">
          No network requests found.
        </Typography>
      </Paper>
    );
  }

  return (
    <TableContainer component={Paper} variant="outlined" sx={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 700, width: 120 }}>Verdict</TableCell>
            <TableCell sx={{ fontWeight: 700, minWidth: 200 }}>Endpoint & Provider</TableCell>
            <TableCell sx={{ fontWeight: 700, width: 110 }}>Category</TableCell>
            <TableCell sx={{ fontWeight: 700, minWidth: 220 }}>TCF Consent (GDPR)</TableCell>
            <TableCell sx={{ fontWeight: 700, width: 110 }}>US Privacy</TableCell>
            <TableCell sx={{ fontWeight: 700, width: 120 }}>GPP String</TableCell>
            <TableCell sx={{ fontWeight: 700, width: 90 }}>Sec-GPC</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {entries.map((c) => {
            const isSelected = selectedEntry?.entry.id === c.entry.id;
            const { privacy } = c;

            const verdictChip =
              privacy.verdict === 'valid' ? (
                <Chip label="VALID" size="small" color="success" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }} />
              ) : privacy.verdict === 'missing' ? (
                <Chip label="MISSING CONSENT" size="small" color="error" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }} />
              ) : privacy.verdict === 'warning' ? (
                <Chip label="MALFORMED TCF" size="small" color="warning" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }} />
              ) : (
                <Chip label="N/A" size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem', color: 'text.disabled' }} />
              );

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
                {}
                <TableCell sx={{ p: 0.75 }}>
                  <Tooltip title={privacy.verdictReason} arrow>
                    <Box component="span" sx={{ display: 'inline-block' }}>
                      {verdictChip}
                    </Box>
                  </Tooltip>
                </TableCell>

                {}
                <TableCell sx={{ p: 0.75 }}>
                  <Tooltip title={c.entry.url} arrow placement="top-start">
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>
                          {c.providerName || c.entry.host}
                        </Typography>
                        <Chip label={c.entry.method} size="small" variant="outlined" sx={{ height: 16, fontSize: '0.6rem' }} />
                      </Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          fontFamily: 'monospace',
                          fontSize: '0.7rem',
                          maxWidth: 320,
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

                {}
                <TableCell sx={{ p: 0.75 }}>
                  <Chip label={c.categoryLabel} size="small" color={c.categoryColor} sx={{ height: 20, fontSize: '0.65rem' }} />
                </TableCell>

                {}
                <TableCell sx={{ p: 0.75 }}>
                  {privacy.gdprConsent ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Chip label={privacy.decodedTcf ? `TCF v${privacy.decodedTcf.version}` : 'TCF'} size="small" color={privacy.decodedTcf ? 'success' : 'warning'} variant="outlined" sx={{ height: 18, fontSize: '0.6rem' }} />
                          {privacy.decodedTcf?.cmpId !== undefined && (
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                              CMP #{privacy.decodedTcf.cmpId}
                            </Typography>
                          )}
                        </Box>
                        <Typography
                          variant="caption"
                          sx={{
                            fontFamily: 'monospace',
                            fontSize: '0.65rem',
                            display: 'block',
                            maxWidth: 200,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {privacy.gdprConsent}
                        </Typography>
                      </Box>
                      <IconButton size="small" onClick={(e) => copyToClipboard(privacy.gdprConsent!, e)} sx={{ p: 0.25 }}>
                        <ContentCopyIcon sx={{ fontSize: '0.8rem' }} />
                      </IconButton>
                    </Box>
                  ) : privacy.hasGdpr ? (
                    <Chip label="gdpr=1 (No String)" size="small" color="error" sx={{ height: 18, fontSize: '0.6rem' }} />
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      None
                    </Typography>
                  )}
                </TableCell>

                {/* US Privacy */}
                <TableCell sx={{ p: 0.75 }}>
                  {privacy.usPrivacy ? (
                    <Chip label={privacy.usPrivacy} size="small" color="primary" variant="outlined" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600 }} />
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      None
                    </Typography>
                  )}
                </TableCell>

                {/* GPP String */}
                <TableCell sx={{ p: 0.75 }}>
                  {privacy.gpp ? (
                    <Tooltip title={`GPP String: ${privacy.gpp} (Sections: ${privacy.gppSid || 'all'})`} arrow>
                      <Chip label={privacy.gppSid ? `GPP (${privacy.gppSid})` : 'GPP'} size="small" color="secondary" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />
                    </Tooltip>
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      None
                    </Typography>
                  )}
                </TableCell>

                {/* Sec-GPC */}
                <TableCell sx={{ p: 0.75 }}>
                  {privacy.gpc === '1' ? (
                    <Chip label="GPC: 1" size="small" color="success" sx={{ height: 18, fontSize: '0.65rem' }} />
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      None
                    </Typography>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
