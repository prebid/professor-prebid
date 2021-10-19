import { ITcfDetails } from "../../../inject/scripts/tcf";
import React from 'react';
import { TCString } from '@iabtcf/core';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Checkbox from '@mui/material/Checkbox';

const TcfDetailsComponent = ({ tcf }: ITcfDetailsComponentComponentProps): JSX.Element => {
  const tmpTcf = tcf || {};
  return (
    <Box gap="15px">
      {Object.keys(tmpTcf).map((key, index) =>
        <Box key={index}>
          <Typography><strong>Version:</strong> {key}</Typography>
          <Typography><strong>CMP Loaded: </strong> <Checkbox checked={tmpTcf[key].cmpLoaded}></Checkbox>
          </Typography>
          <TextField
            label="Consent Data:"
            multiline
            defaultValue="no consent string found"
            variant="outlined" value={tmpTcf[key].consentData}
            sx={{ width: '100%' }}
          />
          <TextField
            label="Decoded Data: "
            multiline
            defaultValue="no consent string found" variant="outlined"
            value={JSON.stringify(TCString.decode(tmpTcf[key].consentData, null), null, 4)}
            sx={{ width: '100%' }}
          />
        </Box>
      )}
    </Box>
  );
}

interface ITcfDetailsComponentComponentProps {
  tcf: ITcfDetails;
}

export default TcfDetailsComponent;
