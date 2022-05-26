import React, { useEffect } from 'react';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Close from '@mui/icons-material/Close';
import Refresh from '@mui/icons-material/Refresh';
import MinimizeIcon from '@mui/icons-material/Minimize';
import MaximizeIcon from '@mui/icons-material/Maximize';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';

const HeaderRow = ({ elementId, expanded, setExpanded, openInPopOver, closePortal, inPopOver, closePopOver }: IHeaderRowProps): JSX.Element => {
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
    <Grid container justifyContent="space-between" alignItems="flex-start" spacing={0}>
      <Grid item xs={8}>
        <Typography variant="h3" sx={{ wordWrap: 'break-word', textAlign: 'left', px: 0.5 }}>
          {elementId}
        </Typography>
      </Grid>
      <Grid
        item
        sx={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'flex-end',
          alignItems: 'flex-end',
          color: 'text.secondary',
        }}
        xs={4}
      >
        {!inPopOver && (
          <IconButton sx={{ p: 0 }} onClick={() => setExpanded(!expanded)}>
            {expanded && <MinimizeIcon sx={{ fontSize: 14 }} />}
            {!expanded && <MaximizeIcon sx={{ fontSize: 14 }} />}
          </IconButton>
        )}
        {!inPopOver && (
          <IconButton sx={{ p: 0 }} onClick={openInPopOver}>
            <OpenInFullIcon sx={{ fontSize: 14 }} />
          </IconButton>
        )}
        {typeof googletag?.pubads === 'function' && (
          <IconButton
            sx={{ p: 0 }}
            onClick={() => {
              googletag.pubads().refresh([slot]);
            }}
          >
            <Refresh sx={{ fontSize: 14 }} />
          </IconButton>
        )}
        {inPopOver && (
          <IconButton sx={{ p: 0 }} onClick={closePopOver}>
            <Close sx={{ fontSize: 14 }} />
          </IconButton>
        )}
        {!inPopOver && (
          <IconButton sx={{ p: 0 }} onClick={closePortal}>
            <Close sx={{ fontSize: 14 }} />
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
