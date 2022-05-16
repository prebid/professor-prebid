import React, { useState, useRef } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import theme from '../../pages/theme';
import { ThemeProvider } from '@mui/material/styles';
import Popover from '@mui/material/Popover';
import GamDetailsComponent from './GamDetailsComponent';
import { getMaxZIndex } from './AdMaskPortal';
import HeaderRowComponent from './HeaderRowComponent';
import PrebidDetailsComponent from './PrebidDetailsComponent';

const AdMaskComponent = ({ elementId, winningCPM, winningBidder, currency, timeToRespond, closePortal }: IMaskInputData): JSX.Element => {
  const [expanded, setExpanded] = useState<boolean>(true);
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
  const slotRef = useRef<googletag.Slot>(null);
  const open = Boolean(anchorEl);

  const openInPopOver = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(document.body);
  };

  const closePopOver = () => {
    setAnchorEl(null);
  };

  return (
    <ThemeProvider theme={theme}>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={closePopOver}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'center',
          horizontal: 'center',
        }}
        sx={{
          zIndex: getMaxZIndex() + 10,
          p: 1,
          '& .MuiPopover-paper': {
            backgroundColor: 'primary.light',
          },
        }}
      >
        <Box
          sx={{
            backgroundColor: 'primary.light',
            color: 'text.primary',
            padding: 1,
            flexGrow: 1,
            display: 'flex',
          }}
        >
          <Grid container direction={'row'} rowSpacing={1} columnSpacing={1}>
            <HeaderRowComponent
              elementId={elementId}
              expanded={expanded}
              setExpanded={setExpanded}
              openInPopOver={openInPopOver}
              slotRef={slotRef}
              closePortal={closePortal}
              inPopOver={true}
              closePopOver={closePopOver}
            />
            <Grid container item direction="column" xs={4}>
              <PrebidDetailsComponent currency={currency} winningBidder={winningBidder} winningCPM={winningCPM} timeToRespond={timeToRespond} />
            </Grid>
            <Grid container item direction="column" xs={12}>
              {elementId && <GamDetailsComponent elementId={elementId} inPopOver={true} />}
            </Grid>
          </Grid>
        </Box>
      </Popover>

      <Box
        sx={{
          height: expanded ? 1 : 'auto',
          width: '100%',
          opacity: 0.9,
          '&:hover': { opacity: 1 },
          backgroundColor: 'primary.light',
          color: theme.palette.text.primary,
          padding: 0,
          flexGrow: 1,
        }}
      >
        <Grid
          container
          spacing={0.5}
          sx={{
            textAlign: 'left',
            '& div > div': { p: 0.5 },
          }}
        >
          <HeaderRowComponent
            elementId={elementId}
            expanded={expanded}
            setExpanded={setExpanded}
            openInPopOver={openInPopOver}
            slotRef={slotRef}
            closePortal={closePortal}
            closePopOver={closePopOver}
            inPopOver={false}
          />

          {expanded && (
            <Grid container item xs={12}>
              <PrebidDetailsComponent currency={currency} winningBidder={winningBidder} winningCPM={winningCPM} timeToRespond={timeToRespond} />
              {elementId && <GamDetailsComponent elementId={elementId} inPopOver={false} />}
            </Grid>
          )}
        </Grid>
      </Box>
    </ThemeProvider>
  );
};

export interface IMaskInputData {
  elementId: string;
  creativeRenderTime: number;
  winningBidder: string;
  winningCPM: number;
  currency: string;
  timeToRespond: number;
  closePortal?: () => void;
}

export default AdMaskComponent;
