import { ITcfDetails } from "../../../inject/scripts/tcf";
import React from 'react';
import { TCString } from '@iabtcf/core';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

const TcfDetailsComponent = ({ tcf }: ITcfDetailsComponentComponentProps): JSX.Element => {
  const tmpTcf = tcf || {};
  return (
    <Box>
      {Object.keys(tmpTcf).map((key, index) =>
        <span key={index}>
          <Typography><strong>Version:</strong> {key}</Typography>
          <Typography><strong>CMP Loaded: </strong> {tmpTcf[key].cmpLoaded}</Typography>
          <Typography><strong>Consent Data:</strong> {tmpTcf[key].consentData}</Typography>
          <Typography><strong>Decoded Data: </strong></Typography> {
            tmpTcf[key].consentData ?
              <pre>{JSON.stringify(TCString.decode(tmpTcf[key].consentData, null), null, 4)}</pre>
              :
              ''
          }
        </span>
      )}
    </Box>
  );
}

interface ITcfDetailsComponentComponentProps {
  tcf: ITcfDetails;
}

export default TcfDetailsComponent;
