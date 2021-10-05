import React from 'react';
import { IPrebidDetails } from "../../../../inject/scripts/prebid";
const PrebidDetailsBidsComponent = ({ prebid }: IPrebidDetailsComponentProps): JSX.Element => {
  const bidsReceived =  prebid?.events.filter(event => event.eventType === 'auctionEnd').map(event => event.args.bidsReceived).flat() || [];
  const noBids =  prebid?.events.filter(event => event.eventType === 'auctionEnd').map(event => event.args.noBids).flat() || [];
  return <span>
    <p><strong>Received Bids</strong></p>
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
        {bidsReceived.map((bid, index) =>
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
    <p><strong>No Bids</strong></p>
    <table>
      <thead>
        <tr>
          <th>auctionId</th>
          <th>bidder</th>
          <th>adUnitCode</th>
          <th>params</th>
        </tr>
      </thead>
      <tbody>
        {noBids.map((bid, index) =>
          <tr key={index}>
            <td key="auctionId">{bid.auctionId}</td>
            <td key="bidder">{bid.bidder}</td>
            <td key="adUnitCode">{bid.adUnitCode}</td>
            <td key="params">{JSON.stringify(bid.params)}</td>
          </tr>
        )}
      </tbody>
    </table>
  </span>
};

interface IPrebidDetailsComponentProps {
  prebid: IPrebidDetails;
}

export default PrebidDetailsBidsComponent;
