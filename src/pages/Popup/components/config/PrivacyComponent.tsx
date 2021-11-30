import React from 'react';
import { IPrebidDetails } from '../../../../inject/scripts/prebid';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { ITcfDetails } from '../../../../inject/scripts/tcf';
import { TCString } from '@iabtcf/core';
import TextField from '@mui/material/TextField';
import Checkbox from '@mui/material/Checkbox';
import logger from '../../../../logger';

const PrivacyComponent = ({ prebid, tcf }: IPrivacyComponentProps): JSX.Element => {
  logger.log(`[PopUp][PriceGranularityComponent]: render `, tcf);
  return (
    <Box sx={{ width: '100%', padding: '5px 5px 5px 25px' }}>
      <Typography>
        <strong>Allow Auction Without Consent: </strong>
        {JSON.stringify(prebid?.config?.consentManagement?.allowAuctionWithoutConsent)}
      </Typography>
      <Typography>
        <strong>CMP api:</strong>
        {prebid?.config?.consentManagement?.cmpApi ? prebid?.config?.consentManagement?.cmpApi : prebid?.config?.consentManagement?.gdpr?.cmpApi}
      </Typography>
      <Typography>
        <strong>Default GDPR Scope:</strong>
        {JSON.stringify(
          prebid?.config?.consentManagement?.defaultGdprScope
            ? prebid?.config?.consentManagement?.defaultGdprScope
            : prebid?.config?.consentManagement?.gdpr?.defaultGdprScope
        )}
      </Typography>
      <Typography>
        <strong>Timeout:</strong>
        {prebid?.config?.consentManagement?.timeout ? prebid?.config?.consentManagement?.timeout : prebid?.config?.consentManagement?.gdpr?.timeout}
      </Typography>
      {Object.keys(tcf).map((key, index) => (
        <Box key={index}>
          <Typography>
            <strong>Version:</strong> {key}
          </Typography>
          <Typography>
            <strong>CMP Loaded: </strong> <Checkbox checked={tcf[key].cmpLoaded}></Checkbox>
          </Typography>
          <Box sx={{ paddingBottom: 1 }}>
            <TextField
              label="Consent Data:"
              multiline
              variant="outlined"
              value={tcf[key].consentData ? tcf[key].consentData : 'no consent string found'}
              sx={{ width: 1 }}
            />
          </Box>
          <Box sx={{ paddingBottom: 1 }}>
            <TextField
              label="Decoded Data: "
              multiline
              value={tcf[key].consentData ? JSON.stringify(TCString.decode(tcf[key].consentData, null), null, 4) : 'no consent string found'}
              sx={{ width: 1 }}
            />
          </Box>
        </Box>
      ))}
    </Box>
  );
};

interface IPrivacyComponentProps {
  prebid: IPrebidDetails;
  tcf: ITcfDetails;
}

export default PrivacyComponent;
