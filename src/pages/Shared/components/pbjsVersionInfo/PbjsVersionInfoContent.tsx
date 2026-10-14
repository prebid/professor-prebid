import React, { useContext, useState, useEffect, useCallback } from 'react';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import AppStateContext from '../../contexts/appStateContext';
import VersionStatusHero from './components/VersionStatusHero';
import VersionComparisonCards from './components/VersionComparisonCards';
import VersionStatsSummary from './components/VersionStatsSummary';
import VersionReleaseList from './components/VersionReleaseList';

const getSectionCount = (text: string, titleStr: string) => {
  const regex = new RegExp(`(?:^|\\n)#{1,5}\\s*(?:<a[^>]*>)?(?:[^\\n]*?)${titleStr}(?:[^\\n]*?)(?:<\\/a>)?\\s*\\n([\\s\\S]*?)(?=(?:^|\\n)#{1,5}|$)`, 'i');
  const match = text.match(regex);
  if (!match) return 0;
  const listItems = match[1].match(/^[-*]\s+/gm);
  return listItems ? listItems.length : 0;
};

export interface PbjsVersionInfoContentProps {
  close?: () => void;
}

interface ReleaseProps {
  published_at: any;
  doc?: Document;
  body: string;
  name: string;
  tag_name: string;
  cached_at?: number;
}

interface TrackingDataProps {
  releasesSinceInstalledVersion: ReleaseProps[];
  totalNewFeaturesCount: number;
  totalMaintenanceCount: number;
  totalBugfixesCount: number;
  timeElapsed: {
    years: string;
    months: string;
    days: string;
    hours: string;
    minutes: string;
    text: string;
  };
}

export const PbjsVersionInfoContent: React.FC<PbjsVersionInfoContentProps> = ({ close }): JSX.Element => {
  const { prebid, prebidReleaseInfo, setPrebidReleaseInfo } = useContext(AppStateContext);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const msToTime = (ms: number) => {
    const minutes = (ms / (1000 * 60)).toFixed(1);
    const hours = (ms / (1000 * 60 * 60)).toFixed(1);
    const days = (ms / (1000 * 60 * 60 * 24)).toFixed(1);
    const months = (ms / (1000 * 60 * 60 * 24 * 30)).toFixed(1);
    const years = (ms / (1000 * 60 * 60 * 24 * 365)).toFixed(1);
    let text = '';

    if (Number(years) >= 1) {
      text = `${years} year${Number(years) > 1 ? 's' : ''}, ${months} mo`;
    } else if (Number(months) >= 1) {
      text = `${months} month${Number(months) > 1 ? 's' : ''}`;
    } else {
      text = `${days} day${Number(days) > 1 ? 's' : ''}`;
    }

    return { years, months, days, hours, minutes, text };
  };

  const isCachedReleaseDataExpired = (cachedData: string) => {
    let result = false;
    try {
      if (cachedData && Object.keys(cachedData).length > 0) {
        const data = JSON.parse(cachedData);
        if (Array.isArray(data) && data[0]?.cached_at) {
          const cachedTime = data[0].cached_at;
          const currentTime = Date.now();
          const differenceInMilliseconds = Math.round(currentTime - cachedTime);
          const timeElapsed = msToTime(differenceInMilliseconds);

          if (Number(timeElapsed.days) >= 1) {
            result = true;
          }
        }
      }
    } catch {
      result = true;
    }
    return result;
  };

  const formatDate = (date: string) => {
    try {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) return date;
      const month = dateObj.toLocaleString('default', { month: 'long' });
      const day = dateObj.toLocaleString('default', { day: 'numeric' });
      const year = dateObj.toLocaleString('default', { year: 'numeric' });
      return `${month} ${day}, ${year}`;
    } catch {
      return date;
    }
  };

  const processReleaseData = useCallback(
    (releaseData: any[], trackingData: TrackingDataProps, page: number) => {
      const installedVer = prebid?.version || '';
      const installedClean = installedVer.startsWith('v') ? installedVer : `v${installedVer}`;

      const dataForCurrentUsedRelease = releaseData.find((release: ReleaseProps) => {
        try {
          const text = release.body || '';
          trackingData.releasesSinceInstalledVersion.push(release);

          const newFeaturesCount = getSectionCount(text, 'new features');
          const maintenanceCount = getSectionCount(text, 'maintenance');
          const bugfixesCount = getSectionCount(text, 'bug fixes');

          trackingData.totalNewFeaturesCount += newFeaturesCount;
          trackingData.totalMaintenanceCount += maintenanceCount;
          trackingData.totalBugfixesCount += bugfixesCount;

          const releaseTagClean = release.tag_name?.startsWith('v') ? release.tag_name : `v${release.tag_name}`;
          return releaseTagClean === installedClean || release.tag_name === installedVer;
        } catch {
          return false;
        }
      });

      if (dataForCurrentUsedRelease && trackingData.releasesSinceInstalledVersion.length > 0) {
        const oldVersionPublishedAtDate = dataForCurrentUsedRelease.published_at;
        const currentDate = new Date();
        const differenceInMilliseconds = Math.round(currentDate.valueOf() - Date.parse(oldVersionPublishedAtDate));
        trackingData.timeElapsed = msToTime(differenceInMilliseconds);

        const latestRel = trackingData.releasesSinceInstalledVersion[0];
        const processedReleaseInfoObj = {
          latestVersion: latestRel.tag_name,
          latestVersionPublishedAt: latestRel.published_at,
          installedVersion: prebid?.version,
          installedVersionPublishedAt: oldVersionPublishedAtDate,
          timeElapsedSinceLatestVersion: trackingData.timeElapsed,
          featureCountSinceInstalledVersion: trackingData.totalNewFeaturesCount,
          maintenanceCountSinceInstalledVersion: trackingData.totalMaintenanceCount,
          bugfixCountSinceInstalledVersion: trackingData.totalBugfixesCount,
          releasesSinceInstalledVersion: trackingData.releasesSinceInstalledVersion,
        };

        setPrebidReleaseInfo(processedReleaseInfoObj);
        setIsRefreshing(false);
        setFetchError(null);

        if (page && chrome?.storage?.local) {
          trackingData.releasesSinceInstalledVersion[0].cached_at = Date.now();
          chrome.storage.local.set({ pbjsReleasesData: JSON.stringify(trackingData.releasesSinceInstalledVersion) });
        }
      } else {
        if (page && releaseData.length === 100) {
          fetchReleaseInfo(page + 1, trackingData);
        } else {
          if (!page) {
            fetchReleaseInfo(1, {
              totalNewFeaturesCount: 0,
              totalMaintenanceCount: 0,
              totalBugfixesCount: 0,
              timeElapsed: { text: '', years: '', months: '', days: '', hours: '', minutes: '' },
              releasesSinceInstalledVersion: [],
            });
          } else {
            setIsRefreshing(false);
            setFetchError('No release data found on GitHub for the current Prebid.js version.');
          }
        }
      }
    },
    [prebid?.version, setPrebidReleaseInfo]
  );

  const fetchReleaseInfo = useCallback(
    async (page: number, trackingData: any) => {
      try {
        setIsRefreshing(true);
        const response = await fetch(
          `https://api.github.com/repos/prebid/Prebid.js/releases?per_page=100&page=${page}&owner=prebid&repo=Prebid.js`
        );

        if (!response.ok) {
          setIsRefreshing(false);
          setFetchError(`GitHub API returned status ${response.status}`);
          return;
        }

        const releaseData = await response.json();
        processReleaseData(releaseData, trackingData, page);
      } catch (error: any) {
        setIsRefreshing(false);
        setFetchError(error?.message || 'Failed to fetch Prebid.js releases');
      }
    },
    [processReleaseData]
  );

  const loadReleaseData = useCallback(
    (force = false) => {
      if (!prebid?.version) return;

      const dataToTrackOverIterations: TrackingDataProps = {
        totalNewFeaturesCount: 0,
        totalMaintenanceCount: 0,
        totalBugfixesCount: 0,
        timeElapsed: { text: '', years: '', months: '', days: '', hours: '', minutes: '' },
        releasesSinceInstalledVersion: [],
      };

      if (!force && chrome?.storage?.local) {
        chrome.storage.local.get('pbjsReleasesData', (result) => {
          if (result?.pbjsReleasesData && !isCachedReleaseDataExpired(result.pbjsReleasesData)) {
            try {
              processReleaseData(JSON.parse(result.pbjsReleasesData), dataToTrackOverIterations, 0);
            } catch {
              fetchReleaseInfo(1, dataToTrackOverIterations);
            }
          } else {
            fetchReleaseInfo(1, dataToTrackOverIterations);
          }
        });
      } else {
        fetchReleaseInfo(1, dataToTrackOverIterations);
      }
    },
    [prebid?.version, processReleaseData, fetchReleaseInfo]
  );

  useEffect(() => {
    if (prebid?.version && (!prebidReleaseInfo || Object.keys(prebidReleaseInfo).length === 0)) {
      loadReleaseData(false);
    }
  }, [prebid?.version, prebidReleaseInfo, loadReleaseData]);

  const hasReleaseInfo = prebidReleaseInfo && Object.keys(prebidReleaseInfo).length > 0;
  const isLatest =
    hasReleaseInfo &&
    (prebidReleaseInfo.latestVersion === prebidReleaseInfo.installedVersion ||
      `v${prebidReleaseInfo.latestVersion}` === prebidReleaseInfo.installedVersion ||
      prebidReleaseInfo.latestVersion === `v${prebidReleaseInfo.installedVersion}`);

  const releasesList = prebidReleaseInfo?.releasesSinceInstalledVersion || [];

  return (
    <Grid container spacing={0.75} sx={{ width: '100%', p: 0.5 }}>
      {/* Optional Top Close Bar (when rendered inside a modal/popover) */}
      {close && (
        <Grid size={{ xs: 12 }} sx={{ display: 'flex', justifyContent: 'flex-end', mb: -0.5 }}>
          <IconButton size="small" onClick={close} sx={{ p: 0.5 }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Grid>
      )}

      {/* Loading state */}
      {!hasReleaseInfo && !fetchError && (
        <Grid size={{ xs: 12 }}>
          <Paper
            elevation={1}
            sx={{
              p: 4,
              border: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
            }}
          >
            <CircularProgress size={36} color="primary" />
            <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
              Attempting to fetch data about PBJS releases..
            </Typography>
          </Paper>
        </Grid>
      )}

      {/* Error state */}
      {fetchError && !hasReleaseInfo && (
        <Grid size={{ xs: 12 }}>
          <Alert
            severity="warning"
            action={
              <Button color="inherit" size="small" onClick={() => loadReleaseData(true)}>
                Retry
              </Button>
            }
          >
            {fetchError}
          </Alert>
        </Grid>
      )}

      {/* Loaded Version Information Content */}
      {hasReleaseInfo && (
        <>
          {/* Hero Banner with Status & Quick Actions */}
          <Grid size={{ xs: 12 }}>
            <VersionStatusHero
              installedVersion={prebidReleaseInfo.installedVersion || prebid?.version || ''}
              latestVersion={prebidReleaseInfo.latestVersion || ''}
              releasesCount={Math.max(0, releasesList.length - 1)}
              onRefresh={() => loadReleaseData(true)}
              isRefreshing={isRefreshing}
            />
          </Grid>

          {/* Installed vs Latest Side-by-Side Comparison (2 direct Grid items) */}
          <VersionComparisonCards
            installedVersion={prebidReleaseInfo.installedVersion || prebid?.version || ''}
            installedPublishedAt={prebidReleaseInfo.installedVersionPublishedAt}
            latestVersion={prebidReleaseInfo.latestVersion || ''}
            latestPublishedAt={prebidReleaseInfo.latestVersionPublishedAt}
            formatDate={formatDate}
          />

          {/* If an update is available: 4 direct KPI metric cards + release changelog */}
          {!isLatest && (
            <>
              <VersionStatsSummary
                newFeaturesCount={prebidReleaseInfo.featureCountSinceInstalledVersion || 0}
                maintenanceCount={prebidReleaseInfo.maintenanceCountSinceInstalledVersion || 0}
                bugfixesCount={prebidReleaseInfo.bugfixCountSinceInstalledVersion || 0}
                timeElapsedText={(prebidReleaseInfo as any).timeElapsedSinceLatestVersion?.text || ''}
              />

              {releasesList.length > 0 && (
                <Grid size={{ xs: 12 }}>
                  <VersionReleaseList
                    releases={releasesList}
                    installedVersion={prebidReleaseInfo.installedVersion || prebid?.version || ''}
                    formatDate={formatDate}
                  />
                </Grid>
              )}
            </>
          )}

          {/* If already running the latest version: Helpful quick links */}
          {isLatest && (
            <Grid size={{ xs: 12 }}>
              <Paper elevation={1} sx={{ p: 1.5, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="h3" sx={{ fontSize: '0.8rem', fontWeight: 700, mb: 0.5, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Resources & Documentation
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Stay up to date with the latest Prebid.js documentation, releases, and discussions:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Button
                    size="small"
                    variant="outlined"
                    href="https://docs.prebid.org"
                    target="_blank"
                    rel="noreferrer"
                    sx={{ fontSize: '0.75rem', textTransform: 'none', fontWeight: 600, py: 0.25 }}
                  >
                    Prebid.org Docs
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    href="https://github.com/prebid/Prebid.js/releases"
                    target="_blank"
                    rel="noreferrer"
                    sx={{ fontSize: '0.75rem', textTransform: 'none', fontWeight: 600, py: 0.25 }}
                  >
                    GitHub Releases
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    href="https://github.com/prebid/Prebid.js/issues"
                    target="_blank"
                    rel="noreferrer"
                    sx={{ fontSize: '0.75rem', textTransform: 'none', fontWeight: 600, py: 0.25 }}
                  >
                    Issue Tracker
                  </Button>
                </Box>
              </Paper>
            </Grid>
          )}
        </>
      )}
    </Grid>
  );
};

export default PbjsVersionInfoContent;
