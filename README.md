# Professor Prebid Chrome Extension

## Installing & Running

Download the extension from the chrome web-store: https://chrome.google.com/webstore/detail/professor-prebid-v02/kdnllijdimhbledmfdbljampcdphcbdc

or

1. Make sure you have node version >= **13.2**
2. run `npm install` in the directory
3. run `npm start`
4. Load your extension on Chrome following:
   1. Access `chrome://extensions/`
   2. Check `Developer mode`
   3. Click on `Load unpacked extension`
   4. Select the `build` folder.

## Building the extension

```
$ NODE_ENV=production npm run build
```

Now, the content of `build` folder will be the extension ready to be submitted to the Chrome Web Store.

## Credits

This extension is based on [chrome-extension-boilerplate-react](https://github.com/lxieyang/chrome-extension-boilerplate-react)
