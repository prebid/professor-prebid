import { Typography } from '@mui/material';
import React from 'react';

export const InfoItem = ({ label, content, href }: { label: React.ReactNode; content: React.ReactNode; href?: string }) => {
  if (!content || JSON.stringify(content) === '{}') return null;
  if (!label) return null;

  if (href)
    return (
      <Typography variant="body1">
        <b>{label}: </b>
        <a href={href} target="_blank">
          {content}
        </a>
      </Typography>
    );

  return (
    <Typography variant="body1">
      <b>{label}: </b>
      {content}
    </Typography>
  );
};
