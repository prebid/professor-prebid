import React, { createContext, useEffect, useState } from 'react';
import { IMessage, IAuctionsForRequestIdValue, ITimeInfoForRequestId, IAuctionInfo, messageTime, eventRowFromMessage } from './paapiContextUtils';
const PaapiContext = createContext<IPaapiInfo | undefined>(undefined);

export const PaapiContextProvider = ({ children }: PaapiProviderProps) => {
  const [auctionsForRequestId, setAuctionsForRequestId] = useState<Map<string, IAuctionsForRequestIdValue>>(new Map());
  const [timeInfoForRequestId, setTimeInfoForRequestId] = useState<Map<string, ITimeInfoForRequestId>>(new Map());

  const [deferredRequestWillBeSentForRequestId, setDeferredRequestWillBeSentForRequestId] = useState<Map<string, IMessage>>(new Map());

  const [auctionState, setAuctionState] = useState<{ [key: string]: IAuctionInfo }>({
    global: { auctionId: 'global', eventTable: [], header: 'global Header' },
  });

  const networkTime = (requestId: string, timestamp: number): number => {
    let timeInfo = timeInfoForRequestId.get(requestId);
    // Somehow missed the start event?
    if (!timeInfo) {
      return undefined;
    }
    return timeInfo.wallTime + (timestamp - timeInfo.timestamp);
  };

  const handleNetworkMessage = (message: IMessage) => {
    const requestId = message.params.requestId;
    const auctionInfo = auctionsForRequestId.get(requestId);
    const timeInfo = timeInfoForRequestId.get(requestId);
    const method = message.method;

    if (!auctionInfo) {
      // Probably an unrelated request, but maybe we just don't know of its relevance yet.
      if (message.method === 'Network.requestWillBeSent') {
        deferredRequestWillBeSentForRequestId.set(requestId, message);
      } else {
        // Request is finished; at this point it's clearly unrelated.
        deferredRequestWillBeSentForRequestId.delete(requestId);
      }
      setDeferredRequestWillBeSentForRequestId(new Map(deferredRequestWillBeSentForRequestId));
      return;
    }

    const { auctions, type } = auctionInfo;
    let prefix;
    let time;
    let cleanup = false;

    switch (method) {
      case 'Network.requestWillBeSent':
        prefix = 'Start fetch ';
        time = message.params.wallTime;
        timeInfoForRequestId.set(requestId, {
          wallTime: message.params.wallTime,
          timestamp: message.params.timestamp,
        });
        setTimeInfoForRequestId(timeInfoForRequestId);
        break;
      case 'Network.loadingFinished':
        prefix = 'Finish fetch ';
        time = networkTime(requestId, message.params.timestamp);
        cleanup = true;
        break;
      case 'Network.loadingFailed':
        prefix = 'Fail fetch ';
        time = networkTime(requestId, message.params.timestamp);
        cleanup = true;
        break;
    }

    if (cleanup) {
      auctionsForRequestId.delete(requestId);
      setAuctionsForRequestId(auctionsForRequestId);
      timeInfoForRequestId.delete(requestId);
      setTimeInfoForRequestId(timeInfoForRequestId);
    }

    // Synthesize fake `auction messages` for each relevant auction, and handle them.
    for (const auctionId of auctions) {
      const fakeMessage: IMessage = {
        method: 're-formated network event',
        params: {
          type: prefix + type,
          uniqueAuctionId: auctionId,
          accessTime: time,
          requestId,
        },
        timeInfo,
      };
      handleMessage(fakeMessage);
    }
  };

  const handleMessage = (message: IMessage) => {
    const { params, method } = message;
    const { uniqueAuctionId, type, parentAuctionId, auctionConfig, requestId } = params;
    const auctionId = uniqueAuctionId || 'global';
    const eventRow = eventRowFromMessage(message, auctionState[auctionId]);

    if (method === 'Storage.interestGroupAuctionEventOccurred') {
      if (type === 'started') {
        const auctionInfo: IAuctionInfo = {
          auctionId,
          header: `${parentAuctionId ? 'Component Auction' : 'Top Auction'} by ${auctionConfig.seller} at ${new Date(messageTime(message) * 1000)}`,
          startTime: messageTime(message),
        };

        auctionState[auctionId] = auctionInfo;

        if (parentAuctionId) {
          if (!auctionState[parentAuctionId].childAuctionsBox?.some((auction) => JSON.stringify(auction) === JSON.stringify(auctionInfo))) {
            auctionState[parentAuctionId].childAuctionsBox = auctionState[parentAuctionId].childAuctionsBox || [];
            auctionState[parentAuctionId].childAuctionsBox.push(auctionInfo);
          }
        } else {
          if (!auctionState.global.childAuctionsBox?.some((auction) => auction.auctionId === auctionInfo.auctionId)) {
            auctionState.global.childAuctionsBox = auctionState.global.childAuctionsBox || [];
            auctionState.global.childAuctionsBox.push(auctionInfo);
          }
        }
      }

      if (type === 'configResolved') {
        auctionState[auctionId].config = auctionConfig;
      }
    }

    if (method === 'Storage.interestGroupAuctionNetworkRequestCreated') {
      auctionsForRequestId.set(requestId, {
        auctions: message.params.auctions,
        type: message.params.type,
      });
      setAuctionsForRequestId(auctionsForRequestId);

      const deferredMessage = deferredRequestWillBeSentForRequestId.get(requestId);
      if (deferredMessage) {
        handleNetworkMessage(deferredMessage);
        deferredRequestWillBeSentForRequestId.delete(requestId);
        setDeferredRequestWillBeSentForRequestId(deferredRequestWillBeSentForRequestId);
      }
      return;
    }

    if (method.startsWith('Network.')) {
      handleNetworkMessage(message);
      return;
    }

    if (!auctionState[auctionId].eventTable?.some((row) => JSON.stringify(row) === JSON.stringify(eventRow))) {
      auctionState[auctionId].eventTable = auctionState[auctionId]?.eventTable || [];
      auctionState[auctionId].eventTable.push(eventRow);
    }

    setAuctionState({ ...auctionState });
  };

  useEffect(() => {
    const backgroundPageConnection = chrome.runtime.connect();

    backgroundPageConnection.postMessage({
      tabId: chrome.devtools.inspectedWindow.tabId,
    });

    backgroundPageConnection.onMessage.addListener(handleMessage);

    return () => {
      backgroundPageConnection.onMessage.removeListener(handleMessage);
    };
  }, []);

  const contextValue: IPaapiInfo = { auctionState };

  return <PaapiContext.Provider value={contextValue}>{children}</PaapiContext.Provider>;
};

export default PaapiContext;

// *****************************************************
// Interfaces for the above functions
// *****************************************************

interface PaapiProviderProps {
  children: React.ReactNode;
}

interface IPaapiInfo {
  auctionState: { [key: string]: IAuctionInfo };
  // messages: IMessage[];
}
