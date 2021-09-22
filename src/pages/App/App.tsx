import React, { useCallback, useEffect, useState } from 'react';
import './App.scss';
import TimelineComponent from './components/TimelineComponent'
import TcfDetailsComponent from './components/TcfDetailsComponent'
import PrebidDetailsComponent from './components/PrebidDetailsComponent'
import GoogleAdManagerDetailsComponent from './components/GoogleAdManagerDetailsComponent';
import { IPrebidDetails } from '../../inject/scripts/prebid';
import { ITcfDetails } from '../../inject/scripts/tcf';
import { IGoogleAdManagerDetails } from '../../inject/scripts/googleAdManager';
import { appHandler } from '../App/appHandler';

const App = () => {
  const [debugData, setDebugData] = useState<IDebugData[]>([]);
  useEffect(() => {
    appHandler.getDebugDetailsFromBackground((data: IDebugData[]) => {
      data && setDebugData(data)
    });
  });
  return (
    <div>
      {debugData && Object.keys(debugData)[0] && Object.keys(debugData).map((key: any) => {
        const { prebidDetails, tcfDetails, gamDetails } = debugData[key];
        return <span key={key}>
          <h1>Debug Data for Tab {key} </h1>
          {prebidDetails && <TimelineComponent prebid={prebidDetails}></TimelineComponent>}
          {prebidDetails && <PrebidDetailsComponent prebid={prebidDetails}></PrebidDetailsComponent>}
          {tcfDetails && <TcfDetailsComponent tcf={tcfDetails}></TcfDetailsComponent>}
          {gamDetails && <GoogleAdManagerDetailsComponent googleAdManager={gamDetails}></GoogleAdManagerDetailsComponent>}
        </span>
      })}
    </div >);
};

interface IDebugData {
  prebidDetails: IPrebidDetails;
  tcfDetails: ITcfDetails;
  gamDetails: IGoogleAdManagerDetails;
}

export default App;
