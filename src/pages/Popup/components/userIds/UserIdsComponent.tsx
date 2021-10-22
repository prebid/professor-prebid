import { IPrebidDetails } from "../../../../inject/scripts/prebid";
import React from 'react';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Divider from '@mui/material/Divider';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const UserIdsComponent = ({ prebid }: IUserIdsComponentProps): JSX.Element => {
  return (
    <div>
      {prebid.eids?.map((eid, index) =>
        <Accordion key={index} sx={{backgroundColor: 'unset'}}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="panel1a-content" id="panel1a-header">
            <Typography>
              <strong>Source:</strong> &nbsp;{eid.source}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography>
              <strong>UIds:</strong>
              <List>
                {eid?.uids.map((uid, index) =>
                  <React.Fragment key={'uid' + index}>
                    <ListItem sx={{ paddingLeft: '15px' }}>{index + 1}: {uid.id} | atype: {uid.atype} </ListItem>
                    {uid.ext && <ListItem><strong>Ext:</strong></ListItem>}
                    {uid.ext && Object.keys(uid.ext).map((key, index) =>
                      <React.Fragment key={'ext' + index}>
                        <ListItem key={'ext' + index} sx={{ paddingLeft: '30px' }}><strong>{key}:</strong> {uid.ext[key]} </ListItem>
                      </React.Fragment>
                    )}
                  </React.Fragment>
                )}
              </List>
            </Typography>
          </AccordionDetails>
        </Accordion>
      )}
    </div>
  );
}

interface IUserIdsComponentProps {
  prebid: IPrebidDetails;
}

export default UserIdsComponent;
