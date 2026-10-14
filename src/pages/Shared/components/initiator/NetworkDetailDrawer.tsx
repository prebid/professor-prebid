import React, { useState } from 'react';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Alert from '@mui/material/Alert';
import { IClassifiedNetworkEntry } from './networkClassifier';
import JSONViewerComponent from '../JSONViewerComponent';
import { decompressPayload } from './payloadDecompressor';
import Button from '@mui/material/Button';

export interface NetworkDetailDrawerProps {
  selectedEntry: IClassifiedNetworkEntry | null;
  onClose: () => void;
}

const formatMs = (ms?: number): string => {
  if (typeof ms !== 'number' || isNaN(ms)) return '0 ms';
  return `${Math.round(ms * 10) / 10} ms`;
};

const formatBytes = (bytes?: number): string => {
  if (typeof bytes !== 'number' || isNaN(bytes) || bytes <= 0) return 'N/A';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const copyToClipboard = (text: string) => {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text);
  }
};

export const NetworkDetailDrawer = ({ selectedEntry, onClose }: NetworkDetailDrawerProps): JSX.Element => {
  const [tabIndex, setTabIndex] = useState<number>(0);
  const [paramFilter, setParamFilter] = useState<string>('');
  const [headerFilter, setHeaderFilter] = useState<string>('');
  const [showRawCompressed, setShowRawCompressed] = useState<boolean>(false);
  const [decompressed, setDecompressed] = useState<{ text: string; isDecompressed: boolean }>({
    text: '',
    isDecompressed: false,
  });

  const entry = selectedEntry?.entry;

  React.useEffect(() => {
    let active = true;
    if (entry?.postData?.text) {
      decompressPayload(entry.postData.text).then((res) => {
        if (active) {
          setDecompressed(res);
        }
      });
    } else {
      setDecompressed({ text: '', isDecompressed: false });
    }
    return () => {
      active = false;
    };
  }, [entry?.postData?.text]);

  if (!selectedEntry || !entry) {
    return <Drawer anchor="right" open={false} onClose={onClose} />;
  }

  const { categoryLabel, categoryColor, providerName, privacy } = selectedEntry;

  const queryParamsList = entry.queryString || [];
  const filteredParams = queryParamsList.filter((p) => p.name.toLowerCase().includes(paramFilter.toLowerCase()) || p.value.toLowerCase().includes(paramFilter.toLowerCase()));

  const reqHeaders = entry.requestHeaders || [];
  const resHeaders = entry.responseHeaders || [];
  const filteredReqHeaders = reqHeaders.filter((h) => h.name.toLowerCase().includes(headerFilter.toLowerCase()) || h.value.toLowerCase().includes(headerFilter.toLowerCase()));
  const filteredResHeaders = resHeaders.filter((h) => h.name.toLowerCase().includes(headerFilter.toLowerCase()) || h.value.toLowerCase().includes(headerFilter.toLowerCase()));

  const activePayloadText = showRawCompressed ? entry.postData?.text || '' : decompressed.text || entry.postData?.text || '';

  let parsedPostJson: any = null;
  if (activePayloadText) {
    try {
      parsedPostJson = JSON.parse(activePayloadText);
    } catch {
      parsedPostJson = null;
    }
  }

  const statusColor = entry.status >= 200 && entry.status < 300 ? 'success' : entry.status >= 300 && entry.status < 400 ? 'info' : entry.status >= 400 ? 'error' : 'default';

  return (
    <Drawer
      anchor="right"
      open={Boolean(selectedEntry)}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 600, md: 740 },
          height: '100%',
          maxHeight: '100vh',
          p: 2,
          backgroundColor: 'background.paper',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
          overflow: 'hidden',
        },
      }}
    >
      {/* Header (Fixed height, no blowing up) */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1, flexShrink: 0 }}>
        <Box sx={{ flex: 1, pr: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
            <Chip label={entry.status || '0'} size="small" color={statusColor as any} sx={{ fontWeight: 700 }} />
            <Chip label={entry.method} size="small" variant="outlined" />
            <Chip label={categoryLabel} size="small" color={categoryColor as any} />
            {providerName && <Chip label={providerName} size="small" variant="outlined" color="primary" />}
          </Box>
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 700,
              fontSize: '0.85rem',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {entry.host}
            {entry.pathname}
          </Typography>
          <Tooltip title={`${entry.url} (Click to copy)`} arrow placement="bottom-start">
            <Typography
              variant="caption"
              color="text.secondary"
              onClick={() => copyToClipboard(entry.url)}
              sx={{
                fontFamily: 'monospace',
                fontSize: '0.7rem',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                wordBreak: 'break-all',
                lineHeight: 1.2,
                cursor: 'pointer',
                bgcolor: 'action.hover',
                p: 0.5,
                borderRadius: 0.5,
                mt: 0.5,
              }}
            >
              {entry.url}
            </Typography>
          </Tooltip>
        </Box>
        <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
          <Tooltip title="Copy full URL" arrow>
            <IconButton size="small" onClick={() => copyToClipboard(entry.url)}>
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <IconButton size="small" onClick={onClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      {/* Navigation Tabs */}
      <Tabs value={tabIndex} onChange={(_, val) => setTabIndex(val)} variant="scrollable" scrollButtons="auto" sx={{ borderBottom: 1, borderColor: 'divider', minHeight: 36, mb: 1.5, flexShrink: 0 }}>
        <Tab label="Overview" sx={{ minHeight: 36, py: 0.5, fontSize: '0.75rem' }} />
        <Tab
          label={`Privacy (${privacy.verdict === 'warning' ? 'MALFORMED' : privacy.verdict.toUpperCase()})`}
          sx={{
            minHeight: 36,
            py: 0.5,
            fontSize: '0.75rem',
            color: privacy.verdict === 'valid' ? 'success.main' : privacy.verdict === 'warning' ? 'warning.main' : privacy.verdict === 'missing' ? 'error.main' : 'inherit',
          }}
        />
        <Tab label={`Query Params (${queryParamsList.length})`} sx={{ minHeight: 36, py: 0.5, fontSize: '0.75rem' }} />
        <Tab label={`Headers (${reqHeaders.length + resHeaders.length})`} sx={{ minHeight: 36, py: 0.5, fontSize: '0.75rem' }} />
        <Tab label="Payload" sx={{ minHeight: 36, py: 0.5, fontSize: '0.75rem' }} />
        <Tab label={`Cookies (${(entry.requestCookies?.length || 0) + (entry.responseCookies?.length || 0)})`} sx={{ minHeight: 36, py: 0.5, fontSize: '0.75rem' }} />
        <Tab label="Initiator Stack" sx={{ minHeight: 36, py: 0.5, fontSize: '0.75rem' }} />
      </Tabs>

      {/* Scrollable Tab Content Container */}
      <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', pr: 0.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {/* Tab 0: Overview */}
        {tabIndex === 0 && (
          <>
            <Paper variant="outlined" sx={{ p: 1.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                General Information
              </Typography>
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, width: 140 }}>Host</TableCell>
                    <TableCell>{entry.host || 'N/A'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Pathname</TableCell>
                    <TableCell sx={{ wordBreak: 'break-all' }}>{entry.pathname || '/'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    <TableCell>
                      {entry.status} {entry.statusText}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Duration</TableCell>
                    <TableCell>{formatMs(entry.time)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Resource Type</TableCell>
                    <TableCell>{entry.resourceType || 'fetch'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>MIME Type</TableCell>
                    <TableCell>{entry.mimeType || 'N/A'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Response Size</TableCell>
                    <TableCell>{formatBytes(entry.contentSize)}</TableCell>
                  </TableRow>
                  {entry.redirectURL && (
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, color: 'info.main' }}>Redirects To</TableCell>
                      <TableCell sx={{ wordBreak: 'break-all', color: 'info.main' }}>{entry.redirectURL}</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Paper>

            {/* Timing Breakdown */}
            {entry.timings && (
              <Paper variant="outlined" sx={{ p: 1.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                  Timing Breakdown
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 1 }}>
                  <Box sx={{ p: 1, bgcolor: 'action.hover', borderRadius: 1, textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                      DNS
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {formatMs(entry.timings.dns)}
                    </Typography>
                  </Box>
                  <Box sx={{ p: 1, bgcolor: 'action.hover', borderRadius: 1, textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                      Connect
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {formatMs(entry.timings.connect)}
                    </Typography>
                  </Box>
                  <Box sx={{ p: 1, bgcolor: 'action.hover', borderRadius: 1, textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                      SSL
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {formatMs(entry.timings.ssl)}
                    </Typography>
                  </Box>
                  <Box sx={{ p: 1, bgcolor: 'action.hover', borderRadius: 1, textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                      Wait (TTFB)
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {formatMs(entry.timings.wait)}
                    </Typography>
                  </Box>
                  <Box sx={{ p: 1, bgcolor: 'action.hover', borderRadius: 1, textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                      Receive
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {formatMs(entry.timings.receive)}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            )}
          </>
        )}

        {/* Tab 1: Privacy & Consent Audit */}
        {tabIndex === 1 && (
          <>
            <Alert severity={privacy.verdict === 'valid' ? 'success' : privacy.verdict === 'warning' ? 'warning' : privacy.verdict === 'missing' ? 'error' : 'info'}>{privacy.verdictReason}</Alert>

            {/* TCF String Details */}
            {privacy.gdprConsent && (
              <Paper variant="outlined" sx={{ p: 1.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    TCF Consent String (gdpr_consent)
                  </Typography>
                  <IconButton size="small" onClick={() => copyToClipboard(privacy.gdprConsent!)}>
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </Box>
                <Typography variant="caption" sx={{ fontFamily: 'monospace', wordBreak: 'break-all', display: 'block', mb: 1.5, bgcolor: 'action.hover', p: 1, borderRadius: 1 }}>
                  {privacy.gdprConsent}
                </Typography>

                {privacy.decodedTcf ? (
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600, width: 160 }}>TCF Version</TableCell>
                        <TableCell>v{privacy.decodedTcf.version}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>CMP ID</TableCell>
                        <TableCell>{privacy.decodedTcf.cmpId}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>CMP Version</TableCell>
                        <TableCell>{privacy.decodedTcf.cmpVersion}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Consent Language</TableCell>
                        <TableCell>{privacy.decodedTcf.consentLanguage || 'N/A'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Purpose Consents</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {privacy.decodedTcf.purposeConsents && privacy.decodedTcf.purposeConsents.length > 0 ? (
                              privacy.decodedTcf.purposeConsents.map((p) => <Chip key={p} label={`P${p}`} size="small" color="primary" variant="outlined" />)
                            ) : (
                              <Typography variant="caption" color="text.secondary">
                                None granted
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Special Features</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {privacy.decodedTcf.specialFeatureOptins && privacy.decodedTcf.specialFeatureOptins.length > 0 ? (
                              privacy.decodedTcf.specialFeatureOptins.map((f) => <Chip key={f} label={`SF${f}`} size="small" color="secondary" variant="outlined" />)
                            ) : (
                              <Typography variant="caption" color="text.secondary">
                                None
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Vendor Consents</TableCell>
                        <TableCell>{privacy.decodedTcf.vendorConsents?.length || 0} Vendors Granted</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                ) : (
                  <Typography variant="caption" color="error">
                    Could not decode TCF structure from this string.
                  </Typography>
                )}
              </Paper>
            )}

            {/* Other Privacy Signals */}
            <Paper variant="outlined" sx={{ p: 1.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                Other Privacy Signals
              </Typography>
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, width: 160 }}>GDPR Applies (gdpr)</TableCell>
                    <TableCell>{privacy.gdpr !== undefined ? privacy.gdpr : 'Not Specified'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>US Privacy String</TableCell>
                    <TableCell>{privacy.usPrivacy || 'None'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Global Privacy Platform (GPP)</TableCell>
                    <TableCell sx={{ wordBreak: 'break-all' }}>{privacy.gpp || 'None'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>GPP Section IDs (gpp_sid)</TableCell>
                    <TableCell>{privacy.gppSid || 'None'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Global Privacy Control (GPC)</TableCell>
                    <TableCell>{privacy.gpc === '1' ? 'Enabled (Sec-GPC: 1)' : 'Not Set'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>COPPA / Child Directed</TableCell>
                    <TableCell>{privacy.coppa === '1' ? 'Yes (coppa=1)' : 'No'}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Paper>
          </>
        )}

        {/* Tab 2: Query Parameters */}
        {tabIndex === 2 && (
          <>
            <TextField size="small" placeholder="Search query parameters..." value={paramFilter} onChange={(e) => setParamFilter(e.target.value)} sx={{ mb: 0.5 }} />
            {filteredParams.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                No query parameters found.
              </Typography>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, width: 160 }}>Parameter</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Value</TableCell>
                      <TableCell sx={{ width: 40 }}></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredParams.map((p, idx) => {
                      const isDecodableUrl = p.value.includes('%2F') || p.value.includes('%3A');
                      return (
                        <TableRow key={idx}>
                          <TableCell sx={{ fontWeight: 600, fontFamily: 'monospace', fontSize: '0.75rem' }}>{p.name}</TableCell>
                          <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem', wordBreak: 'break-all' }}>
                            {p.value}
                            {isDecodableUrl && (
                              <Box sx={{ mt: 0.5, p: 0.5, bgcolor: 'action.hover', borderRadius: 0.5 }}>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>
                                  URL Decoded:
                                </Typography>
                                <Typography variant="caption" sx={{ wordBreak: 'break-all', fontFamily: 'monospace' }}>
                                  {decodeURIComponent(p.value)}
                                </Typography>
                              </Box>
                            )}
                          </TableCell>
                          <TableCell>
                            <IconButton size="small" onClick={() => copyToClipboard(p.value)}>
                              <ContentCopyIcon fontSize="small" sx={{ fontSize: '0.9rem' }} />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </>
        )}

        {/* Tab 3: Headers */}
        {tabIndex === 3 && (
          <>
            <TextField size="small" placeholder="Search headers..." value={headerFilter} onChange={(e) => setHeaderFilter(e.target.value)} />
            <Paper variant="outlined" sx={{ p: 1.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                Request Headers ({filteredReqHeaders.length})
              </Typography>
              <Table size="small">
                <TableBody>
                  {filteredReqHeaders.map((h, i) => (
                    <TableRow key={i}>
                      <TableCell sx={{ fontWeight: 600, fontFamily: 'monospace', fontSize: '0.75rem', width: 180 }}>{h.name}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem', wordBreak: 'break-all' }}>{h.value}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>

            <Paper variant="outlined" sx={{ p: 1.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                Response Headers ({filteredResHeaders.length})
              </Typography>
              <Table size="small">
                <TableBody>
                  {filteredResHeaders.map((h, i) => (
                    <TableRow key={i}>
                      <TableCell sx={{ fontWeight: 600, fontFamily: 'monospace', fontSize: '0.75rem', width: 180 }}>{h.name}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem', wordBreak: 'break-all' }}>{h.value}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          </>
        )}

        {/* Tab 4: Payload */}
        {tabIndex === 4 && (
          <>
            {!entry.postData?.text ? (
              <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                No POST payload for this request.
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      MIME: {entry.postData.mimeType || 'application/json'}
                    </Typography>
                    {decompressed.isDecompressed && (
                      <Chip
                        label={showRawCompressed ? 'Gzipped (Raw View)' : '✨ Auto-Unzipped (Gzip)'}
                        size="small"
                        color={showRawCompressed ? 'default' : 'success'}
                        variant={showRawCompressed ? 'outlined' : 'filled'}
                        sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }}
                      />
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {decompressed.isDecompressed && (
                      <Button size="small" variant="outlined" onClick={() => setShowRawCompressed(!showRawCompressed)} sx={{ fontSize: '0.65rem', py: 0.25, px: 1, textTransform: 'none', height: 24 }}>
                        {showRawCompressed ? 'Show Unzipped JSON' : 'Show Raw Compressed'}
                      </Button>
                    )}
                    <Tooltip title="Copy Payload" arrow>
                      <IconButton size="small" onClick={() => copyToClipboard(activePayloadText)}>
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>

                {parsedPostJson ? (
                  <JSONViewerComponent src={parsedPostJson} collapsed={2} />
                ) : (
                  <Paper variant="outlined" sx={{ p: 1.5, maxHeight: 400, overflow: 'auto', bgcolor: 'grey.900' }}>
                    <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'common.white', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                      {activePayloadText}
                    </Typography>
                  </Paper>
                )}
              </Box>
            )}
          </>
        )}

        {/* Tab 5: Cookies */}
        {tabIndex === 5 && (
          <>
            <Paper variant="outlined" sx={{ p: 1.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                Request Cookies ({entry.requestCookies?.length || 0})
              </Typography>
              {entry.requestCookies && entry.requestCookies.length > 0 ? (
                <Table size="small">
                  <TableBody>
                    {entry.requestCookies.map((c, i) => (
                      <TableRow key={i}>
                        <TableCell sx={{ fontWeight: 600, fontFamily: 'monospace', fontSize: '0.75rem', width: 140 }}>{c.name}</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem', wordBreak: 'break-all' }}>{c.value}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Typography variant="caption" color="text.secondary">
                  No request cookies
                </Typography>
              )}
            </Paper>

            <Paper variant="outlined" sx={{ p: 1.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                Response Cookies / Set-Cookie ({entry.responseCookies?.length || 0})
              </Typography>
              {entry.responseCookies && entry.responseCookies.length > 0 ? (
                <Table size="small">
                  <TableBody>
                    {entry.responseCookies.map((c, i) => (
                      <TableRow key={i}>
                        <TableCell sx={{ fontWeight: 600, fontFamily: 'monospace', fontSize: '0.75rem', width: 140 }}>{c.name}</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem', wordBreak: 'break-all' }}>{c.value}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Typography variant="caption" color="text.secondary">
                  No response cookies set
                </Typography>
              )}
            </Paper>
          </>
        )}

        {/* Tab 6: Initiator Stack */}
        {tabIndex === 6 && (
          <Paper variant="outlined" sx={{ p: 1.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
              Initiator Details
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <b>Type:</b> {entry.initiator?.type || 'parser / other'}
            </Typography>
            {entry.initiator?.url && (
              <Typography variant="caption" sx={{ fontFamily: 'monospace', display: 'block', wordBreak: 'break-all', mb: 1 }}>
                <b>Initiator URL:</b> {entry.initiator.url}
              </Typography>
            )}
            {entry.initiator?.stack?.callFrames && entry.initiator.stack.callFrames.length > 0 ? (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Function</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Script / Location</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {entry.initiator.stack.callFrames.map((frame: any, idx: number) => (
                    <TableRow key={idx}>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: 600 }}>{frame.functionName || '(anonymous)'}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem', wordBreak: 'break-all' }}>{frame.url ? `${frame.url}:${frame.lineNumber || 0}:${frame.columnNumber || 0}` : 'inline'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <Typography variant="caption" color="text.secondary">
                No JS call frames recorded for this initiator.
              </Typography>
            )}
          </Paper>
        )}
      </Box>
    </Drawer>
  );
};
