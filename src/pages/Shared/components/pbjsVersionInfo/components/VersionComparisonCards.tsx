import React, { ReactNode } from 'react';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip, { ChipProps } from '@mui/material/Chip';
import Link from '@mui/material/Link';
import { timeFromNow } from '../../../utils';
import ComputerIcon from '@mui/icons-material/Computer';
import CloudDownloadOutlinedIcon from '@mui/icons-material/CloudDownloadOutlined';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import LaunchIcon from '@mui/icons-material/Launch';
import { VersionCard } from './VersionCard';

export interface VersionComparisonCardsProps {
  installedVersion: string;
  installedPublishedAt?: string;
  latestVersion: string;
  latestPublishedAt?: string;
  formatDate: (date: string) => string;
}

interface IVersionTileProps {
  title: string;
  icon: ReactNode;
  version: string;
  chip: Pick<ChipProps, 'variant' | 'color'>;
  published: string;
  publishedRelative: string;
  highlighted?: boolean;
  link?: ReactNode;
}

const VersionTile = ({ title, icon, version, chip, published, publishedRelative, highlighted = false, link }: IVersionTileProps): JSX.Element => (
  <Grid size={{ xs: 12, sm: 6 }}>
    <VersionCard highlighted={highlighted}>
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.75 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            {icon}
            <Typography variant="h3" sx={{ fontSize: '0.78rem', fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {title}
            </Typography>
          </Box>
          <Chip size="small" label={version} {...chip} sx={{ fontWeight: 700, fontSize: '0.75rem', height: 22 }} />
        </Box>

        <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '0.95rem', mb: 0.5 }}>
          Prebid.js {version}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 0.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
            <CalendarTodayOutlinedIcon sx={{ fontSize: 13 }} />
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
              Published {published} {publishedRelative ? `(${publishedRelative})` : ''}
            </Typography>
          </Box>
          {link}
        </Box>
      </Box>
    </VersionCard>
  </Grid>
);

export const VersionComparisonCards: React.FC<VersionComparisonCardsProps> = ({ installedVersion, installedPublishedAt, latestVersion, latestPublishedAt, formatDate }) => {
  const cleanInstalled = installedVersion?.startsWith('v') ? installedVersion : `v${installedVersion || ''}`;
  const cleanLatest = latestVersion?.startsWith('v') ? latestVersion : `v${latestVersion || ''}`;
  const isLatest = cleanInstalled === cleanLatest;

  const installedDateStr = installedPublishedAt ? formatDate(installedPublishedAt) : 'Unknown';
  const installedRelativeStr = installedPublishedAt ? timeFromNow(installedPublishedAt) : '';

  const latestDateStr = latestPublishedAt ? formatDate(latestPublishedAt) : 'Unknown';
  const latestRelativeStr = latestPublishedAt ? timeFromNow(latestPublishedAt) : '';

  return (
    <>
      <VersionTile
        title="Installed Version"
        icon={<ComputerIcon fontSize="small" color="primary" />}
        version={cleanInstalled}
        chip={{ variant: 'outlined', color: isLatest ? 'success' : 'default' }}
        published={installedDateStr}
        publishedRelative={installedRelativeStr}
      />
      <VersionTile
        title="Latest Available"
        icon={<CloudDownloadOutlinedIcon fontSize="small" color={isLatest ? 'success' : 'primary'} />}
        version={cleanLatest}
        chip={{ color: isLatest ? 'success' : 'primary' }}
        published={latestDateStr}
        publishedRelative={latestRelativeStr}
        highlighted={!isLatest}
        link={
          <Link
            href={`https://github.com/prebid/Prebid.js/releases/tag/${cleanLatest}`}
            target="_blank"
            rel="noreferrer"
            sx={{ display: 'flex', alignItems: 'center', gap: 0.25, fontSize: '0.75rem', fontWeight: 600, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
          >
            Release Notes <LaunchIcon sx={{ fontSize: 12 }} />
          </Link>
        }
      />
    </>
  );
};

export default VersionComparisonCards;
