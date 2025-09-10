interface findPathsToKeyOptions {
    obj: {
        [key: string]: any;
    };
    key: string;
    pathToKey?: string;
}

interface resourceObj {
    message?: string;
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
}

interface resultObj {
    [key: string]: resourceObj;
}
