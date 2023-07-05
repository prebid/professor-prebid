chrome.devtools?.panels?.create('Professor Prebid', 'icon-34.png', 'panel.html', async (panel) => { });

let redirectArray: string[] = [];
let currentRootUrl: string;

const findPathsToKey = (options: findPathsToKeyOptions) => {
  return new Promise((resolve, reject) => {
    try {
      let results = [];

      (function findKey({ key, obj, pathToKey }) {
        const oldPath = `${pathToKey ? pathToKey + '[' : ''}`;
        if (obj.hasOwnProperty(key)) {
          const filteredResult = `${oldPath}${key}`.split('[').map((item) => {
            let returnItem = item;
            if (item.indexOf(']') !== -1) {
              returnItem = item.replace(']', '');
            }
            return returnItem;
          });
          results.push(filteredResult);
          return;
        }

        if (obj !== null && typeof obj === 'object' && !Array.isArray(obj)) {
          for (const k in obj) {
            if (obj.hasOwnProperty(k)) {
              if (Array.isArray(obj[k])) {
                for (let j = 0; j < obj[k].length; j++) {
                  findKey({
                    obj: obj[k][j],
                    key,
                    pathToKey: `${oldPath}${k}[${j}]`,
                  });
                }
              }

              if (obj[k] !== null && typeof obj[k] === 'object') {
                findKey({
                  obj: obj[k],
                  key,
                  pathToKey: `${oldPath}${k}`,
                });
              }
            }
          }
        }
      })(options);
      resolve(results);
    } catch (error) {
      reject({error: error});
    }
  });
}

const setToRedirectValue = (obj: { [key: string]: any; }, value: resourceObj, pathArray: string | any[]) => {
  let i;

  for (i = 0; i < pathArray.length - 1; i++) {
    obj = obj[pathArray[i]];
  }

  obj[pathArray[i]] = value;
}

const populateInitSeqArray = (obj: { [key: string]: any; }, pathArray: string[], array: string[]) => {
  let i;

  for (i = 0; i < pathArray.length - 1; i++) {
    obj = obj[pathArray[i]];
  }

  array.push(obj[pathArray[i]]);
}

const setToInitReqChainObj = (obj: { [key: string]: any }, pathArray: string[], value: resourceObj) => {
  let i: number;
  let next;

  for (i = 0; i < pathArray.length; i++) {
    if (i % 2 === 0) { // even index
      next = obj[pathArray[i]]['initiated'];
      
      if (next) {
        obj = next;
      }
    } else { // odd index
      next = obj.find((item: { fullUrl: any; }) => item.fullUrl === pathArray[i]);

      if (next) {
        obj = next;
      } else {
        value = {
          fullUrl: pathArray[i],
          initiated: [value]
        };
      }
    }
  }

  if (Array.isArray(obj)) {
    obj.push(value);
  } else {
    obj['initiated'].push(value);
  }
}

const setToStorage = (key: string, value: string) => {
  chrome.storage.local.set({ [key]: value });
};

const setRootUrlToInitReqChainObj = (reqChainObj: resultObj, currentResourceData: resourceObj) => {
  return new Promise((resolve, reject) => {
    try {
      reqChainObj[currentRootUrl] = currentResourceData;
      setToStorage('initReqChain', JSON.stringify(reqChainObj));
      resolve(true);
    } catch (error) {
      reject({error: error});
    }
  });
};

const getInitReqChainByUrl = (rootUrl: string, rootResourceType: string, rootRequestMethod: string) => {
  let initReqChainObj: resultObj = {};

  chrome.devtools.network.getHAR((result) => {
    const processHarRequests = async (har_entry: any) => {
      currentRootUrl = rootUrl;
      chrome.storage.local.get('initReqChain', (result) => {
        const data = JSON.parse(result.initReqChain);
        if (data === null) {
          console.log('STOPPING');
          initReqChainObj = {};
          chrome.devtools.network.onRequestFinished.removeListener(processHarRequests);
        }
      });

      if (har_entry._initiator.stack) {
        const stringifiedStack = JSON.stringify(har_entry._initiator.stack);
        Object.keys(initReqChainObj).forEach((url) => {
          if (stringifiedStack.includes(url)) {
            currentRootUrl = url;
          }
        });
      }

      const harEntryRequestUrl = har_entry.request.url;
      const resourceType = rootResourceType ? rootResourceType : har_entry._resourceType;
      const reqMethod = rootRequestMethod ? rootRequestMethod : har_entry.request.method;
      const origin = har_entry.request.headers.find((header: { name: string; }) => header.name.toLowerCase() === 'origin');
      const referer = har_entry.request.headers.find((header: { name: string; }) => header.name.toLowerCase() === 'referer');
      const host = har_entry.request.headers.find((header: { name: string; }) => header.name.toLowerCase() === 'host');

      const data = {
        fullUrl: harEntryRequestUrl,
        queryParameters: har_entry.request.queryString || {},
        redirectsTo: har_entry.response.redirectURL ? { [har_entry.response.redirectURL]: {} } : {},
        initiated: [] as any[],
        startedDateTime: new Date(har_entry.startedDateTime).getTime(),
        time: har_entry.time,
        timings: har_entry.timings,
        timeSincePageLoad: performance.now(),
        requestCookies: har_entry.request.cookies,
        requestHeaders: har_entry.request.headers,
        responseCookies: har_entry.response.cookies,
        responseHeaders: har_entry.response.headers,
        origin: origin ? origin.value : '',
        referer: referer ? referer.value : '',
        host: host ? host.value : '',
        postData: har_entry.request.postData ? har_entry.request.postData : '',
      };

      if (har_entry.response.redirectURL) {
        redirectArray.push(har_entry.response.redirectURL);
      }

      // if (origin) {
      //   data.origin = origin.value;
      // }

      // if (referer) {
      //   data.referer = referer.value;
      // }

      // if (host) {
      //   data.host = host.value;
      // }

      // if (har_entry.request.postData) {
      //   data.postData = har_entry.request.postData;
      // }

      switch (true) {
        case Boolean(
          harEntryRequestUrl.includes(currentRootUrl) &&
          har_entry._resourceType === resourceType &&
          reqMethod === har_entry.request.method &&
          !initReqChainObj[harEntryRequestUrl]
        ): // root resource logic
          try {
            await setRootUrlToInitReqChainObj(initReqChainObj, data);
          } catch (error) {
            console.error('Something went wrong: ', error);
          }
          break;
        case har_entry._initiator.stack && JSON.stringify(har_entry._initiator.stack).includes(currentRootUrl): // logic for resources initiated from root resource
        case har_entry._initiator.url && har_entry._initiator.url.includes(currentRootUrl):
          if (redirectArray.includes(harEntryRequestUrl)) {
            // remove harEntryRequestUrl from redirectArray
            const pathsToRedirectUrl: any = await findPathsToKey({ obj: initReqChainObj, key: harEntryRequestUrl });
            pathsToRedirectUrl.forEach((pathArray: any) => {
              setToRedirectValue(initReqChainObj, data, pathArray);
            });
            const index = redirectArray.indexOf(harEntryRequestUrl);
            redirectArray.splice(index, 1);
          } else {
            if (har_entry._initiator.stack) {
              const pathOuterArray: any = await findPathsToKey({ obj: har_entry._initiator.stack, key: 'url' });
              const initSeqArray: any = [];
  
              pathOuterArray.forEach((pathInnerArray: any) => {
                populateInitSeqArray(har_entry._initiator.stack, pathInnerArray, initSeqArray);
              });
  
              // const initiatorSequence = [...new Set(initSeqArray)];
              const initiatorSequence = initSeqArray.filter((value: any, index: any, array: any) => array.indexOf(value) === index);
              setToInitReqChainObj(initReqChainObj, initiatorSequence, data);
            }
  
            if (har_entry._initiator.url) {
              initReqChainObj[harEntryRequestUrl] = data;
              initReqChainObj[currentRootUrl].initiated.push({
                url: harEntryRequestUrl,
                initiatorDetails: har_entry._initiator
              });
            }
          }

          setToStorage('initReqChain', JSON.stringify(initReqChainObj));
          break;
        default: // logic for resources redirected to from other resources (and everything else)
          // 
      }
    };

    start(processHarRequests);

    chrome.tabs.onUpdated.addListener(function (tabId, info) {
      if (info.status === 'loading') {
        console.log("info.status === 'loading': ", info.status === 'loading');
        console.log('tabId: ', tabId);
        console.log('info: ', info);
        chrome.storage.local.set({ initReqChain: JSON.stringify({}) });
        console.log('STARTING');
        start(processHarRequests);
      }
    });
  });

  return initReqChainObj;
};

const start = (func: { (request: chrome.devtools.network.Request): void; }) => {
  chrome.devtools.network.onRequestFinished.addListener(func);
};

chrome.storage.local.get('initiator_state', (result: { [key: string]: any; }) => {
  if (result.initiator_state) {
    chrome.storage.local.get('initiator_root_url', (res: { [key: string]: any; }) => {
      if (res.initiator_root_url) {
        getInitReqChainByUrl(res.initiator_root_url, 'document', 'GET');
      }
    });
  }
});

interface findPathsToKeyOptions {
  obj: {
    [key: string]: any;
  }
  key: string;
  pathToKey?: string;
};

interface resourceObj {
  fullUrl: string;
  queryParameters?: {
    name: string;
    value: string;
  };
  redirectsTo?: {
    [key: string]: any;
  };
  host?: string;
  origin?: string;
  referer?: string;
  requestCookies?: {
    name: string;
    value: string;
    path: string;
    domain: string;
    expires: string;
    httpOnly: boolean;
    secure: boolean;
    sameSite: string;
  };
  requestHeaders?: {
    name: string;
    value: string;
  };
  responseCookies?: {
    name: string;
    value: string;
    path: string;
    domain: string;
    expires: string;
    httpOnly: boolean;
    secure: boolean;
    sameSite: string;
  };
  responseHeaders?: {
    name: string;
    value: string;
  };
  startedDateTime?: number;
  time?: number;
  timings?: {
    blocked: number;
    dns: number;
    ssl: number;
    connect: number;
    send: number;
    wait: number;
    receive: number;
    _blocked_queueing: number;
    _blocked_proxy: number;
  };
  timeSincePageLoad?: number;
  postData?: any;
  initiated: any[];
};

interface resultObj {
  [key: string]: resourceObj;
};
