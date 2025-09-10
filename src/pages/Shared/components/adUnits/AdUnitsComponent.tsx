import React, { useContext, useMemo } from 'react';
import Grid from '@mui/material/Grid';
import { AdUnitsGridComponent } from './grid/AdUnitsGridComponent';
import { conditionalPluralization as cP } from '../../utils';
import AdUnitsComponentState from './AdUnitsComponentState';
import { Tooltip, IconButton } from '@mui/material';
import AppStateContext from '../../contexts/appStateContext';
import { AutoComplete } from '../autocomplete/AutoComplete';
import { GridCell } from '../bids/BidRowComponent';
import PbjsVersionInfoPopOver from '../pbjsVersionInfo/PbjsVersionInfoPopOver';
import DownloadIcon from '@mui/icons-material/Download';
import { download } from '../../utils';
import { createQueryEngine, distinct, getWidthXHeightStringFromBid, NUMERIC_FIELD_KEYS, replaceLastToken } from '../autocomplete/utils';
import { IPrebidAdUnit } from '../../../Injected/prebid';

const adUnitFirstSize = (adUnit: IPrebidAdUnit): [number, number] | null => (Array.isArray(adUnit?.sizes) && adUnit.sizes[0]?.length === 2 ? [adUnit.sizes[0][0], adUnit.sizes[0][1]] : null);

const adUnitSizeStr = (adUnit: IPrebidAdUnit): string => {
  const s = adUnitFirstSize(adUnit);
  return s ? `${s[0]}x${s[1]}` : '';
};

const adUnitAllSizesStr = (adUnit: IPrebidAdUnit): string =>
  Array.isArray(adUnit?.sizes)
    ? adUnit.sizes
        .filter((size: any) => Array.isArray(size) && size.length === 2)
        .map((size: number[]) => `${size[0]}x${size[1]}`)
        .join(',')
    : '';

const ADUNIT_FIELD_MAP = {
  code: (adUnit: IPrebidAdUnit) => adUnit?.code,
  adunitcode: (adUnit: IPrebidAdUnit) => adUnit?.code,

  size: (adUnit: IPrebidAdUnit) => adUnitSizeStr(adUnit),
  sizes: (adUnit: IPrebidAdUnit) => adUnitAllSizesStr(adUnit),
  width: (adUnit: IPrebidAdUnit) => adUnitFirstSize(adUnit)?.[0],
  height: (adUnit: IPrebidAdUnit) => adUnitFirstSize(adUnit)?.[1],

  mediatypes: (adUnit: IPrebidAdUnit) => adUnit?.mediaTypes,
  mediatype: (adUnit: IPrebidAdUnit): string => (adUnit?.mediaTypes ? Object.keys(adUnit.mediaTypes).join(',') : ''),

  bids: (adUnit: IPrebidAdUnit) => adUnit?.bids?.length ?? 0,
  bidders: (adUnit: IPrebidAdUnit) =>
    Array.isArray(adUnit?.bids)
      ? adUnit.bids
          .map((b: any) => b?.bidder)
          .filter(Boolean)
          .join(',')
      : '',

  gpid: (adUnit: IPrebidAdUnit) => adUnit?.ortb2Imp?.ext?.gpid,

  adunitid: (adUnit: any) => adUnit?.adUnitId,
  transactionid: (adUnit: any) => adUnit?.transactionId,
} as const;

const adUnitsQueryEngine = (() => createQueryEngine<any>(ADUNIT_FIELD_MAP))();

const buildAdUnitSuggestions = (adUnits: IPrebidAdUnit[]): string[] => {
  const keySuggestions = (Object.keys(ADUNIT_FIELD_MAP) as string[]).map((key) => `${key}:`);
  const numericStubs = (NUMERIC_FIELD_KEYS as readonly string[]).flatMap((key) => [`${key}>`, `${key}>=`, `${key}<`, `${key}<=`, `${key}=`]);
  const bidders = distinct(adUnits.flatMap((adUnit) => (Array.isArray(adUnit?.bids) ? adUnit.bids.map((b: any) => (b?.bidder ? `bidder:${String(b.bidder)}` : undefined)) : [])));
  const mediaTypes = distinct(adUnits.flatMap((adUnit) => (Array.isArray(adUnit?.bids) ? adUnit.bids.map((b: any) => (b?.mediaType ? `mediatype:${String(b.mediaType)}` : undefined)) : [])));
  const currencies = distinct(adUnits.flatMap((adUnit) => (Array.isArray(adUnit?.bids) ? adUnit.bids.map((b: any) => (b?.currency ? `currency:${String(b.currency)}` : undefined)) : [])));
  const adUnitsCodes = distinct(adUnits.map((adUnit) => (adUnit?.code ? `code:${String(adUnit.code)}` : undefined)));
  const sizes = distinct(
    adUnits.flatMap((adUnit) =>
      Array.isArray(adUnit?.bids)
        ? adUnit.bids.map((bid: any) => {
            const s = getWidthXHeightStringFromBid(bid);
            return s ? `size:${s}` : undefined;
          })
        : []
    )
  );
  return Array.from(new Set<string>([...keySuggestions, ...numericStubs, ...bidders, ...mediaTypes, ...currencies, ...adUnitsCodes, ...sizes])).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
};

const AdUnitsComponent = (): JSX.Element => {
  const { adUnits, query, setQuery, setPbjsVersionPopUpOpen, pbjsVersionPopUpOpen } = AdUnitsComponentState();
  const { prebid, allBidderEvents, allAdUnitCodes } = useContext(AppStateContext);
  const suggestions = useMemo(() => buildAdUnitSuggestions(adUnits as any[]), [adUnits]);
  const filteredAdUnits = useMemo(() => adUnits.filter(adUnitsQueryEngine.runQuery(query)), [adUnits, query]);
  return (
    <Grid container justifyContent="space-between">
      <GridCell cols={2} variant="h2" sx={{ border: 0, cursor: 'pointer' }} onClick={() => setPbjsVersionPopUpOpen(true)}>
        <Tooltip title="Click for more info" children={<>Version: {prebid.version}</>} />
      </GridCell>

      {/* <GridCell cols={2} variant="h2" sx={{ border: 0, cursor: 'pointer' }}>
        Timeout: {prebid.config?.bidderTimeout}
      </GridCell> */}

      <GridCell cols={1.5} variant="h2">
        AdUnit{cP(allAdUnitCodes)}: {allAdUnitCodes.length}
      </GridCell>

      <GridCell cols={1.5} variant="h2">
        Bidder{cP(allBidderEvents)}: {allBidderEvents.length}
      </GridCell>

      {/* <GridCell
        cols={1.5}
        variant="h2"
        onClick={() => {
          setSelectedTab(2);
        }}
        sx={{ border: 0, cursor: 'pointer' }}
      >
        <Tooltip
          title="Click for more info"
          children={
            <>
              Event{cP(events)}: {events?.length}
            </>
          }
        />
      </GridCell> */}

      <Grid size={{ xs: 6.5 }} sx={{ display: 'flex', alignItems: 'center', border: 0, '& .MuiInputBase-input': { paddingLeft: '4px !important', paddingTop: '4px !important' } }}>
        <AutoComplete query={query} fieldKeys={Object.keys(ADUNIT_FIELD_MAP) as string[]} options={suggestions} onPick={(opt) => setQuery((cur) => replaceLastToken(cur, opt))} onQueryChange={setQuery} placeholder="Filter Ad Units..." />
      </Grid>

      <GridCell cols={0.5} sx={{ display: 'flex', alignItems: 'center', border: 0 }}>
        <Tooltip title="Download filtered bids as JSON" arrow>
          <IconButton size="small" onClick={() => download(adUnits, 'filtered adunits')} sx={{ p: 0.5, fontSize: '1.05rem', height: 'auto' }}>
            <DownloadIcon fontSize="inherit" />
          </IconButton>
        </Tooltip>
      </GridCell>

      <PbjsVersionInfoPopOver pbjsVersionPopUpOpen={pbjsVersionPopUpOpen} setPbjsVersionPopUpOpen={setPbjsVersionPopUpOpen} />

      {filteredAdUnits.length === 0 ? (
        <GridCell cols={12} variant="body1">
          No matching adunits
        </GridCell>
      ) : (
        <AdUnitsGridComponent adUnits={filteredAdUnits} />
      )}
    </Grid>
  );
};

export default AdUnitsComponent;
