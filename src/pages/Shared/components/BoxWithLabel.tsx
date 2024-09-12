import { Box, IconButton, IconButtonProps, Typography, styled } from '@mui/material';
import React from 'react';
import { SxProps, Theme } from '@mui/system';
import ThreeSixtyOutlinedIcon from '@mui/icons-material/ThreeSixtyOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

export const BoxWithoutLabel = ({ children, sx = {} }: { children: React.ReactNode; sx?: SxProps<Theme> }) => (
  <Box component="fieldset" sx={{ p: 1, border: 1, borderColor: 'primary.light', borderRadius: 1.5, ...sx }}>
    <legend children={<Typography>&nbsp;</Typography>} />
    {children}
  </Box>
);

export const BoxWithLabel = ({ children, label, sx = {} }: { children: React.ReactNode; label: React.ReactNode; sx?: SxProps<Theme> }) => (
  <Box component="fieldset" sx={{ p: 1, border: 1, borderColor: 'primary.light', borderRadius: 1.5, ...sx }}>
    <legend>{label}</legend>
    {children}
  </Box>
);

export const BoxWithLabelAndExpandAndJsonView = ({ children, label, sx = {}, input }: { children: React.FunctionComponent<{ expanded: boolean; jsonView: boolean; input: any }>; label: React.ReactNode; sx?: SxProps<Theme>; input: any }) => {
  const [expanded, setExpanded] = React.useState(false);
  const [jsonView, setJsonView] = React.useState(false);

  return (
    <Box component="fieldset" sx={{ postion: 'relative', p: 1, border: 1, borderColor: 'primary.light', borderRadius: 1.5, ...sx }}>
      <legend>{label}</legend>
      <Box
        sx={{
          marginTop: '-20px',
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
        }}
      >
        <Box />
        <Box>
          {expanded && (
            <IconButton
              onClick={() => setJsonView(!jsonView)}
              sx={{
                transform: !jsonView ? 'scaleX(1)' : 'scaleX(-1)',
                padding: 0,
                transition: 'transform 0.2s',
              }}
            >
              <Box display="flex" flexDirection="column" alignItems="flex-start">
                <ThreeSixtyOutlinedIcon />
                {!jsonView && <Typography variant="caption" sx={{ fontSize: 8, mt: 2.5, position: 'absolute' }} children={'JSON'} />}
              </Box>
            </IconButton>
          )}
          <IconButton
            onClick={() => {
              setExpanded(!expanded);
              if (expanded === true) {
                setJsonView(false);
              }
            }}
            sx={{
              transform: !expanded ? 'scaleY(1)' : 'scaleY(-1)',
              padding: 0,
              transition: 'transform 0.2s',
            }}
            children={<ExpandMoreIcon />}
          />
        </Box>
      </Box>
      {children({ expanded, jsonView, input })}
    </Box>
  );
};

interface ExpandMoreProps extends IconButtonProps {
  expand: boolean;
}
