import React from 'react';
import Grid from '@mui/material/Grid';
import { AdUnitsGridComponent } from './AdUnitsGridComponent';
import { conditionalPluralization as cP } from '../../utils';
import AdUnitsComponentState from './AdUnitsComponentState';
import PbjsVersionInfoPopOver from '../pbjsVersionInfo/PbjsVersionInfoPopOver';
import { DownloadButton } from '../DownloadButton';
import { TabEmptyState, TabToolbar } from '../TabToolbar';

interface AdUnitsHeaderProps {
  prebid: any;
  allAdUnitCodes: string[];
  allBidderEvents: any[];
  query: string;
  setQuery: (q: string | ((prev: string) => string)) => void;
  suggestions: any[];
  ADUNIT_FIELD_MAP: any;
  setPbjsVersionPopUpOpen: (open: boolean) => void;
  pbjsVersionPopUpOpen: boolean;
  filteredAdUnits: any[];
}

const AdUnitsHeader = ({ prebid, allAdUnitCodes, allBidderEvents, query, setQuery, suggestions, ADUNIT_FIELD_MAP, setPbjsVersionPopUpOpen, pbjsVersionPopUpOpen, filteredAdUnits }: AdUnitsHeaderProps): JSX.Element => {
  return (
    <React.Fragment>
      <TabToolbar
        stats={[
          { label: `Version: ${prebid.version}`, onClick: () => setPbjsVersionPopUpOpen(true), tooltip: 'Click for more info' },
          { label: `AdUnit${cP(allAdUnitCodes)}: ${allAdUnitCodes.length}` },
          { label: `Bidder${cP(allBidderEvents)}: ${allBidderEvents.length}` },
        ]}
        search={{ query, onQueryChange: setQuery, options: suggestions, fieldKeys: Object.keys(ADUNIT_FIELD_MAP), placeholder: 'Filter Ad Units...' }}
        actions={<DownloadButton data={filteredAdUnits} fileName="filtered adunits" tooltip="Download filtered ad units as JSON" />}
      />

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

      {filteredAdUnits.length === 0 ? <TabEmptyState>No matching ad units</TabEmptyState> : <AdUnitsGridComponent adUnits={filteredAdUnits} />}
    </Grid>
  );
};

export default AdUnitsComponent;
