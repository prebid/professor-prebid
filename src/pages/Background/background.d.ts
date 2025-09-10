interface IFrameInfo {
    googleAdManager?: IGoogleAdManagerDetails;
    prebids?: IPrebids;
    tcf?: ITcfDetails;
    url?: string;
    downloading?: 'true' | 'false' | 'error';
    namespace?: string;
    updateNamespace?: (namespace: string) => void;
    syncState?: string;
    initReqChainResult?: initReqChainResult;
}

interface IFrameInfos {
    [key: string]: IFrameInfo;
}
interface ITabInfos {
    [key: number]: IFrameInfos;
}

interface initReqChainResult {
    [key: string]: any;
}

interface IPrebids {
    [key: string]: IPrebidDetails;
}