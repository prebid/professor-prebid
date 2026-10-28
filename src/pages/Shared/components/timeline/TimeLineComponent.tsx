import React, { useContext, useState, useMemo } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';

import HourglassTopIcon from '@mui/icons-material/HourglassTop';

import GanttChartComponent, { TimelineViewMode } from '../../../Popup/components/timeline/GanttChartComponent';
import AppStateContext from '../../contexts/appStateContext';
import JSONViewerComponent from '../JSONViewerComponent';
import { conditionalPluralization as cP } from '../../utils';
import { getPreAuctionTimeline } from './preAuctionTimeline';
import { JsonViewToggle } from '../JsonViewToggle';
import { DownloadButton } from '../DownloadButton';
import { TabStat, TabToolbar, ToolbarButton } from '../TabToolbar';

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
      <Box sx={{ width: '100%' }}>
        <TabToolbar
          stats={[{ label: `Auction${cP(auctionEndEvents)}: ${totalAuctions}` }, { label: `${isAllAuctions ? 'Max Duration:' : 'Duration:'} ${activeDuration}ms` }, { label: `Timeout: ${timeoutMs}ms` }]}
          search={{ query, onQueryChange: setQuery, options: suggestions, fieldKeys: ['bidder'], placeholder: 'Filter bidder timeline...' }}
          actions={
            <>
              <ToolbarButton
                tooltip={
                  preAuctionDuration > 0 ? `${showPreAuction ? 'Hide' : 'Show'} the pre-auction phase — consent, user ids, real time data and first party data took ${Math.round(preAuctionDuration)}ms` : 'Prebid reported no pre-auction metrics for this auction'
                }
                onClick={() => setShowPreAuction(!showPreAuction)}
                icon={<HourglassTopIcon fontSize="inherit" />}
                color={showPreAuction ? 'secondary' : 'default'}
                disabled={preAuctionDuration <= 0}
              />
              <JsonViewToggle active={showJson} onToggle={() => setShowJson(!showJson)} formattedView="SVG Timeline view" toolbar />
              <DownloadButton data={auctionEndEvents} fileName="timeline-auctions" tooltip="Download timeline auction events as JSON" />
            </>
          }
        />

        {/* Auction switcher: scrolls sideways when there are many auctions */}
        <Box sx={{ width: '100%', display: 'flex', gap: 0.5, overflowX: 'auto', mb: 0.25, pb: 0.25 }}>
          <TabStat label={`All Auctions (${totalAuctions})`} selected={selectedTab === 0} onClick={() => setSelectedTab(0)} />
          {auctionEndEvents.map((ae, idx) => (
            <TabStat key={idx} label={`Auction #${idx + 1} (${ae.args?.auctionId?.slice(0, 8) || 'ID'})`} selected={selectedTab === idx + 1} onClick={() => setSelectedTab(idx + 1)} />
          ))}
        </Box>
      </Box>

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
