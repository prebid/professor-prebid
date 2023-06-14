chrome.devtools.panels.create('Dev Tools from chrome-extension-boilerplate-react', 'icon-34.png', 'panel.html');

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

let redirectTrackerObj = {};

function Console() {}

Console.Type = {
  LOG: "log",
  DEBUG: "debug",
  INFO: "info",
  WARN: "warn",
  ERROR: "error",
  GROUP: "group",
  GROUP_COLLAPSED: "groupCollapsed",
  GROUP_END: "groupEnd"
};

Console.addMessage = function(type, format, args) {
  if (chrome.devtools.inspectedWindow.tabId) {
    chrome.runtime.sendMessage({
      command: "sendToConsole",
      tabId: chrome.devtools.inspectedWindow.tabId,
      args: escape(JSON.stringify(Array.prototype.slice.call(arguments, 0)))
    });
  }
};

// Generate Console output methods, i.e. Console.log(), Console.debug() etc.
(function() {
  var console_types = Object.getOwnPropertyNames(Console.Type);
  for (var type = 0; type < console_types.length; ++type) {
    var method_name = Console.Type[console_types[type]];
    Console[method_name] = Console.addMessage.bind(Console, method_name);
  }
})();

const globalCallFramesArray = [];

const getCallFrames = (hEntry, rootUrl) => {
  if (
    hEntry._initiator.stack &&
    hEntry._initiator.stack.callFrames &&
    hEntry._initiator.stack.callFrames.find(callFrame => callFrame.url.includes(rootUrl))
  ) {
    globalCallFramesArray.push({hEntry, callFrames: hEntry._initiator.stack.callFrames, path: 'stack.callFrames', url: hEntry.request.url});
    return hEntry._initiator.stack.callFrames;
  }

  if (
    hEntry._initiator.stack &&
    hEntry._initiator.stack.parent &&
    hEntry._initiator.stack.parent.callFrames && hEntry._initiator.stack.parent.callFrames.find(callFrame => callFrame.url.includes(rootUrl))
  ) {
    globalCallFramesArray.push({hEntry, callFrames: hEntry._initiator.stack.callFrames, path: 'stack.parent.callFrames', url: hEntry.request.url});
    return hEntry._initiator.stack.parent.callFrames;
  }

  return false;
};

const generateInvokedFuncHistoryArray = h_entry => {
  const invokedFuncHistory = [];

  if (h_entry._resourceType === 'image') {
    h_entry._initiator.stack.parent.callFrames.forEach(callFrame => {
      invokedFuncHistory.push(callFrame.functionName);
    });
  } else {
    h_entry._initiator.stack.callFrames.forEach(callFrame => {
      invokedFuncHistory.push(callFrame.functionName);
    });
  }

  return invokedFuncHistory;
};

const setInvokedFuncHistory = h_entry => {
  if (h_entry.response.redirectURL && !redirectTrackerObj[h_entry.response.redirectURL]) {
    redirectTrackerObj[h_entry.response.redirectURL] = generateInvokedFuncHistoryArray(h_entry);
  }
};

function findPathsToKey(options) {
  let results = [];

  (function findKey({
    key,
    obj,
    pathToKey,
  }) {
    const oldPath = `${pathToKey ? pathToKey + "[" : ""}`;
    if (obj.hasOwnProperty(key)) {
      const filteredResult = `${oldPath}${key}`.split('[').map(item => {
        let returnItem = item;
        if (item.indexOf(']') !== -1 ) {
            returnItem = item.replace(']', '');
        }
        return returnItem;
      });
      results.push(filteredResult);
      return;
    }

    if (obj !== null && typeof obj === "object" && !Array.isArray(obj)) {
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

          if (obj[k] !== null && typeof obj[k] === "object") {
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

  return results;
}

function setToValue(obj, value, pathArray, harEntryRequestUrl, isRedirect = false) {
  let i;

  if (isRedirect) {
    for (i = 0; i < pathArray.length - 1; i++) {
      obj = obj[pathArray[i]];
    }

    obj[pathArray[i]] = value;
  } else {
    for (i = 0; i < pathArray.length; i++) {
      if (i !== 0 && pathArray[i].includes('https://')) {
        obj = obj.find(item => item.fullUrl === pathArray[i]);
      } else {
        obj = obj[pathArray[i]];
      }
    }

    obj.push(value);
    // obj.sort(dynamicSort('timeSincePageLoad'));
  }
}

function dynamicSort(property) {
  var sortOrder = 1;
  if(property[0] === "-") {
      sortOrder = -1;
      property = property.substr(1);
  }
  return function (a,b) {
      /* next line works with strings and numbers, 
       * and you may want to customize it to your needs
       */
      var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
      return result * sortOrder;
  }
}

const getInitReqChainByUrl = (rootUrl, rootResourceType = false, rootRequestMethod = false) => {
  let initReqChainObj = {};

  chrome.devtools.network.getHAR(result => {
    var entries = result.entries;
    if (!entries.length) {
      Console.warn("No HAR entries detected, try refreshing the page.");
    }

    chrome.devtools.network.onRequestFinished.addListener(har_entry => { 
      const harEntryRequestUrl = har_entry.request.url;
      let cFrames;
      const resourceType = rootResourceType ? rootResourceType : har_entry._resourceType;
      const reqMethod = rootRequestMethod ? rootRequestMethod : har_entry.request.method;
      const origin = har_entry.request.headers.find(header => header.name.toLowerCase() === 'origin');
      const referer = har_entry.request.headers.find(header => header.name.toLowerCase() === 'referer');
      const host = har_entry.request.headers.find(header => header.name.toLowerCase() === 'host');

      const data = {
        fullUrl: harEntryRequestUrl,
        queryParameters: har_entry.request.queryString || {},
        redirectsTo: har_entry.response.redirectURL ? { [har_entry.response.redirectURL]: {} } : {},
        initiated: [],
        startedDateTime: new Date(har_entry.startedDateTime).getTime(),
        time: har_entry.time,
        timings: har_entry.timings,
        timeSincePageLoad: performance.now(),
        requestCookies: har_entry.request.cookies,
        requestHeaders: har_entry.request.headers,
        responseCookies: har_entry.response.cookies,
        responseHeaders: har_entry.response.headers
      };

      if (origin) {
        data.origin = origin.value;
      }

      if (referer) {
        data.referer = referer.value;
      }

      if (host) {
        data.host = host.value;
      }

      if (har_entry.request.postData) {
        data.postData = har_entry.request.postData;
      }

      switch (true) {
        case Boolean(
          harEntryRequestUrl.includes(rootUrl) &&
          har_entry._resourceType === resourceType &&
          reqMethod === har_entry.request.method &&
          !initReqChainObj[harEntryRequestUrl]
        ): // root resource logic
          initReqChainObj[rootUrl] = data;
          setInvokedFuncHistory(har_entry);
          Console.log(initReqChainObj);
          break;
        case Boolean( // logic for resources initiated from root resource
          (
            har_entry._initiator.stack &&
            har_entry._initiator.stack.callFrames.length > 0 &&
            har_entry._initiator.stack.callFrames[har_entry._initiator.stack.callFrames.length - 1].url.includes(rootUrl)
          ) ||
          (
            har_entry._initiator.stack &&
            har_entry._initiator.stack.parent &&
            har_entry._initiator.stack.parent.callFrames.length > 0 &&
            har_entry._initiator.stack.parent.callFrames[har_entry._initiator.stack.parent.callFrames.length - 1].url.includes(rootUrl)
          )
        ):
          if (harEntryRequestUrl) {
            initReqChainObj[rootUrl].initiated.push(data);
            // initReqChainObj[rootUrl].initiated.sort(dynamicSort('timeSincePageLoad'));
            setInvokedFuncHistory(har_entry);
            Console.log(initReqChainObj);
          }
          break;
        default: // logic for resources redirected to from other resources (and everything else)
          cFrames = getCallFrames(har_entry, rootUrl);

          if (cFrames.length > 0) {
            if (redirectTrackerObj[har_entry.request.url] && JSON.stringify(redirectTrackerObj[har_entry.request.url]) === JSON.stringify(generateInvokedFuncHistoryArray(har_entry))) { // redirects              
              setToValue(
                initReqChainObj,
                data,
                findPathsToKey({ obj: initReqChainObj, key: har_entry.request.url })[0],
                harEntryRequestUrl,
                true
              );
              
              setInvokedFuncHistory(har_entry);
              delete redirectTrackerObj[har_entry.request.url];
              Console.log(initReqChainObj);
            } else { // initiators
              const initiatorOrderArray = [];

              for (let i = cFrames.length - 1; i >= 0; i--) {
                const cFrameUrl = cFrames[i].url;

                if (initReqChainObj[cFrameUrl.split('?')[0]]) {
                  initiatorOrderArray.push('initiated');
                  initiatorOrderArray.push(rootUrl);
                  break;
                } else {
                  initiatorOrderArray.push('initiated');
                  initiatorOrderArray.push(cFrameUrl);
                }
              }
              
              setToValue(
                initReqChainObj,
                data,
                initiatorOrderArray.slice().reverse(),
                harEntryRequestUrl
              );

              setInvokedFuncHistory(har_entry);
              Console.log(initReqChainObj);
            }
          }
      }
    });
  });

  return initReqChainObj;
};

chrome.storage.local.get('initiator_state', (result) => {
  if (result.initiator_state) {
    chrome.storage.local.get('initiator_root_url', (res) => {
      if (res) {
        getInitReqChainByUrl(res.initiator_root_url, 'document', 'GET');
        // getInitReqChainByUrl(res.initiator_root_url);
      }
    });
  }
});

// https://ads.pubmatic.com/AdServer/js/user_sync.html
// https://hbopenbid.pubmatic.com/translator
