import React from 'react';
import { IPrebidConfigUserSync } from '../../../../inject/scripts/prebid';
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
import Avatar from '@mui/material/Avatar';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ContactPageOutlinedIcon from '@mui/icons-material/ContactPageOutlined';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { tileHeight } from './ConfigComponent';

const UserIdModuleComponent = ({ userSync }: UserIdModuleComponentProps): JSX.Element => {
  const [expanded, setExpanded] = React.useState(false);
  const [maxWidth, setMaxWidth] = React.useState<4 | 12>(4);
  const ref = React.useRef<HTMLInputElement>(null);
  const handleExpandClick = () => {
    setExpanded(!expanded);
    setMaxWidth(expanded ? 4 : 12);
    setTimeout(() => ref.current.scrollIntoView({ behavior: 'smooth' }), 150);
  };

  logger.log(`[PopUp][ModulesComponent]: render `);
  return (
    <Grid item md={maxWidth} xs={12} ref={ref}>
      <Card sx={{ width: 1, minHeight: tileHeight }}>
        <CardHeader
          avatar={
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              <ContactPageOutlinedIcon />
            </Avatar>
          }
          title={<Typography variant="h3">UserIds</Typography>}
          subheader={
            <Typography variant="subtitle1">
              {userSync.userIds?.length > 0
                ? `${userSync.userIds.length} UserId${userSync.userIds.length > 1 ? 's' : ''} detected:`
                : 'No UserIds detected!'}
            </Typography>
          }
          action={
            <ExpandMoreIcon
              sx={{
                transform: !expanded ? 'rotate(0deg)' : 'rotate(180deg)',
                marginLeft: 'auto',
              }}
            />
          }
          onClick={handleExpandClick}
        />
        <CardContent>
          <Grid container spacing={2}>
            {!expanded &&
              userSync.userIds?.length > 0 &&
              userSync.userIds.slice(0, 6).map((userId, index) => (
                <Grid item xs={12} sm={expanded ? 3 : 6}>
                  <Typography variant="body1" key={index}>
                    <strong>#{index}: </strong> {userId.name}
                  </Typography>
                </Grid>
              ))}
            {!expanded && userSync.userIds?.length > 5 && (
              <Grid item xs={12}>
                <Typography variant="body2">+ {userSync.userIds.length - 5} more user ids...</Typography>
              </Grid>
            )}
            {expanded && (
              <Grid item xs={12}>
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
                      {userSync?.userIds?.map((userId, index) => (
                        <TableRow key={index}>
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
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>
    </Grid>
  );
};

interface UserIdModuleComponentProps {
  userSync: IPrebidConfigUserSync;
}

export default UserIdModuleComponent;
