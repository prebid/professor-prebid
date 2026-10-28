import React from 'react';
import DownloadIcon from '@mui/icons-material/Download';
import { download } from '../utils';
import { ToolbarButton } from './TabToolbar';

interface IDownloadButtonProps {
  /** What to save; a function is called only when the button is clicked. */
  data: object | (() => object);
  fileName: string;
  tooltip: string;
}

/** Saves a tab's data as a JSON file. */
export const DownloadButton = ({ data, fileName, tooltip }: IDownloadButtonProps): JSX.Element => <ToolbarButton tooltip={tooltip} onClick={() => download(typeof data === 'function' ? data() : data, fileName)} icon={<DownloadIcon fontSize="inherit" />} />;
