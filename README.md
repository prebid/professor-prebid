# Professor Prebid

> Prebid's next‑generation debugging tool.

Professor Prebid is an open source Chrome extension used to debug and
troubleshoot header‑bidding setups built with
[Prebid.js](https://github.com/prebid/Prebid.js). When you open a page that
uses Prebid.js, the extension automatically detects the Prebid instance and
provides a detailed view of your ad‑units, bids, auctions and configuration so
you can understand what is happening under the hood [oai_citation:0‡docs.prebid.org](https://docs.prebid.org/tools/professor-prebid.html#:~:text=Professor%20Prebid%20is%20an%20open,js).
This project is complementary to Prebid.js – it is **not** an ad‑server or a
bidder, but a tool to inspect and optimise your header‑bidding integration.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running the Extension Locally](#running-the-extension-locally)
- [Features](#features)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)
- [Credits](#credits)

## Prerequisites

- **Node.js ≥ 15.12.0**. A recent Node LTS version is required when building
  from source [oai_citation:1‡raw.githubusercontent.com](https://raw.githubusercontent.com/prebid/professor-prebid/master/README.md#:~:text=1,folder).
- A website or test page that integrates
  [Prebid.js](https://github.com/prebid/Prebid.js). Professor Prebid surfaces
  information emitted by Prebid.js; it cannot analyse other
  header‑bidding frameworks.

## Installation

### Install from the Chrome Web Store

The easiest way to use Professor Prebid is to install it directly from the
Chrome Web Store. Visit the
[dedicated listing](https://chrome.google.com/webstore/detail/professor-prebid-v02/kdnllijdimhbledmfdbljampcdphcbdc)
and click **Add to Chrome** [oai_citation:2‡docs.prebid.org](https://docs.prebid.org/tools/professor-prebid.html#:~:text=Simply%20visit%20the%20dedicated%20Chrome,click%20access). Don’t forget to
pin the extension so you have one‑click access in the browser toolbar.

### Build it yourself

To build the extension locally you must clone the repository and run the dev
server:

```bash
git clone https://github.com/florianerl/professor-prebid.git
cd professor-prebid
npm install    # install dependencies
npm start      # start the local dev server