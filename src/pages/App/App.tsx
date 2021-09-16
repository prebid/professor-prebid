import './App.scss';
import React, { useCallback, useEffect, useState } from 'react';
import logger from '../../logger';
import { appHandler } from './appHandler';
import { IGoogleAdManagerDetails } from '../../inject/scripts/googleAdManager'
import { IPrebidDetails } from '../../inject/scripts/prebid'
import { ITcfDetails } from '../../inject/scripts/tcf'

const App: React.FC = () => {

  const [googleAdManager, setGamDetails] = useState<IGoogleAdManagerDetails>({
    slots: [],
    sra: false,
    async: false,
    fetchBeforeKeyvalue: false,
    fetchBeforeRefresh: false
  });

  const [prebid, setPrebidDetails] = useState<IPrebidDetails>({
    version: null,
    slots: [],
    timeout: null,
    events: {
      auctionStartTimestamp: null,
      auctionEndTimestamp: null,
      bidders: {}
    },
    config: null,
    bids: []
  });

  const [tcf, setTcfDetails] = useState<ITcfDetails>({
    v1: {
      cmpLoaded: false,
      gdprApplies: false,
      consentData: ''
    },
    v2: {
      cmpLoaded: false,
      gdprApplies: false,
      consentData: ''
    }
  });

  useEffect(() => {

    logger.log('[App] waiting for data from background');

    appHandler.getGamDetailsFromBackground((data: IGoogleAdManagerDetails) => {
      logger.log('[App] received Google AdManager Details from background', data);
      data && setGamDetails(data)
    });

    appHandler.getPrebidDetailsFromBackground((data: IPrebidDetails) => {
      logger.log('[App] received Prebid Details from background', data);
      data && setPrebidDetails(data)
    });

    appHandler.getTcfDetailsFromBackground((data: ITcfDetails) => {
      logger.log('[App] received Prebid Details from background', data);
      data && setTcfDetails(data)
    });

  }, []);

  return (
    <div>
      <h1>Professor Prebid App</h1>
      <h2>IAB TCF Details</h2>
      {Object.keys(tcf).map((key, index) =>
        <span key={index}>
          <h3>Version: {key}</h3>
          <h3>CMP Loaded: {tcf[key].cmpLoaded}</h3>
          <h3>ConsentData: {tcf[key].consentData}</h3>
        </span>
      )}
      <h2>Prebid Details</h2>
      <h3>Version: {prebid.version}</h3>
      <h3>Timeout: {prebid.timeout}</h3>
      <h3>Config:</h3>
      <pre>
        {JSON.stringify(prebid.config, null, 4)}
      </pre>
      <h2>Prebid Events</h2>
      <table>
        <thead>
          <tr>
            <th>
              Auction Time
            </th>
            <th colSpan={3} style={{ textAlign: "left" }}>
              {prebid.events.auctionEndTimestamp - prebid.events.auctionStartTimestamp} ms
            </th>
          </tr>
          <tr>
            <th>
              Auction Start Time
            </th>
            <th colSpan={3} style={{ textAlign: "left" }}>
              {prebid.events.auctionStartTimestamp}
            </th>
          </tr>
          <tr>
            <th>
              Auction End Time
            </th>
            <th colSpan={3} style={{ textAlign: "left" }}>
              {prebid.events.auctionEndTimestamp}
            </th>
          </tr>
          <tr>
            <th>Bidder</th><th>Request Timestamp</th><th>Response Timestamp</th><th>Respose Time</th>
          </tr>
        </thead>
        <tbody>
          {Object.keys(prebid.events.bidders).map(key =>
            <tr key={key}>
              <td>{key}</td>
              <td>{prebid.events.bidders[key].requestTimestamp}</td>
              <td>{prebid.events.bidders[key].responseTimestamp}</td>
              <td>{prebid.events.bidders[key].responseTime}</td>
            </tr>
          )}
        </tbody>
      </table>
      <h2>Prebid Slots</h2>
      <table>
        <thead>
          <tr>
            <th>code</th>
            <th>mediaTypes</th>
            <th >bid</th>

          </tr>
        </thead>
        <tbody>
          {prebid.slots.map(slot =>
            <tr key={`${Math.random() * Math.random()}`}>
              <td>{slot.code}</td>
              <td>{JSON.stringify(slot.mediaTypes)}</td>
              <td>
                <table width="100%">
                  <thead>
                    <tr>
                      <th>adId</th>
                      <th>bidder</th>
                      <th>cpm</th>
                      <th>params</th>
                    </tr>
                  </thead>
                  <tbody>
                    {slot.bids.map((bid, index) =>
                      <tr key={index}>
                        <td key="adId">{bid.adId}</td>
                        <td key="bidder">{bid.bidder}</td>
                        <td key="cpm">{bid.cpm}</td>
                        <td key="params">{JSON.stringify(bid.params)}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <h2>Prebid Bids</h2>
      <table>
        <thead>
          <tr>
            <th>bidderCode</th>
            <th>width</th>
            <th>height</th>
            <th>statusMessage</th>
            <th>adId</th>
            <th>requestId</th>
            <th>mediaType</th>
            <th>source</th>
            <th>cpm</th>
            <th>currency</th>
            <th>netRevenue</th>
            <th>ttl</th>
            <th>creativeId</th>
            <th>dealId</th>
            <th>originalCpm</th>
            <th>originalCurrency</th>
            <th>meta</th>
            <th>auctionId</th>
            <th>responseTimestamp</th>
            <th>requestTimestamp</th>
            <th>bidder</th>
            <th>adUnitCode</th>
            <th>timeToRespond</th>
            <th>pbLg</th>
            <th>pbMg</th>
            <th>pbHg</th>
            <th>pbAg</th>
            <th>pbDg</th>
            <th>pbCg</th>
            <th>size</th>
            <th>adserverTargeting</th>
            <th>status</th>
            <th>adUrl</th>
            <th>params</th>
            <th>ad</th>
          </tr>
        </thead>
        <tbody>
          {prebid.bids.map((bid, index) =>
            <tr key={index}>
              <td key="bidderCode">{bid.bidderCode}</td>
              <td key="width">{bid.width}</td>
              <td key="height">{bid.height}</td>
              <td key="statusMessage">{bid.statusMessage}</td>
              <td key="adId">{bid.adId}</td>
              <td key="requestId">{bid.requestId}</td>
              <td key="mediaType">{bid.mediaType}</td>
              <td key="source">{bid.source}</td>
              <td key="cpm">{bid.cpm}</td>
              <td key="currency">{bid.currency}</td>
              <td key="netRevenue">{bid.netRevenue}</td>
              <td key="ttl">{bid.ttl}</td>
              <td key="creativeId">{bid.creativeId}</td>
              <td key="dealId">{bid.dealId}</td>
              <td key="originalCpm">{bid.originalCpm}</td>
              <td key="originalCurrency">{bid.originalCurrency}</td>
              <td key="meta">{JSON.stringify(bid.meta)}</td>
              <td key="auctionId">{bid.auctionId}</td>
              <td key="responseTimestamp">{bid.responseTimestamp}</td>
              <td key="requestTimestamp">{bid.requestTimestamp}</td>
              <td key="bidder">{bid.bidder}</td>
              <td key="adUnitCode">{bid.adUnitCode}</td>
              <td key="timeToRespond">{bid.timeToRespond}</td>
              <td key="pbLg">{bid.pbLg}</td>
              <td key="pbMg">{bid.pbMg}</td>
              <td key="pbHg">{bid.pbHg}</td>
              <td key="pbAg">{bid.pbAg}</td>
              <td key="pbDg">{bid.pbDg}</td>
              <td key="pbCg">{bid.pbCg}</td>
              <td key="size">{bid.size}</td>
              <td key="adserverTargeting">{JSON.stringify(bid.adserverTargeting)}</td>
              <td key="status">{bid.status}</td>
              <td key="adUrl">{bid.adUrl}</td>
              <td key="params">{JSON.stringify(bid.params)}</td>
              <td key="ad">{bid.ad}</td>
            </tr>
          )}
        </tbody>
      </table>
      <h2>GAM Details</h2>
      <table>
        <thead>
          <tr>
            <th>Request Mode</th>
            <th colSpan={4} style={{ textAlign: "left" }}>
              {(googleAdManager.sra) ? 'Single Request Architecture' : 'something else like Multi Request Architecture? '}
            </th>
          </tr>
          <tr>
            <th>Render Mode</th>
            <th colSpan={4} style={{ textAlign: "left" }}>
              {(googleAdManager.async) ? 'Asynchronous' : 'Synchronous'}
            </th>
          </tr>
          <tr>
            <th>Fetch Before Request</th>
            <th colSpan={4} style={{ textAlign: "left" }}>
              {(googleAdManager.fetchBeforeRefresh) ? 'YES' : 'NO'}
            </th>
          </tr>
          <tr>
            <th>Fetch Before Key/Value</th>
            <th colSpan={4} style={{ textAlign: "left" }}>
              {(googleAdManager.fetchBeforeKeyvalue) ? 'YES' : 'NO'}
            </th>
          </tr>
          <tr>
            <th>element_id</th>
            <th>creativeRenderTime</th>
            <th>name</th>
            <th>sizes</th>
            <th>targeting</th>
          </tr>
        </thead>
        <tbody>
          {googleAdManager.slots.map((slot, index) =>
            <tr key={index}>
              <td>{slot.elementId}</td>
              <td>{slot.creativeRenderTime}</td>
              <td>{slot.name}</td>
              <td>
                <ul>
                  {slot.sizes.map((size, index) => (
                    <li key={index}>{size}</li>
                  ))}
                </ul>
              </td>
              <td>
                <ul>
                  {slot.targeting.map((targeting, index) => (
                    <li key={index}>
                      <strong>{targeting.key}</strong>
                      <span>:</span>
                      {targeting.value}
                    </li>
                  ))}
                </ul>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div >);
};

export default App;
