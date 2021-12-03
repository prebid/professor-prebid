import React from 'react';
import { IPrebidDetails } from '../../../../inject/scripts/prebid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import ReactJson from 'react-json-view';
import logger from '../../../../logger';
import Collapse from '@mui/material/Collapse';
import Avatar from '@mui/material/Avatar';
import IconButton, { IconButtonProps } from '@mui/material/IconButton';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ContactPageOutlinedIcon from '@mui/icons-material/ContactPageOutlined';
import { styled } from '@mui/styles';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { tileHeight } from './ConfigComponent';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';

interface ExpandMoreProps extends IconButtonProps {
  expand: boolean;
}

const ExpandMore = styled((props: ExpandMoreProps) => {
  const { expand, ...other } = props;
  return <IconButton {...other} />;
})(({ theme, expand }) => ({
  transform: !expand ? 'rotate(0deg)' : 'rotate(180deg)',
  marginLeft: 'auto',
}));

const UserIdModuleComponent = ({ prebid }: UserIdModuleComponentProps): JSX.Element => {
  const [expanded, setExpanded] = React.useState(false);
  const [maxWidth, setMaxWidth] = React.useState<4 | 12>(4);

  const handleExpandClick = () => {
    setExpanded(!expanded);
    setMaxWidth(expanded ? 4 : 12);
  };

  logger.log(`[PopUp][ModulesComponent]: render `);
  return (
    <Grid item xs={maxWidth}>
      <Card sx={{ width: 1, minHeight: tileHeight, border: '1px solid #0e86d4' }}>
        <CardHeader
          avatar={
            <Avatar sx={{ bgcolor: '#0e86d4' }} aria-label="recipe">
              <ContactPageOutlinedIcon />
            </Avatar>
          }
          title="UserIds"
          subheader={
            prebid.config?.userSync?.userIds?.length > 0
              ? `${prebid.config?.userSync?.userIds?.length} UserId${prebid.config?.userSync?.userIds?.length > 1 ? 's' : ''} detected:`
              : 'No UserIds detected!'
          }
          action={
            <ExpandMore expand={expanded} onClick={handleExpandClick} aria-expanded={expanded} aria-label="show more">
              <ExpandMoreIcon />
            </ExpandMore>
          }
        />
        <Collapse in={!expanded} timeout="auto" unmountOnExit>
          {prebid.config?.userSync?.userIds.length === 1 && (
            <CardContent>
              {prebid.config?.userSync?.userIds[0].name && (
                <Typography variant="body2" color="text.secondary">
                  <strong>Name: </strong>
                  {prebid.config?.userSync?.userIds[0].name}
                </Typography>
              )}
              {prebid.config.userSync.userIds[0].storage?.type && (
                <Typography variant="body2" color="text.secondary">
                  <strong>Storage Type: </strong> {prebid.config.userSync.userIds[0].storage?.type}
                </Typography>
              )}
              {prebid.config.userSync.userIds[0].storage?.expires && (
                <Typography variant="body2" color="text.secondary">
                  <strong>Storage Expires: </strong> {prebid.config.userSync.userIds[0].storage?.expires}
                </Typography>
              )}
              {prebid.config.userSync.userIds[0].storage?.name && (
                <Typography variant="body2" color="text.secondary">
                  <strong>Storage Name: </strong> {prebid.config.userSync.userIds[0].storage?.name}
                </Typography>
              )}
            </CardContent>
          )}
          {prebid.config.userSync.userIds.length > 1 && (
            <CardContent sx={{ paddingTop: 0, paddingBottom: 0 }}>
              {prebid.config?.userSync?.userIds?.map((userId, index) => (
                <Typography variant="body2" color="text.secondary" key={index}>
                  <strong>#{index}: </strong> {userId.name}
                </Typography>
              ))}
            </CardContent>
          )}
        </Collapse>
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <CardContent>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Storage Type</TableCell>
                    <TableCell>Storage Expires</TableCell>
                    <TableCell>Storage Name</TableCell>
                    <TableCell>Params</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {prebid.config?.userSync?.userIds?.map((userId, index) => (
                    <TableRow key={index} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      <TableCell>
                        <strong>{userId.name}</strong>
                      </TableCell>
                      <TableCell>{userId.storage?.type}</TableCell>
                      <TableCell>{userId.storage?.expires}</TableCell>
                      <TableCell>{userId.storage?.name}</TableCell>
                      <TableCell>
                        <ReactJson
                          src={userId.params}
                          name={false}
                          collapsed={1}
                          enableClipboard={false}
                          displayObjectSize={false}
                          displayDataTypes={false}
                          sortKeys={false}
                          quotesOnKeys={false}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Collapse>
      </Card>
    </Grid>
  );
};

interface UserIdModuleComponentProps {
  prebid: IPrebidDetails;
}

export default UserIdModuleComponent;
