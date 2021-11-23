import React from 'react';
import { IPrebidAuctionEndEventData, IPrebidDetails, IPrebidAdUnitMediaTypes } from '../../../../inject/scripts/prebid';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Tooltip from '@mui/material/Tooltip';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

const truncateString = (str: string, num: number) => {
  if (str.length <= num) {
    return str;
  }
  return str.slice(0, num) + '...';
};
const MediaTypesComponent = ({ mediaTypes }: IMediaTypesComponentProps): JSX.Element => {
  return (
    <Box>
      {Object.keys(mediaTypes).map((mediaType, index) => (
        <Box key={index}>
          <Typography>{mediaType}:</Typography>
          {Object.keys(mediaTypes[mediaType as keyof IPrebidAdUnitMediaTypes]).map((mediaTypeKey, subIndex) => {
            const keyOfMediaType = mediaTypeKey as keyof IPrebidAdUnitMediaTypes[keyof IPrebidAdUnitMediaTypes];
            const value = mediaTypes[mediaType as keyof IPrebidAdUnitMediaTypes][keyOfMediaType];
            switch (typeof value) {
              case 'object': {
                if (Array.isArray(value)) {
                  const valStr = `${mediaTypeKey}: [${(value as []).map((v: any) => {
                    switch (typeof v) {
                      case 'object': {
                        return `${JSON.stringify(v)}`;
                      }
                      case 'string': {
                        // return `"${truncateString(value, 34)}"`
                        return value;
                      }
                      case 'number': {
                        return v;
                      }
                      default: {
                        return `${v} (${typeof v})`;
                      }
                    }
                  })}]`;
                  return (
                    <Tooltip title={valStr} key={mediaTypeKey + subIndex} PopperProps={{ disablePortal: true }} leaveDelay={0} enterDelay={0}>
                      <Chip
                        size="small"
                        label={<Box sx={{ whiteSpace: 'break-spaces' }}>{valStr}</Box>}
                        variant="outlined"
                        color="primary"
                        sx={{ height: 'unset' }}
                      />
                    </Tooltip>
                  );
                } else {
                  return Object.keys(value).map((valueKey, vkIndex) => (
                    <Chip key={vkIndex} size="small" label={`${mediaTypeKey}: ${valueKey} = ${value[valueKey]}`} variant="outlined" color="primary" />
                  ));
                }
              }
              case 'number': {
                return <Chip size="small" key={keyOfMediaType} label={`${keyOfMediaType}: ${value}`} variant="outlined" color="primary" />;
              }
              case 'string': {
                return (
                  <Tooltip title={value} key={keyOfMediaType} PopperProps={{ disablePortal: true }} leaveDelay={0} enterDelay={0}>
                    <Chip
                      size="small"
                      label={
                        <Box id="floTest" sx={{ whiteSpace: 'break-spaces' }}>
                          {`${mediaTypeKey}: ${
                            mediaTypeKey === 'adTemplate' ? truncateString((value as string).trim().replace('\n', ''), 15) : value
                          }`}
                        </Box>
                      }
                      variant="outlined"
                      color="primary"
                      sx={{ height: 'unset' }}
                    />
                  </Tooltip>
                );
              }
              case 'boolean': {
                return <Chip size="small" key={keyOfMediaType} label={`${keyOfMediaType}: ${value}`} variant="outlined" color="primary" />;
              }
              default: {
                return (
                  <Chip
                    size="small"
                    key={keyOfMediaType}
                    label={`${keyOfMediaType}: ${value} (${typeof value})`}
                    variant="outlined"
                    color="primary"
                  />
                );
              }
            }
          })}
        </Box>
      ))}
    </Box>
  );
};

const SlotsComponent = ({ prebid }: ISlotsComponentProps): JSX.Element => {
  const adUnits =
    prebid.events
      .filter((event) => event.eventType === 'auctionEnd')
      .map((event) => (event as IPrebidAuctionEndEventData).args.adUnits)
      .flat() || [];
  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell variant="head" sx={{ width: '33%' }}>
              Code
            </TableCell>
            <TableCell variant="head" sx={{ width: '33%' }}>
              Media Types
            </TableCell>
            <TableCell variant="head" sx={{ width: '34%' }}>
              Bidders
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {adUnits.map((adUnit, index) => (
            <TableRow key={index} sx={{ verticalAlign: 'top', '&:last-child td, &:last-child th': { border: 0 } }}>
              <TableCell variant="body">
                <strong>{adUnit.code}</strong>
              </TableCell>
              <TableCell variant="body">
                <MediaTypesComponent mediaTypes={adUnit.mediaTypes} />
              </TableCell>
              <TableCell variant="body">
                <Stack direction="row" sx={{ flexWrap: 'wrap', gap: '5px' }}>
                  {Array.from(new Set(adUnit.bids)).map((bid, index) => (
                    <Tooltip
                      PopperProps={{ disablePortal: true }}
                      leaveDelay={0}
                      enterDelay={0}
                      title={JSON.stringify(bid.params, null, 4)}
                      key={index}
                    >
                      <Chip size="small" label={bid.bidder} />
                    </Tooltip>
                  ))}
                </Stack>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

interface ISlotsComponentProps {
  prebid: IPrebidDetails;
}

interface IMediaTypesComponentProps {
  mediaTypes: IPrebidAdUnitMediaTypes;
}

export default SlotsComponent;
