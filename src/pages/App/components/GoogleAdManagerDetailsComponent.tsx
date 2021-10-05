import { IGoogleAdManagerDetails } from "../../../inject/scripts/googleAdManager";
import React from 'react';

class GoogleAdManagerDetailsComponent extends React.Component<IGoogleAdManagerDetailsComponentProps> {
  render() {
    const { googleAdManager } = this.props;
    return (
      <span>
        <p><strong>Request Mode: </strong>{(googleAdManager?.sra) ? 'Single Request Architecture' : 'something else like Multi Request Architecture? '}</p>
        <p><strong>Render Mode: </strong>{(googleAdManager?.async) ? 'Asynchronous' : 'Synchronous'}</p>
        <p><strong>Fetch Before Request: </strong>{(googleAdManager?.fetchBeforeRefresh) ? 'YES' : 'NO'}</p>
        <p><strong>Fetch Before Key/Value: </strong>{(googleAdManager?.fetchBeforeKeyvalue) ? 'YES' : 'NO'}</p>

        <table>
          <thead>
            <tr>
              <th>element_id</th>
              <th>creativeRenderTime</th>
              <th>name</th>
              <th>sizes</th>
              <th>targeting</th>
            </tr>
          </thead>
          <tbody>
            {googleAdManager?.slots.map((slot, index) =>
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