/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import { Grid } from '@mui/material';
import { IAuctionInfo } from '../../../Shared/contexts/paapiContextUtils';
import { BackGroundGrid, PaapiGridContainer, normalizeValue } from './PaapiAuctionGridComponent';
import {
  AuctionStart,
  SellerJs,
  TopLevelBid,
  SellerTrustedSignals,
  Win,
  BidderJs,
  InterestGroup,
  BidderTrustedSignals,
  AuctionConfig,
} from './PaapiAuctionEventsComponent';

export const EventGridItem = ({
  children,
  step,
  colCount,
  width,
  offset,
}: {
  children: JSX.Element;
  step: number;
  colCount: number;
  maxValue: number;
  width: number;
  offset: number;
}): JSX.Element => {
  return (
    <>
      <BackGroundGrid step={step} width={offset} />
      <Grid item xs={width} sx={{ overflow: 'visible' }}>
        {children}
      </Grid>
      <BackGroundGrid step={step} width={colCount - offset - width} reverse />
    </>
  );
};

export const EventGrid = ({ auction }: { auction: IAuctionInfo }): JSX.Element => {
  const { expanded, eventTable } = auction;
  const maxMessageTime = auction.eventTable.reduce((max, event) => {
    if (event.messageTime > max) {
      max = event.messageTime;
    }
    return max;
  }, 0);
  const maxValue = maxMessageTime - auction.startTime;
  const colCount = 100;
  const step = 10;
  return (
    <PaapiGridContainer
      show={true}
      step={step}
      colCount={colCount}
      label={false}
      children={
        <>
          {auction.eventTable.map((event, index) => {
            const offSetNorm = Math.floor(normalizeValue(event.messageTime - auction.startTime, maxValue, colCount));
            switch (event.Event) {
              case 'started': {
                const width = Math.floor(normalizeValue(eventTable[eventTable.length - 1].messageTime - event.messageTime, maxValue, colCount)) || 1;

                return (
                  <EventGridItem
                    step={step}
                    colCount={colCount}
                    width={width}
                    offset={offSetNorm}
                    maxValue={maxValue}
                    children={<AuctionStart event={event} auctionId={auction.auctionId} key={index} />}
                  />
                );
              }
              case 'Start fetch sellerJs': {
                if (!expanded) return null;
                const finishEvent = eventTable.find((message) => message.Event === 'Finish fetch sellerJs' && message.requestId === event.requestId);
                const width = Math.floor(normalizeValue(finishEvent.messageTime - event.messageTime, maxValue, colCount)) || 1;

                return (
                  <EventGridItem
                    step={step}
                    colCount={colCount}
                    width={width}
                    offset={offSetNorm}
                    maxValue={maxValue}
                    children={<SellerJs event={event} auctionId={auction.auctionId} key={index} />}
                  />
                );
              }
              case 'topLevelBid': {
                if (!expanded) return null;
                const howLongIsBidEvent = 0.1;
                const width = Math.floor(normalizeValue(howLongIsBidEvent, maxValue, colCount)) || 1;

                return (
                  <EventGridItem
                    step={step}
                    colCount={colCount}
                    width={width}
                    offset={offSetNorm}
                    maxValue={maxValue}
                    children={<TopLevelBid event={event} auctionId={auction.auctionId} key={index} />}
                  />
                );
              }
              case 'Start fetch sellerTrustedSignals': {
                if (!expanded) return null;
                const finishEvent = eventTable.find(
                  (message) => message.Event === 'Finish fetch sellerTrustedSignals' && message.requestId === event.requestId
                );
                const width = Math.floor(normalizeValue(finishEvent.messageTime - event.messageTime, maxValue, colCount)) || 1;

                return (
                  <EventGridItem
                    step={step}
                    colCount={colCount}
                    width={width}
                    offset={offSetNorm}
                    maxValue={maxValue}
                    children={<SellerTrustedSignals event={event} auctionId={auction.auctionId} key={index} />}
                  />
                );
              }
              case 'win': {
                if (!expanded) return null;
                const howLongIsBidEvent = 0.1;
                const width = Math.floor(normalizeValue(howLongIsBidEvent, maxValue, colCount)) || 1;

                return (
                  <EventGridItem
                    step={step}
                    colCount={colCount}
                    width={width}
                    offset={offSetNorm}
                    maxValue={maxValue}
                    children={<Win event={event} auctionId={auction.auctionId} key={index} />}
                  />
                );
              }
              case 'Start fetch bidder.js': {
                if (!expanded) return null;
                const finishEvent = eventTable.find(
                  (message) => message.Event === 'Finish fetch sellerTrustedSignals' && message.requestId === event.requestId
                );
                const width = Math.floor(normalizeValue(finishEvent.messageTime - event.messageTime, maxValue, colCount)) || 1;

                return (
                  <EventGridItem
                    step={step}
                    colCount={colCount}
                    width={width}
                    offset={offSetNorm}
                    maxValue={maxValue}
                    children={<BidderJs event={event} auctionId={auction.auctionId} key={index} />}
                  />
                );
              }
              case 'loaded': {
                if (!expanded) return null;
                const howLongIsBidEvent = 0.1;
                const width = Math.floor(normalizeValue(howLongIsBidEvent, maxValue, colCount)) || 1;
                return (
                  <EventGridItem
                    step={step}
                    colCount={colCount}
                    width={width}
                    offset={offSetNorm}
                    maxValue={maxValue}
                    children={<InterestGroup event={event} auctionId={auction.auctionId} key={index} />}
                  />
                );
              }
              case 'Start fetch bidderTrustedSignals': {
                if (!expanded) return null;
                const finishEvent = eventTable.find(
                  (message) => message.Event === 'Finish fetch bidderTrustedSignals' && message.requestId === event.requestId
                );
                const width = Math.floor(normalizeValue(finishEvent.messageTime - event.messageTime, maxValue, colCount)) || 1;

                return (
                  <EventGridItem
                    step={step}
                    colCount={colCount}
                    width={width}
                    offset={offSetNorm}
                    maxValue={maxValue}
                    children={<BidderTrustedSignals event={event} auctionId={auction.auctionId} key={index} />}
                  />
                );
              }
              case 'configResolved': {
                if (!expanded) return null;
                const howLongIsBidEvent = 0.1;
                const width = Math.floor(normalizeValue(howLongIsBidEvent, maxValue, colCount)) || 1;
                return (
                  <EventGridItem
                    step={step}
                    colCount={colCount}
                    width={width}
                    offset={offSetNorm}
                    maxValue={maxValue}
                    children={<AuctionConfig event={event} auctionId={auction.auctionId} key={index} />}
                  />
                );
              }
              default:
                return null;
            }
          })}
        </>
      }
    />
  );
};
