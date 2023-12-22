import React, { useContext, useState } from 'react';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Close from '@mui/icons-material/Close';
import AppStateContext from '../../contexts/appStateContext';
import showdown from 'showdown';
import moment from 'moment';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import parse from 'html-react-parser';
import { Bars } from 'react-loader-spinner';
import './PbjsVersionInfoContent.css';

const converter = new showdown.Converter();

const PbjsVersionInfoContent = ({ close }: PbjsVersionInfoContentProps): JSX.Element => {
  const { prebid, prebidReleaseInfo, setPrebidReleaseInfo } = useContext(AppStateContext);
  const [showChangeLog, setShowChangeLog] = useState<boolean>(false);

  const msToTime = (ms: number) => {
    let minutes = (ms / (1000 * 60)).toFixed(1);
    let hours = (ms / (1000 * 60 * 60)).toFixed(1);
    let days = (ms / (1000 * 60 * 60 * 24)).toFixed(1);
    let months = (ms / (1000 * 60 * 60 * 24 * 30)).toFixed(1);
    let years = (ms / (1000 * 60 * 60 * 24 * 365)).toFixed(1);
    let text = '';

    if (Number(years) >= 1) {
      text = `${years} year${Number(years) > 1 ? 's' : ''}, ${months} month${Number(months) > 1 ? 's' : ''} and ${days} day${
        Number(days) > 1 ? 's' : ''
      }`;
    } else if (Number(months) >= 1) {
      text = `${months} month${Number(months) > 1 ? 's' : ''} and ${days} day${Number(days) > 1 ? 's' : ''}`;
    } else {
      text = `${days} day${Number(days) > 1 ? 's' : ''}`;
    }

    return { years, months, days, hours, minutes, text };
  };

  const isCachedReleaseDataExpired = (cachedData: string) => {
    let result = false;

    if (Object.keys(cachedData).length > 0) {
      const data = JSON.parse(cachedData);
      const cachedTime = data[0].cached_at;
      const currentTime = Date.now();
      const differenceInMilliseconds = Math.round(currentTime - cachedTime);
      const timeElapsed = msToTime(differenceInMilliseconds);

      if (Number(timeElapsed.days) >= 1) {
        result = true;
        // console.log('cached data is expired, refreshing data from github');
      }

      // console.log(timeElapsed);
    }

    return result;
  };

  const toggleChangeLog = () => {
    setShowChangeLog(!showChangeLog);
  };

  const formatDate = (date: string) => {
    const dateObj = new Date(date);
    const month = dateObj.toLocaleString('default', { month: 'long' });
    const day = dateObj.toLocaleString('default', { day: 'numeric' });
    const year = dateObj.toLocaleString('default', { year: 'numeric' });
    return `${month} ${day}, ${year}`;
  };

  const processReleaseData = (releaseData: any[], trackingData: TrackingDataProps, page: number) => {
    const dataForCurrentUsedRelease = releaseData.find((release: ReleaseProps) => {
      const text = release.body;
      const html = converter.makeHtml(text);
      const doc = new DOMParser().parseFromString(html, 'text/html');
      release.doc = doc;
      trackingData.releasesSinceInstalledVersion.push(release);

      const newFeaturesEl = doc.getElementById('newfeatures');
      const maintenanceEl = doc.getElementById('maintenance');
      const bugfixesEl = doc.getElementById('bugfixes');
      const newFeaturesCount = newFeaturesEl?.nextElementSibling?.children.length;
      const maintenanceCount = maintenanceEl?.nextElementSibling?.children.length;
      const bugfixesCount = bugfixesEl?.nextElementSibling?.children.length;

      if (newFeaturesCount) {
        trackingData.totalNewFeaturesCount = trackingData.totalNewFeaturesCount + newFeaturesCount;
      }

      if (maintenanceCount) {
        trackingData.totalMaintenanceCount = trackingData.totalMaintenanceCount + maintenanceCount;
      }

      if (bugfixesCount) {
        trackingData.totalBugfixesCount = trackingData.totalBugfixesCount + bugfixesCount;
      }

      return `v${release.tag_name}` === prebid.version;
    });

    if (dataForCurrentUsedRelease) {
      const oldVersionPublishedAtDate = dataForCurrentUsedRelease.published_at;
      const currentDate = new Date();
      const differenceInMilliseconds = Math.round(currentDate.valueOf() - Date.parse(oldVersionPublishedAtDate));
      trackingData.timeElapsed = msToTime(differenceInMilliseconds);

      const processedReleaseInfoObj = {
        latestVersion: trackingData.releasesSinceInstalledVersion[0].tag_name,
        latestVersionPublishedAt: trackingData.releasesSinceInstalledVersion[0].published_at,
        installedVersion: prebid.version,
        installedVersionPublishedAt: oldVersionPublishedAtDate,
        timeElapsedSinceLatestVersion: trackingData.timeElapsed,
        featureCountSinceInstalledVersion: trackingData.totalNewFeaturesCount,
        maintenanceCountSinceInstalledVersion: trackingData.totalMaintenanceCount,
        bugfixCountSinceInstalledVersion: trackingData.totalBugfixesCount,
        releasesSinceInstalledVersion: trackingData.releasesSinceInstalledVersion,
      };

      setPrebidReleaseInfo(processedReleaseInfoObj);

      if (page) {
        // console.log('setting pbjsReleasesData in storage: ', trackingData.releasesSinceInstalledVersion);
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
          // console.log('Oops, something went wrong. No release data for the currently installed PBJS version was able to be found.');
        }
      }
    }
  };

  const fetchReleaseInfo = async (page: number, trackingData: any) => {
    // console.log('calling github: ', `https://api.github.com/repos/prebid/Prebid.js/releases?per_page=100&page=${page}&owner=prebid&repo=Prebid.js`);
    const response = await fetch(`https://api.github.com/repos/prebid/Prebid.js/releases?per_page=100&page=${page}&owner=prebid&repo=Prebid.js`);

    if (!response.ok) {
      const message = `An error has occured: ${response.status}`;
      throw new Error(message);
    }

    const releaseData = await response.json();

    processReleaseData(releaseData, trackingData, page);
  };

  if (prebid && prebid.version && Object.keys(prebidReleaseInfo).length === 0) {
    try {
      let dataToTrackOverIterations: TrackingDataProps = {
        totalNewFeaturesCount: 0,
        totalMaintenanceCount: 0,
        totalBugfixesCount: 0,
        timeElapsed: { text: '', years: '', months: '', days: '', hours: '', minutes: '' },
        releasesSinceInstalledVersion: [],
      };

      chrome.storage.local.get('pbjsReleasesData', (result) => {
        if (result.pbjsReleasesData && !isCachedReleaseDataExpired(result.pbjsReleasesData)) {
          // console.log('using pbjsReleasesData from storage: ', result);
          processReleaseData(JSON.parse(result.pbjsReleasesData), dataToTrackOverIterations, 0);
        } else {
          // console.log('calling the github api for pbjsReleasesData ');
          fetchReleaseInfo(1, dataToTrackOverIterations);
        }
      });
    } catch (error) {
      console.error('Failed to fetch data for PBJS releases: ', error);
    }
  }

  return (
    <React.Fragment>
      {close && (
        <Grid
          item
          sx={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            color: 'text.secondary',
          }}
          xs={12}
        >
          <IconButton sx={{ p: 0 }} onClick={() => close()}>
            <Close sx={{ fontSize: 14 }} />
          </IconButton>
        </Grid>
      )}
      <Grid className="version-info__body" item xs={7}>
        {Object.keys(prebidReleaseInfo).length > 0 ? (
          <>
            <div className="title__wrapper">
              <div className="sub-title-main__wrapper">
                {`v${prebidReleaseInfo.latestVersion}` === prebidReleaseInfo.installedVersion
                  ? (
                      <>
                        <CheckCircleOutlineIcon color="primary" />
                        <h4>You are using the latest version of Prebid.js!</h4>
                      </>
                    )
                  : (
                      <WarningAmberOutlinedIcon color="secondary" />
                    )
                }
              </div>
              <div className="sub-title__wrapper">
                <p>
                  <strong>Latest PBJS Version:</strong> v{prebidReleaseInfo.latestVersion} - <em>({formatDate(prebidReleaseInfo.latestVersionPublishedAt)})</em>
                </p>
                <p>
                  <strong>Installed PBJS Version:</strong> {prebidReleaseInfo.installedVersion} - <em>({formatDate(prebidReleaseInfo.installedVersionPublishedAt)})</em>
                </p>
              </div>
            </div>
            <div className="content__wrapper">
              {`v${prebidReleaseInfo.latestVersion}` === prebidReleaseInfo.installedVersion ? (
                <>
                  <p>
                    <strong>Details:</strong> For more information about Prebid.js releases, please visit the following link:{' '}
                    <a style={{ color: '#ff6f00' }} href="https://github.com/prebid/Prebid.js/releases" target="_blank" rel="noreferrer">
                      https://github.com/prebid/Prebid.js/releases
                    </a>
                  </p>
                </>
              ) : (
                <>
                  <p>
                    <strong>Details:</strong> {prebidReleaseInfo.installedVersion} was released{' '}
                    {moment(prebidReleaseInfo.installedVersionPublishedAt).fromNow()}. Approximately, the following number of updates have been pushed
                    since it's release:
                  </p>
                  <ul className="updates__wrapper">
                    <li>
                      <strong>New Features:</strong> {prebidReleaseInfo.featureCountSinceInstalledVersion}
                    </li>
                    <li>
                      <strong>Maintenance Updates:</strong> {prebidReleaseInfo.maintenanceCountSinceInstalledVersion}
                    </li>
                    <li>
                      <strong>Bug Fixes:</strong> {prebidReleaseInfo.bugfixCountSinceInstalledVersion}
                    </li>
                  </ul>
                  <p className="changelog__link" onClick={toggleChangeLog}>
                    View Full Release Changelog Since {prebidReleaseInfo.installedVersion}
                  </p>
                </>
              )}
            </div>
            {showChangeLog &&
              prebidReleaseInfo.releasesSinceInstalledVersion.map((version: VersionProps) => (
                <>
                  <hr />
                  <p>
                    <strong>Name:</strong> {version.name}
                  </p>
                  <p>
                    <strong>Published:</strong> {formatDate(version.published_at)}
                  </p>
                  <p>
                    <strong>URL:</strong>{' '}
                    <a style={{ color: '#ff6f00' }} href={version.html_url} target="_blank" rel="noreferrer">
                      {version.html_url}
                    </a>
                  </p>
                  <p>
                    <strong>Description:</strong> {parse(version.doc.body.innerHTML)}
                  </p>
                </>
              ))}
          </>
        ) : (
          <div className="pbjs-version-info__loader-wrapper">
            <p>Attempting to fetch data about PBJS releases..</p>
            <div className="loader">
              <Bars height="80" width="50" color="#ff6f00" ariaLabel="bars-loading" wrapperStyle={{}} wrapperClass="" visible={true} />
            </div>
          </div>
        )}
      </Grid>
    </React.Fragment>
  );
};

interface PbjsVersionInfoContentProps {
  close?: () => void | undefined;
}

interface ReleaseProps {
  published_at: any;
  doc: Document;
  body: string;
  name: string;
  tag_name: string;
  cached_at: number;
}

interface VersionProps {
  name: boolean | React.ReactChild | React.ReactFragment | React.ReactPortal;
  published_at: string;
  html_url: string;
  doc: {
    body: {
      innerHTML: string;
    };
  };
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

export default PbjsVersionInfoContent;
