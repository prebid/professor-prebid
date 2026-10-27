# Professor Prebid

> Prebid's next-generation debugging tool.

Professor Prebid is an open source Chrome extension used to debug and
troubleshoot header-bidding setups built with
[Prebid.js](https://github.com/prebid/Prebid.js). When you open a page that
uses Prebid.js, the extension automatically detects the Prebid instance and
provides a detailed view of your ad-units, bids, auctions and configuration so
you can understand what is happening under the hood.
This project is complementary to Prebid.js – it is **not** an ad-server or a
bidder, but a tool to inspect and optimise your header-bidding integration.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running the Extension Locally](#running-the-extension-locally)
- [Features](#features)
- [Project Structure](#project-structure)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)
- [Credits](#credits)

## Prerequisites

- **Node.js ≥ 18.0.0**. A recent Node LTS version is required when building
  from source.
- A website or test page that integrates
  [Prebid.js](https://github.com/prebid/Prebid.js). Professor Prebid surfaces
  information emitted by Prebid.js; it cannot analyse other
  header-bidding frameworks.

## Installation

### Install from the Chrome Web Store

The easiest way to use Professor Prebid is to install it directly from the
Chrome Web Store. Visit the
[dedicated listing](https://chrome.google.com/webstore/detail/professor-prebid/kdnllijdimhbledmfdbljampcdphcbdc)
and click **Add to Chrome**. Don’t forget to
pin the extension so you have one-click access in the browser toolbar.

### Build it yourself

To build the extension locally, clone the repository and install dependencies:

```bash
git clone https://github.com/prebid/professor-prebid.git
cd professor-prebid
npm install    # install dependencies
npm run build  # build production extension into ./build
```

## Running the Extension Locally

1. Start the development server with hot reload:
   ```bash
   npm start
   ```
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** in the top-right corner.
4. Click **Load unpacked** and select the generated `build` directory.

## Features

- **Ad Units & Media Types**: Inspect configured ad units, sizes, bidders, OpenRTB 2.x impression objects (`ortb2Imp`), and Google Ad Manager (GAM) slot targeting.
- **Bids & No-Bids Analysis**: Filter and inspect received bids, winning bids, CPMs, latencies, and no-bid reasons.
- **Timeline & Pre-Auction Diagnostics**: Visualize auction and bidder waterfalls alongside pre-auction identity, RTD, and vendor network activity.
- **Configuration & Privacy**: Review Prebid.js configuration, installed modules, price granularity, floors, User ID modules, and TCF/GDPR/USP/GPP consent signals.
- **On-Page Ad Overlays & Debugging Tools**: Toggle visual overlays directly over ad slots on the page and configure bid interception/replacement rules.

## Project Structure

- `src/pages/Background` – Manifest V3 service worker managing tab context, storage, and badge state.
- `src/pages/Content` – Content script bridging page events and extension messaging.
- `src/pages/Injected` – Main-world script inspecting `pbjs`, `googletag`, and `__tcfapi` instances, and rendering in-page ad overlays.
- `src/pages/Popup` & `src/pages/Panel` – Chrome action popup and DevTools panel UI.
- `src/pages/Shared` – Shared React components, contexts, hooks, and utilities.

## Testing

```bash
npm run typecheck    # TypeScript, including the unit and e2e tests
npm test             # unit and component tests (Vitest)
npm run build        # the end-to-end tests load the extension from ./build
npm run test:e2e     # end-to-end tests (Playwright)
npm run test:perf    # performance benchmark against live sites, with and without the extension
```

The end-to-end suite runs the extension against mock pages and a set of live
publisher sites (see `e2e/fixtures/liveSitesCatalog.ts`), so it needs network
access. Set `HEADED=true` to watch the browser. The performance benchmark
takes over an hour and is not part of `test:e2e`.

## Contributing

Contributions, bug reports, and pull requests are welcome! Before submitting a pull request, please ensure all tests and builds pass:

```bash
npm test
npm run build
```

## License

Licensed under the [Apache License, Version 2.0](LICENSE).

## Credits

Originally based on [chrome-extension-boilerplate-react](https://github.com/lxieyang/chrome-extension-boilerplate-react).
