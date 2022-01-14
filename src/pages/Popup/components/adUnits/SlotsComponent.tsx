import React, { useEffect } from 'react';
import { IPrebidAuctionEndEventData, IPrebidDetails, IPrebidAdUnitMediaTypes, IPrebidAdUnit } from '../../../../inject/scripts/prebid';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import ReactJson from 'react-json-view';
import Popover from '@mui/material/Popover';
import logger from '../../../../logger';
import merge from 'lodash/merge';

const ChipWithPopOverOnClickComponent = ({ input, label, showInputInChip }: any): JSX.Element => {
  let json: { [key: string]: any } = {};
  if (typeof input !== 'object') {
    json[label] = input;
  } else {
    json = { ...input };
  }

  const labelText = showInputInChip ? `${label}: ${JSON.stringify(input)}` : `${label}`;
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
  const handlePopoverOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handlePopoverClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  return (
    <React.Fragment>
      <Chip size="small" variant="outlined" color="primary" label={labelText} onClick={handlePopoverOpen} sx={{ maxWidth: 200 }} />
      <Popover
        id="mouse-over-popover"
        open={open}
        anchorEl={anchorEl}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        onClose={handlePopoverClose}
        disableRestoreFocus
      >
        <ReactJson
          src={json}
          name={false}
          collapsed={false}
          enableClipboard={false}
          displayObjectSize={false}
          displayDataTypes={false}
          sortKeys={false}
          quotesOnKeys={false}
          indentWidth={2}
          collapseStringsAfterLength={100}
          style={{ fontSize: '12px', fontFamily: 'roboto', padding: '5px' }}
        />
      </Popover>
    </React.Fragment>
  );
};

const MediaTypesComponent = ({ mediaTypes }: IMediaTypesComponentProps): JSX.Element => {
  return (
    <Box>
      {Object.keys(mediaTypes).map((mediaType, index) => {
        switch (mediaType) {
          case 'banner': {
            return (
              <Box key={index}>
                <Typography variant="subtitle2">Banner Sizes:</Typography>
                <Stack direction="row" sx={{ flexWrap: 'wrap', gap: '5px' }}>
                  {mediaTypes[mediaType].sizes.map((size, index) => (
                    <Chip size="small" variant="outlined" color="primary" label={`${size[0]}x${size[1]}`} key={index} />
                  ))}
                </Stack>
              </Box>
            );
          }
          case 'video': {
            return (
              <Box key={index}>
                <Typography variant="subtitle2">Video:</Typography>
                <Stack direction="row" sx={{ flexWrap: 'wrap', gap: '5px' }}>
                  {Object.keys(mediaTypes[mediaType]).map((key, index) => (
                    <ChipWithPopOverOnClickComponent
                      input={mediaTypes[mediaType][key as keyof IPrebidAdUnitMediaTypes['video']]}
                      showInputInChip={true}
                      label={key}
                      key={index}
                    />
                  ))}
                </Stack>
              </Box>
            );
          }
          case 'native': {
            return (
              <Box key={index}>
                <Typography variant="subtitle2">Native:</Typography>
                <Stack direction="row" sx={{ flexWrap: 'wrap', gap: '5px' }}>
                  {Object.keys(mediaTypes[mediaType]).map((key, index) => (
                    <ChipWithPopOverOnClickComponent
                      input={mediaTypes[mediaType][key as keyof IPrebidAdUnitMediaTypes['native']]}
                      showInputInChip={true}
                      label={key}
                      key={index}
                    />
                  ))}
                </Stack>
              </Box>
            );
          }
        }
        return null;
      })}
    </Box>
  );
};

const SlotsComponent = ({ prebid }: ISlotsComponentProps): JSX.Element => {
  const [adUnits, setAdUnits] = React.useState<IPrebidAdUnit[]>([]);
  useEffect(() => {
    const adUnits = prebid.events
      .filter((event) => event.eventType === 'auctionEnd')
      .map((event) => (event as IPrebidAuctionEndEventData).args.adUnits)
      .flat()
      .reduce((previousValue, currentValue) => {
        const toBeUpdatedIndex = previousValue.findIndex((adUnit) => adUnit.code === currentValue.code);
        if (toBeUpdatedIndex !== -1) {
          previousValue[toBeUpdatedIndex] = merge(previousValue[toBeUpdatedIndex], currentValue);
          return previousValue;
        } else {
          return [...previousValue, currentValue];
        }
      }, [] as IPrebidAdUnit[])
      .sort((a, b) => (a.code > b.code ? 1 : -1));
    setAdUnits(adUnits);
  }, [prebid.events]);
  logger.log(`[PopUp][SlotComponent]: render `, adUnits);
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
                    <ChipWithPopOverOnClickComponent input={bid.params} label={bid.bidder} key={index} />
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
