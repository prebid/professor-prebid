import React from 'react';
import Grid from '@mui/material/Grid';
import { AdUnitsGridComponent } from './AdUnitsGridComponent';
import { conditionalPluralization as cP } from '../../utils';
import AdUnitsComponentState from './AdUnitsComponentState';
import { Tooltip, IconButton } from '@mui/material';
import { AutoComplete } from '../autocomplete/AutoComplete';
import { GridCell } from '../bids/BidRowComponent';
import PbjsVersionInfoPopOver from '../pbjsVersionInfo/PbjsVersionInfoPopOver';
import DownloadIcon from '@mui/icons-material/Download';
import { download } from '../../utils';
import { replaceLastToken } from '../autocomplete/utils';

interface AdUnitsHeaderProps {
  prebid: any;
  allAdUnitCodes: string[];
  allBidderEvents: any[];
  query: string;
  setQuery: (q: string | ((prev: string) => string)) => void;
  suggestions: any[]; // Adjust type if possible
  ADUNIT_FIELD_MAP: any;
  setPbjsVersionPopUpOpen: (open: boolean) => void;
  pbjsVersionPopUpOpen: boolean;
  adUnits: any[];
}

const AdUnitsHeader = ({ prebid, allAdUnitCodes, allBidderEvents, query, setQuery, suggestions, ADUNIT_FIELD_MAP, setPbjsVersionPopUpOpen, pbjsVersionPopUpOpen, adUnits }: AdUnitsHeaderProps): JSX.Element => {
  return (
    <React.Fragment>
      <GridCell cols={2} variant="h2" sx={{ border: 0, cursor: 'pointer' }} onClick={() => setPbjsVersionPopUpOpen(true)}>
        <Tooltip title="Click for more info" children={<>Version: {prebid.version}</>} />
      </GridCell>

      <GridCell cols={1.5} variant="h2">
        AdUnit{cP(allAdUnitCodes)}: {allAdUnitCodes.length}
      </GridCell>

      <GridCell cols={1.5} variant="h2">
        Bidder{cP(allBidderEvents)}: {allBidderEvents.length}
      </GridCell>

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
    </React.Fragment>
  );
};

const AdUnitsComponent = (): JSX.Element => {
  const state = AdUnitsComponentState();
  const { filteredAdUnits } = state;

  return (
    <Grid container justifyContent="space-between">
      <AdUnitsHeader {...state} />

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
