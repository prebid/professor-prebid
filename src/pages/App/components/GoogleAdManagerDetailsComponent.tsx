import { IGoogleAdManagerDetails } from "../../../inject/scripts/googleAdManager";
import React from 'react';

class GoogleAdManagerDetailsComponent extends React.Component<IGoogleAdManagerDetailsComponentProps> {
  render() {
    const { googleAdManager } = this.props;
    return (
      <span>
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
      </span>
    );
  }

}
interface IGoogleAdManagerDetailsComponentProps {
  googleAdManager: IGoogleAdManagerDetails;
}

export default GoogleAdManagerDetailsComponent;