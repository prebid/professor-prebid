import { ITcfDetails } from "../../../inject/scripts/tcf";
import React from 'react';
const TcfDetailsComponent: React.FC<ITcfDetailsComponentComponentProps> = ({ tcf }) => {
  return (
    <span>
      <h2>IAB TCF Details</h2>
      {Object.keys(tcf).map((key, index) =>
        <span key={index}>
          <h3>Version: {key}</h3>
          <h3>CMP Loaded: {tcf[key].cmpLoaded}</h3>
          <h3>ConsentData: {tcf[key].consentData}</h3>
        </span>
      )}
    </span>
  );
}

interface ITcfDetailsComponentComponentProps {
  tcf: ITcfDetails;
}

export default TcfDetailsComponent;