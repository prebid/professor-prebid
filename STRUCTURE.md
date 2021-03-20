## **Technology**

- The code is bundled with **webpack**
- The UI is built with **React** and **Typescript\***

_\* Note that at this point typescript is only used for react code._

## **Components**

The extension is made out of 3 main components

### **1. Injected Script**

```
src/inject
```

This script contains code which (as its name suggests) gets injected into the web page and is the entry point for all prebid & gpt data collection.

It has 3 main roles

1. check if prebid/gpt exists in the page (_injected.js_)
2. hook into prebid/gpt events and process them with dataframe.js (_handlers.js_)
3. create and control the masks (ad overlays) on the page (_InjectedApp.tsx_)

### **2. Content Script**

```
src/pages/Content/index.js
```

This script has 2 main roles

1. get the processed data from the injected script and create the masks objects.
2. listen to the "console" state from the popup and deliver it to the injected script.

### **3. Popup**

```
src/pages/Popup
```

Currently the popup is only connected to masks state on the page, eventually it will present the collected data from the page.
