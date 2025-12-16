import React, { useMemo, useState, useCallback, useEffect, useContext } from 'react';
import Grid from '@mui/material/Grid';
import { IconButton, Paper, Tooltip, Typography } from '@mui/material';
import { replaceLastToken } from '../autocomplete/utils';
import { AutoComplete } from '../autocomplete/AutoComplete';
import DownloadIcon from '@mui/icons-material/Download';
import { download } from '../../utils';
import { Bid } from 'prebid.js/types.d.ts';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { SxProps } from '@mui/material';
import AppsIcon from '@mui/icons-material/Apps';
import JSONViewerComponent from '../JSONViewerComponent';
import BidsComponentState, { getBidKey } from './BidsComponentState';

export const BidsComponent = (): JSX.Element => {
  const { globalOpen, toggleGlobalOpen, query, setQuery, sort, toggleSort, counts, suggestions, sortedBids, filteredBids, BID_FIELD_MAP } = BidsComponentState();

  return (
    <Grid container sx={{ width: '100%' }}>
      <GridCell cols={1.5} variant="h2" sx={{ border: 0, cursor: 'pointer' }} onClick={() => setQuery('')}>
        All ({counts.all})
      </GridCell>

      <GridCell cols={2} variant="h2" sx={{ border: 0, cursor: 'pointer' }} onClick={() => setQuery('cpm>0')}>
        Received ({counts.received})
      </GridCell>

      <GridCell cols={2} variant="h2" sx={{ border: 0, cursor: 'pointer' }} onClick={() => setQuery('cpm=0')}>
        No Bids ({counts.nobid})
      </GridCell>

      <Grid size={{ xs: 6 }} sx={{ display: 'flex', alignItems: 'center', border: 0, '& .MuiInputBase-input': { paddingLeft: '4px !important', paddingTop: '4px !important' } }}>
        <AutoComplete fieldKeys={Object.keys(BID_FIELD_MAP) as string[]} options={suggestions} onPick={(opt) => setQuery((cur) => replaceLastToken(cur, opt))} onQueryChange={setQuery} placeholder="Filter bids..." query={query} />
      </Grid>
      <GridCell cols={0.5} sx={{ display: 'flex', alignItems: 'center', border: 0 }}>
        <Tooltip title="Download filtered bids as JSON" arrow>
          <IconButton size="small" onClick={() => download(sortedBids, 'filtered-bids')} sx={{ p: 0.5, fontSize: '1.05rem', height: 'auto' }}>
            <DownloadIcon fontSize="inherit" />
          </IconButton>
        </Tooltip>
      </GridCell>
      {sortedBids.length === 0 ? (
        <Grid size={{ xs: 12 }}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>No matching bids</Paper>
        </Grid>
      ) : (
        <>
          <HeaderRow globalOpen={globalOpen} toggleGlobalOpen={toggleGlobalOpen} sort={sort} onSort={toggleSort} />
          {sortedBids.map((bid) => (
            <BidRowComponent key={getBidKey(bid)} bid={bid} globalOpen={globalOpen} />
          ))}
        </>
      )}
    </Grid>
  );
};

export const GridCell = ({ children, cols = 1, sx, variant, ...rest }: { children: React.ReactNode; cols?: number; sx?: SxProps; variant?: 'h2' | 'body1' | 'body2'; [key: string]: any }) => (
  <Grid size={{ xs: cols }} sx={sx} {...rest}>
    <Paper sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Typography sx={{ p: 0.5, width: '100%' }} variant={variant || 'body1'} component="div" align="center">
        {children}
      </Typography>
    </Paper>
  </Grid>
);

const useRowExpand = (globalOpen?: boolean) => {
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(globalOpen ?? false), [globalOpen]);
  const toggle = useCallback(() => setOpen((prev) => !prev), []);
  return { open, toggle } as const;
};

const truncate = (text?: string, length = 30): string => (text && text.length > length ? `${text.substring(0, length)}…` : text ?? '');

const formatCpm = (cpm?: number): string => (Number.isFinite(cpm) && typeof cpm === 'number' ? `${Math.round(cpm * 100) / 100}` : 'no cpm');

const displaySize = (bid: Bid): string => (bid as any).size ?? (bid.width && bid.height ? `${bid.width} x ${bid.height}` : 'no size');

const ExpandedRowComponent = React.memo(({ bid }: { bid: Bid }) => (
  <>
    <Grid size={{ xs: 0.62 }} />
    <Grid size={{ xs: 11.38 }}>
      <Paper sx={{ width: '100%', height: '100%' }}>
        <JSONViewerComponent src={bid} />
      </Paper>
    </Grid>
  </>
));

export const BidRowComponent = React.memo(({ bid, globalOpen }: { bid: Bid; globalOpen?: boolean }) => {
  const { open, toggle } = useRowExpand(globalOpen);

  return (
    <>
      <GridCell sx={IconCellStyles} cols={0.62}>
        <Tooltip title={open ? 'Collapse' : 'Expand'}>
          <IconButton size="small" onClick={toggle} aria-label={open ? 'collapse row' : 'expand row'} aria-expanded={open}>
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </Tooltip>
      </GridCell>
      <GridCell cols={2.38}>{bid.bidder}</GridCell>
      <GridCell cols={1}>{formatCpm(bid.cpm)}</GridCell>
      <GridCell cols={2}>{bid.currency || 'no currency'}</GridCell>
      <GridCell cols={3}>{truncate(bid.adUnitCode, 30)}</GridCell>
      <GridCell cols={1}>{displaySize(bid)}</GridCell>
      <GridCell cols={2}>{bid.mediaType || 'no mediaType'}</GridCell>
      {open && <ExpandedRowComponent bid={bid} />}
    </>
  );
});

export const IconCellStyles: SxProps = {
  justifyContent: 'center',
  '& div > p > svg': { fontSize: 15 },
  '& div ': { display: 'flex', justifyContent: 'center', alignContent: 'center' },
};

const HEADERS: ReadonlyArray<{ label: string; cols: number; key: string }> = Object.freeze([
  { label: 'Bidder Code', cols: 2.38, key: 'bidder' },
  { label: 'CPM', cols: 1, key: 'cpm' },
  { label: 'Currency', cols: 2, key: 'currency' },
  { label: 'AdUnit Code', cols: 3, key: 'adUnitCode' },
  { label: 'Size', cols: 1, key: 'size' },
  { label: 'Media Type', cols: 2, key: 'mediaType' },
]);

export const HeaderRow = React.memo(({ globalOpen, toggleGlobalOpen, sort, onSort }: { globalOpen: boolean; toggleGlobalOpen: () => void; sort: { key: string; dir: 'asc' | 'desc' }; onSort: (key: string) => void }) => (
  <>
    <GridCell cols={0.62} sx={IconCellStyles}>
      <Tooltip title={globalOpen ? 'Collapse all' : 'Expand all'}>
        <IconButton size="small" onClick={toggleGlobalOpen} aria-label={globalOpen ? 'collapse all rows' : 'expand all rows'}>
          <AppsIcon />
        </IconButton>
      </Tooltip>
    </GridCell>
    {HEADERS.map((h) => (
      <GridCell key={h.label} variant="h2" cols={h.cols} sx={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => onSort(h.key)} role="columnheader" aria-sort={sort.key === h.key ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
        <Tooltip title={`Sort by ${h.label}`}>
          <span>
            {h.label}
            {sort.key === h.key ? (sort.dir === 'asc' ? ' ▲' : ' ▼') : ''}
          </span>
        </Tooltip>
      </GridCell>
    ))}
  </>
));

export default BidsComponent;
