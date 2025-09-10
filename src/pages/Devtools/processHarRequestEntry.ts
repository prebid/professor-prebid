let redirectSet = new Set<string>();
let currentRootUrl: string;

const start = (func: { (request: chrome.devtools.network.Request): void }) => {
    chrome.devtools.network.onRequestFinished.addListener(func);
};
export const getInitReqChainByUrl = (rootUrl: string, rootResourceType: string, rootRequestMethod: string) => {
    let initReqChainObj: resultObj = {};

    chrome.devtools.network.getHAR((result) => {
        const processHarRequests = async (har_entry: any) => {
            chrome.storage.local.get('initReqChain', async (result) => {
                if (result.initReqChain === 'null') {
                    initReqChainObj = {};
                    chrome.devtools.network.onRequestFinished.removeListener(processHarRequests);
                } else {
                    await processHarRequestEntry(har_entry, initReqChainObj, redirectSet, currentRootUrl);
                }
            });
        };

        start(processHarRequests);

        chrome.tabs?.onUpdated.addListener(function (tabId, info) {
            if (info.status === 'loading') {
                chrome.storage.local.set({ initReqChain: JSON.stringify({}) });
                start(processHarRequests);
            }
        });
    });

    return initReqChainObj;
};
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
            reject({ error: error });
        }
    });
};

const buildObjectFromHarEntry = (har_entry: any) => {
    const origin = har_entry.request.headers.find((header: { name: string }) => header.name.toLowerCase() === 'origin');
    const referer = har_entry.request.headers.find((header: { name: string }) => header.name.toLowerCase() === 'referer');
    const host = har_entry.request.headers.find((header: { name: string }) => header.name.toLowerCase() === 'host');
    const data = {
        fullUrl: har_entry.request.url,
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
    return data;
};
const populateInitSeqArray = (obj: { [key: string]: any }, pathArray: string[], array: string[]) => {
    let i;

    for (i = 0; i < pathArray.length - 1; i++) {
        obj = obj[pathArray[i]];
    }

    array.push(obj[pathArray[i]]);
};

const setToInitReqChainObj = (obj: { [key: string]: any }, pathArray: string[], value: resourceObj) => {
    let i: number;
    let next;

    for (i = 0; i < pathArray.length; i++) {
        if (i % 2 === 0) {
            // even index
            next = obj[pathArray[i]]['initiated'];

            if (next) {
                obj = next;
            }
        } else {
            // odd index
            next = obj.find((item: { fullUrl: any }) => item.fullUrl === pathArray[i]);

            if (next) {
                obj = next;
            } else {
                value = {
                    fullUrl: pathArray[i],
                    initiated: [value],
                };
            }
        }
    }

    if (Array.isArray(obj)) {
        obj.push(value);
    } else {
        obj['initiated'].push(value);
    }
};

const setToRedirectValue = (obj: { [key: string]: any }, value: resourceObj, pathArray: string | any[]) => {
    let i;

    for (i = 0; i < pathArray.length - 1; i++) {
        obj = obj[pathArray[i]];
    }

    obj[pathArray[i]] = value;
};
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
            reject({ error: error });
        }
    });
};
const handleRedirects = async (
    harEntryRequestUrl: string,
    redirectSet: Set<string>,
    initReqChainObj: resultObj,
    resource: resourceObj
) => {
    if (redirectSet.has(harEntryRequestUrl)) {
        const pathsToRedirectUrl: any = await findPathsToKey({ obj: initReqChainObj, key: harEntryRequestUrl });
        for (const pathArray of pathsToRedirectUrl) {
            setToRedirectValue(initReqChainObj, resource, pathArray);
        }
        redirectSet.delete(harEntryRequestUrl);
    }
};
const handleInitiatorStack = async (
    har_entry: any,
    initReqChainObj: resultObj,
    currentRootUrl: string,
    resource: resourceObj
) => {
    const pathOuterArray: any = await findPathsToKey({ obj: har_entry._initiator.stack, key: 'url' });
    const initSeqArray: any = [];

    pathOuterArray.forEach((pathInnerArray: any) => {
        populateInitSeqArray(har_entry._initiator.stack, pathInnerArray, initSeqArray);
    });

    const initiatorSequence = initSeqArray.filter((v: any, i: number, a: any) => a.indexOf(v) === i);
    setToInitReqChainObj(initReqChainObj, initiatorSequence, resource);
};
const handleInitiatorUrl = (
    har_entry: any,
    initReqChainObj: resultObj,
    currentRootUrl: string,
    harEntryRequestUrl: string,
    resource: resourceObj
) => {
    initReqChainObj[harEntryRequestUrl] = resource;
    initReqChainObj[currentRootUrl].initiated.push({
        message: `${harEntryRequestUrl} was initiated by the root URL, however the root URL will no longer be visible in the initiator stack for any subsequent resources initiated/redirected to from ${harEntryRequestUrl} because this resource was parsed by the root URL.  Instead all subsequent resources of this type will appear under a new object key under ${harEntryRequestUrl} (Scroll below to view).`,
        url: harEntryRequestUrl,
        initiatorDetails: har_entry._initiator,
    });
};
const processHarRequestEntry = async (
    har_entry: any,
    initReqChainObj: resultObj,
    redirectSet: Set<string>,
    currentRootUrl: string
) => {
    if (har_entry._initiator.stack) {
        const stringifiedStack = JSON.stringify(har_entry._initiator.stack);
        Object.keys(initReqChainObj).forEach((url) => {
            if (stringifiedStack.includes(url)) {
                currentRootUrl = url;
            }
        });
    }

    const harEntryRequestUrl = har_entry.request.url;
    const resourceType = har_entry._resourceType;
    const reqMethod = har_entry.request.method;

    if (har_entry.response.redirectURL) {
        redirectSet.add(har_entry.response.redirectURL);
    }

    const resource = buildObjectFromHarEntry(har_entry);

    switch (true) {
        case Boolean(
            harEntryRequestUrl.includes(currentRootUrl) &&
            resourceType === har_entry._resourceType &&
            reqMethod === har_entry.request.method &&
            !initReqChainObj[harEntryRequestUrl]
        ):
            await setRootUrlToInitReqChainObj(initReqChainObj, resource);
            break;

        case har_entry._initiator.stack && JSON.stringify(har_entry._initiator.stack).includes(currentRootUrl):
        case har_entry._initiator.url && har_entry._initiator.url.includes(currentRootUrl):
            await handleRedirects(harEntryRequestUrl, redirectSet, initReqChainObj, resource);

            if (!redirectSet.has(harEntryRequestUrl)) {
                if (har_entry._initiator.stack) {
                    await handleInitiatorStack(har_entry, initReqChainObj, currentRootUrl, resource);
                }

                if (har_entry._initiator.url) {
                    handleInitiatorUrl(har_entry, initReqChainObj, currentRootUrl, harEntryRequestUrl, resource);
                }
            }

            setToStorage('initReqChain', JSON.stringify(initReqChainObj));
            break;
        default:
    }
};
