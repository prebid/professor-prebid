import { Paper, Tooltip, IconButton, Typography } from '@mui/material';
import React, { useState, useEffect, useCallback } from 'react';
import { Grid, SxProps } from '@mui/system';
import { IPrebidBid } from '../../../Injected/prebid';
import JSONViewerComponent from '../JSONViewerComponent';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { IconCellStyles } from './HeaderRow';

export const GridCell = ({ children, cols = 1, sx, variant, ...rest }: { children: React.ReactNode; cols?: number; sx?: SxProps; variant?: 'h2' | 'body1' | 'body2'; [key: string]: any }) => (
  <Grid size={{ xs: cols }} sx={sx} {...rest}>
    <Paper sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Typography sx={{ p: 0.5 }} variant={variant || 'body1'}>
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

const jsonViewerProps = {
  collapsed: 3,
  displayObjectSize: false,
  displayDataTypes: false,
  sortKeys: false,
  quotesOnKeys: false,
  indentWidth: 2,
  collapseStringsAfterLength: 100,
  style: { fontSize: '12px', fontFamily: 'roboto' },
};

const truncate = (text?: string, length = 30): string => (text && text.length > length ? `${text.substring(0, length)}…` : text ?? '');

const formatCpm = (cpm?: number): string => (Number.isFinite(cpm) && typeof cpm === 'number' ? `${Math.round(cpm * 100) / 100}` : 'no cpm');

const displaySize = (bid: IPrebidBid): string => (bid as any).size ?? (bid.width && bid.height ? `${bid.width} x ${bid.height}` : 'no size');

const ExpandedRowComponent = React.memo(({ bid }: { bid: IPrebidBid }) => (
  <>
    <Grid size={{ xs: 0.62 }} />
    <Grid size={{ xs: 11.38 }}>
      <Paper sx={{ width: '100%', height: '100%' }}>
        <JSONViewerComponent src={bid} {...jsonViewerProps} />
      </Paper>
    </Grid>
  </>
));

export const BidRowComponent = React.memo(({ bid, globalOpen }: { bid: IPrebidBid; globalOpen?: boolean }) => {
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
