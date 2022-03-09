import React, { useEffect } from 'react';
import { IPrebidAuctionEndEventData, IPrebidDetails, IPrebidBid } from '../../../../inject/scripts/prebid';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import AppsIcon from '@mui/icons-material/Apps';
import Chip from '@mui/material/Chip';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Paper from '@mui/material/Paper';
import ReactJson from 'react-json-view';
import Grid from '@mui/material/Grid';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;
  return (
    <Box role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Typography component="div">{children}</Typography>}
    </Box>
  );
};

const Row = ({ bid, globalOpen }: IRowComponentProps) => {
  const [open, setOpen] = React.useState(false);
  useEffect(() => {
    setOpen(globalOpen);
  }, [globalOpen]);
  return (
    <React.Fragment>
      <TableRow
        sx={{
          '& > *': { borderBottom: 'unset' },
          '&:hover': {
            backgroundColor: 'primary.main',
          },
        }}
      >
        <TableCell>
          <IconButton size="small" onClick={() => setOpen(!open)}>
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell variant="body">
          <Typography variant="body1">{bid.bidder} </Typography>
        </TableCell>
        <TableCell variant="body">
          <Typography variant="body1">{bid.cpm ? Math.floor(bid.cpm * 100) / 100 : bid.cpm}</Typography>
        </TableCell>
        <TableCell variant="body">
          <Typography variant="body1">{bid.currency}</Typography>
        </TableCell>
        <TableCell variant="body">
          <Typography variant="body1">{bid.adUnitCode.length > 15 ? bid.adUnitCode.substring(0, 15) + '...' : bid.adUnitCode}</Typography>
        </TableCell>
        <TableCell variant="body">
          <Typography variant="body1">{bid.size}</Typography>
        </TableCell>
      </TableRow>
      <TableRow sx={{ backgroundColor: 'primary.light' }}>
        <TableCell colSpan={8}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Paper elevation={1} sx={{ m: 1, borderRadius: 4, maxWidth: 1 }}>
              <Table>
                <TableBody>
                  {bid.mediaType && (
                    <TableRow>
                      <TableCell>Media Type</TableCell>
                      <TableCell>{bid.mediaType}</TableCell>
                    </TableRow>
                  )}
                  {bid.bidder && (
                    <TableRow>
                      <TableCell>Bidder</TableCell>
                      <TableCell>{bid.bidder}</TableCell>
                    </TableRow>
                  )}
                  {bid.params && (
                    <TableRow>
                      <TableCell>Params</TableCell>
                      <TableCell>
                        {bid.params && (
                          <ReactJson
                            src={bid.params}
                            name={false}
                            collapsed={false}
                            enableClipboard={false}
                            displayObjectSize={false}
                            displayDataTypes={false}
                            sortKeys={false}
                            quotesOnKeys={false}
                            indentWidth={2}
                            collapseStringsAfterLength={100}
                            style={{ fontSize: '12px', fontFamily: 'roboto', padding: '5px' }}
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                  {bid.width && bid.height && (
                    <TableRow>
                      <TableCell>Size</TableCell>
                      <TableCell>
                        {bid.width} x {bid.height}
                      </TableCell>
                    </TableRow>
                  )}
                  {bid.originalCpm && (
                    <TableRow>
                      <TableCell>Org. Cpm</TableCell>
                      <TableCell>{Math.floor(bid.originalCpm * 100) / 100}</TableCell>
                    </TableRow>
                  )}
                  {bid.originalCurrency && (
                    <TableRow>
                      <TableCell>Org. Currency</TableCell>
                      <TableCell>{bid.originalCurrency}</TableCell>
                    </TableRow>
                  )}
                  {bid.timeToRespond && (
                    <TableRow>
                      <TableCell>Time to Respond</TableCell>
                      <TableCell>{bid.timeToRespond}</TableCell>
                    </TableRow>
                  )}
                  {bid.statusMessage && (
                    <TableRow>
                      <TableCell>Status Message</TableCell>
                      <TableCell>{bid.statusMessage}</TableCell>
                    </TableRow>
                  )}
                  {bid.adUnitCode && (
                    <TableRow>
                      <TableCell>AdUnit Code</TableCell>
                      <TableCell>{bid.adUnitCode}</TableCell>
                    </TableRow>
                  )}
                  {bid.source && (
                    <TableRow>
                      <TableCell>Source</TableCell>
                      <TableCell>{bid.source}</TableCell>
                    </TableRow>
                  )}
                  {bid.ttl && (
                    <TableRow>
                      <TableCell>Bid Cache Period (seconds)</TableCell>
                      <TableCell>{bid.ttl}</TableCell>
                    </TableRow>
                  )}
                  {bid.adserverTargeting && (
                    <TableRow>
                      <TableCell>Adserver Targeting</TableCell>
                      <TableCell>
                        <Stack direction="column" sx={{ flexWrap: 'wrap', gap: '5px' }}>
                          {bid.adserverTargeting &&
                            Object.keys(bid.adserverTargeting).map((key) => (
                              <Chip key={key} label={key + ': ' + bid.adserverTargeting[key]} size="small" sx={{ maxWidth: '300px' }} />
                            ))}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Paper>
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
};

const BidsComponent = ({ prebid }: IBidsComponentProps): JSX.Element => {
  const [value, setValue] = React.useState(0);
  const [globalOpen, setGlobalOpen] = React.useState(false);
  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };
  const bidsReceived =
    prebid.events
      ?.filter((event) => event.eventType === 'auctionEnd')
      .map((event) => (event as IPrebidAuctionEndEventData).args.bidsReceived)
      .flat() || [];
  const noBids =
    prebid.events
      ?.filter((event) => event.eventType === 'auctionEnd')
      .map((event) => (event as IPrebidAuctionEndEventData).args.noBids)
      .flat() || [];
  return (
    <React.Fragment>
      <Grid container direction="row" justifyContent="start" spacing={1} sx={{ p: 1 }}>
        <Grid item xs={12}>
          <Tabs value={value} onChange={handleChange} sx={{ minHeight: 0, '& > div > div > button': { minHeight: 0 } }}>
            <Tab
              sx={{ p: 0, justifyContent: 'flex-start' }}
              label={
                <Typography
                  variant="h2"
                  component={Paper}
                  sx={{ p: 1, border: '1px solid', borderColor: value === 0 ? 'primary.light' : 'info.main' }}
                >
                  Received Bids
                </Typography>
              }
            />
            <Tab
              sx={{ p: 0, justifyContent: 'flex-start' }}
              label={
                <Typography
                  variant="h2"
                  component={Paper}
                  sx={{ p: 1, border: '1px solid', borderColor: value === 1 ? 'primary.light' : 'info.main' }}
                >
                  No Bids
                </Typography>
              }
            />
          </Tabs>
        </Grid>
        {value === 0 && (
          <Grid item xs={12}>
            <TabPanel value={value} index={0}>
              <TableContainer sx={{ maxWidth: 1, backgroundColor: 'background.paper', borderRadius: 1}}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>
                        <IconButton onClick={(event) => setGlobalOpen(!globalOpen)} size="small">
                          <AppsIcon />
                        </IconButton>
                      </TableCell>
                      <TableCell variant="head">
                        <Typography variant="h3">Bidder Code</Typography>
                      </TableCell>
                      <TableCell variant="head">
                        <Typography variant="h3">Cpm</Typography>
                      </TableCell>
                      <TableCell variant="head">
                        <Typography variant="h3">Currency</Typography>
                      </TableCell>
                      <TableCell variant="head">
                        <Typography variant="h3">AdUnit Code</Typography>
                      </TableCell>
                      <TableCell variant="head">
                        <Typography variant="h3">Size</Typography>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {bidsReceived.map((bid, index) => (
                      <Row key={index} bid={bid} globalOpen={globalOpen} />
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </TabPanel>
          </Grid>
        )}
        {value === 1 && (
          <Grid item xs={12}>
            <TabPanel value={value} index={1}>
              <TableContainer sx={{ maxWidth: 1, backgroundColor: 'background.paper' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell variant="head">
                        <IconButton onClick={(event) => setGlobalOpen(!globalOpen)} size="small">
                          <AppsIcon />
                        </IconButton>
                      </TableCell>
                      <TableCell variant="head">
                        <Typography variant="h3">Bidder</Typography>
                      </TableCell>
                      <TableCell variant="head"></TableCell>
                      <TableCell variant="head"></TableCell>
                      <TableCell variant="head">
                        <Typography variant="h3">AdUnit Code</Typography>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {noBids.map((bid, index) => (
                      <Row key={index} bid={bid} globalOpen={globalOpen} />
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </TabPanel>
          </Grid>
        )}
        {value === 2 && (
          <Grid item xs={12}>
            <TabPanel value={value} index={2}>
              <TableContainer sx={{ maxWidth: 1, backgroundColor: 'background.paper' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>
                        <IconButton onClick={(event) => setGlobalOpen(!globalOpen)} size="small">
                          <AppsIcon />
                        </IconButton>
                      </TableCell>
                      <TableCell>Bidder Code</TableCell>
                      <TableCell>Width</TableCell>
                      <TableCell>Height</TableCell>
                      <TableCell>Cpm</TableCell>
                      <TableCell>Currency</TableCell>
                      <TableCell>AdUnit Code</TableCell>
                      <TableCell>Size</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {bidsReceived.map((bid, index) => (
                      <Row key={index} bid={bid} globalOpen={globalOpen} />
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </TabPanel>
          </Grid>
        )}
      </Grid>
    </React.Fragment>
  );
};

interface IBidsComponentProps {
  prebid: IPrebidDetails;
}

interface IRowComponentProps {
  bid: IPrebidBid;
  globalOpen: boolean;
}

export default BidsComponent;
