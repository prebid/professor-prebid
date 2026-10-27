import React, { useState, useMemo } from 'react';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Button from '@mui/material/Button';
import SearchIcon from '@mui/icons-material/Search';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import UnfoldLessIcon from '@mui/icons-material/UnfoldLess';
import VersionReleaseItem from './VersionReleaseItem';

export interface VersionReleaseListProps {
  releases: any[];
  installedVersion: string;
  formatDate: (date: string) => string;
}

export const VersionReleaseList: React.FC<VersionReleaseListProps> = ({ releases = [], installedVersion, formatDate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>({});

  const filteredReleases = useMemo(() => {
    if (!searchQuery.trim()) return releases;
    const q = searchQuery.toLowerCase().trim();
    return releases.filter((release) => {
      const tagMatch = release.tag_name?.toLowerCase().includes(q);
      const nameMatch = typeof release.name === 'string' && release.name.toLowerCase().includes(q);
      const bodyMatch = typeof release.body === 'string' && release.body.toLowerCase().includes(q);
      return tagMatch || nameMatch || bodyMatch;
    });
  }, [releases, searchQuery]);

  const allExpanded = useMemo(() => {
    if (filteredReleases.length === 0) return false;
    return filteredReleases.every((r) => expandedMap[r.tag_name || r.name]);
  }, [filteredReleases, expandedMap]);

  const toggleAll = () => {
    const nextState = !allExpanded;
    const newMap: Record<string, boolean> = {};
    filteredReleases.forEach((r) => {
      newMap[r.tag_name || r.name] = nextState;
    });
    setExpandedMap(newMap);
  };

  const toggleRelease = (key: string) => {
    setExpandedMap((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <Paper elevation={1} sx={{ p: 1.25, border: '1px solid', borderColor: 'divider' }}>
      {}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'stretch', sm: 'center' },
          justifyContent: 'space-between',
          gap: 1,
          mb: 1.25,
        }}
      >
        <Box>
          <Typography
            variant="h3"
            sx={{
              fontSize: '0.85rem',
              fontWeight: 700,
              color: 'text.secondary',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Release Changelog ({releases.length} release{releases.length === 1 ? '' : 's'} since {installedVersion})
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Review features, fixes, and changes introduced across intermediate releases.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TextField
            size="small"
            placeholder="Filter changelog..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
              sx: { fontSize: '0.75rem', height: 28, minWidth: { xs: '100%', sm: 180 } },
            }}
          />

          {filteredReleases.length > 0 && (
            <Button
              size="small"
              variant="outlined"
              onClick={toggleAll}
              startIcon={allExpanded ? <UnfoldLessIcon fontSize="small" /> : <UnfoldMoreIcon fontSize="small" />}
              sx={{ fontSize: '0.75rem', textTransform: 'none', fontWeight: 600, py: 0.25, px: 1, whiteSpace: 'nowrap' }}
            >
              {allExpanded ? 'Collapse All' : 'Expand All'}
            </Button>
          )}
        </Box>
      </Box>

      {}
      <Box sx={{ mt: 1 }}>
        {filteredReleases.length === 0 ? (
          <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: 'action.hover', border: '1px dashed', borderColor: 'divider' }}>
            <Typography variant="body2" color="text.secondary">
              No releases match "{searchQuery}"
            </Typography>
          </Paper>
        ) : (
          filteredReleases.map((release) => {
            const key = release.tag_name || (typeof release.name === 'string' ? release.name : Math.random().toString());
            return <VersionReleaseItem key={key} version={release} expanded={Boolean(expandedMap[key])} onToggle={() => toggleRelease(key)} formatDate={formatDate} />;
          })
        )}
      </Box>
    </Paper>
  );
};

export default VersionReleaseList;
