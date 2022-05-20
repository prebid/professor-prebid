import React, { useEffect } from 'react';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Close from '@mui/icons-material/Close';
import Refresh from '@mui/icons-material/Refresh';
import MinimizeIcon from '@mui/icons-material/Minimize';
import MaximizeIcon from '@mui/icons-material/Maximize';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';

const HeaderRow = ({
  elementId,
  expanded,
  setExpanded,
  openInPopOver,
  closePortal,
  inPopOver,
  closePopOver,
}: IHeaderRowProps): JSX.Element => {
  const [slot, setSlot] = React.useState<googletag.Slot>(null);
  useEffect(() => {
    if (googletag && typeof googletag?.pubads === 'function') {
      const pubads = googletag.pubads();
      const slots = pubads.getSlots();
      const slot = slots.find((slot) => slot.getSlotElementId() === elementId);
      if (slot) {
        setSlot(slot);
      }
    }
  }, [elementId]);
  return (
    <Grid container item justifyContent="space-between" alignItems="flex-start" xs={12}>
      <Grid item xs={8}>
        <Typography variant="h3" sx={{ wordWrap: 'break-word' }}>
          {elementId}
        </Typography>
      </Grid>
      <Grid
        item
        sx={{
          flexDirection: 'row',
          justifyContent: 'flex-end',
          alignItems: 'flex-start',
          color: 'text.secondary',
          p: '0 !important',
        }}
      >
        {!inPopOver && (
          <IconButton sx={{ p: 0 }} onClick={() => setExpanded(!expanded)}>
            {expanded && <MinimizeIcon sx={{ p: 0, fontSize: 12 }} />}
            {!expanded && <MaximizeIcon sx={{ p: 0, fontSize: 12 }} />}
          </IconButton>
        )}
        {!inPopOver && (
          <IconButton sx={{ p: 0 }} onClick={openInPopOver}>
            <OpenInFullIcon sx={{ p: 0, fontSize: 12 }} />
          </IconButton>
        )}
        {typeof googletag?.pubads === 'function' && (
          <IconButton
            sx={{ p: 0, fontSize: 12 }}
            onClick={() => {
              googletag.pubads().refresh([slot]);
            }}
          >
            <Refresh sx={{ p: 0, fontSize: 12 }} />
          </IconButton>
        )}

        {inPopOver && (
          <IconButton sx={{ p: 0, fontSize: 12 }} onClick={closePopOver}>
            <Close sx={{ p: 0, fontSize: 12 }} />
          </IconButton>
        )}
        {!inPopOver && (
          <IconButton sx={{ p: 0, fontSize: 12 }} onClick={closePortal}>
            <Close sx={{ p: 0, fontSize: 12 }} />
          </IconButton>
        )}
      </Grid>
    </Grid>
  );
};

interface IHeaderRowProps {
  elementId: string;
  expanded: boolean;
  setExpanded: any;
  openInPopOver: (event: React.MouseEvent<HTMLButtonElement>) => void;
  closePopOver: (event: React.MouseEvent<HTMLButtonElement>) => void;
  closePortal: (event: React.MouseEvent<HTMLButtonElement>) => void;
  inPopOver: boolean;
}

export default HeaderRow;
