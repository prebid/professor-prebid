import React from 'react';
import { IPrebidDetails } from "../../../../inject/scripts/prebid";
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Tooltip from '@mui/material/Tooltip';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';

const PrebidDetailsSlotsComponent = ({ prebid }: IPrebidDetailsComponentProps): JSX.Element => {
  const adUnits = prebid.events.filter(event => event.eventType === 'auctionEnd').map(event => event.args.adUnits).flat() || [];
  return (
    <Box>
      <Typography><strong>Prebid Slots</strong></Typography>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>

              <TableCell variant="head">Code</TableCell>
              <TableCell variant="head">Media Types</TableCell>
              <TableCell variant="head">Bidders</TableCell>

            </TableRow>
          </TableHead>
          <TableBody>
            {adUnits.map((adUnit: any, index) => (

              <TableRow key={index} sx={{ verticalAlign: 'top', '&:last-child td, &:last-child th': { border: 0 } }}>

                <TableCell variant="body">{adUnit.code}</TableCell>

                <TableCell variant="body">
                  <Typography>Banner Sizes:</Typography>
                  <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                    {adUnit.mediaTypes?.banner?.sizes?.map((size: string[], index: number) =>
                      <Chip size="small" key={index} label={size[0] + 'x' + size[1]} variant="outlined" />
                    )}
                  </Stack>
                </TableCell>

                <TableCell variant="body">
                  <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                    {Array.from(new Set(adUnit.bids)).map((bid: any, index: number) =>
                      <Tooltip title={JSON.stringify(bid.params, null, 4)} key={index}>
                        <Chip size="small" label={bid.bidder} variant="outlined" />
                      </Tooltip>
                    )}
                  </Stack>
                </TableCell>

              </TableRow>

            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
};

interface IPrebidDetailsComponentProps {
  prebid: IPrebidDetails;
}

export default PrebidDetailsSlotsComponent;
