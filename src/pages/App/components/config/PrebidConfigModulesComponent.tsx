import React from 'react';
import { IPrebidDetails } from "../../../../inject/scripts/prebid";
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';

const PrebidConfigModulesComponent = ({ prebid }: PrebidConfigModulesComponentProps): JSX.Element => {
  return (
    <Box>
      <Box>
        {/* Floors  */}
        {prebid.config.floors && <Typography><strong>Floors:</strong></Typography>}
        {prebid.config.floors?.data?.skipRate && <Typography><strong>Skip Rate:</strong> {prebid.config?.floors?.data?.skipRate}</Typography>}
        {prebid.config.floors?.data?.currency && <Typography><strong>Currency:</strong> {prebid.config?.floors?.data?.currency}</Typography>}
        {prebid.config.floors?.data?.schema?.fields && <Typography><strong>Schema/Field:</strong></Typography>}
        {prebid.config.floors?.data?.schema?.fields && <List>{prebid.config.floors.data.schema.fields.map((field: string, index: number) => <ListItem key={index}>{field}</ListItem>)}</List>}
        {prebid.config.floors?.data?.values && <Typography><strong>Values:</strong></Typography>}
        {prebid.config.floors?.data?.values && <List>
          {Object.keys(prebid.config.floors.data.values).map(
            (key: any, index: number) => <ListItem key={index}>{key}: {prebid.config.floors.data.values[key]}</ListItem>
          )}</List>}
        {prebid.config.floors?.floorsSchemaVersion && <Typography><strong>floorsSchemaVersion:</strong> {prebid.config?.floors?.floorsSchemaVersion}</Typography>}
      </Box>

      <Box>
        {/* GDPR*/}
        {prebid.config.consentManagement?.gdpr && <Typography><strong>GDPR:</strong></Typography>}
        {prebid.config.consentManagement?.gdpr?.cmpApi && <Typography><strong>CmpApi:</strong> {prebid.config.consentManagement.gdpr.cmpApi}</Typography>}
        {prebid.config.consentManagement?.gdpr?.timeout && <Typography><strong>Timeout:</strong> {prebid.config.consentManagement.gdpr.timeout}</Typography>}
        {prebid.config.consentManagement?.gdpr?.defaultGdprScope && <Typography><strong>defaultGdprScope:</strong> {JSON.stringify(prebid.config.consentManagement.gdpr.defaultGdprScope)}</Typography>}
        {prebid.config.consentManagement?.gdpr?.allowAuctionWithoutConsent && <Typography><strong>allowAuctionWithoutConsent:</strong> {prebid.config.consentManagement.gdpr.allowAuctionWithoutConsent}</Typography>}
      </Box>

      <Box>
        {/* GDPR Enforcement*/}
        {prebid.config.consentManagement?.gdpr?.rules && <Typography><strong>GDPR Enforcement:</strong></Typography>}
        {prebid.config.consentManagement?.gdpr?.rules && <Typography><strong>Rules:</strong> {prebid.config.consentManagement.gdpr.cmpApi}</Typography>}
        {prebid.config.consentManagement?.gdpr?.rules &&
          <List>
            {Object.keys(prebid.config.consentManagement.gdpr.rules).map(
              (key: any, index: number) => <ListItem key={index}>{key}: {prebid.config.consentManagement.gdpr.rules[key]}</ListItem>
            )}
          </List>
        }
      </Box>

      <Box>
        {/* US Privacy*/}
        {prebid.config.consentManagement?.usp && <Typography><strong>USP:</strong></Typography>}
        {prebid.config.consentManagement?.usp?.cmpApi && <Typography><strong>CmpApi:</strong> {prebid.config.consentManagement.usp.cmpApi}</Typography>}
        {prebid.config.consentManagement?.usp?.timeout && <Typography><strong>Timeout:</strong> {prebid.config.consentManagement.usp.timeout}</Typography>}
      </Box>

      <Box>
        {/* First Party Data Enrichment Module */}
        {prebid.config.firstPartyData && <Typography><strong>firstPartyData:</strong></Typography>}
        {prebid.config.firstPartyData?.skipEnrichments && <Typography><strong>skipEnrichments:</strong> {JSON.stringify(prebid.config.firstPartyData.skipEnrichments)}</Typography>}
      </Box>

      <Box>
        {/* GPT Pre-Auction Module */}
        {prebid.config.gptPreAuction && <Typography><strong>gptPreAuction:</strong></Typography>}
        {prebid.config.gptPreAuction?.enabled && <Typography><strong>enabled:</strong> {JSON.stringify(prebid.config.gptPreAuction.enabled)}</Typography>}
        {prebid.config.gptPreAuction?.mcmEnabled && <Typography><strong>mcmEnabled:</strong> {JSON.stringify(prebid.config.gptPreAuction.mcmEnabled)}</Typography>}
      </Box>

    </Box>
  );
}

interface PrebidConfigModulesComponentProps {
  prebid: IPrebidDetails
}

export default PrebidConfigModulesComponent;
