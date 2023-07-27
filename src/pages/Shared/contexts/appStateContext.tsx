import React, { useState, useContext, useEffect } from 'react';
import { useMediaQuery, useTheme } from '@mui/material';
import InspectedPageContext from './inspectedPageContext';

import {
  IPrebidDetails,
  IPrebidAuctionInitEventData,
  IPrebidBidResponseEventData,
  IPrebidNoBidEventData,
  IPrebidAuctionEndEventData,
  IPrebidBidWonEventData,
  IPrebidAdRenderSucceededEventData,
} from '../../Content/scripts/prebid';

const AppStateContext = React.createContext<AppState>({
  pbjsNamespace: undefined,
  setPbjsNamespace: undefined,
  isSmallScreen: false,
  isPanel: false,
  events: [],
  allBidResponseEvents: [],
  allNoBidEvents: [],
  allBidderEvents: [],
  allAdUnitCodes: [],
  allWinningBids: [],
  auctionInitEvents: [],
  auctionEndEvents: [],
  adsRendered: [],
  prebid: {} as IPrebidDetails,
  initiatorOutput: {},
  setInitiatorOutput: () => {},
  isRefresh: false,
  setIsRefresh: () => {},
  initDataLoaded: false,
  setInitDataLoaded: () => {},
});

export const StateContextProvider = ({ children }: StateContextProviderProps) => {
  const [pbjsNamespace, setPbjsNamespace] = useState<string | undefined>();
  const [prebid, setPrebid] = useState<IPrebidDetails>({} as IPrebidDetails);
  const [events, setEvents] = useState<IPrebidDetails['events']>([]);
  const [allBidResponseEvents, setAllBidResponseEvents] = useState<IPrebidBidResponseEventData[]>([]);
  const [allNoBidEvents, setAllNoBidEvents] = useState<IPrebidNoBidEventData[]>([]);
  const [allBidderEvents, setAllBidderEvents] = useState<IPrebidDetails['events'][]>([]);
  const [allAdUnitCodes, setAllAdUnitCodes] = useState<string[]>([]);
  const [auctionInitEvents, setAuctionInitEvents] = useState<IPrebidAuctionEndEventData[]>([]);
  const [auctionEndEvents, setAuctionEndEvents] = useState<IPrebidAuctionEndEventData[]>([]);
  const [allWinningBids, setAllWinningBids] = React.useState<IPrebidBidWonEventData[]>([]);
  const [adsRendered, setAdsRendered] = React.useState<IPrebidAdRenderSucceededEventData[]>([]);
  const { prebids } = useContext(InspectedPageContext);
  const isSmallScreen = useMediaQuery(useTheme().breakpoints.down('sm'));
  const isPanel = useMediaQuery(useTheme().breakpoints.up('md'));
  const [initiatorOutput, setInitiatorOutput] = useState<any>({});
  const [isRefresh, setIsRefresh] = useState<boolean>(false);
  const [initDataLoaded, setInitDataLoaded] = useState<boolean>(false);
  
  useEffect(() => {
    if (pbjsNamespace === undefined && prebids && Object.keys(prebids).length > 0) {
      const defaultNameSpaceIndex = Object.keys(prebids).findIndex((el) => el === 'pbjs');
      const newValue = defaultNameSpaceIndex > -1 ? Object.keys(prebids)[defaultNameSpaceIndex] : Object.keys(prebids)[0];
      setPbjsNamespace(newValue);
    }
  }, [pbjsNamespace, prebids, setPbjsNamespace]);

  useEffect(() => {
    const prebid = prebids?.[pbjsNamespace] || ({} as IPrebidDetails);
    const events = prebids?.[pbjsNamespace]?.events || [];
    const allBidResponseEvents = (events?.filter(({ eventType }) => eventType === 'bidResponse') || []) as IPrebidBidResponseEventData[];
    const allNoBidEvents = (events?.filter(({ eventType }) => eventType === 'noBid') || []) as IPrebidNoBidEventData[];
    const allAdUnitCodes = Array.from(
      new Set(
        events?.reduce((acc, event) => {
          if (event.eventType === 'auctionInit') {
            const adUnitCodes = (event as IPrebidAuctionInitEventData).args.adUnitCodes;
            acc = [...acc, ...adUnitCodes];
          }
          return acc;
        }, [] as string[])
      )
    );
    const allBidderEventsBidders = Array.from(new Set([].concat(allBidResponseEvents, allNoBidEvents).map(({ args: { bidder } }) => bidder)));
    const auctionInitEvents = (events?.filter(({ eventType }) => eventType === 'auctionInit') as IPrebidAuctionEndEventData[])?.sort(
      ({ args: { timestamp: tsa } }, { args: { timestamp: tsb } }) => tsa - tsb
    );
    const auctionEndEvents = events?.filter(({ eventType }) => eventType === 'auctionEnd') as IPrebidAuctionEndEventData[];
    const allWinningBids = events?.filter(({ eventType }) => eventType === 'bidWon') as IPrebidBidWonEventData[];
    const adsRendered = events?.filter(({ eventType }) => eventType === 'adRenderSucceeded') as IPrebidAdRenderSucceededEventData[];

    setPrebid(prebid);
    setEvents(events);
    setAuctionInitEvents(auctionInitEvents);
    setAuctionEndEvents(auctionEndEvents);
    setAllBidderEvents(allBidderEventsBidders);
    setAllBidResponseEvents(allBidResponseEvents);
    setAllNoBidEvents(allNoBidEvents);
    setAllAdUnitCodes(allAdUnitCodes);
    setAllWinningBids(allWinningBids);
    setAdsRendered(adsRendered);
  }, [pbjsNamespace, prebids]);

  const contextValue: AppState = {
    pbjsNamespace,
    setPbjsNamespace,
    isSmallScreen,
    isPanel,
    prebid,
    events,
    allBidResponseEvents,
    allNoBidEvents,
    allBidderEvents,
    allAdUnitCodes,
    allWinningBids,
    auctionInitEvents,
    auctionEndEvents,
    adsRendered,
    initiatorOutput,
    setInitiatorOutput,
    isRefresh,
    setIsRefresh,
    initDataLoaded,
    setInitDataLoaded,
  };

  return <AppStateContext.Provider value={contextValue}>{children}</AppStateContext.Provider>;
};

export default AppStateContext;

interface AppState {
  pbjsNamespace?: string;
  setPbjsNamespace?: React.Dispatch<React.SetStateAction<string>>;
  isSmallScreen: boolean;
  isPanel: boolean;
  prebid: IPrebidDetails;
  events: IPrebidDetails['events'];
  allBidResponseEvents: IPrebidBidResponseEventData[];
  allNoBidEvents: IPrebidNoBidEventData[];
  allBidderEvents: IPrebidDetails['events'][];
  allAdUnitCodes: string[];
  allWinningBids: IPrebidBidWonEventData[];
  auctionInitEvents: IPrebidAuctionEndEventData[];
  auctionEndEvents: IPrebidAuctionEndEventData[];
  adsRendered: IPrebidAdRenderSucceededEventData[];
  initiatorOutput: {
    [key: string]: any;
  };
  setInitiatorOutput: React.Dispatch<React.SetStateAction<any>>;
  isRefresh: boolean;
  setIsRefresh: React.Dispatch<React.SetStateAction<boolean>>;
  initDataLoaded: boolean;
  setInitDataLoaded: React.Dispatch<React.SetStateAction<boolean>>;
}

interface StateContextProviderProps {
  children: React.ReactNode;
}
