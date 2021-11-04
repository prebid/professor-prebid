import React from 'react';
import { IPrebidDetails } from "../../../../inject/scripts/prebid";
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
import Chip from '@mui/material/Chip';
import { styled } from '@mui/material/styles';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 , padding: 0}}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}



const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.body}`]: {
    backgroundColor: '#6689CC',
    color: theme.palette.common.white,
    margin: 1,
    padding: 1
  }
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  "&:hover": {
    backgroundColor: theme.palette.primary.light
  }
}));

const Row = ({ bid }: any) => {
  const [open, setOpen] = React.useState(false);
  return (
    <React.Fragment>
      <StyledTableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
        <StyledTableCell>
          <IconButton size="small" onClick={() => setOpen(!open)}>
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </StyledTableCell>
        <StyledTableCell>{bid.bidderCode}</StyledTableCell>
        <StyledTableCell>{bid.width}</StyledTableCell>
        <StyledTableCell>{bid.height}</StyledTableCell>
        <StyledTableCell>{bid.cpm ? (Math.floor(bid.cpm * 100) / 100) : bid.cpm}</StyledTableCell>
        <StyledTableCell>{bid.currency}</StyledTableCell>
        <StyledTableCell>{bid.adUnitCode}</StyledTableCell>
        <StyledTableCell>{bid.size}</StyledTableCell>
      </StyledTableRow>
      <TableRow>
        {/* <TableCell></TableCell> */}
        <TableCell colSpan={8}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Bidder</TableCell>
                  <TableCell>Org. Cpm</TableCell>
                  <TableCell>Org. Currency</TableCell>
                  <TableCell>Time to Respond</TableCell>
                  <TableCell>Status Message</TableCell>
                  <TableCell>Media Type</TableCell>
                  <TableCell>Source</TableCell>
                  <TableCell>TTL</TableCell>
                  <TableCell>Adserver Targeting</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>{bid.bidder}</TableCell>
                  <TableCell>{Math.floor(bid.originalCpm * 100) / 100}</TableCell>
                  <TableCell>{bid.originalCurrency}</TableCell>
                  <TableCell>{bid.timeToRespond}</TableCell>
                  <TableCell>{bid.statusMessage}</TableCell>
                  <TableCell>{bid.mediaType}</TableCell>
                  <TableCell>{bid.source}</TableCell>
                  <TableCell>{bid.ttl}</TableCell>
                  <TableCell>
                    <Stack direction="row" sx={{ flexWrap: 'wrap', gap: '5px', }}>
                      {bid.adserverTargeting && Object.keys(bid.adserverTargeting).map(key =>
                        <Chip key={key} label={key + ': ' + bid.adserverTargeting[key]} size="small" sx={{ maxWidth: '110px' }} />
                      )}</Stack>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  )
}

const BidsComponent = ({ prebid }: IBidsComponentProps): JSX.Element => {
  const [value, setValue] = React.useState(0);
  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };
  const bidsReceived = prebid.events.filter(event => event.eventType === 'auctionEnd').map(event => event.args.bidsReceived).flat() || [];
  const noBids = prebid.events.filter(event => event.eventType === 'auctionEnd').map(event => event.args.noBids).flat() || [];
  return (
    <Box>
      <Box sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={value} onChange={handleChange} aria-label="basic tabs example">
            <Tab label="Received Bids" {...a11yProps(0)} />
            <Tab label="No Bids" {...a11yProps(1)} />
          </Tabs>
        </Box>
        <TabPanel value={value} index={0}>
          <TableContainer sx={{ width: '100%', maxWidth: '100%' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell />
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
                {bidsReceived.map((bid, index) =>
                  <Row key={index} bid={bid} />
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
        <TabPanel value={value} index={1}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>auctionId</TableCell>
                  <TableCell>bidder</TableCell>
                  <TableCell>adUnitCode</TableCell>
                  <TableCell>params</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {noBids.map((bid, index) => (
                  <TableRow key={index} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell component="th" scope="row">{bid.auctionId}</TableCell>
                    <TableCell>{bid.bidder}</TableCell>
                    <TableCell>{bid.adUnitCode}</TableCell>
                    <TableCell><Stack direction="row" sx={{ flexWrap: 'wrap', gap: '5px' }}>
                      {bid.params && Object.keys(bid.params).map((key: any) =>
                        <Chip key={key} label={key + ': ' + JSON.stringify(bid.params[key])} variant="outlined" size="small" />
                      )}</Stack></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
      </Box>
    </Box>
  )
};

interface IBidsComponentProps {
  prebid: IPrebidDetails;
}

export default BidsComponent;
