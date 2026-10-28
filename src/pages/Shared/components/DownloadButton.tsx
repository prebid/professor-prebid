import React from 'react';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import DownloadIcon from '@mui/icons-material/Download';
import { download } from '../utils';

interface IDownloadButtonProps {
  /** What to save; a function is called only when the button is clicked. */
  data: object | (() => object);
  fileName: string;
  tooltip: string;
}

/** Saves a tab's data as a JSON file; sized for the toolbar next to a tab's search field. */
export const DownloadButton = ({ data, fileName, tooltip }: IDownloadButtonProps): JSX.Element => (
  <Tooltip title={tooltip} arrow>
    <IconButton size="small" onClick={() => download(typeof data === 'function' ? data() : data, fileName)} sx={{ p: 0.5, fontSize: '1.05rem', height: 'auto' }}>
      <DownloadIcon fontSize="inherit" />
    </IconButton>
  </Tooltip>
);
