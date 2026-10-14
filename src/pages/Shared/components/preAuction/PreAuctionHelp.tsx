import React, { useState } from 'react';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Collapse from '@mui/material/Collapse';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

import { ATTRIBUTION_HELP, ATTRIBUTION_LABEL, VERDICT_HELP, verdictLabel, VERDICT_COLOR } from './labels';
import { AttributionSource } from './harCorrelation';
import { LandedVerdict } from './providerDiagnostics';

const Section = ({ title, children }: { title: string; children: React.ReactNode }): JSX.Element => (
  <Box sx={{ mb: 1.5 }}>
    <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.75rem', mb: 0.5 }}>
      {title}
    </Typography>
    {children}
  </Box>
);

const LegendRow = ({ chip, children }: { chip: React.ReactNode; children: React.ReactNode }): JSX.Element => (
  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 0.5 }}>
    <Box sx={{ minWidth: 130, flexShrink: 0, pt: '1px' }}>{chip}</Box>
    <Typography variant="body2" sx={{ fontSize: '0.72rem' }}>
      {children}
    </Typography>
  </Box>
);

const chipSx = { height: 20, fontSize: '0.65rem' };

const PreAuctionHelp = (): JSX.Element => {
  const [open, setOpen] = useState(false);

  return (
    <Grid size={{ xs: 12 }} sx={{ mb: 0.5 }}>
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
        <Box onClick={() => setOpen(!open)} sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 0.75, cursor: 'pointer', userSelect: 'none' }}>
          <HelpOutlineIcon fontSize="small" color="primary" />
          <Typography variant="body1" sx={{ fontWeight: 700, flexGrow: 1 }}>
            How this works — what each chip means and how far to trust it
          </Typography>
          <IconButton size="small" aria-label={open ? 'hide explanation' : 'show explanation'} aria-expanded={open}>
            <KeyboardArrowDownIcon fontSize="small" sx={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </IconButton>
        </Box>

        <Collapse in={open} timeout="auto" unmountOnExit>
          <Box sx={{ px: 1.5, pb: 1.5, pt: 0.5, borderTop: '1px dashed', borderColor: 'divider' }}>
            <Section title="What this answers">
              <Typography variant="body2" sx={{ fontSize: '0.72rem' }}>
                For every configured Real-Time Data and identity module: did prebid <strong>wait</strong> for it before calling bidders, did its data actually <strong>reach</strong> the auction, and did its network response <strong>arrive in time</strong>?
              </Typography>
            </Section>

            <Section title="Was it awaited? — certain, read from config">
              <LegendRow chip={<Chip label="awaited" size="small" color="success" sx={chipSx} />}>
                Prebid blocks the auction for this provider, but only up to the configured <code>auctionDelay</code>. It is a timeout, never a guarantee — the auction proceeds when it expires.
              </LegendRow>
              <LegendRow chip={<Chip label="NOT awaited" size="small" color="error" sx={chipSx} />}>
                Prebid provably never waits. An RTD provider is awaited only with <code>waitForIt: true</code> <em>and</em> <code>realTimeData.auctionDelay &gt; 0</code>; identity modules only with <code>userSync.auctionDelay &gt; 0</code>. Anything this
                provider returns reaches an auction only if it happens to arrive first.
              </LegendRow>
            </Section>

            <Section title="Did its data reach the auction? — one chip per auction">
              {(['landed', 'late', 'never', 'unknown'] as LandedVerdict[]).map((verdict) => (
                <LegendRow key={verdict} chip={<Chip label={`#1 ${verdictLabel(verdict)}`} size="small" color={VERDICT_COLOR[verdict]} variant="outlined" sx={chipSx} />}>
                  {VERDICT_HELP[verdict]}
                </LegendRow>
              ))}
              <Typography variant="body2" sx={{ fontSize: '0.72rem', mt: 0.5 }}>
                For identity modules this is <strong>exact</strong> — the EID <code>source</code> is compared string for string against each auction’s bidder requests. For RTD it depends on the module: where prebid’s own source shows the path it writes to (
                <code>ortb2Imp.ext.data.&lt;vendor&gt;</code> and the like) a value found there is <strong>proof</strong>, and its absence is proof too. The rest fall back to matching the module name against ortb2 segment names, which is{' '}
                <strong>best effort</strong> — those providers may also contribute through bid params, which is not tracked.
              </Typography>
            </Section>

            <Section title="Did the response arrive in time? — needs the DevTools panel">
              <LegendRow chip={<Chip label="#1 340ms early" size="small" color="success" variant="outlined" sx={chipSx} />}>
                Its last request that had started before bidding began finished this long <em>before</em> the first bidder was called.
              </LegendRow>
              <LegendRow chip={<Chip label="#1 +210ms late" size="small" color="error" sx={{ ...chipSx, fontWeight: 700 }} />}>
                A request was still in flight this long <em>after</em> the first bidder was called, so it could not have been used for that auction.
              </LegendRow>
              <LegendRow chip={<Chip label="#1 no request" size="small" sx={chipSx} />}>This provider had not made any request at all by the time bidding started.</LegendRow>
              <LegendRow chip={<Chip label="no requests" size="small" variant="outlined" sx={{ ...chipSx, color: 'text.secondary', borderStyle: 'dashed' }} />}>
                No captured request was attributed to this provider. Not every provider makes one. Unattributed requests are listed at the foot of the page.
              </LegendRow>
              <Typography variant="body2" sx={{ fontSize: '0.72rem', mt: 0.5 }}>
                Each auction is judged only against requests that had already started when it began bidding — a sync fired afterwards says nothing about whether that auction got its data.
              </Typography>
            </Section>

            <Section title="How confident is the network attribution?">
              {(['endpoint', 'host'] as AttributionSource[]).map((source) => (
                <LegendRow key={source} chip={<Chip label={ATTRIBUTION_LABEL[source]} size="small" variant="outlined" color={source === 'host' ? 'default' : 'primary'} sx={chipSx} />}>
                  {ATTRIBUTION_HELP[source]}
                </LegendRow>
              ))}
            </Section>

            <Section title="Limits worth knowing">
              <Typography variant="body2" component="div" sx={{ fontSize: '0.72rem' }}>
                <Box component="ul" sx={{ m: 0, pl: 2 }}>
                  <li>Verdicts come from config and auction data and hold everywhere. Network timings need the DevTools panel, and DevTools only sees traffic while it is open — open it before loading the page.</li>
                  <li>A provider with no endpoint is not necessarily broken: some resolve from a first-party cookie or a browser API and make no request at all.</li>
                  <li>Where a provider could not be identified, nothing is claimed rather than guessed. Unattributed requests and EID sources are listed at the foot of the page.</li>
                </Box>
              </Typography>
            </Section>
          </Box>
        </Collapse>
      </Paper>
    </Grid>
  );
};

export default PreAuctionHelp;
