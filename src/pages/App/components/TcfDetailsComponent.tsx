import { ITcfDetails } from "../../../inject/scripts/tcf";
import React from 'react';
import { TCString, Segment } from '@iabtcf/core';


class TcfDetailsComponent extends React.Component<ITcfDetailsComponentComponentProps> {
  state = { count: 0 };
  render() {
    const { tcf } = this.props;
    return (
      <span>
        {Object.keys(tcf).map((key, index) =>
          <span key={index}>
            <p><strong>Version:</strong> {key}</p>
            <p><strong>CMP Loaded: </strong> {tcf[key].cmpLoaded}</p>
            <p><strong>Consent Granted: </strong> {
              <pre>{JSON.stringify(TCString.decode(tcf[key].consentData, null), null, 4)}</pre>
            }</p>
            <p><strong>ConsentData:</strong> {tcf[key].consentData}</p>
          </span>
        )}
      </span>
    );
  }

}

interface ITcfDetailsComponentComponentProps {
  tcf: ITcfDetails;
}

export default TcfDetailsComponent;