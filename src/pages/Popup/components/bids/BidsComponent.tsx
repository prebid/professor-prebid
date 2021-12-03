import React from 'react';
import { IPrebidAuctionEndEventData, IPrebidDetails, IPrebidBid } from '../../../../inject/scripts/prebid';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell, { tableCellClasses } from '@mui/material/TableCell';
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
import { styled } from '@mui/material/styles';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Paper from '@mui/material/Paper';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div role="tabpanel" hidden={value !== index} id={`simple-tabpanel-${index}`} aria-labelledby={`simple-tab-${index}`} {...other}>
      {value === index && (
        <Box sx={{ p: 3, padding: 0 }}>
          <Typography component="div">{children}</Typography>
        </Box>
      )}
    </div>
  );
};

const a11yProps = (index: number) => {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
};

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.body}`]: {
    backgroundColor: '#FFF', //theme.palette.primary.contrastText,
    color: theme.palette.common.black,
    margin: 0,
    padding: 0,
    textAlign: 'left',
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:hover': {
    backgroundColor: theme.palette.primary.dark,
  },
}));

const Row = ({ bid }: IRowComponentProps) => {
  const [open, setOpen] = React.useState(false);
  return (
    <React.Fragment>
      <StyledTableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
        <StyledTableCell>
          <IconButton size="small" onClick={() => setOpen(!open)}>
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </StyledTableCell>
        <StyledTableCell>{bid.bidder}</StyledTableCell>
        <StyledTableCell>{bid.width}</StyledTableCell>
        <StyledTableCell>{bid.height}</StyledTableCell>
        <StyledTableCell>{bid.cpm ? Math.floor(bid.cpm * 100) / 100 : bid.cpm}</StyledTableCell>
        <StyledTableCell>{bid.currency}</StyledTableCell>
        <StyledTableCell>{bid.adUnitCode.length > 15 ? bid.adUnitCode.substring(0, 15) + '...' : bid.adUnitCode}</StyledTableCell>
        <StyledTableCell>{bid.size}</StyledTableCell>
      </StyledTableRow>
      <TableRow sx={{ backgroundColor: '#87CEEB' }}>
        <TableCell colSpan={8}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Paper elevation={5} sx={{ margin: '3% 5% 3% 5%', borderRadius: 4, maxWidth: '100%' }}>
              <Table>
                {bid.mediaType && (
                  <TableRow>
                    <TableCell>Media Type</TableCell>
                    <TableCell>{bid.mediaType}</TableCell>
                  </TableRow>
                )}
                {bid.bidder && (
                  <TableRow>
                    <TableCell>Bidder</TableCell>
                    <TableCell>
                      {open}
                      {bid.bidder}
                    </TableCell>
                  </TableRow>
                )}
                {bid.params && (
                  <TableRow>
                    <TableCell>Params</TableCell>
                    <TableCell>
                      <Stack direction="row" sx={{ flexWrap: 'wrap', gap: '5px' }}>
                        {bid.params &&
                          Object.keys(bid.params).map((key) => (
                            <Chip
                              key={key}
                              label={key + ': ' + JSON.stringify(bid.params[key])}
                              color="primary"
                              variant="outlined"
                              size="small"
                              sx={{ maxWidth: '300px' }}
                            />
                          ))}
                      </Stack>
                    </TableCell>
                  </TableRow>
                )}
                {bid.width & bid.height ? (
                  <TableRow>
                    <TableCell>Size</TableCell>
                    <TableCell>
                      {bid.width} x {bid.height}
                    </TableCell>
                  </TableRow>
                ) : (
                  ''
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
                    <TableCell>TTL</TableCell>
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
  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };
  const bidsReceived =
    prebid.events
      .filter((event) => event.eventType === 'auctionEnd')
      .map((event) => (event as IPrebidAuctionEndEventData).args.bidsReceived)
      .flat() || [];
  const noBids =
    prebid.events
      .filter((event) => event.eventType === 'auctionEnd')
      .map((event) => (event as IPrebidAuctionEndEventData).args.noBids)
      .flat() || [];
  return (
    <Box>
      <Box sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={value} onChange={handleChange} aria-label="basic tabs example">
            <Tab label="Received Bids" {...a11yProps(0)} />
            <Tab label="No Bids" {...a11yProps(1)} />
            {/* <Tab label="Auction focus" {...a11yProps(2)} /> */}
          </Tabs>
        </Box>
        <TabPanel value={value} index={0}>
          <TableContainer sx={{ maxWidth: '100%', backgroundColor: '#87CEEB' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <IconButton size="small">
                    <AppsIcon />
                  </IconButton>
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
                  <Row key={index} bid={bid} />
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
        <TabPanel value={value} index={1}>
          <TableContainer sx={{ maxWidth: '100%', backgroundColor: '#87CEEB' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <IconButton size="small">
                    <AppsIcon />
                  </IconButton>
                  <TableCell>Bidder</TableCell>
                  <TableCell>AdUnit Code</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {noBids.map((bid, index) => (
                  <Row key={index} bid={bid} />
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
        <TabPanel value={value} index={2}>
          <TableContainer sx={{ maxWidth: '100%', backgroundColor: '#87CEEB' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <IconButton size="small">
                    <AppsIcon />
                  </IconButton>
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
                  <Row key={index} bid={bid} />
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
      </Box>
    </Box>
  );
};

interface IBidsComponentProps {
  prebid: IPrebidDetails;
}

interface IRowComponentProps {
  bid: IPrebidBid;
}

export default BidsComponent;
