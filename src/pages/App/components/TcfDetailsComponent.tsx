import { ITcfDetails } from "../../../inject/scripts/tcf";
import React from 'react';
import { TCString } from '@iabtcf/core';

const TcfDetailsComponent = ({ tcf }: ITcfDetailsComponentComponentProps): JSX.Element => {
  const tmpTcf = tcf || {};
  return (
    <span>
      {Object.keys(tmpTcf).map((key, index) =>
        <span key={index}>
          <p><strong>Version:</strong> {key}</p>
          <p><strong>CMP Loaded: </strong> {tmpTcf[key].cmpLoaded}</p>
          <p><strong>Consent Data:</strong> {tmpTcf[key].consentData}</p>
          <p><strong>Decoded Data: </strong></p> {
            tmpTcf[key].consentData ?
              <pre>{JSON.stringify(TCString.decode(tmpTcf[key].consentData, null), null, 4)}</pre>
              :
              ''
          }
        </span>
      )}
    </span>
  );
}

interface ITcfDetailsComponentComponentProps {
  tcf: ITcfDetails;
}

export default TcfDetailsComponent;
