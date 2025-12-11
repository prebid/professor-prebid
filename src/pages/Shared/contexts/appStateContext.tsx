import React, { useState, useContext, useEffect } from 'react';
import { useMediaQuery, useTheme } from '@mui/material';
import InspectedPageContext from './inspectedPageContext';
import { IGoogleAdManagerDetails } from '../../Injected/googleAdManager';
import { IPrebidDetails } from '../../Injected/prebid';
import type { EventRecord, Config } from 'prebid.js/types.d.ts';

declare global {
  interface Document {
    featurePolicy: { [key: string]: any };
    browsingTopics: () => Promise<string[]>;
  }
}

const AppStateContext = React.createContext<AppState>({
  tcf: {} as Config['consentManagement'],
  googleAdManager: {} as IGoogleAdManagerDetails,
  pbjsNamespace: '',
  setPbjsNamespace: undefined,
  frameId: '',
  setIframeId: undefined,
  isSmallScreen: false,
  isPanel: false,
  events: [],
  allBidResponseEvents: [],
  allBidRequestedEvents: [],
  allNoBidEvents: [],
  allBidderEvents: [],
  allBidderDoneEvents: [],
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
  topics: [],
  setTopics: () => {},
});

export const StateContextProvider = ({ children }: StateContextProviderProps) => {
  const [frameId, setIframeId] = useState<string>('');
  const [pbjsNamespace, setPbjsNamespace] = useState<string>('');
  const [pbjsNamespaces, setPbjsNamespaces] = useState<string[]>([]);
  const [tcf, setTcf] = useState<Config['consentManagement']>({} as Config['consentManagement']);
  const [googleAdManager, setGoogleAdManager] = useState<IGoogleAdManagerDetails>({} as IGoogleAdManagerDetails);
  const [prebids, setPrebids] = useState<IPrebids>({} as IPrebids);
  const [prebid, setPrebid] = useState<IPrebidDetails>({} as IPrebidDetails);
  const [events, setEvents] = useState<IPrebidDetails['events']>([]);
  const [allBidResponseEvents, setAllBidResponseEvents] = useState<EventRecord<'bidResponse'>[]>([]);
  const [allBidRequestedEvents, setAllBidRequestedEvents] = useState<EventRecord<'bidRequested'>[]>([]);
  const [allNoBidEvents, setAllNoBidEvents] = useState<EventRecord<'noBid'>[]>([]);
  const [allBidderEvents, setAllBidderEvents] = useState<IPrebidDetails['events'][]>([]);
  const [allBidderDoneEvents, setAllBidderDoneEvents] = useState<EventRecord<'bidderDone'>[]>([]);
  const [allAdUnitCodes, setAllAdUnitCodes] = useState<string[]>([]);
  const [auctionInitEvents, setAuctionInitEvents] = useState<EventRecord<'auctionInit'>[]>([]);
  const [auctionEndEvents, setAuctionEndEvents] = useState<EventRecord<'auctionEnd'>[]>([]);
  const [allWinningBids, setAllWinningBids] = React.useState<EventRecord<'bidWon'>[]>([]);
  const [adsRendered, setAdsRendered] = React.useState<EventRecord<'adRenderSucceeded'>[]>([]);
  const { frames } = useContext(InspectedPageContext);
  const isSmallScreen = useMediaQuery(useTheme().breakpoints.down('sm'));
  const isPanel = useMediaQuery(useTheme().breakpoints.up('md'));
  const [initiatorOutput, setInitiatorOutput] = useState<any>({});
  const [isRefresh, setIsRefresh] = useState<boolean>(false);
  const [initDataLoaded, setInitDataLoaded] = useState<boolean>(false);
  const [prebidReleaseInfo, setPrebidReleaseInfo] = useState<any>({});
  const [topics, setTopics] = useState<string[]>([]);

  useEffect(() => {
    setPbjsNamespaces(Object.keys(prebids).filter((key) => key !== 'tcf'));
  }, [prebids]);

  useEffect(() => {
    if (frameId === '' && frames && Object.keys(frames).length > 0) {
      // if there is prebids in top-window, set it as default
      if (frames['top-window']?.prebids) {
        setIframeId('top-window');
        return;
      }
      // if there is no prebids in top-window, set first frame with prebids as default
      for (const frameId of Object.keys(frames)) {
        if (frames[frameId].prebids) {
          setIframeId(frameId);
          return;
        }
      }
      // if there is no prebids in any frame, set top-window as default
      setIframeId('top-window');
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
    const allBidResponseEvents = (events?.filter(({ eventType }: { eventType: string }) => eventType === 'bidResponse') || []) as EventRecord<'bidResponse'>[];
    const allBidRequestedEvents = (events?.filter(({ eventType }: { eventType: string }) => eventType === 'bidRequested') || []) as EventRecord<'bidRequested'>[];
    const allNoBidEvents = (events?.filter(({ eventType }: { eventType: string }) => eventType === 'noBid') || []) as EventRecord<'noBid'>[];
    const allBidderDoneEvents = (events?.filter(({ eventType }: { eventType: string }) => eventType === 'bidderDone') || []) as EventRecord<'bidderDone'>[];
    const allAdUnitCodes = Array.from(
      new Set(
        events?.reduce((acc: string[], event: any) => {
          if (event.eventType === 'auctionInit') {
            const adUnitCodes = (event as EventRecord<'auctionInit'>).args.adUnitCodes;
            acc = [...acc, ...adUnitCodes];
          }
          return acc;
        }, [] as string[])
      )
    ) as string[];
    const allBidderEventsBidders = Array.from(new Set([].concat(allBidResponseEvents, allNoBidEvents).map(({ args: { bidder } }) => bidder)));
    const auctionInitEvents = (events?.filter(({ eventType }: { eventType: string }) => eventType === 'auctionInit') as EventRecord<'auctionInit'>[])?.sort(({ args: { timestamp: tsa } }, { args: { timestamp: tsb } }) => tsa - tsb);
    const auctionEndEvents = events?.filter(({ eventType }: { eventType: string }) => eventType === 'auctionEnd') as EventRecord<'auctionEnd'>[];
    const allWinningBids = events?.filter(({ eventType }: { eventType: string }) => eventType === 'bidWon') as EventRecord<'bidWon'>[];
    const adsRendered = events?.filter(({ eventType }: { eventType: string }) => eventType === 'adRenderSucceeded') as EventRecord<'adRenderSucceeded'>[];

    setPrebid(prebid);
    setEvents(events);
    setAuctionInitEvents(auctionInitEvents);
    setAuctionEndEvents(auctionEndEvents);
    setAllBidderEvents(allBidderEventsBidders);
    setAllBidderDoneEvents(allBidderDoneEvents);
    setAllBidResponseEvents(allBidResponseEvents);
    setAllBidRequestedEvents(allBidRequestedEvents);
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
    allBidRequestedEvents,
    allNoBidEvents,
    allBidderEvents,
    allBidderDoneEvents,
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
    topics,
    setTopics,
  };

  return <AppStateContext.Provider value={contextValue}>{children}</AppStateContext.Provider>;
};

export default AppStateContext;

interface AppState {
  tcf: Config['consentManagement'];
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
  allBidResponseEvents: EventRecord<'bidResponse'>[];
  allBidRequestedEvents: EventRecord<'bidRequested'>[];
  allNoBidEvents: EventRecord<'noBid'>[];
  allBidderEvents: IPrebidDetails['events'][];
  allBidderDoneEvents: EventRecord<'bidderDone'>[];
  allAdUnitCodes: string[];
  allWinningBids: EventRecord<'bidWon'>[];
  auctionInitEvents: EventRecord<'auctionInit'>[];
  auctionEndEvents: EventRecord<'auctionEnd'>[];

  adsRendered: EventRecord<'adRenderSucceeded'>[];
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
  topics: string[];
  setTopics: React.Dispatch<React.SetStateAction<string[]>>;
}

interface StateContextProviderProps {
  children: React.ReactNode;
}
