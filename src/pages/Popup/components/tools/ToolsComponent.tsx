import { IPrebidDetails } from "../../../../inject/scripts/prebid";
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { faGoogle } from '@fortawesome/free-brands-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import Switch from '@mui/material/Switch';
import { popupHandler } from '../../popupHandler';
import React, { useEffect, useState } from 'react';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';

const ToolsComponent = ({ prebid }: ToolsComponentProps): JSX.Element => {
    const [consoleState, setConsoleState] = useState<boolean>(null);
    useEffect(() => {
        popupHandler.getToggleStateFromStorage((checked: boolean) => {
            setConsoleState(checked);
        });
    }, [consoleState]);

    const handleConsoleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setConsoleState(event.target.checked);
        popupHandler.onConsoleToggle(event.target.checked);
    };

    const dfp_open_console = () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const currentTab = tabs[0];
            const file = './openDfpConsole.bundle.js';
            chrome.tabs.executeScript(currentTab.id, { file });
        });
    }

    return (
        <Box sx={{padding: '5px'}}>
            <Button variant="outlined" size="small" onClick={dfp_open_console} startIcon={<FontAwesomeIcon icon={faGoogle} />}>
                open google AdManager console
            </Button>
            <FormGroup>
                <FormControlLabel control={<Switch checked={consoleState || false} onChange={handleConsoleChange} />} label="Show AdUnit Info Overlay" />
            </FormGroup>
        </Box>
    );
}

interface ToolsComponentProps {
    prebid: IPrebidDetails;
}

export default ToolsComponent;
