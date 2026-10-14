import React, { useContext, useState, useMemo } from 'react';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';

import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import CodeIcon from '@mui/icons-material/Code';
import DownloadIcon from '@mui/icons-material/Download';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';

import GanttChartComponent, { TimelineViewMode } from '../../../Popup/components/timeline/GanttChartComponent';
import AppStateContext from '../../contexts/appStateContext';
import { GridCell } from '../bids/BidsComponent';
import JSONViewerComponent from '../JSONViewerComponent';
import { AutoComplete } from '../autocomplete/AutoComplete';
import { replaceLastToken } from '../autocomplete/utils';
import { download, conditionalPluralization as cP } from '../../utils';
import { getPreAuctionTimeline } from './preAuctionTimeline';

const TimeLineComponent = (): JSX.Element => {
  const { prebid, auctionEndEvents } = useContext(AppStateContext);

  const [selectedTab, setSelectedTab] = useState(0);
  const [query, setQuery] = useState('');
  const [showJson, setShowJson] = useState(false);
  const [showPreAuction, setShowPreAuction] = useState(false);

  const { events, config } = prebid || {};
  const timeoutMs = config?.bidderTimeout || 3000;

  const suggestions = useMemo(() => {
    const set = new Set<string>();
    set.add('bidder:');
    (auctionEndEvents || []).forEach((ae) => {
      (ae.args?.bidderRequests || []).forEach((br: any) => {
        if (br.bidderCode) set.add(`bidder:${br.bidderCode.toLowerCase()}`);
      });
    });
    return Array.from(set).sort();
  }, [auctionEndEvents]);

  if (!events || events.length === 0 || !auctionEndEvents || auctionEndEvents.length === 0) {
    return (
      <Grid container sx={{ width: '100%', height: '100%', flex: 1 }}>
        <Grid size={{ xs: 12 }}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>No auction timeline events detected on this page.</Paper>
        </Grid>
      </Grid>
    );
  }

  const totalAuctions = auctionEndEvents.length;
  const isAllAuctions = selectedTab === 0;
  const mode: TimelineViewMode = isAllAuctions ? 'stacked' : 'single';
  const activeAuctionIndex = isAllAuctions ? 0 : selectedTab - 1;
  const activeAuction = auctionEndEvents[activeAuctionIndex] || auctionEndEvents[0];

  const activeDuration = isAllAuctions
    ? Math.max(
        ...auctionEndEvents.map((ae) => {
          const { auctionEnd, timestamp } = ae?.args || {};
          return auctionEnd && timestamp ? auctionEnd - timestamp : 0;
        })
      )
    : activeAuction?.args?.auctionEnd && activeAuction?.args?.timestamp
    ? activeAuction.args.auctionEnd - activeAuction.args.timestamp
    : 0;

  // What prebid spent on consent, user ids, real time data and first party data before bidding started
  const preAuctionDuration = isAllAuctions ? Math.max(0, ...auctionEndEvents.map((ae) => getPreAuctionTimeline(ae, config)?.duration ?? 0)) : getPreAuctionTimeline(activeAuction, config)?.duration ?? 0;

  return (
    <Grid container sx={{ width: '100%', height: '100%', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {/* Header Bar */}
      <Grid container size={{ xs: 12 }} sx={{ mb: 0.5 }}>
        <GridCell cols={1.7} variant="h2" sx={{ border: 0, whiteSpace: 'nowrap', '& span': { whiteSpace: 'nowrap' } }}>
          Auction{cP(auctionEndEvents)}: {totalAuctions}
        </GridCell>

        <GridCell cols={2.8} variant="h2" sx={{ border: 0, whiteSpace: 'nowrap', '& span': { whiteSpace: 'nowrap' } }}>
          {isAllAuctions ? 'Max Duration:' : 'Duration:'} {activeDuration}ms
        </GridCell>

        <GridCell cols={2} variant="h2" sx={{ border: 0, whiteSpace: 'nowrap', '& span': { whiteSpace: 'nowrap' } }}>
          Timeout: {timeoutMs}ms
        </GridCell>

        {/* Search Bar */}
        <Grid size={{ xs: 4 }} sx={{ display: 'flex', alignItems: 'center', border: 0, '& .MuiInputBase-input': { paddingLeft: '4px !important', paddingTop: '4px !important' } }}>
          <AutoComplete fieldKeys={['bidder']} options={suggestions} onPick={(opt) => setQuery((cur) => replaceLastToken(cur, opt))} onQueryChange={setQuery} placeholder="Filter bidder timeline..." query={query} />
        </Grid>

        {/* Pre-Auction Toggle Button */}
        <GridCell cols={0.5} sx={{ display: 'flex', alignItems: 'center', border: 0 }}>
          <Tooltip
            title={
              preAuctionDuration > 0 ? `${showPreAuction ? 'Hide' : 'Show'} the pre-auction phase — consent, user ids, real time data and first party data took ${Math.round(preAuctionDuration)}ms` : 'Prebid reported no pre-auction metrics for this auction'
            }
            arrow
          >
            <span>
              <IconButton size="small" disabled={preAuctionDuration <= 0} onClick={() => setShowPreAuction(!showPreAuction)} color={showPreAuction ? 'secondary' : 'default'} sx={{ p: 0.5, fontSize: '1.05rem', height: 'auto' }}>
                <HourglassTopIcon fontSize="inherit" />
              </IconButton>
            </span>
          </Tooltip>
        </GridCell>

        {/* JSON Toggle Button */}
        <GridCell cols={0.5} sx={{ display: 'flex', alignItems: 'center', border: 0 }}>
          <Tooltip title={showJson ? 'Switch to SVG Timeline view' : 'Switch to raw JSON view'} arrow>
            <IconButton size="small" onClick={() => setShowJson(!showJson)} color={showJson ? 'primary' : 'default'} sx={{ p: 0.5, fontSize: '1.05rem', height: 'auto' }}>
              <CodeIcon fontSize="inherit" />
            </IconButton>
          </Tooltip>
        </GridCell>

        {/* Download Button */}
        <GridCell cols={0.5} sx={{ display: 'flex', alignItems: 'center', border: 0 }}>
          <Tooltip title="Download timeline auction events as JSON" arrow>
            <IconButton size="small" onClick={() => download(auctionEndEvents, 'timeline-auctions')} sx={{ p: 0.5, fontSize: '1.05rem', height: 'auto' }}>
              <DownloadIcon fontSize="inherit" />
            </IconButton>
          </Tooltip>
        </GridCell>

        {/* Auction Sub-Tabs Header - Removes disabled left scroll button gap */}
        <Grid size={{ xs: 12 }} sx={{ mb: 0.5 }}>
          <Tabs
            value={selectedTab}
            onChange={(_, val) => setSelectedTab(val)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              minHeight: 32,
              '& .MuiTabs-indicator': { display: 'none' },
              '& .MuiTabScrollButton-root': {
                width: '16px',
                '&.Mui-disabled': {
                  width: 0,
                  minWidth: 0,
                  display: 'none',
                },
              },
              'svg[data-testid="KeyboardArrowRightIcon"],svg[data-testid="KeyboardArrowLeftIcon"]': {
                fill: 'rgba(0, 0, 0, 0.6)',
              },
            }}
          >
            <Tab
              sx={{ padding: '0px 3px 0px 0px', minWidth: 'initial', minHeight: 32 }}
              label={
                <Button
                  size="small"
                  variant={selectedTab === 0 ? 'contained' : 'outlined'}
                  onClick={() => setSelectedTab(0)}
                  sx={{ py: 0.25, px: 1, textTransform: 'none', fontSize: '0.75rem', fontWeight: 600, backgroundColor: selectedTab === 0 ? undefined : 'background.paper' }}
                >
                  ALL AUCTIONS ({totalAuctions})
                </Button>
              }
            />
            {auctionEndEvents.map((ae, idx) => {
              const tabIdx = idx + 1;
              const isSelected = selectedTab === tabIdx;
              return (
                <Tab
                  key={idx}
                  sx={{ padding: '0px 3px', minWidth: 'initial', minHeight: 32 }}
                  label={
                    <Button
                      size="small"
                      variant={isSelected ? 'contained' : 'outlined'}
                      onClick={() => setSelectedTab(tabIdx)}
                      sx={{ py: 0.25, px: 1, textTransform: 'none', fontSize: '0.75rem', fontWeight: 600, backgroundColor: isSelected ? undefined : 'background.paper' }}
                    >
                      Auction #{idx + 1} ({ae.args?.auctionId?.slice(0, 8) || 'ID'})
                    </Button>
                  }
                />
              );
            })}
          </Tabs>
        </Grid>
      </Grid>

      {/* Content View: JSON or SVG Gantt Chart */}
      {showJson ? (
        <Grid size={{ xs: 12 }} sx={{ flex: 1 }}>
          <JSONViewerComponent src={isAllAuctions ? auctionEndEvents : activeAuction} name="auctions" collapsed={3} />
        </Grid>
      ) : (
        <GanttChartComponent auctionEndEvent={activeAuction} auctionEndEvents={auctionEndEvents} mode={mode} query={query} showPreAuction={showPreAuction} />
      )}
    </Grid>
  );
};

export default TimeLineComponent;
