import { Tooltip, IconButton, SxProps } from '@mui/material';
import React from 'react';
import AppsIcon from '@mui/icons-material/Apps';
import { GridCell } from './BidRowComponent';

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
