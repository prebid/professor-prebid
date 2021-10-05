import React, { useCallback, useEffect, useState } from 'react';
import './App.scss';
import Timeline from './components/TimelineComponent'
import TcfDetailsComponent from './components/TcfDetailsComponent'
import PrebidDetailsComponent from './components/details/PrebidDetailsComponent'
import GoogleAdManagerDetailsComponent from './components/GoogleAdManagerDetailsComponent';
import { IPrebidDetails } from '../../inject/scripts/prebid';
import { ITcfDetails } from '../../inject/scripts/tcf';
import { googleAdManager, IGoogleAdManagerDetails } from '../../inject/scripts/googleAdManager';
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
          <h2>Prebid Details</h2>
          {prebidDetails && googleAdManager && <Timeline prebid={prebidDetails} googleAdManager={gamDetails}></Timeline>}
          {prebidDetails && <PrebidDetailsComponent prebid={prebidDetails}></PrebidDetailsComponent>}
          <h2>IAB TCF Details</h2>
          {tcfDetails && <TcfDetailsComponent tcf={tcfDetails}></TcfDetailsComponent>}
          <h2>GAM Details</h2>
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
