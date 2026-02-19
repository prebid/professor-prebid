import React, { useContext } from 'react';
import Typography from '@mui/material/Typography';
import SettingsApplicationsIcon from '@mui/icons-material/SettingsApplications';
import RenderKeyValueComponent from '../../RenderKeyValueComponent';
import AppStateContext from '../../../contexts/appStateContext';
import { ExpandableTile } from './ExpandableTile';

const BidderSettingsComponent = (): JSX.Element | null => {
  const { prebid } = useContext(AppStateContext);
  const { bidderSettings } = prebid;

  if (!bidderSettings) return null;

  return (
    <ExpandableTile icon={<SettingsApplicationsIcon />} title="Bidder Settings" subtitle="LocalStorageAccess" defaultMaxWidth={4} expandedMaxWidth={8}>
      <RenderKeyValueComponent
        label="StorageAccess: "
        value={
          <>
            {Object.keys(bidderSettings)
              .filter((bidder) => bidderSettings[bidder].storageAllowed !== undefined)
              .map((bidder) => (
                <Typography key={bidder} variant="body1">
                  {bidder}: {String(bidderSettings[bidder].storageAllowed)}
                </Typography>
              ))}
          </>
        }
        expanded={true}
        columns={[6, 12]}
      />
    </ExpandableTile>
  );
};

export default BidderSettingsComponent;
