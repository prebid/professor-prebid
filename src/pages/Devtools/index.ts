import { collectHarLog } from './harLog';

chrome.devtools?.panels?.create('Professor Prebid', 'assets/img/icon-34.png', 'panel.html', async () => {});

collectHarLog();
