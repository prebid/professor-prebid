import React from 'react';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Link from '@mui/material/Link';
import { timeFromNow } from '../../../utils';
import ComputerIcon from '@mui/icons-material/Computer';
import CloudDownloadOutlinedIcon from '@mui/icons-material/CloudDownloadOutlined';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import LaunchIcon from '@mui/icons-material/Launch';

export interface VersionComparisonCardsProps {
  installedVersion: string;
  installedPublishedAt?: string;
  latestVersion: string;
  latestPublishedAt?: string;
  formatDate: (date: string) => string;
}

export const VersionComparisonCards: React.FC<VersionComparisonCardsProps> = ({
  installedVersion,
  installedPublishedAt,
  latestVersion,
  latestPublishedAt,
  formatDate,
}) => {
  const cleanInstalled = installedVersion?.startsWith('v') ? installedVersion : `v${installedVersion || ''}`;
  const cleanLatest = latestVersion?.startsWith('v') ? latestVersion : `v${latestVersion || ''}`;
  const isLatest = cleanInstalled === cleanLatest;

  const installedDateStr = installedPublishedAt ? formatDate(installedPublishedAt) : 'Unknown';
  const installedRelativeStr = installedPublishedAt ? timeFromNow(installedPublishedAt) : '';

  const latestDateStr = latestPublishedAt ? formatDate(latestPublishedAt) : 'Unknown';
  const latestRelativeStr = latestPublishedAt ? timeFromNow(latestPublishedAt) : '';

  return (
    <>
      {/* Installed Version Tile */}
      <Grid size={{ xs: 12, sm: 6 }}>
        <Paper
          elevation={1}
          sx={{
            p: 1.25,
            border: '1px solid',
            borderColor: 'divider',
            backgroundColor: 'background.paper',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxSizing: 'border-box',
          }}
        >
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.75 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <ComputerIcon fontSize="small" color="primary" />
                <Typography variant="h3" sx={{ fontSize: '0.78rem', fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Installed Version
                </Typography>
              </Box>
              <Chip
                size="small"
                label={cleanInstalled}
                variant="outlined"
                color={isLatest ? 'success' : 'default'}
                sx={{ fontWeight: 700, fontSize: '0.75rem', height: 22 }}
              />
            </Box>

            <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '0.95rem', mb: 0.5 }}>
              Prebid.js {cleanInstalled}
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
              <CalendarTodayOutlinedIcon sx={{ fontSize: 13 }} />
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                Published {installedDateStr} {installedRelativeStr ? `(${installedRelativeStr})` : ''}
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Grid>

      {/* Latest Available Tile */}
      <Grid size={{ xs: 12, sm: 6 }}>
        <Paper
          elevation={1}
          sx={{
            p: 1.25,
            border: '1px solid',
            borderColor: isLatest ? 'divider' : 'primary.main',
            backgroundColor: 'background.paper',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxSizing: 'border-box',
          }}
        >
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.75 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <CloudDownloadOutlinedIcon fontSize="small" color={isLatest ? 'success' : 'primary'} />
                <Typography variant="h3" sx={{ fontSize: '0.78rem', fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Latest Available
                </Typography>
              </Box>
              <Chip
                size="small"
                label={cleanLatest}
                color={isLatest ? 'success' : 'primary'}
                sx={{ fontWeight: 700, fontSize: '0.75rem', height: 22 }}
              />
            </Box>

            <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '0.95rem', mb: 0.5 }}>
              Prebid.js {cleanLatest}
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 0.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                <CalendarTodayOutlinedIcon sx={{ fontSize: 13 }} />
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                  Published {latestDateStr} {latestRelativeStr ? `(${latestRelativeStr})` : ''}
                </Typography>
              </Box>

              <Link
                href={`https://github.com/prebid/Prebid.js/releases/tag/${cleanLatest}`}
                target="_blank"
                rel="noreferrer"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.25,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                Release Notes <LaunchIcon sx={{ fontSize: 12 }} />
              </Link>
            </Box>
          </Box>
        </Paper>
      </Grid>
    </>
  );
};

export default VersionComparisonCards;
