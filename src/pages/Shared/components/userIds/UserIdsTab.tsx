import React, { useContext, useState, useMemo } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Collapse from '@mui/material/Collapse';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CodeIcon from '@mui/icons-material/Code';
import BadgeIcon from '@mui/icons-material/Badge';
import AppStateContext from '../../contexts/appStateContext';
import JSONViewerComponent from '../JSONViewerComponent';
import { createQueryEngine } from '../autocomplete/utils';

export const EID_FIELD_MAP = {
  source: (eid: any) => eid?.source,
  id: (eid: any) => eid?.uids?.map((u: any) => u?.id).join(' ') || '',
} as const;

const eidQueryEngine = createQueryEngine<any>(EID_FIELD_MAP);

const UserIdsTab = ({ searchQuery = '' }: { searchQuery?: string }): JSX.Element => {
  const { prebid } = useContext(AppStateContext);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedEids, setExpandedEids] = useState<Record<string, boolean>>({});

  const handleCopy = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(text);
  };

  const toggleExpand = (key: string) => {
    setExpandedEids((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const eids = prebid?.eids || [];
  const filterFn = useMemo(() => eidQueryEngine.runQuery(searchQuery), [searchQuery]);
  const filteredEids = useMemo(() => eids.filter((eid) => eid && filterFn(eid)), [eids, filterFn]);

  if (!filteredEids || filteredEids.length === 0) {
    return (
      <Grid size={{ xs: 12 }}>
        <Box sx={{ p: 3, textAlign: 'center', backgroundColor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="body1" color="text.secondary">
            {searchQuery ? `No User IDs match "${searchQuery}"` : 'No User IDs (EIDs) detected on this page.'}
          </Typography>
        </Box>
      </Grid>
    );
  }

  return (
    <Grid container spacing={0.75} sx={{ width: '100%' }}>
      {filteredEids.map((eid, i) => {
        const key = `${eid?.source || 'eid'}-${eid?.uids?.map((u: any) => u.id).join('-') || i}`;
        const isExpanded = !!expandedEids[key];
        const uids = eid?.uids || [];

        return (
          <Grid key={key} size={{ xs: 12 }}>
            <Card elevation={1} sx={{ border: '1px solid', borderColor: 'divider', transition: 'box-shadow 0.2s', '&:hover': { boxShadow: 2 } }}>
              <CardContent sx={{ p: 1.25, '&:last-child': { pb: 1.25 } }}>
                {/* EID Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, flexWrap: 'wrap', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <BadgeIcon color="primary" sx={{ fontSize: '1.2rem' }} />
                    <Typography variant="h3" sx={{ fontSize: '0.875rem', fontWeight: 700, fontFamily: 'monospace' }}>
                      {eid?.source || 'Unknown Source'}
                    </Typography>
                    <Chip label={`EID Source`} size="small" color="primary" variant="outlined" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700 }} />
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Tooltip title="Toggle Raw EID JSON payload" arrow>
                      <IconButton size="small" onClick={() => toggleExpand(key)} color={isExpanded ? 'primary' : 'default'}>
                        <CodeIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>

                {/* UIDs list */}
                {uids.map((uid: any, index: number) => (
                  <Box
                    key={uid.id || index}
                    sx={{
                      p: 1,
                      backgroundColor: 'action.hover',
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: 'divider',
                      mb: index === uids.length - 1 ? 0 : 0.75,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                      <Box sx={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                        <Typography
                          variant="body2"
                          sx={{
                            fontFamily: 'monospace',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            wordBreak: 'break-all',
                            color: 'text.primary',
                            p: 0.5,
                            backgroundColor: 'background.paper',
                            borderRadius: 0.5,
                            border: '1px solid',
                            borderColor: 'divider',
                          }}
                        >
                          {uid?.id || '—'}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        {uid?.atype !== undefined && <Chip label={`atype: ${uid.atype}`} size="small" color="secondary" sx={{ height: 20, fontSize: '0.675rem', fontWeight: 600 }} />}

                        <Tooltip title="Copy User ID to clipboard" arrow>
                          <IconButton size="small" color="primary" onClick={() => handleCopy(uid?.id || '')}>
                            <ContentCopyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>

                    {/* UID Extension Metadata if present */}
                    {uid?.ext && Object.keys(uid.ext).length > 0 && (
                      <Box sx={{ mt: 0.75, pt: 0.75, borderTop: '1px dashed', borderColor: 'divider' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 0.25 }}>
                          Extension Metadata (ext):
                        </Typography>
                        <JSONViewerComponent src={uid.ext} name={false} collapsed={1} displayObjectSize={false} displayDataTypes={false} style={{ fontSize: '11px', fontFamily: 'monospace' }} />
                      </Box>
                    )}
                  </Box>
                ))}

                {/* Collapsible Full EID JSON */}
                <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                  <Box sx={{ mt: 1, pt: 1, borderTop: '1px dashed', borderColor: 'divider' }}>
                    <JSONViewerComponent src={eid} name={false} collapsed={false} displayObjectSize={false} displayDataTypes={false} style={{ fontSize: '11px' }} />
                  </Box>
                </Collapse>
              </CardContent>
            </Card>
          </Grid>
        );
      })}

      {/* Copy Snackbar Toast */}
      <Snackbar open={!!copiedId} autoHideDuration={2500} onClose={() => setCopiedId(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setCopiedId(null)} severity="success" sx={{ width: '100%' }}>
          User ID copied to clipboard!
        </Alert>
      </Snackbar>
    </Grid>
  );
};

export default UserIdsTab;
