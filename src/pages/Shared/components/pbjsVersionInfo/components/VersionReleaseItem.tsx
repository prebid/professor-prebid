import React from 'react';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Link from '@mui/material/Link';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LaunchIcon from '@mui/icons-material/Launch';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import ReactMarkdown from 'react-markdown';
import { timeFromNow } from '../../../utils';

export interface ReleaseItemProps {
  version: {
    tag_name?: string;
    name?: string | any;
    published_at: string;
    html_url: string;
    body?: string;
  };
  expanded: boolean;
  onToggle: () => void;
  formatDate: (date: string) => string;
}

export const VersionReleaseItem: React.FC<ReleaseItemProps> = ({ version, expanded, onToggle, formatDate }) => {
  const tagName = version.tag_name || (typeof version.name === 'string' ? version.name.split(' ')[0] : 'Release');
  const cleanTag = tagName.startsWith('v') ? tagName : `v${tagName}`;
  const releaseTitle = typeof version.name === 'string' && version.name ? version.name : cleanTag;
  const publishedDate = version.published_at ? formatDate(version.published_at) : '';
  const relativeDate = version.published_at ? timeFromNow(version.published_at) : '';

  const markdownContent = version.body || '';

  return (
    <Accordion
      expanded={expanded}
      onChange={onToggle}
      disableGutters
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: '4px !important',
        mb: 0.75,
        '&:before': { display: 'none' },
        overflow: 'hidden',
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon fontSize="small" />}
        sx={{
          minHeight: 42,
          py: 0.5,
          px: 1.25,
          backgroundColor: expanded ? 'action.selected' : 'background.paper',
          '& .MuiAccordionSummary-content': { my: 0.5, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Chip size="small" label={cleanTag} color="primary" variant={expanded ? 'filled' : 'outlined'} sx={{ fontWeight: 700, fontSize: '0.75rem', height: 22 }} />
          <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
            {releaseTitle}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary', mr: 1 }}>
          <CalendarTodayOutlinedIcon sx={{ fontSize: 12 }} />
          <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
            {publishedDate} {relativeDate ? `(${relativeDate})` : ''}
          </Typography>
        </Box>
      </AccordionSummary>

      <AccordionDetails sx={{ p: 1.5, pt: 1, backgroundColor: 'background.paper', borderTop: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
          <Link
            href={version.html_url}
            target="_blank"
            rel="noreferrer"
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.5,
              fontSize: '0.75rem',
              fontWeight: 600,
              textDecoration: 'none',
              '&:hover': { textDecoration: 'underline' },
            }}
          >
            View on GitHub <LaunchIcon sx={{ fontSize: 12 }} />
          </Link>
        </Box>

        <Box
          className="version-release__changelog-body"
          sx={{
            fontSize: '0.8rem',
            lineHeight: 1.5,
            '& h1, & h2, & h3, & h4': {
              fontSize: '0.85rem',
              fontWeight: 700,
              mt: 1,
              mb: 0.5,
              color: 'text.primary',
            },
            '& ul, & ol': {
              my: 0.5,
              pl: 2.25,
            },
            '& li': {
              mb: 0.25,
              fontSize: '0.78rem',
              lineHeight: 1.45,
            },
            '& a': {
              color: 'primary.main',
              textDecoration: 'none',
              '&:hover': { textDecoration: 'underline' },
            },
            '& code': {
              fontFamily: 'monospace',
              fontSize: '0.75rem',
              px: 0.5,
              py: 0.1,
              borderRadius: '3px',
              backgroundColor: 'action.hover',
              border: '1px solid',
              borderColor: 'divider',
            },
            '& p': {
              my: 0.5,
              fontSize: '0.78rem',
            },
          }}
        >
          {markdownContent ? (
            <ReactMarkdown>{markdownContent}</ReactMarkdown>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No changelog description provided.
            </Typography>
          )}
        </Box>
      </AccordionDetails>
    </Accordion>
  );
};

export default VersionReleaseItem;
