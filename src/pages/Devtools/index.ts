import { getInitReqChainByUrl } from "./processHarRequestEntry";

chrome.devtools?.panels?.create('Professor Prebid', 'icon-34.png', 'panel.html', async (panel) => { });
chrome.storage.local.get('initiator_state', (result: { [key: string]: any }) => {
  if (result.initiator_state) {
    chrome.storage.local.get('initiator_root_url', (res: { [key: string]: any }) => {
      if (res.initiator_root_url) {
        getInitReqChainByUrl(res.initiator_root_url, 'document', 'GET');
      }
    });
  }
});
