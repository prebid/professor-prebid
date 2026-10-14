import React, { useState } from 'react';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import RefreshIcon from '@mui/icons-material/Refresh';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

export interface VersionStatusHeroProps {
  installedVersion: string;
  latestVersion: string;
  releasesCount: number;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export const VersionStatusHero: React.FC<VersionStatusHeroProps> = ({ installedVersion, latestVersion, releasesCount, onRefresh, isRefreshing = false }) => {
  const [copied, setCopied] = useState(false);

  const cleanInstalled = installedVersion.startsWith('v') ? installedVersion : `v${installedVersion}`;
  const cleanLatest = latestVersion.startsWith('v') ? latestVersion : `v${latestVersion}`;
  const isLatest = cleanInstalled === cleanLatest;

  const handleCopy = () => {
    const summary = isLatest ? `Prebid.js ${cleanInstalled} (Up to date)` : `Prebid.js installed: ${cleanInstalled}, latest: ${cleanLatest} (${releasesCount} release${releasesCount === 1 ? '' : 's'} behind)`;

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(summary).catch(() => {});
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Paper
      elevation={1}
      sx={{
        p: 1.25,
        border: '1px solid',
        borderColor: isLatest ? 'success.light' : 'warning.light',
        backgroundColor: 'background.paper',
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { xs: 'flex-start', sm: 'center' },
        justifyContent: 'space-between',
        gap: 1.25,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
        {isLatest ? <CheckCircleOutlineIcon color="success" sx={{ fontSize: 30 }} /> : <WarningAmberOutlinedIcon color="warning" sx={{ fontSize: 30 }} />}
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
            <Typography variant="h3" sx={{ fontSize: '0.9rem', fontWeight: 700 }}>
              Prebid.js
            </Typography>
            <Chip
              size="small"
              label={isLatest ? 'Up to date' : 'Update available'}
              color={isLatest ? 'success' : 'warning'}
              sx={{
                fontWeight: 700,
                fontSize: '0.72rem',
                height: 22,
                px: 0.25,
                color: isLatest ? '#fff' : '#fff',
                backgroundColor: isLatest ? 'success.main' : 'warning.main',
              }}
            />
            {!isLatest && (
              <Chip
                size="small"
                label={`${releasesCount} release${releasesCount === 1 ? '' : 's'} behind`}
                variant="outlined"
                color="warning"
                sx={{
                  fontWeight: 600,
                  fontSize: '0.7rem',
                  height: 22,
                  backgroundColor: 'rgba(237, 108, 2, 0.08)',
                  borderColor: 'warning.light',
                }}
              />
            )}
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25, fontSize: '0.75rem' }}>
            {isLatest ? `Currently running ${cleanInstalled}. All latest features and bug fixes are present.` : `Currently running ${cleanInstalled}. Upgrade to ${cleanLatest} to receive the latest features & fixes.`}
          </Typography>
        </Box>
      </Box>

      {/* Action buttons */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, alignSelf: { xs: 'flex-end', sm: 'center' } }}>
        <Tooltip title={copied ? 'Copied to clipboard!' : 'Copy version summary'} arrow>
          <IconButton size="small" onClick={handleCopy} sx={{ border: '1px solid', borderColor: 'divider', p: 0.5 }}>
            {copied ? <CheckIcon fontSize="small" color="success" /> : <ContentCopyIcon fontSize="small" />}
          </IconButton>
        </Tooltip>

        <Tooltip title="Check GitHub for release updates" arrow>
          <span>
            <IconButton size="small" onClick={onRefresh} disabled={isRefreshing} sx={{ border: '1px solid', borderColor: 'divider', p: 0.5 }}>
              <RefreshIcon fontSize="small" sx={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }} />
            </IconButton>
          </span>
        </Tooltip>

        <Tooltip title="Open Prebid.js GitHub Releases page" arrow>
          <Button
            size="small"
            variant="outlined"
            href="https://github.com/prebid/Prebid.js/releases"
            target="_blank"
            rel="noreferrer"
            endIcon={<OpenInNewIcon sx={{ fontSize: '0.85rem !important' }} />}
            sx={{ fontSize: '0.75rem', textTransform: 'none', fontWeight: 600, py: 0.25, px: 1 }}
          >
            Releases
          </Button>
        </Tooltip>
      </Box>
    </Paper>
  );
};

export default VersionStatusHero;
