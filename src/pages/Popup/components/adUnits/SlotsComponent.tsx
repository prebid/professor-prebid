import React from 'react';
import {
  IPrebidAuctionEndEventData,
  IPrebidAdUnit,
  IPrebidBidWonEventData,
  IPrebidAdRenderSucceededEventData,
  IPrebidDetails,
} from '../../../../inject/scripts/prebid';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import theme from '../../../theme';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import BidderStackComponent from './BidderStackComponent';
import BidChipComponent from './BidChipComponent';
import AdUnitChipComponent from './AdUnitChipComponent';
import MediaTypesComponent from './MediaTypesComponent';

const SlotsComponent = ({
  adUnits,
  latestAuctionsWinningBids,
  latestAuctionsBidsReceived,
  latestAuctionsAdsRendered,
}: ISlotsComponentProps): JSX.Element => {
  return (
    <React.Fragment>
      <TableContainer
        sx={{
          [theme.breakpoints.down('sm')]: {
            display: 'none',
          },
        }}
      >
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell variant="head" sx={{ width: 0.33 }}>
                Code
              </TableCell>
              <TableCell variant="head" sx={{ width: 0.33 }}>
                Media Types
              </TableCell>
              <TableCell variant="head" sx={{ width: 0.33 }}>
                Bidders
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {adUnits.map((adUnit, index) => {
              return (
                <TableRow key={index} sx={{ verticalAlign: 'top', '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell variant="body">
                    <AdUnitChipComponent adUnit={adUnit} />
                  </TableCell>
                  <TableCell variant="body">
                    <MediaTypesComponent mediaTypes={adUnit.mediaTypes} />
                  </TableCell>
                  <TableCell variant="body">
                    <Stack direction="row" sx={{ flexWrap: 'wrap', gap: '5px' }}>
                      {adUnit.bids.map((bid, index) => {
                        const bidReceived = latestAuctionsBidsReceived.find(
                          (bidReceived) =>
                            bidReceived.args?.adUnitCode === adUnit.code &&
                            bidReceived.args.bidder === bid.bidder &&
                            adUnit.sizes?.map((size) => `${size[0]}x${size[1]}`).includes(bidReceived?.args?.size)
                        );
                        const isWinner = latestAuctionsWinningBids.some(
                          (winningBid) =>
                            winningBid.args.adUnitCode === adUnit.code &&
                            winningBid.args.bidder === bid.bidder &&
                            adUnit.sizes?.map((size) => `${size[0]}x${size[1]}`).includes(bidReceived?.args.size)
                        );
                        const isRendered = latestAuctionsAdsRendered.some(
                          (renderedAd) =>
                            renderedAd.args.bid.adUnitCode === adUnit.code &&
                            renderedAd.args.bid.bidder === bid.bidder &&
                            renderedAd.args.bid.auctionId === bid.auctionId
                        );
                        const label = bidReceived?.args.cpm
                          ? `${bid.bidder} (${bidReceived?.args.cpm.toFixed(2)} ${bidReceived?.args.currency})`
                          : `${bid.bidder}`;
                        return (
                          <BidChipComponent
                            input={bid}
                            label={label}
                            key={index}
                            isWinner={isWinner}
                            bidReceived={bidReceived}
                            isRendered={isRendered}
                          />
                        );
                      })}
                    </Stack>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      <Stack
        sx={{
          backgroundColor: 'primary.light',
          [theme.breakpoints.up('sm')]: {
            display: 'none',
          },
        }}
      >
        {adUnits.map((adUnit, index) => {
          return (
            <Card key={index} sx={{ m: 1 }} variant="outlined">
              <CardContent>
                <Typography variant="h3" sx={{ pt: 1 }}>
                  Code:
                  <Typography variant="body2" component="span">
                    {adUnit.code}
                  </Typography>
                </Typography>
                <Typography variant="h3" sx={{ pt: 1 }}>
                  Media Types:
                </Typography>
                <MediaTypesComponent mediaTypes={adUnit.mediaTypes} />
                <Typography variant="h3" sx={{ pt: 1 }}>
                  Bidders:
                </Typography>
                <BidderStackComponent
                  adUnit={adUnit}
                  latestAuctionsBidsReceived={latestAuctionsBidsReceived}
                  latestAuctionsWinningBids={latestAuctionsWinningBids}
                  latestAuctionsAdsRendered={latestAuctionsAdsRendered}
                ></BidderStackComponent>
              </CardContent>
            </Card>
          );
        })}
      </Stack>
    </React.Fragment>
  );
};

interface ISlotsComponentProps {
  auctionEndEvents: IPrebidAuctionEndEventData[];
  allBidderEvents: IPrebidDetails['events'][];
  latestAuctionsWinningBids: IPrebidBidWonEventData[];
  latestAuctionsBidsReceived: IPrebidBidWonEventData[];
  latestAuctionsAdsRendered: IPrebidAdRenderSucceededEventData[];
  adUnits: IPrebidAdUnit[];
}

export default SlotsComponent;
