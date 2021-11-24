import React from 'react';
import { IPrebidDetails } from '../../../../inject/scripts/prebid';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import ReactJson from 'react-json-view';

const ModulesComponent = ({ prebid }: IModulesComponentProps): JSX.Element => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'row', columnGap: '5px', rowGap: '5px', flexWrap: 'wrap', paddingLeft: '5px' }}>
      {prebid.config.floors && (
        <Card sx={{ minWidth: '200px' }}>
          <CardHeader title="Floors" />
          <CardContent>
            {prebid.config.floors?.skipRate && (
              <Typography>
                <strong>Skip Rate:</strong> {prebid.config?.floors?.skipRate}
              </Typography>
            )}
            {prebid.config.floors?.currency && (
              <Typography>
                <strong>Currency:</strong> {prebid.config?.floors?.currency}
              </Typography>
            )}
            {prebid.config.floors?.schema?.fields && (
              <Typography>
                <strong>Schema/Field:</strong>
              </Typography>
            )}
            {prebid.config.floors?.schema?.fields && (
              <List dense={true}>
                {prebid.config.floors.schema.fields.map((field: string, index: number) => (
                  <ListItem key={index}>{field}</ListItem>
                ))}
              </List>
            )}
            {prebid.config.floors?.values && (
              <Typography>
                <strong>Values:</strong>
              </Typography>
            )}
            {prebid.config.floors?.values && (
              <List dense={true}>
                {Object.keys(prebid.config.floors.values).map((key, index) => (
                  <ListItem key={index}>
                    {key}: {prebid.config.floors.values[key]}
                  </ListItem>
                ))}
              </List>
            )}
            {prebid.config.floors?.floorsSchemaVersion && (
              <Typography>
                <strong>floorsSchemaVersion:</strong> {prebid.config?.floors?.floorsSchemaVersion}
              </Typography>
            )}
          </CardContent>
        </Card>
      )}

      {prebid.config.consentManagement?.gdpr && (
        <Card sx={{ maxWidth: '200px' }}>
          <CardHeader title="GDPR" />
          <CardContent>
            {prebid.config.consentManagement?.gdpr?.cmpApi && (
              <Typography>
                <strong>CmpApi:</strong> {prebid.config.consentManagement.gdpr.cmpApi}
              </Typography>
            )}
            {prebid.config.consentManagement?.gdpr?.timeout && (
              <Typography>
                <strong>Timeout:</strong> {prebid.config.consentManagement.gdpr.timeout}
              </Typography>
            )}
            {prebid.config.consentManagement?.gdpr?.defaultGdprScope && (
              <Typography>
                <strong>defaultGdprScope:</strong> {JSON.stringify(prebid.config.consentManagement.gdpr.defaultGdprScope)}
              </Typography>
            )}
            {prebid.config.consentManagement?.gdpr?.allowAuctionWithoutConsent && (
              <Typography>
                <strong>allowAuctionWithoutConsent:</strong> {prebid.config.consentManagement.gdpr.allowAuctionWithoutConsent}
              </Typography>
            )}
          </CardContent>
        </Card>
      )}

      {prebid.config.consentManagement?.gdpr?.rules && (
        <Card sx={{ maxWidth: '200px' }}>
          <CardHeader title="GDPR Enforcement" />
          <CardContent>
            {prebid.config.consentManagement?.gdpr?.rules && (
              <React.Fragment>
                {prebid.config.consentManagement.gdpr.rules.map((rule: any, index) => (
                  <List dense={true}>
                    <Typography>
                      <strong>Rules #{index}</strong>
                    </Typography>
                    {Object.keys(rule).map((key, index) => (
                      <ListItem key={index}>
                        {key}: {String(rule[key])}
                      </ListItem>
                    ))}
                  </List>
                ))}
              </React.Fragment>
            )}
          </CardContent>
        </Card>
      )}

      {prebid.config.consentManagement?.usp && (
        <Card sx={{ maxWidth: '200px' }}>
          <CardHeader title="USP" />
          <CardContent>
            {prebid.config.consentManagement?.usp?.cmpApi && (
              <Typography>
                <strong>CmpApi:</strong> {prebid.config.consentManagement.usp.cmpApi}
              </Typography>
            )}
            {prebid.config.consentManagement?.usp?.timeout && (
              <Typography>
                <strong>Timeout:</strong> {prebid.config.consentManagement.usp.timeout}
              </Typography>
            )}
          </CardContent>
        </Card>
      )}

      {prebid.config.firstPartyData && (
        <Card sx={{ maxWidth: '200px' }}>
          <CardHeader title="First Party Data Enrichment" />
          <CardContent>
            {prebid.config.firstPartyData?.skipEnrichments && (
              <Typography>
                <strong>skipEnrichments: </strong> {JSON.stringify(prebid.config.firstPartyData.skipEnrichments)}
              </Typography>
            )}
          </CardContent>
        </Card>
      )}

      {prebid.config.gptPreAuction && (
        <Card sx={{ maxWidth: '200px' }}>
          <CardHeader title="GPT Pre-Auction" />
          <CardContent>
            {prebid.config.gptPreAuction?.enabled && (
              <Typography>
                <strong>enabled: </strong> {JSON.stringify(prebid.config.gptPreAuction.enabled)}
              </Typography>
            )}
            {prebid.config.gptPreAuction?.mcmEnabled && (
              <Typography>
                <strong>mcmEnabled: </strong> {JSON.stringify(prebid.config.gptPreAuction.mcmEnabled)}
              </Typography>
            )}
          </CardContent>
        </Card>
      )}

      {prebid.config?.userSync?.userIds && prebid.config?.userSync?.userIds[0] && (
        <Card sx={{ maxWidth: '100%' }}>
          <CardHeader title="User Ids" />
          <CardContent>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Storage Type</TableCell>
                    <TableCell>Storage Expires</TableCell>
                    <TableCell>Storage Name</TableCell>
                    <TableCell>Params</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {prebid.config?.userSync?.userIds?.map((userId, index) => (
                    <TableRow key={index} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      <TableCell>
                        <strong>{userId.name}</strong>
                      </TableCell>
                      <TableCell>{userId.storage?.type}</TableCell>
                      <TableCell>{userId.storage?.expires}</TableCell>
                      <TableCell>{userId.storage?.name}</TableCell>
                      <TableCell>
                        <ReactJson
                          src={userId.params}
                          name={false}
                          collapsed={1}
                          enableClipboard={false}
                          displayObjectSize={false}
                          displayDataTypes={false}
                          sortKeys={false}
                          quotesOnKeys={false}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

interface IModulesComponentProps {
  prebid: IPrebidDetails;
}

export default ModulesComponent;
