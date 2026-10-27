import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import Tooltip from '@mui/material/Tooltip';
import { IClassifiedNetworkEntry } from './networkClassifier';
import { buildNetworkTree, INetworkTreeNode } from './initiatorTree';

export interface NetworkCascadeViewProps {
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

interface TreeNodeRowProps {
  node: INetworkTreeNode;
  selectedEntry: IClassifiedNetworkEntry | null;
  onSelectEntry: (entry: IClassifiedNetworkEntry) => void;
}

const TreeNodeRow = ({ node, selectedEntry, onSelectEntry }: TreeNodeRowProps): JSX.Element => {
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const isSelected = selectedEntry?.entry.id === node.entry.entry.id;
  const hasChildren = node.children.length > 0;

  const relationChip =
    node.relation === 'redirect' ? (
      <Chip label="Redirect ➔" size="small" color="info" variant="outlined" sx={{ height: 18, fontSize: '0.6rem' }} />
    ) : node.relation === 'initiator' ? (
      <Chip label="Initiated ➔" size="small" color="warning" variant="outlined" sx={{ height: 18, fontSize: '0.6rem' }} />
    ) : (
      <Chip label="Root" size="small" variant="filled" sx={{ height: 18, fontSize: '0.6rem' }} />
    );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      <Box
        onClick={() => onSelectEntry(node.entry)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          py: 0.75,
          px: 1,
          pl: Math.min(10, node.depth) * 2.5 + 1,
          borderBottom: 1,
          borderColor: 'divider',
          cursor: 'pointer',
          backgroundColor: isSelected ? 'action.selected' : 'inherit',
          '&:hover': { backgroundColor: 'action.hover' },
        }}
      >
        {hasChildren ? (
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              setCollapsed(!collapsed);
            }}
            sx={{ p: 0.25 }}
          >
            {collapsed ? <ChevronRightIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
          </IconButton>
        ) : (
          <Box sx={{ width: 24 }} />
        )}

        {relationChip}

        <Chip label={node.entry.entry.status || '0'} size="small" color={getStatusColor(node.entry.entry.status)} sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700 }} />

        <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>
          {node.entry.entry.method}
        </Typography>

        <Tooltip title={node.entry.entry.url} arrow placement="top-start">
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, flex: 1, minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
              {node.entry.entry.host}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                fontFamily: 'monospace',
                fontSize: '0.7rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {node.entry.entry.pathname}
            </Typography>
          </Box>
        </Tooltip>

        <Chip label={node.entry.categoryLabel} size="small" color={node.entry.categoryColor} sx={{ height: 18, fontSize: '0.6rem' }} />

        {node.entry.providerName && <Chip label={node.entry.providerName} size="small" variant="outlined" sx={{ height: 18, fontSize: '0.6rem' }} />}

        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, minWidth: 50, textAlign: 'right' }}>
          {Math.round(node.entry.entry.time)} ms
        </Typography>
      </Box>

      {hasChildren && !collapsed && (
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          {node.children.map((child) => (
            <TreeNodeRow key={child.id} node={child} selectedEntry={selectedEntry} onSelectEntry={onSelectEntry} />
          ))}
        </Box>
      )}
    </Box>
  );
};

export const NetworkCascadeView = ({ entries, selectedEntry, onSelectEntry }: NetworkCascadeViewProps): JSX.Element => {
  const [rootFilter, setRootFilter] = useState<string>('');
  const treeNodes = buildNetworkTree(entries, rootFilter);

  return (
    <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 1, overflow: 'hidden' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
        <TextField size="small" placeholder="Filter tree cascade by Root URL, Domain or Provider (e.g. adnxs.com or /getuid)..." value={rootFilter} onChange={(e) => setRootFilter(e.target.value)} sx={{ flex: 1 }} />
        {rootFilter && <Chip label="Clear Filter" size="small" onClick={() => setRootFilter('')} sx={{ cursor: 'pointer' }} />}
      </Box>

      {treeNodes.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', mt: 1 }}>
          <Typography variant="body1" color="text.secondary">
            No initiator or redirect chains match the filter.
          </Typography>
        </Paper>
      ) : (
        <Paper variant="outlined" sx={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
          {treeNodes.map((node) => (
            <TreeNodeRow key={node.id} node={node} selectedEntry={selectedEntry} onSelectEntry={onSelectEntry} />
          ))}
        </Paper>
      )}
    </Box>
  );
};
