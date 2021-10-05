import React from 'react';
import { IPrebidDetails } from "../../../../inject/scripts/prebid";
const PrebidDetailsSlotsComponent = ({ prebid }: IPrebidDetailsComponentProps): JSX.Element => {
  const adUnits = prebid.events.filter(event => event.eventType === 'auctionEnd').map(event => event.args.adUnits).flat();
  return <span>
    <h2>Prebid Slots</h2>
    <table>
      <thead>
        <tr>
          <th>code</th>
          <th>mediaTypes</th>
          <th>bid</th>
        </tr>
      </thead>
      <tbody>
        {adUnits.map(adUnit =>
          <tr key={`${Math.random() * Math.random()}`}>
            <td>{adUnit.code}</td>
            <td>{JSON.stringify(adUnit.mediaTypes)}</td>
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
                  {adUnit.bids.map((bid, index) =>
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
  </span>
};

interface IPrebidDetailsComponentProps {
  prebid: IPrebidDetails;
}

export default PrebidDetailsSlotsComponent;
