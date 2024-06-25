import React, { useState, useContext, useEffect } from 'react';
import { useMediaQuery, useTheme } from '@mui/material';
import InspectedPageContext from './inspectedPageContext';
import { IFrameInfo, IPrebids } from '../../Background';
import { IGoogleAdManagerDetails } from '../../Injected/googleAdManager';
import {
  IPrebidDetails,
  IPrebidBidResponseEventData,
  IPrebidNoBidEventData,
  IPrebidAuctionEndEventData,
  IPrebidBidWonEventData,
  IPrebidAdRenderSucceededEventData,
  IPrebidAuctionInitEventData,
} from '../../Injected/prebid';
import { ITcfDetails } from '../../Injected/tcf';

declare global {
  interface Document {
    featurePolicy: { [key: string]: any };
    browsingTopics: () => Promise<string[]>;
  }
}

const AppStateContext = React.createContext<AppState>({
  tcf: {} as ITcfDetails,
  googleAdManager: {} as IGoogleAdManagerDetails,
  pbjsNamespace: '',
  setPbjsNamespace: undefined,
  frameId: '',
  setIframeId: undefined,
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
  prebids: {} as IPrebids,
  initiatorOutput: {},
  setInitiatorOutput: () => {},
  isRefresh: false,
  setIsRefresh: () => {},
  initDataLoaded: false,
  setInitDataLoaded: () => {},
  prebidReleaseInfo: {},
  setPrebidReleaseInfo: () => {},
});

export const StateContextProvider = ({ children }: StateContextProviderProps) => {
  const [frameId, setIframeId] = useState<string>('');
  const [pbjsNamespace, setPbjsNamespace] = useState<string>('');
  const [pbjsNamespaces, setPbjsNamespaces] = useState<string[]>([]);
  const [tcf, setTcf] = useState<ITcfDetails>({} as ITcfDetails);
  const [googleAdManager, setGoogleAdManager] = useState<IGoogleAdManagerDetails>({} as IGoogleAdManagerDetails);
  const [prebids, setPrebids] = useState<IPrebids>({} as IPrebids);
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
  const { frames } = useContext(InspectedPageContext);
  const isSmallScreen = useMediaQuery(useTheme().breakpoints.down('sm'));
  const isPanel = useMediaQuery(useTheme().breakpoints.up('md'));
  const [initiatorOutput, setInitiatorOutput] = useState<any>({});
  const [isRefresh, setIsRefresh] = useState<boolean>(false);
  const [initDataLoaded, setInitDataLoaded] = useState<boolean>(false);
  const [prebidReleaseInfo, setPrebidReleaseInfo] = useState<any>({});

  useEffect(() => {
    setPbjsNamespaces(Object.keys(prebids).filter((key) => key !== 'tcf'));
  }, [prebids]);

  useEffect(() => {
    if (frameId === '' && frames && Object.keys(frames).length > 0) {
      const defaultFrameIdIndex = Object.keys(frames).findIndex((el) => el === 'top-window');
      const newValue = defaultFrameIdIndex > -1 ? Object.keys(frames)[defaultFrameIdIndex] : Object.keys(frames)[0];
      setIframeId(newValue || '');
    }
  }, [frameId, frames]);

  useEffect(() => {
    const currentFrameInfo = frames[frameId as keyof IFrameInfo] as IFrameInfo;
    const newValue = currentFrameInfo?.prebids;
    setPrebids({ ...newValue });
    setGoogleAdManager({ ...currentFrameInfo?.googleAdManager });
    setTcf({ ...currentFrameInfo?.tcf });
  }, [frameId, frames]);

  useEffect(() => {
    if (pbjsNamespace === '' && pbjsNamespaces.length > 0) {
      const defaultNameSpaceIndex = pbjsNamespaces.findIndex((el) => el === 'pbjs');
      const newValue = defaultNameSpaceIndex > -1 ? pbjsNamespaces[defaultNameSpaceIndex] : pbjsNamespaces[0];
      setPbjsNamespace(newValue || '');
    }
  }, [pbjsNamespace, pbjsNamespaces, setPbjsNamespace, frameId]);

  useEffect(() => {
    const fetchTopics = async () => {
      if ('browsingTopics' in document && document.featurePolicy.allowsFeature('browsing-topics')) {
        try {
          const topics = await document.browsingTopics();
          setTopics(topics);
        } catch (error) {
          console.error('Error fetching topics', error);
        }
      }
    };
    fetchTopics();
  }, [prebids]);

  useEffect(() => {
    const prebid = prebids?.[pbjsNamespace] || ({} as IPrebidDetails);
    const events = Array.isArray(prebid.events) ? prebid.events : [];
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
    tcf,
    pbjsNamespace,
    setPbjsNamespace,
    frameId,
    setIframeId,
    isSmallScreen,
    isPanel,
    prebid,
    prebids,
    googleAdManager,
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
    prebidReleaseInfo,
    setPrebidReleaseInfo,
  };

  return <AppStateContext.Provider value={contextValue}>{children}</AppStateContext.Provider>;
};

export default AppStateContext;

interface AppState {
  tcf: ITcfDetails;
  googleAdManager: IGoogleAdManagerDetails;
  pbjsNamespace?: string;
  setPbjsNamespace?: React.Dispatch<React.SetStateAction<string>>;
  frameId: string;
  setIframeId: React.Dispatch<React.SetStateAction<string>>;
  isSmallScreen: boolean;
  isPanel: boolean;
  prebid: IPrebidDetails;
  prebids: IPrebids;
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
  prebidReleaseInfo: {
    latestVersionPublishedAt?: string;
    latestVersion?: string;
    installedVersion?: string;
    installedVersionPublishedAt?: string;
    featureCountSinceInstalledVersion?: number;
    maintenanceCountSinceInstalledVersion?: number;
    bugfixCountSinceInstalledVersion?: number;
    releasesSinceInstalledVersion?: any[];
  };
  setPrebidReleaseInfo: React.Dispatch<React.SetStateAction<any>>;
}

interface StateContextProviderProps {
  children: React.ReactNode;
}
