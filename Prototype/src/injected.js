// This script is injected into the original page and is the ONLY
// way to gain access to the JS context of the page (namely pbjs)
// The only way for an injected script to message to the content.js
// script is via window.postMessage()

function convertTimestamp(requestTimestamp) {
	let ts = new Date(requestTimestamp);
	let year = ts.getYear() + 1900;
	let mon = ts.getMonth() + 1;
	let day = ts.getUTCDate();
	let h = ts.getHours();
	let m = ts.getMinutes();
	let s = ts.getSeconds();
	let ms = ts.getMilliseconds();

	if (mon < 10) {
		mon = '0' + mon
	}

	if (day < 10) {
		day = '0' + day
	}

	if (h < 10) {
		h = '0' + h
	}

	if (m < 10) {
		m = '0' + m
	}

	if (s < 10) {
		s = '0' + s
	}

	return (`${year}-${mon}-${day} ${h}:${m}:${s}.${ms}`);
}

// Need to use window.postMessage() to communicate with content.js

function sendMessage(evt, x) {
	console.log('PREBID_TOOLS: sendMessage(' + evt + ')');

	window.postMessage({
		type: evt,
		obj: JSON.stringify(x)
	});
}

var do_once_pbjs = 1;

// Check for PBJS loaded and add listeners to various events when ready

function checkForPBJS(domFoundTime) {
	if (window.pbjs && window.pbjs.libLoaded && do_once_pbjs == 1) {

		window.pbjs.onEvent('auctionEnd', function(data) {
			console.log('PREBID_TOOLS: auctionEnd ' + convertTimestamp(Date.now()));
			// TODO hmmm 'data' seems to contain all (and more) data that I use from
			// the various other pbjs.get... methods. I guess longer term should look to
			// parse and use 'data' directly

			console.log(data);

			//console.log(window.pbjs.getConfig());

			var adUnitObj = {};

			window.pbjs.adUnits.forEach(e => {
				adUnitObj[e.code] = e.path;
			});

			// On auctionEnd, let the content script know it happened
			let response = {
				"auctionTimestamp": Date.now(),
				"yesBids": window.pbjs.getBidResponses(),
				"noBids": window.pbjs.getNoBids(),
				"wonBids": window.pbjs.getAllPrebidWinningBids(),
				"adUnits": adUnitObj,
				"bidderRequests": data.bidderRequests,
				"rawData": data
			};

			sendMessage("AUCTION_END", response);
		});

		window.pbjs.onEvent('addAdUnits', function() {
			console.log('Ad units were added to Prebid.')
		});

		window.pbjs.onEvent('bidResponse', function(response) {
			console.log('Bid Responses.')
		});

		window.pbjs.onEvent('auctionInit', function(data) {
			console.log('PREBID_TOOLS: auctionInit ' + convertTimestamp(Date.now()));
		});

		window.pbjs.onEvent('bidTimeout', function(data) {
			data.forEach(nobid => {
				console.log('PREBID_TOOLS: bidTimeout ' + JSON.stringify(nobid));
			});
		});

		do_once_pbjs = 0;

		console.log('PREBID_TOOLS: PBJS check found: ' + convertTimestamp(Date.now()) + ' ' + (Date.now() - domFoundTime) + 'ms');

		return 1;
	} else {
		return 0;
	}
}

var do_once_gpt = 1;
var visibleSlots = new Set();
var slotIdHash = {};

// Check for GPT loaded and add listeners to various events when ready

function checkForGPT(domFoundTime) {
	if (window.googletag && window.googletag.pubadsReady && window.googletag.apiReady && do_once_gpt == 1) {
		googletag.pubads().addEventListener('slotRenderEnded', function(event) {
			let targeting = {};

			slotIdHash[event.slot.getSlotElementId()] = Date.now();

			console.log('GPT_TOOLS: SlotRenderEnded ' + JSON.stringify(event));

			event.slot.getTargetingKeys().forEach(k => {
				targeting[k] = event.slot.getTargeting(k);
			});

			console.log('GPT_TOOLS: campaignId=' + event.campaignId + ' lineItemId=' + event.lineItemId + ' advertiserId=' + event.advertiserId);

			let response = {
				"gptTimestamp": Date.now(),
				"gptTargeting": targeting,
				"adUnitPath": event.slot.getAdUnitPath(),
				"slotElementId": event.slot.getSlotElementId()
			};

			sendMessage("GPT_SLOTRENDERED", response);
		});

		googletag.pubads().addEventListener('slotOnload', function(event) {
			// Is this how GAM computed creative render time?
			let creativeRenderTime = Date.now() - slotIdHash[event.slot.getSlotElementId()];

			console.log("(slotOnload_Time - slotRenderEnded_Time)[" + event.slot.getSlotElementId() + "] = " + creativeRenderTime + 'msec');
			
			// Remove SlotElementID from hash
			delete slotIdHash[event.slot.getSlotElementId()];

			console.log('GPT_TOOLS: slotOnload ' + JSON.stringify(event));
		});

		googletag.pubads().addEventListener('impressionViewable', function(event) {
			console.log('GPT_TOOLS: ImpressionViewable ' + JSON.stringify(event));
		});

		googletag.pubads().addEventListener('slotRequested', function(event) {
			console.log('GPT_TOOLS: SlotRequested ' + JSON.stringify(event));
		});

		googletag.pubads().addEventListener('slotResponse', function(event) {
			console.log('GPT_TOOLS: SlotResponse ' + JSON.stringify(event));
		});

		googletag.pubads().addEventListener('slotVisibilityChanged', function(event) {
			console.log('GPT_TOOLS: SlotVisibilityChanged ' + JSON.stringify(event));

			// Want this to feed the popup but can't message to that directly so this
			// message goes to content.js which then sends to popup.js

			if (event.inViewPercentage > 0) {
				visibleSlots.add(event.slot.getSlotElementId());
			} else {
				visibleSlots.delete(event.slot.getSlotElementId());
			}

			sendMessage('GPT_VISIBILITY_EVENT', Array.from(visibleSlots));
		});

		do_once_gpt = 0;

		console.log('PREBID_TOOLS: GPT check found: ' + convertTimestamp(Date.now()) + ' ' + (Date.now() - domFoundTime) + 'ms');

		return 1;
	} else {
		return 0;
	}
}


// Set a interval check to see when the PBJS and GPT ojects are loaded and ready

var domFoundTime = Date.now();

console.log('PREBID_TOOLS: Entry ' + convertTimestamp(Date.now()));

if (checkForPBJS(domFoundTime) == 0) {
	var count_pbjs = 0;
	var timer_pbjs = setInterval(checkForPBJSExists, 10);

	function checkForPBJSExists() {
		if (checkForPBJS(domFoundTime) == 0) {
			if (count_pbjs++ > 1000) {
				clearInterval(timer_pbjs);
				console.log('PREBID_TOOLS: PBJS check failure');
			}
		} else {
			clearInterval(timer_pbjs);
		}
	}
}

if (checkForGPT(domFoundTime) == 0) {
	var count_gpt = 0;
	var timer_gpt = setInterval(checkForGPTExists, 10);

	function checkForGPTExists() {
		if (checkForGPT(domFoundTime) == 0) {
			if (count_gpt++ > 1000) {
				clearInterval(timer_gpt);
				console.log('PREBID_TOOLS: GPT check failure');
			}
		} else {
			clearInterval(timer_gpt);
		}
	}
}