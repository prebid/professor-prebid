import React from 'react';
import Grid from '@mui/material/Grid';
import { AdUnitsGridComponent } from './grid/AdUnitsGridComponent';
import { conditionalPluralization as cP } from '../../utils';
import AdUnitsComponentState from './AdUnitsComponentState';
import { Tooltip, IconButton } from '@mui/material';
import { AutoComplete } from '../autocomplete/AutoComplete';
import { GridCell } from '../bids/BidRowComponent';
import PbjsVersionInfoPopOver from '../pbjsVersionInfo/PbjsVersionInfoPopOver';
import DownloadIcon from '@mui/icons-material/Download';
import { download } from '../../utils';
import { replaceLastToken } from '../autocomplete/utils';

const AdUnitsComponent = (): JSX.Element => {
  const { adUnits, query, setQuery, setPbjsVersionPopUpOpen, pbjsVersionPopUpOpen, filteredAdUnits, suggestions, prebid, allBidderEvents, allAdUnitCodes, ADUNIT_FIELD_MAP } = AdUnitsComponentState();
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
