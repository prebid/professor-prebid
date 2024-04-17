/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useState } from 'react';
import JSONViewerComponent from '../../Shared/components/JSONViewerComponent';
import { Grid, Paper, Typography } from '@mui/material';
import { IMessage } from '../../Shared/contexts/paapiContextUtils';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

export const AuctionComponent = ({
  auctionStartEvent: {
    params: { uniqueAuctionId, auctionConfig, eventTime, parentAuctionId },
  },
  messages,
}: {
  auctionStartEvent: IMessage;
  messages: IMessage[];
}): JSX.Element => {
  const [mgs, setMgs] = React.useState<IMessage[]>([]);
  const [childAuctionMessages, setChildAuctionMessages] = React.useState<IMessage[]>([]);

  useEffect(() => {
    const tmp = messages
      .filter(({ params }) => params.uniqueAuctionId === uniqueAuctionId)
      .map((message) => ({ ...message, time: (message.params.eventTime || message.params.accessTime) - eventTime }))
      .sort((a, b) => a.time - b.time);
    setMgs(tmp);
  }, [eventTime, messages, uniqueAuctionId]);

  useEffect(() => {
    const childAuctionMessages = messages.filter((message) => message.params.parentAuctionId === uniqueAuctionId);
    setChildAuctionMessages(childAuctionMessages);
  }, [messages, uniqueAuctionId]);

  return (
    <Grid container spacing={0.25}>
      <Grid item xs={12}>
        <Paper>
          <Typography variant="h4" sx={{ p: 1 }}>
            {parentAuctionId ? 'Component ' : 'Top Seller '} Auction ({uniqueAuctionId}) by {auctionConfig?.seller} at{' '}
          </Typography>
        </Paper>
      </Grid>

      <Grid item xs={0.5}>
        <Paper sx={{ height: 1 }}>
          <Typography variant="body1" sx={{ p: 1 }}></Typography>
        </Paper>
      </Grid>

      <Grid item xs={0.5}>
        <Paper>
          <Typography variant="h4" sx={{ p: 1 }}>
            Time
          </Typography>
        </Paper>
      </Grid>

      <Grid item xs={1}>
        <Paper>
          <Typography variant="h4" sx={{ p: 1 }}>
            Event
          </Typography>
        </Paper>
      </Grid>

      <Grid item xs={3}>
        <Paper>
          <Typography variant="h4" sx={{ p: 1 }}>
            IG Origin
          </Typography>
        </Paper>
      </Grid>

      <Grid item xs={3}>
        <Paper>
          <Typography variant="h4" sx={{ p: 1 }}>
            IG Name
          </Typography>
        </Paper>
      </Grid>

      <Grid item xs={2}>
        <Paper>
          <Typography variant="h4" sx={{ p: 1 }}>
            Bid
          </Typography>
        </Paper>
      </Grid>

      <Grid item xs={2}>
        <Paper>
          <Typography variant="h4" sx={{ p: 1 }}>
            Bid Currency
          </Typography>
        </Paper>
      </Grid>
      {mgs.map((message, index) => (
        <AuctionLineComponent message={message} key={index} />
      ))}

      {childAuctionMessages
        .filter(({ params: { type } }) => type === 'started')
        .map((auctionStartEvent, index) => (
          <AuctionComponent auctionStartEvent={auctionStartEvent} messages={childAuctionMessages} key={index} />
        ))}
    </Grid>
  );
};

const AuctionLineComponent = ({ message }: { message: IMessage }): JSX.Element => {
  const [expanded, setExpanded] = React.useState(false);
  return (
    <React.Fragment>
      <Grid item xs={0.5} onClick={() => setExpanded(!expanded)}>
        <Paper sx={{ height: 1 }}>
          <Typography variant="body1" sx={{ p: 1 }}>
            {expanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </Typography>
        </Paper>
      </Grid>
      <Grid item xs={0.5}>
        <Paper sx={{ height: 1 }}>
          <Typography variant="body1" sx={{ p: 1 }}>
            {(message.time * 1000).toFixed(2)} ms
          </Typography>
        </Paper>
      </Grid>

      <Grid item xs={1}>
        <Paper sx={{ height: 1 }}>
          <Typography variant="body1" sx={{ p: 1 }}>
            {message.params.type}
          </Typography>
        </Paper>
      </Grid>

      <Grid item xs={3}>
        <Paper sx={{ height: 1 }}>
          <Typography variant="body1" sx={{ p: 1 }}>
            {message.params.ownerOrigin}
          </Typography>
        </Paper>
      </Grid>

      <Grid item xs={3}>
        <Paper sx={{ height: 1 }}>
          <Typography variant="body1" sx={{ p: 1 }}>
            {message.params.name}
          </Typography>
        </Paper>
      </Grid>

      <Grid item xs={2}>
        <Paper sx={{ height: 1 }}>
          <Typography variant="body1" sx={{ p: 1 }}>
            {message.params.bid}
          </Typography>
        </Paper>
      </Grid>

      <Grid item xs={2}>
        <Paper sx={{ height: 1 }}>
          <Typography variant="body1" sx={{ p: 1 }}>
            {message.params.bidCurrency}
          </Typography>
        </Paper>
      </Grid>
      <Grid item xs={12}></Grid>
      {expanded && (
        <Grid item xs={12}>
          <Paper sx={{ height: 1 }}>
            <JSONViewerComponent src={message} collapsed={false} />
          </Paper>
        </Grid>
      )}
    </React.Fragment>
  );
};
